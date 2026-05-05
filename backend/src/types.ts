export type SkillType = 'shake' | 'fog' | 'timeCut';
export type QuestionType = 'vocab' | 'audio' | 'fillblank';

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  charIdx: number;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  totalResponseTime: number;
  answeredCount: number;
  energy: number;
  reviewWords: ReviewWord[];
}

export interface ReviewWord {
  word: string;
  correct: boolean;
  yourAnswer: string;
  correctAnswer: string;
  definition: string;
  meaning: string; // Chinese meaning, always populated when available
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
  energy: number;
  isFinal: boolean;
  word: string;
  correctAnswer: string;
  definition: string;
  meaning: string;
}

export interface SkillEffect {
  fromName: string;
  skillType: SkillType;
}

export interface PostGameStats {
  reviewWords: ReviewWord[];
}
