import { create } from 'zustand';
import { getSocket } from '@/lib/socket';
import { sounds } from '@/lib/sounds';
import { haptic } from '@/lib/haptics';

export type Locale = 'zh' | 'en';

const SAVED_WORDS_KEY = 'tp_words';

function loadSavedWords(): SavedWord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SAVED_WORDS_KEY);
    return raw ? (JSON.parse(raw) as SavedWord[]) : [];
  } catch {
    return [];
  }
}

function persistSavedWords(words: SavedWord[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SAVED_WORDS_KEY, JSON.stringify(words));
  } catch {
    // ignore quota errors
  }
}

function mergeReviewIntoSaved(
  saved: SavedWord[],
  review: ReviewWord[],
): SavedWord[] {
  const map = new Map<string, SavedWord>();
  for (const w of saved) map.set(w.word.toLowerCase(), w);
  const now = Date.now();
  for (const r of review) {
    if (!r.word) continue;
    const key = r.word.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      map.set(key, {
        ...existing,
        correctCount: existing.correctCount + (r.correct ? 1 : 0),
        wrongCount: existing.wrongCount + (r.correct ? 0 : 1),
        definition: r.definition || existing.definition,
        correctAnswer: r.correctAnswer || existing.correctAnswer,
        meaning: r.meaning || existing.meaning,
        pos: r.pos || existing.pos,
        example: r.example || existing.example,
        exampleZh: r.exampleZh || existing.exampleZh,
        lastSeen: now,
      });
    } else {
      map.set(key, {
        word: r.word,
        correctAnswer: r.correctAnswer,
        definition: r.definition,
        meaning: r.meaning ?? '',
        pos: r.pos ?? '',
        example: r.example ?? '',
        exampleZh: r.exampleZh ?? '',
        correctCount: r.correct ? 1 : 0,
        wrongCount: r.correct ? 0 : 1,
        starred: false,
        lastSeen: now,
      });
    }
  }
  return [...map.values()];
}

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
  charIdx?: number;
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
  isFinal: boolean;
  word?: string;
  correctAnswer?: string;
  definition?: string;
  meaning?: string;
  pos?: string;
  example?: string;
  exampleZh?: string;
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
  meaning?: string;
  pos?: string;
  example?: string;
  exampleZh?: string;
  questionType: string;
}

export interface SavedWord {
  word: string;
  correctAnswer: string;
  definition: string;
  meaning: string;
  pos?: string;
  example?: string;
  exampleZh?: string;
  correctCount: number;
  wrongCount: number;
  starred: boolean;
  lastSeen: number;
}

interface SkillEffect {
  fromName: string;
  skillType: SkillType;
}

interface LobbyPlayer {
  name: string;
  ready: boolean;
  you?: boolean;
}

interface LobbyState {
  players: LobbyPlayer[];
  count: number;
  capacity: number;
  secondsLeft: number;
  code?: string;
  isPrivate?: boolean;
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
  myUsedSkills: SkillType[];

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

  // Personal vocab notebook (persisted to localStorage)
  savedWords: SavedWord[];

  // Ready state in lobby (local mirror of server flag)
  myReady: boolean;

  // Selected character index (free pick, persisted)
  selectedCharIdx: number;

  // UI language (persisted)
  locale: Locale;

  setPlayerName: (name: string) => void;
  setGameMode: (mode: 'classic' | 'jump') => void;
  setSelectedChar: (idx: number) => void;
  setLocale: (locale: Locale) => void;
  joinMatch: () => void;
  leaveMatch: () => void;
  setReady: (ready: boolean) => void;
  createPrivateRoom: () => void;
  joinPrivateRoom: (code: string) => void;
  joinError: string | null;
  submitAnswer: (answerIndex: number) => void;
  useSkill: (skillType: SkillType) => void;
  initSocket: () => void;
  reset: () => void;
  toggleStarWord: (word: string) => void;
  removeSavedWord: (word: string) => void;
  addManualWord: (word: string, meaning: string) => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  phase: 'idle',
  gameMode: 'classic',
  playerId: null,
  playerName: typeof window !== 'undefined' ? localStorage.getItem('tp_name') || '' : '',
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
  myUsedSkills: [],
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
  unlockedChars: 4,
  savedWords: loadSavedWords(),
  myReady: false,
  joinError: null,
  selectedCharIdx:
    typeof window !== 'undefined' ? Number(localStorage.getItem('tp_char_idx') || 0) : 0,
  locale:
    typeof window !== 'undefined'
      ? ((localStorage.getItem('tp_locale') as Locale) || 'zh')
      : 'zh',

  setPlayerName: (name) => {
    if (typeof window !== 'undefined') localStorage.setItem('tp_name', name);
    set({ playerName: name });
  },
  setGameMode: (mode) => set({ gameMode: mode }),
  setSelectedChar: (idx) => {
    if (typeof window !== 'undefined') localStorage.setItem('tp_char_idx', String(idx));
    set({ selectedCharIdx: idx });
  },
  setLocale: (locale) => {
    if (typeof window !== 'undefined') localStorage.setItem('tp_locale', locale);
    set({ locale });
  },

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

    socket.on('PRIVATE_ROOM_JOINED', () => {
      set({ phase: 'matchmaking', myReady: false, joinError: null });
    });

    socket.on('PRIVATE_ROOM_ERROR', ({ reason }: { reason: string }) => {
      const messages: Record<string, string> = {
        not_found: 'home.joinError',
        full: 'home.joinError',
        expired: 'home.joinError',
      };
      set({ joinError: messages[reason] ?? 'home.joinError', phase: 'idle', lobby: null });
    });

    socket.on('MATCH_FOUND', ({ roomId, players }) => {
      set({
        phase: 'found',
        roomId,
        players,
        lobby: null,
        myScore: 0,
        myCombo: 0,
        myUsedSkills: [],
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
        haptic(result.combo >= 3 ? 'heavy' : 'success');
        if (result.combo >= 3) sounds.combo();
      } else {
        sounds.wrong();
        haptic('error');
      }
      set({
        lastResult: result,
        myScore: result.totalScore,
        myCombo: result.combo,
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
      haptic('error');
      // Clear previous effect
      const prev = get().effectTimer;
      if (prev) clearTimeout(prev);

      const timer = setTimeout(() => {
        set({ activeEffect: null, effectTimer: null });
      }, 2000);

      set({ activeEffect: effect, effectTimer: timer });
    });

    socket.on('SKILL_USED', ({ usedSkills }: { skillType: SkillType; usedSkills: SkillType[] }) => {
      set({ myUsedSkills: usedSkills });
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
      const merged = mergeReviewIntoSaved(get().savedWords, reviewWords);
      persistSavedWords(merged);
      set({ reviewWords, savedWords: merged });
    });

    socket.on('disconnect', () => {
      set({ socketReady: false });
    });
  },

  joinMatch: () => {
    const { playerName, savedWords, selectedCharIdx } = get();
    const weakWords = savedWords
      .filter((w) => w.wrongCount >= w.correctCount && (w.wrongCount > 0 || w.correctCount === 0))
      .sort((a, b) => b.wrongCount - a.wrongCount)
      .slice(0, 60)
      .map((w) => w.word);
    const socket = getSocket();
    socket.emit('JOIN_MATCH', {
      playerName: playerName || 'Player',
      weakWords,
      charIdx: selectedCharIdx,
    });
    set({ phase: 'matchmaking', lobby: null, myReady: false });
  },

  leaveMatch: () => {
    getSocket().emit('LEAVE_QUEUE');
    set({ phase: 'idle', lobby: null, myReady: false });
  },

  setReady: (ready: boolean) => {
    getSocket().emit('READY_UP', { ready });
    set({ myReady: ready });
  },

  createPrivateRoom: () => {
    const { playerName, savedWords, selectedCharIdx } = get();
    const weakWords = savedWords
      .filter((w) => w.wrongCount >= w.correctCount && (w.wrongCount > 0 || w.correctCount === 0))
      .slice(0, 60)
      .map((w) => w.word);
    set({ joinError: null });
    getSocket().emit('CREATE_PRIVATE', {
      playerName: playerName || 'Player',
      weakWords,
      charIdx: selectedCharIdx,
    });
  },

  joinPrivateRoom: (code: string) => {
    const { playerName, savedWords, selectedCharIdx } = get();
    const weakWords = savedWords
      .filter((w) => w.wrongCount >= w.correctCount && (w.wrongCount > 0 || w.correctCount === 0))
      .slice(0, 60)
      .map((w) => w.word);
    set({ joinError: null });
    getSocket().emit('JOIN_PRIVATE', {
      code: code.toUpperCase().trim(),
      playerName: playerName || 'Player',
      weakWords,
      charIdx: selectedCharIdx,
    });
  },

  submitAnswer: (answerIndex) => {
    if (get().selectedAnswer !== null) return;
    set({ selectedAnswer: answerIndex });
    haptic('tap');
    getSocket().emit('SUBMIT_ANSWER', { answerIndex });
  },

  useSkill: (skillType) => {
    if (get().myUsedSkills.includes(skillType)) return;
    haptic('heavy');
    getSocket().emit('USE_SKILL', { skillType });
  },

  toggleStarWord: (word: string) => {
    const key = word.toLowerCase();
    const current = get().savedWords;
    const found = current.find((w) => w.word.toLowerCase() === key);
    let next: SavedWord[];
    if (found) {
      next = current.map((w) =>
        w.word.toLowerCase() === key ? { ...w, starred: !w.starred } : w,
      );
    } else {
      // Save brand-new entry from current review session
      const r = get().reviewWords.find(
        (rw) => rw.word.toLowerCase() === key,
      );
      if (!r) return;
      next = [
        ...current,
        {
          word: r.word,
          correctAnswer: r.correctAnswer,
          definition: r.definition,
          meaning: r.meaning ?? '',
          pos: r.pos ?? '',
          example: r.example ?? '',
          exampleZh: r.exampleZh ?? '',
          correctCount: r.correct ? 1 : 0,
          wrongCount: r.correct ? 0 : 1,
          starred: true,
          lastSeen: Date.now(),
        },
      ];
    }
    persistSavedWords(next);
    set({ savedWords: next });
  },

  removeSavedWord: (word: string) => {
    const key = word.toLowerCase();
    const next = get().savedWords.filter((w) => w.word.toLowerCase() !== key);
    persistSavedWords(next);
    set({ savedWords: next });
  },

  addManualWord: (word: string, meaning: string) => {
    const trimmed = word.trim();
    const trimmedMeaning = meaning.trim();
    if (!trimmed || !trimmedMeaning) return;
    const key = trimmed.toLowerCase();
    const current = get().savedWords;
    const existing = current.find((w) => w.word.toLowerCase() === key);
    let next: SavedWord[];
    if (existing) {
      next = current.map((w) =>
        w.word.toLowerCase() === key
          ? { ...w, meaning: trimmedMeaning, starred: true, lastSeen: Date.now() }
          : w,
      );
    } else {
      next = [
        ...current,
        {
          word: trimmed,
          correctAnswer: trimmedMeaning,
          definition: '',
          meaning: trimmedMeaning,
          correctCount: 0,
          wrongCount: 0,
          starred: true,
          lastSeen: Date.now(),
        },
      ];
    }
    persistSavedWords(next);
    set({ savedWords: next });
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
      myUsedSkills: [],
      finalRankings: [],
      labels: null,
      reviewWords: [],
      countdownValue: 3,
      activeEffect: null,
      effectTimer: null,
      myReady: false,
    });
  },
}));
