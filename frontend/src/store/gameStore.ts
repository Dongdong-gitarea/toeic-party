import { create } from 'zustand';
import { getSocket } from '@/lib/socket';
import { sounds } from '@/lib/sounds';

export type Phase =
  | 'idle'
  | 'matchmaking'
  | 'found'
  | 'countdown'
  | 'playing'
  | 'result';

export type SkillType = 'shake' | 'fog' | 'timeCut';

interface PlayerInfo {
  playerId: string;
  name: string;
  isAI: boolean;
}

interface QuestionForClient {
  id: string;
  type: 'vocab' | 'listen' | 'fillblank';
  prompt: string;
  options: string[];
  isFinal: boolean;
}

interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  baseScore: number;
  speedBonus: number;
  comboMultiplier: number;
  totalGained: number;
  totalScore: number;
  combo: number;
  energy: number;
  isFinal: boolean;
}

interface RankEntry {
  playerId: string;
  name: string;
  score: number;
  isAI: boolean;
}

interface FinalRankEntry extends RankEntry {
  correctCount: number;
  maxCombo: number;
  avgResponseTime: number;
}

interface GameLabels {
  mvp: string;
  fastest: string;
  comboKing: string;
}

interface WrongWord {
  word: string;
  yourAnswer: string;
  correctAnswer: string;
}

interface SkillEffect {
  fromName: string;
  skillType: SkillType;
}

interface GameState {
  phase: Phase;
  playerId: string | null;
  playerName: string;

  roomId: string | null;
  players: PlayerInfo[];

  currentQuestion: QuestionForClient | null;
  questionNumber: number;
  totalQuestions: number;

  selectedAnswer: number | null;
  lastResult: AnswerResult | null;

  rankings: RankEntry[];
  myScore: number;
  myCombo: number;
  myEnergy: number;

  finalRankings: FinalRankEntry[];
  labels: GameLabels | null;
  wrongWords: WrongWord[];

  countdownValue: number;
  socketReady: boolean;

  // Skill effects received
  activeEffect: SkillEffect | null;
  effectTimer: NodeJS.Timeout | null;

  // Session XP
  totalXP: number;

  setPlayerName: (name: string) => void;
  joinMatch: () => void;
  submitAnswer: (answerIndex: number) => void;
  useSkill: (skillType: SkillType) => void;
  initSocket: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  playerId: null,
  playerName: '',
  roomId: null,
  players: [],
  currentQuestion: null,
  questionNumber: 0,
  totalQuestions: 10,
  selectedAnswer: null,
  lastResult: null,
  rankings: [],
  myScore: 0,
  myCombo: 0,
  myEnergy: 0,
  finalRankings: [],
  labels: null,
  wrongWords: [],
  countdownValue: 3,
  socketReady: false,
  activeEffect: null,
  effectTimer: null,
  totalXP: 0,

  setPlayerName: (name) => set({ playerName: name }),

  initSocket: () => {
    if (get().socketReady) return;
    const socket = getSocket();
    socket.connect();

    socket.on('connect', () => {
      set({ playerId: socket.id, socketReady: true });
    });

    socket.on('MATCH_FOUND', ({ roomId, players }) => {
      set({
        phase: 'found',
        roomId,
        players,
        myScore: 0,
        myCombo: 0,
        myEnergy: 0,
        rankings: [],
        finalRankings: [],
        labels: null,
        wrongWords: [],
      });
    });

    socket.on('GAME_START', () => {
      set({ phase: 'countdown', countdownValue: 3 });
      sounds.gameStart();
      let count = 3;
      const interval = setInterval(() => {
        count--;
        set({ countdownValue: count });
        if (count <= 0) clearInterval(interval);
      }, 1000);
    });

    socket.on('NEW_QUESTION', ({ question, questionNumber, total }) => {
      // Clear any lingering effects on new question
      const prev = get().effectTimer;
      if (prev) clearTimeout(prev);

      set({
        phase: 'playing',
        currentQuestion: question,
        questionNumber,
        totalQuestions: total,
        selectedAnswer: null,
        lastResult: null,
        activeEffect: null,
        effectTimer: null,
      });
    });

    socket.on('ANSWER_RESULT', (result: AnswerResult) => {
      if (result.correct) {
        sounds.correct();
        if (result.combo >= 3) sounds.combo();
      } else {
        sounds.wrong();
      }
      set({
        lastResult: result,
        myScore: result.totalScore,
        myCombo: result.combo,
        myEnergy: result.energy,
      });
    });

    socket.on('RANK_UPDATE', ({ rankings }) => {
      set({ rankings });
    });

    socket.on('SKILL_EFFECT', (effect: SkillEffect) => {
      // Clear previous effect
      const prev = get().effectTimer;
      if (prev) clearTimeout(prev);

      const timer = setTimeout(() => {
        set({ activeEffect: null, effectTimer: null });
      }, 2000);

      set({ activeEffect: effect, effectTimer: timer });
    });

    socket.on('SKILL_USED', ({ energy }: { energy: number }) => {
      set({ myEnergy: energy });
    });

    socket.on('GAME_END', ({ rankings, labels }) => {
      sounds.gameEnd();
      const myPlayer = rankings.find(
        (r: FinalRankEntry) => r.playerId === get().playerId,
      );
      const xpGain = myPlayer ? Math.round(myPlayer.score / 2) : 0;
      set({
        phase: 'result',
        finalRankings: rankings,
        labels,
        totalXP: get().totalXP + xpGain,
      });
    });

    socket.on('POST_GAME_STATS', ({ wrongWords }) => {
      set({ wrongWords });
    });

    socket.on('disconnect', () => {
      set({ socketReady: false });
    });
  },

  joinMatch: () => {
    const { playerName } = get();
    const socket = getSocket();
    socket.emit('JOIN_MATCH', { playerName: playerName || 'Player' });
    set({ phase: 'matchmaking' });
  },

  submitAnswer: (answerIndex) => {
    if (get().selectedAnswer !== null) return;
    set({ selectedAnswer: answerIndex });
    getSocket().emit('SUBMIT_ANSWER', { answerIndex });
  },

  useSkill: (skillType) => {
    if (get().myEnergy < 3) return;
    getSocket().emit('USE_SKILL', { skillType });
  },

  reset: () => {
    const prev = get().effectTimer;
    if (prev) clearTimeout(prev);
    set({
      phase: 'idle',
      roomId: null,
      players: [],
      currentQuestion: null,
      questionNumber: 0,
      selectedAnswer: null,
      lastResult: null,
      rankings: [],
      myScore: 0,
      myCombo: 0,
      myEnergy: 0,
      finalRankings: [],
      labels: null,
      wrongWords: [],
      countdownValue: 3,
      activeEffect: null,
      effectTimer: null,
    });
  },
}));
