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
} from '../types.js';
import { calculateCorrect, calculateWrong } from './ScoreEngine.js';
import { pickQuestions } from '../data/questions.js';
import { lookupChinese } from '../data/vocabChinese.js';
import { saveMatch } from '../db/matchService.js';
import { updatePlayerStats } from '../db/playerService.js';

const QUESTIONS_PER_GAME = 10;
const QUESTION_TIME_MS = 10000;
const BETWEEN_QUESTIONS_FAST_MS = 1800;  // when nobody got it wrong
const BETWEEN_QUESTIONS_REVIEW_MS = 5000;  // when at least one human got it wrong — give time to read meaning + definition + example
const PRE_GAME_COUNTDOWN_MS = 4500;
const ALL_SKILLS: SkillType[] = ['shake', 'fog', 'timeCut'];

const AI_NAMES = ['AI-Alpha', 'AI-Beta', 'AI-Gamma', 'AI-Delta'];

type RoomState = 'waiting' | 'countdown' | 'playing' | 'reviewing' | 'ended';

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

  difficulty: 'easy' | 'medium' | 'hard' | 'curve' = 'medium';

  constructor(
    id: string,
    io: Server,
    onDestroy: (roomId: string) => void,
    weakWords: string[] = [],
    difficulty: 'easy' | 'medium' | 'hard' | 'curve' = 'medium',
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
      ...((q.type === 'listen' || q.type === 'audiocloze') && q.audioPayload ? { audioWord: q.audioPayload } : {}),
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

          // AI might use a skill it hasn't used yet
          if (!this.isFinalQuestion && Math.random() < 0.35) {
            const available = ALL_SKILLS.filter(
              (s) => !player.usedSkills.includes(s),
            );
            if (available.length > 0) {
              this.handleSkill(
                player.id,
                available[Math.floor(Math.random() * available.length)]!,
              );
            }
          }
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
    // (broadcastAnswerProgress is called AFTER reviewWords.push below
    // so the per-player status it reports is for *this* round, not
    // a stale entry from the previous one.)

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
      this.broadcastAnswerProgress();

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
      this.broadcastAnswerProgress();

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
    // Per-player live status so every client can colour the ranking
    // bar as people lock answers in. Pending = haven't answered yet;
    // correct/wrong reads off the most recent reviewWords entry, which
    // is guaranteed to be for the current round because callers push
    // before invoking this.
    const statuses: Record<string, 'pending' | 'correct' | 'wrong'> = {};
    for (const [id, p] of this.players) {
      if (!this.answeredThisRound.has(id)) {
        statuses[id] = 'pending';
      } else {
        const last = p.reviewWords[p.reviewWords.length - 1];
        statuses[id] = last?.correct ? 'correct' : 'wrong';
      }
    }
    this.io.to(this.id).emit('ANSWER_PROGRESS', {
      answered: this.answeredThisRound.size,
      total: this.playerCount,
      statuses,
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
    let anyTimeout = false;
    for (const player of this.players.values()) {
      if (!this.answeredThisRound.has(player.id)) {
        anyTimeout = true;
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
        // Mark as "answered (wrong)" so the per-player progress
        // statuses flip from pending → wrong on every client.
        this.answeredThisRound.add(player.id);
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
    if (anyTimeout) this.broadcastAnswerProgress();

    this.io.to(this.id).emit('RANK_UPDATE', { rankings: this.getRankings() });

    // Give players longer to read the definition when any human got it wrong.
    let anyHumanWrong = false;
    for (const player of this.players.values()) {
      if (player.isAI) continue;
      const last = player.reviewWords[player.reviewWords.length - 1];
      if (last && last.word === q.word && !last.correct) {
        anyHumanWrong = true;
        break;
      }
    }
    const pause = anyHumanWrong ? BETWEEN_QUESTIONS_REVIEW_MS : BETWEEN_QUESTIONS_FAST_MS;

    this.schedule(() => {
      this.state = 'playing';
      this.nextQuestion();
    }, pause);
  }

  // ── Skills ──

  handleSkill(playerId: string, skillType: SkillType) {
    const player = this.players.get(playerId);
    if (!player) return;
    if (player.usedSkills.includes(skillType)) return;
    if (this.state !== 'playing') return;
    if (this.isFinalQuestion) return; // no skills on final question

    player.usedSkills.push(skillType);

    // Broadcast effect to all OTHER human players
    for (const [id, p] of this.players) {
      if (id === playerId || p.isAI) continue;
      this.io.to(id).emit('SKILL_EFFECT', {
        fromName: player.name,
        skillType,
      });
    }

    // Confirm to caster
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
  }

  cleanup() {
    this.clearTimers();
  }
}
