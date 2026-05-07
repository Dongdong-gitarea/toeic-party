import type { Server } from 'socket.io';
import type {
  Player,
  Question,
  QuestionForClient,
  RankEntry,
  FinalRankEntry,
  GameLabels,
  AnswerResult,
  SkillType,
  RoundSummary,
} from '../types.js';
import { calculateCorrect, calculateWrong } from './ScoreEngine.js';
import { pickQuestions } from '../data/questions.js';
import { lookupChinese } from '../data/vocabChinese.js';
import { saveMatch } from '../db/matchService.js';
import { updatePlayerStats } from '../db/playerService.js';

const QUESTIONS_PER_GAME = 10;
const QUESTION_TIME_MS = 10000;
// Between two questions there's a wrap-up screen for everyone:
// shows who got the last question right + (when allowed) lets each
// player pick a skill to cast on the next round. Auto-advances after
// BETWEEN_ROUND_MS or sooner if every human votes Skip.
const BETWEEN_ROUND_MS = 4000;
const PRE_GAME_COUNTDOWN_MS = 4500;
const ALL_SKILLS: SkillType[] = ['shake', 'fog', 'timeCut'];

const AI_NAMES = ['AI-Alpha', 'AI-Beta', 'AI-Gamma', 'AI-Delta'];

type RoomState = 'waiting' | 'countdown' | 'playing' | 'reviewing' | 'between' | 'ended';

export class Room {
  id: string;
  players = new Map<string, Player>();
  questions: Question[];
  currentQuestionIndex = -1;
  state: RoomState = 'waiting';
  questionStartTime = 0;
  answeredThisRound = new Set<string>();
  gameStartedAt: Date | null = null;
  private io: Server;
  private timers: NodeJS.Timeout[] = [];
  private onDestroy: (roomId: string) => void;
  private questionTimer: NodeJS.Timeout | null = null;
  private betweenTimer: NodeJS.Timeout | null = null;
  // Players that voted "skip" during the current between-round window.
  // Once every human has skipped we cut the wrap-up short.
  private skipVotes = new Set<string>();

  difficulty: 'easy' | 'medium' | 'hard' = 'medium';

  constructor(
    id: string,
    io: Server,
    onDestroy: (roomId: string) => void,
    weakWords: string[] = [],
    difficulty: 'easy' | 'medium' | 'hard' = 'medium',
  ) {
    this.id = id;
    this.io = io;
    this.onDestroy = onDestroy;
    this.difficulty = difficulty;
    this.questions = pickQuestions(QUESTIONS_PER_GAME, weakWords, difficulty);
  }

  get playerCount() {
    return this.players.size;
  }

  private get isFinalQuestion() {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  addPlayer(id: string, name: string, isAI: boolean, charIdx = 0, deviceId?: string) {
    this.players.set(id, {
      id,
      name,
      isAI,
      charIdx,
      deviceId,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      totalResponseTime: 0,
      answeredCount: 0,
      usedSkills: [],
      pendingCast: null,
      reviewWords: [],
    });
  }

  fillWithAI() {
    const used = new Set<number>();
    for (const p of this.players.values()) used.add(p.charIdx);
    let aiIdx = 0;
    while (this.playerCount < 4) {
      const id = `ai-${this.id}-${aiIdx}`;
      // Pick a charIdx not yet used; fall back to aiIdx
      let charIdx = 0;
      for (let i = 0; i < 4; i++) {
        if (!used.has(i)) {
          charIdx = i;
          used.add(i);
          break;
        }
      }
      this.addPlayer(id, AI_NAMES[aiIdx] ?? `AI-${aiIdx}`, true, charIdx);
      aiIdx++;
    }
  }

  getPlayerList() {
    return [...this.players.values()].map((p) => ({
      playerId: p.id,
      name: p.name,
      isAI: p.isAI,
      charIdx: p.charIdx,
    }));
  }

  start() {
    this.state = 'countdown';
    this.gameStartedAt = new Date();
    this.io.to(this.id).emit('GAME_START', { countdown: 3 });
    this.schedule(() => {
      this.state = 'playing';
      this.nextQuestion();
    }, PRE_GAME_COUNTDOWN_MS);
  }

  // ── Question flow ──

  private nextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex >= this.questions.length) {
      this.endGame();
      return;
    }

    this.answeredThisRound.clear();
    this.questionStartTime = Date.now();
    const q = this.questions[this.currentQuestionIndex]!;
    const isFinal = this.isFinalQuestion;

    const clientQ: QuestionForClient = {
      id: q.id,
      type: q.type,
      prompt: q.type === 'audio' ? 'Listen and choose the word' : q.prompt,
      options: q.options,
      isFinal,
      ...(q.type === 'audio' ? { audioWord: q.word } : {}),
    };

    this.io.to(this.id).emit('NEW_QUESTION', {
      question: clientQ,
      questionNumber: this.currentQuestionIndex + 1,
      total: this.questions.length,
    });

    this.scheduleAIAnswers(q);
    this.questionTimer = this.schedule(
      () => this.resolveQuestion(),
      QUESTION_TIME_MS,
    );
  }

  private scheduleAIAnswers(q: Question) {
    for (const player of this.players.values()) {
      if (!player.isAI) continue;
      const delay = 1500 + Math.random() * 2500;
      const accuracy = 0.4 + Math.random() * 0.25;
      const isCorrect = Math.random() < accuracy;
      const answerIndex = isCorrect
        ? q.correctIndex
        : this.randomWrongIndex(q.correctIndex);

      this.schedule(() => {
        if (this.state === 'playing' && !this.answeredThisRound.has(player.id)) {
          this.processAnswer(player.id, answerIndex);
        }
      }, delay);
    }
  }

  private randomWrongIndex(correctIndex: number): number {
    let idx: number;
    do {
      idx = Math.floor(Math.random() * 4);
    } while (idx === correctIndex);
    return idx;
  }

  // ── Answer handling ──

  handleAnswer(playerId: string, answerIndex: number) {
    if (this.state !== 'playing') return;
    if (this.answeredThisRound.has(playerId)) return;

    const result = this.processAnswer(playerId, answerIndex);
    if (!result) return;

    const player = this.players.get(playerId);
    if (player && !player.isAI) {
      this.io.to(playerId).emit('ANSWER_RESULT', result);
    }

    if (this.answeredThisRound.size >= this.playerCount) {
      if (this.questionTimer) {
        clearTimeout(this.questionTimer);
        this.questionTimer = null;
      }
      this.resolveQuestion();
    }
  }

  private processAnswer(playerId: string, answerIndex: number): AnswerResult | null {
    const player = this.players.get(playerId);
    if (!player) return null;

    this.answeredThisRound.add(playerId);
    this.broadcastAnswerProgress();

    const q = this.questions[this.currentQuestionIndex]!;
    const responseTime = Date.now() - this.questionStartTime;
    const remainingTime = Math.max(0, QUESTION_TIME_MS - responseTime);
    const correct = answerIndex === q.correctIndex;
    const isFinal = this.isFinalQuestion;
    const meta = {
      pos: q.pos ?? '',
      example: q.example ?? '',
    };

    if (correct) {
      const { baseScore, speedBonus, comboMultiplier, total, newCombo } =
        calculateCorrect(remainingTime, player.combo, isFinal);

      player.score += total;
      player.combo = newCombo;
      player.maxCombo = Math.max(player.maxCombo, newCombo);
      player.correctCount++;
      player.totalResponseTime += responseTime;
      player.answeredCount++;

      player.reviewWords.push({
        word: q.word,
        correct: true,
        yourAnswer: q.options[answerIndex] ?? '—',
        correctAnswer: q.options[q.correctIndex]!,
        definition: q.definition ?? '',
        meaning: lookupChinese(q.word),
        questionType: q.type,
        ...meta,
      });

      return {
        correct: true,
        correctIndex: q.correctIndex,
        baseScore,
        speedBonus,
        comboMultiplier,
        totalGained: total,
        totalScore: player.score,
        combo: newCombo,
        isFinal,
        word: q.word,
        correctAnswer: q.options[q.correctIndex]!,
        definition: q.definition ?? '',
        meaning: lookupChinese(q.word),
        ...meta,
      };
    } else {
      const { total: penalty } = calculateWrong(isFinal);
      player.score = Math.max(0, player.score + penalty);
      player.combo = 0;
      player.totalResponseTime += responseTime;
      player.answeredCount++;

      player.reviewWords.push({
        word: q.word,
        correct: false,
        yourAnswer: q.options[answerIndex] ?? '—',
        correctAnswer: q.options[q.correctIndex]!,
        definition: q.definition ?? '',
        meaning: lookupChinese(q.word),
        questionType: q.type,
        ...meta,
      });

      return {
        correct: false,
        correctIndex: q.correctIndex,
        baseScore: 0,
        speedBonus: 0,
        comboMultiplier: 1,
        totalGained: penalty,
        totalScore: player.score,
        combo: 0,
        isFinal,
        word: q.word,
        correctAnswer: q.options[q.correctIndex]!,
        definition: q.definition ?? '',
        meaning: lookupChinese(q.word),
        ...meta,
      };
    }
  }

  private broadcastAnswerProgress() {
    this.io.to(this.id).emit('ANSWER_PROGRESS', {
      answered: this.answeredThisRound.size,
      total: this.playerCount,
    });
  }

  private resolveQuestion() {
    if (this.state !== 'playing') return;
    this.state = 'reviewing';

    const q = this.questions[this.currentQuestionIndex]!;
    const meta = {
      pos: q.pos ?? '',
      example: q.example ?? '',
    };
    for (const player of this.players.values()) {
      if (!this.answeredThisRound.has(player.id)) {
        player.combo = 0;
        player.reviewWords.push({
          word: q.word,
          correct: false,
          yourAnswer: '(timeout)',
          correctAnswer: q.options[q.correctIndex]!,
          definition: q.definition ?? '',
          meaning: lookupChinese(q.word),
          questionType: q.type,
          ...meta,
        });
        if (!player.isAI) {
          this.io.to(player.id).emit('ANSWER_RESULT', {
            correct: false,
            correctIndex: q.correctIndex,
            baseScore: 0,
            speedBonus: 0,
            comboMultiplier: 1,
            totalGained: 0,
            totalScore: player.score,
            combo: 0,
            isFinal: this.isFinalQuestion,
            word: q.word,
            correctAnswer: q.options[q.correctIndex]!,
            definition: q.definition ?? '',
            meaning: lookupChinese(q.word),
            ...meta,
          } satisfies AnswerResult);
        }
      }
    }

    this.io.to(this.id).emit('RANK_UPDATE', { rankings: this.getRankings() });

    // After each question (Q1..Q9) we drop into a wrap-up window — the
    // RoundSummary screen on the client. Q10's wrap-up is skipped:
    // we go straight to endGame() below.
    if (this.isFinalQuestion) {
      this.schedule(() => {
        this.state = 'playing'; // brief flag so endGame's checks pass
        this.endGame();
      }, 600); // tiny pause so the final ANSWER_RESULT can land
      return;
    }
    this.schedule(() => this.enterBetweenPhase(), 600);
  }

  // ── Between-rounds window ──

  /**
   * The wrap-up screen the user sees after each question (except the
   * final one). Shows everyone's correct/wrong + lets each player
   * optionally pick a skill that fires when the next question begins.
   *
   * Q1's wrap-up is a "warm-up" — no skills allowed yet. The wrap-up
   * before the final question (Q10) also disables skills since the
   * final round has its own no-skills rule.
   */
  private enterBetweenPhase() {
    if (this.state === 'ended') return;
    this.state = 'between';
    this.skipVotes.clear();
    for (const p of this.players.values()) p.pendingCast = null;

    const skillsAllowed =
      this.currentQuestionIndex >= 1 &&
      this.currentQuestionIndex < this.questions.length - 1;

    const summary: RoundSummary = {
      questionNumber: this.currentQuestionIndex + 1,
      durationMs: BETWEEN_ROUND_MS,
      skillsAllowed,
      results: [...this.players.values()].map((p) => {
        const last = p.reviewWords[p.reviewWords.length - 1];
        return {
          playerId: p.id,
          correct: !!last?.correct,
          score: p.score,
        };
      }),
    };
    this.io.to(this.id).emit('ROUND_SUMMARY', summary);

    if (skillsAllowed) this.scheduleAISkillPicks();

    this.betweenTimer = this.schedule(() => this.exitBetweenPhase(), BETWEEN_ROUND_MS);
  }

  private exitBetweenPhase() {
    if (this.state !== 'between') return;
    if (this.betweenTimer) {
      clearTimeout(this.betweenTimer);
      this.betweenTimer = null;
    }
    this.state = 'playing';
    // 1) Send NEW_QUESTION first — clients clear any stale activeEffect
    this.nextQuestion();
    // 2) Then fire each pending skill so the effect lands ON the new
    //    question rather than on the wrap-up screen.
    for (const [id, p] of this.players) {
      if (!p.pendingCast) continue;
      const skill = p.pendingCast;
      p.pendingCast = null;
      for (const [otherId, other] of this.players) {
        if (otherId === id || other.isAI) continue;
        this.io.to(otherId).emit('SKILL_EFFECT', {
          fromName: p.name,
          skillType: skill,
        });
      }
    }
  }

  private scheduleAISkillPicks() {
    for (const player of this.players.values()) {
      if (!player.isAI) continue;
      if (Math.random() >= 0.4) continue; // 40% chance per AI per round
      const available = ALL_SKILLS.filter((s) => !player.usedSkills.includes(s));
      if (available.length === 0) continue;
      const skill = available[Math.floor(Math.random() * available.length)]!;
      const delay = 600 + Math.random() * (BETWEEN_ROUND_MS - 1200);
      this.schedule(() => {
        if (this.state !== 'between') return;
        if (player.pendingCast) return; // already picked
        this.handleSkill(player.id, skill);
      }, delay);
    }
  }

  handleSkipVote(playerId: string) {
    if (this.state !== 'between') return;
    const player = this.players.get(playerId);
    if (!player || player.isAI) return;
    this.skipVotes.add(playerId);

    const humans = [...this.players.values()].filter((p) => !p.isAI);
    if (humans.every((h) => this.skipVotes.has(h.id))) {
      this.exitBetweenPhase();
    }
  }

  // ── Skills ──

  handleSkill(playerId: string, skillType: SkillType) {
    const player = this.players.get(playerId);
    if (!player) return;
    if (player.usedSkills.includes(skillType)) return;
    if (this.state !== 'between') return;
    // Q1 wrap-up = warm-up; wrap-up before Q10 also disabled
    if (this.currentQuestionIndex < 1) return;
    if (this.currentQuestionIndex >= this.questions.length - 1) return;
    if (player.pendingCast) return; // one cast per wrap-up

    player.usedSkills.push(skillType);
    player.pendingCast = skillType;

    // No SKILL_EFFECT broadcast yet — the effect fires at exitBetweenPhase
    // so it lands during the next question, not on the wrap-up screen.

    if (!player.isAI) {
      this.io.to(playerId).emit('SKILL_USED', {
        skillType,
        usedSkills: [...player.usedSkills],
      });
    }
  }

  // ── Rankings ──

  getRankings(): RankEntry[] {
    return [...this.players.values()]
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        score: p.score,
        isAI: p.isAI,
      }));
  }

  // ── End game ──

  private endGame() {
    this.state = 'ended';
    this.clearTimers();

    const players = [...this.players.values()];
    const finalRankings: FinalRankEntry[] = players
      .sort((a, b) => b.score - a.score)
      .map((p) => ({
        playerId: p.id,
        name: p.name,
        score: p.score,
        isAI: p.isAI,
        correctCount: p.correctCount,
        maxCombo: p.maxCombo,
        avgResponseTime:
          p.answeredCount > 0
            ? Math.round(p.totalResponseTime / p.answeredCount)
            : 9999,
      }));

    const labels = this.getLabels(players);

    this.io.to(this.id).emit('GAME_END', { rankings: finalRankings, labels });

    // Send individual post-game stats (wrong words)
    for (const player of players) {
      if (!player.isAI) {
        this.io.to(player.id).emit('POST_GAME_STATS', {
          reviewWords: player.reviewWords.map((rw) => ({ ...rw })),
        });
      }
    }

    // ── Persist to database (async, non-blocking) ──
    void saveMatch(this.id, finalRankings, this.gameStartedAt ?? new Date()).catch(() => {});
    for (const player of players) {
      if (!player.isAI && player.deviceId) {
        const won = finalRankings[0]?.playerId === player.id;
        const xp = Math.round(player.score / 2);
        void updatePlayerStats(player.deviceId, xp, won, player.name).catch(() => {});
      }
    }

    this.schedule(() => this.onDestroy(this.id), 60_000);
  }

  private getLabels(players: Player[]): GameLabels {
    const sorted = [...players];
    const mvp = sorted.sort((a, b) => b.score - a.score)[0]!;

    const answerers = sorted.filter((p) => p.answeredCount > 0);
    const fastest =
      answerers.sort(
        (a, b) =>
          a.totalResponseTime / a.answeredCount -
          b.totalResponseTime / b.answeredCount,
      )[0] ?? mvp;

    const comboKing = sorted.sort((a, b) => b.maxCombo - a.maxCombo)[0]!;

    return { mvp: mvp.name, fastest: fastest.name, comboKing: comboKing.name };
  }

  handleDisconnect(playerId: string) {
    const player = this.players.get(playerId);
    if (player) player.isAI = true;
  }

  private schedule(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    this.timers.push(t);
    return t;
  }

  private clearTimers() {
    this.timers.forEach(clearTimeout);
    this.timers = [];
    this.questionTimer = null;
    this.betweenTimer = null;
  }

  cleanup() {
    this.clearTimers();
  }
}
