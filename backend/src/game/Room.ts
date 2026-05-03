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

const QUESTIONS_PER_GAME = 10;
const QUESTION_TIME_MS = 10000;
const BETWEEN_QUESTIONS_MS = 1200;
const PRE_GAME_COUNTDOWN_MS = 4500;
const ENERGY_PER_CORRECT = 1;
const SKILL_COST = 3;

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
  private io: Server;
  private timers: NodeJS.Timeout[] = [];
  private onDestroy: (roomId: string) => void;
  private questionTimer: NodeJS.Timeout | null = null;

  constructor(id: string, io: Server, onDestroy: (roomId: string) => void) {
    this.id = id;
    this.io = io;
    this.onDestroy = onDestroy;
    this.questions = pickQuestions(QUESTIONS_PER_GAME);
  }

  get playerCount() {
    return this.players.size;
  }

  private get isFinalQuestion() {
    return this.currentQuestionIndex === this.questions.length - 1;
  }

  addPlayer(id: string, name: string, isAI: boolean) {
    this.players.set(id, {
      id,
      name,
      isAI,
      score: 0,
      combo: 0,
      maxCombo: 0,
      correctCount: 0,
      totalResponseTime: 0,
      answeredCount: 0,
      energy: 0,
      wrongWords: [],
    });
  }

  fillWithAI() {
    let aiIdx = 0;
    while (this.playerCount < 4) {
      const id = `ai-${this.id}-${aiIdx}`;
      this.addPlayer(id, AI_NAMES[aiIdx] ?? `AI-${aiIdx}`, true);
      aiIdx++;
    }
  }

  getPlayerList() {
    return [...this.players.values()].map((p) => ({
      playerId: p.id,
      name: p.name,
      isAI: p.isAI,
    }));
  }

  start() {
    this.state = 'countdown';
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
      const delay = 500 + Math.random() * 2000;
      const accuracy = 0.6 + Math.random() * 0.25;
      const isCorrect = Math.random() < accuracy;
      const answerIndex = isCorrect
        ? q.correctIndex
        : this.randomWrongIndex(q.correctIndex);

      this.schedule(() => {
        if (this.state === 'playing' && !this.answeredThisRound.has(player.id)) {
          this.processAnswer(player.id, answerIndex);

          // AI might use skill
          if (
            player.energy >= SKILL_COST &&
            !this.isFinalQuestion &&
            Math.random() < 0.3
          ) {
            const skills: SkillType[] = ['shake', 'fog', 'timeCut'];
            this.handleSkill(
              player.id,
              skills[Math.floor(Math.random() * skills.length)]!,
            );
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

    const q = this.questions[this.currentQuestionIndex]!;
    const responseTime = Date.now() - this.questionStartTime;
    const remainingTime = Math.max(0, QUESTION_TIME_MS - responseTime);
    const correct = answerIndex === q.correctIndex;
    const isFinal = this.isFinalQuestion;

    if (correct) {
      const { baseScore, speedBonus, comboMultiplier, total, newCombo } =
        calculateCorrect(remainingTime, player.combo, isFinal);

      player.score += total;
      player.combo = newCombo;
      player.maxCombo = Math.max(player.maxCombo, newCombo);
      player.correctCount++;
      player.totalResponseTime += responseTime;
      player.answeredCount++;
      player.energy = Math.min(player.energy + ENERGY_PER_CORRECT, 9);

      return {
        correct: true,
        correctIndex: q.correctIndex,
        baseScore,
        speedBonus,
        comboMultiplier,
        totalGained: total,
        totalScore: player.score,
        combo: newCombo,
        energy: player.energy,
        isFinal,
      };
    } else {
      const { total: penalty } = calculateWrong(isFinal);
      player.score = Math.max(0, player.score + penalty);
      player.combo = 0;
      player.totalResponseTime += responseTime;
      player.answeredCount++;

      player.wrongWords.push({
        word: q.word,
        yourAnswer: q.options[answerIndex] ?? '—',
        correctAnswer: q.options[q.correctIndex]!,
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
        energy: player.energy,
        isFinal,
      };
    }
  }

  private resolveQuestion() {
    if (this.state !== 'playing') return;
    this.state = 'reviewing';

    const q = this.questions[this.currentQuestionIndex]!;
    for (const player of this.players.values()) {
      if (!this.answeredThisRound.has(player.id)) {
        player.combo = 0;
        player.wrongWords.push({
          word: q.word,
          yourAnswer: '(timeout)',
          correctAnswer: q.options[q.correctIndex]!,
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
            energy: player.energy,
            isFinal: this.isFinalQuestion,
          } satisfies AnswerResult);
        }
      }
    }

    this.io.to(this.id).emit('RANK_UPDATE', { rankings: this.getRankings() });

    this.schedule(() => {
      this.state = 'playing';
      this.nextQuestion();
    }, BETWEEN_QUESTIONS_MS);
  }

  // ── Skills ──

  handleSkill(playerId: string, skillType: SkillType) {
    const player = this.players.get(playerId);
    if (!player) return;
    if (player.energy < SKILL_COST) return;
    if (this.state !== 'playing') return;
    if (this.isFinalQuestion) return; // no skills on final question

    player.energy -= SKILL_COST;

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
        energy: player.energy,
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
          wrongWords: player.wrongWords,
        });
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
