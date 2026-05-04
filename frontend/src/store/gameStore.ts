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
  type: 'vocab' | 'audio' | 'fillblank';
  prompt: string;
  options: string[];
  isFinal: boolean;
  audioWord?: string;
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

interface ReviewWord {
  word: string;
  correct: boolean;
  yourAnswer: string;
  correctAnswer: string;
  definition: string;
  questionType: string;
}

interface SkillEffect {
  fromName: string;
  skillType: SkillType;
}

interface LobbyState {
  players: string[];
  count: number;
  capacity: number;
  secondsLeft: number;
}

interface GameState {
  phase: Phase;
  gameMode: 'classic' | 'jump';
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
  reviewWords: ReviewWord[];

  countdownValue: number;
  socketReady: boolean;

  lobby: LobbyState | null;

  // Skill effects received
  activeEffect: SkillEffect | null;
  overtakeMsg: string | null;
  effectTimer: NodeJS.Timeout | null;

  // Session XP
  totalXP: number;
  gamesPlayed: number;
  unlockedChars: number; // 1-4 characters unlocked

  setPlayerName: (name: string) => void;
  setGameMode: (mode: 'classic' | 'jump') => void;
  joinMatch: () => void;
  submitAnswer: (answerIndex: number) => void;
  useSkill: (skillType: SkillType) => void;
  initSocket: () => void;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  gameMode: 'classic',
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
  reviewWords: [],
  countdownValue: 3,
  socketReady: false,
  lobby: null,
  activeEffect: null,
  effectTimer: null,
  overtakeMsg: null,
  totalXP: typeof window !== 'undefined' ? Number(localStorage.getItem('tp_xp') || 0) : 0,
  gamesPlayed: typeof window !== 'undefined' ? Number(localStorage.getItem('tp_games') || 0) : 0,
  unlockedChars: typeof window !== 'undefined' ? Number(localStorage.getItem('tp_chars') || 1) : 1,

  setPlayerName: (name) => set({ playerName: name }),
  setGameMode: (mode) => set({ gameMode: mode }),

  initSocket: () => {
    if (get().socketReady) return;
    const socket = getSocket();
    socket.connect();

    socket.on('connect', () => {
      set({ playerId: socket.id, socketReady: true });
    });

    socket.on('LOBBY_UPDATE', (state: LobbyState) => {
      set({ lobby: state });
    });

    socket.on('MATCH_FOUND', ({ roomId, players }) => {
      set({
        phase: 'found',
        roomId,
        players,
        lobby: null,
        myScore: 0,
        myCombo: 0,
        myEnergy: 0,
        rankings: [],
        finalRankings: [],
        labels: null,
        reviewWords: [],
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
      // Detect overtake
      const prev = get().rankings;
      const myId = get().playerId;
      if (myId && prev.length > 0) {
        const oldRank = prev.findIndex((r) => r.playerId === myId);
        const newRank = rankings.findIndex((r: RankEntry) => r.playerId === myId);
        if (newRank >= 0 && oldRank > newRank) {
          // Moved up! Get the name of who we passed
          const passed = prev[newRank];
          if (passed && passed.playerId !== myId) {
            set({ overtakeMsg: `You passed ${passed.name}!` });
            setTimeout(() => set({ overtakeMsg: null }), 2000);
            sounds.rankUp();
          }
        }
      }
      set({ rankings });
    });

    socket.on('SKILL_EFFECT', (effect: SkillEffect) => {
      sounds.skillReceived();
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
      const newXP = get().totalXP + xpGain;
      const newGames = get().gamesPlayed + 1;
      // Unlock: 1=default, 3 games=2nd, 5 games=3rd, 10 games=4th
      const unlocked = newGames >= 10 ? 4 : newGames >= 5 ? 3 : newGames >= 3 ? 2 : 1;

      // Persist
      if (typeof window !== 'undefined') {
        localStorage.setItem('tp_xp', String(newXP));
        localStorage.setItem('tp_games', String(newGames));
        localStorage.setItem('tp_chars', String(Math.max(get().unlockedChars, unlocked)));
      }

      set({
        phase: 'result',
        finalRankings: rankings,
        labels,
        totalXP: newXP,
        gamesPlayed: newGames,
        unlockedChars: Math.max(get().unlockedChars, unlocked),
      });
    });

    socket.on('POST_GAME_STATS', ({ reviewWords }) => {
      set({ reviewWords });
    });

    socket.on('disconnect', () => {
      set({ socketReady: false });
    });
  },

  joinMatch: () => {
    const { playerName } = get();
    const socket = getSocket();
    socket.emit('JOIN_MATCH', { playerName: playerName || 'Player' });
    set({ phase: 'matchmaking', lobby: null });
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
      lobby: null,
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
      reviewWords: [],
      countdownValue: 3,
      activeEffect: null,
      effectTimer: null,
    });
  },
}));
