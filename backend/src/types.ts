export type SkillType = 'shake' | 'fog' | 'timeCut';
export type QuestionType = 'vocab' | 'audio' | 'fillblank' | 'confusable' | 'collocation';

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  charIdx: number;
  deviceId?: string; // for DB persistence
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  totalResponseTime: number;
  answeredCount: number;
  usedSkills: SkillType[];
  // What skill (if any) the player picked during the most recent
  // between-round window. Cleared when the next question fires.
  pendingCast: SkillType | null;
  reviewWords: ReviewWord[];
}

export interface ReviewWord {
  word: string;
  correct: boolean;
  yourAnswer: string;
  correctAnswer: string;
  definition: string;
  meaning: string; // Chinese meaning, always populated when available
  pos: string; // part of speech, e.g. "noun", "verb"; may be empty
  example: string; // English example sentence (from examples.json); may be empty
  questionType: QuestionType;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndex: number;
  word: string;
  definition?: string; // English definition for post-game review
  pos?: string; // part of speech, e.g. "noun", "verb"
  example?: string; // English example sentence (from examples.json)
}

export interface QuestionForClient {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  isFinal: boolean;
  audioWord?: string; // word to speak via TTS for audio type
}

export interface RankEntry {
  playerId: string;
  name: string;
  score: number;
  isAI: boolean;
}

export interface FinalRankEntry extends RankEntry {
  correctCount: number;
  maxCombo: number;
  avgResponseTime: number;
}

export interface GameLabels {
  mvp: string;
  fastest: string;
  comboKing: string;
}

export interface AnswerResult {
  correct: boolean;
  correctIndex: number;
  baseScore: number;
  speedBonus: number;
  comboMultiplier: number;
  totalGained: number;
  totalScore: number;
  combo: number;
  isFinal: boolean;
  word: string;
  correctAnswer: string;
  definition: string;
  meaning: string;
  pos: string;
  example: string;
}

export interface SkillEffect {
  fromName: string;
  skillType: SkillType;
}

export interface RoundSummary {
  questionNumber: number; // 1-based, the question that just finished
  durationMs: number;     // how long the wrap-up window lasts
  skillsAllowed: boolean; // false on first wrap-up (warm-up) and on the last wrap-up before the final question
  results: { playerId: string; correct: boolean; score: number }[];
}

export interface PostGameStats {
  reviewWords: ReviewWord[];
}
