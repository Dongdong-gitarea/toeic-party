export type SkillType = 'shake' | 'fog' | 'timeCut';
export type QuestionType = 'vocab' | 'listen' | 'fillblank';

export interface Player {
  id: string;
  name: string;
  isAI: boolean;
  score: number;
  combo: number;
  maxCombo: number;
  correctCount: number;
  totalResponseTime: number;
  answeredCount: number;
  energy: number;
  wrongWords: WrongWord[];
}

export interface WrongWord {
  word: string;
  yourAnswer: string;
  correctAnswer: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctIndex: number;
  word: string; // the actual word being tested (for wrong-word tracking)
}

export interface QuestionForClient {
  id: string;
  type: QuestionType;
  prompt: string;
  options: string[];
  isFinal: boolean;
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
}

export interface SkillEffect {
  fromName: string;
  skillType: SkillType;
}

export interface PostGameStats {
  wrongWords: WrongWord[];
}
