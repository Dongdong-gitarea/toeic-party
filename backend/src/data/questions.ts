import type { Question } from '../types.js';
import { generateTSLQuestions } from './tslLoader.js';

// 'curve' = a built-in difficulty ramp inside a single 10-question
// match: ~3 easy warm-ups → ~4 medium → ~3 hard finishers. Used by
// default for public matchmaking so anonymous queues aren't always
// stuck at flat medium.
export type Difficulty = 'easy' | 'medium' | 'hard' | 'curve';

export function pickQuestions(count: number, weakWords: string[] = [], difficulty: Difficulty = 'curve'): Question[] {
  return generateTSLQuestions(count, weakWords, difficulty);
}
