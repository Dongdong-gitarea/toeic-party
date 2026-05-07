import type { Question, QuestionType } from '../types.js';
import { generateTSLQuestions } from './tslLoader.js';

interface WordEntry {
  word: string;
  vocab: { options: string[]; correctIndex: number };
  audio: { options: string[]; correctIndex: number };
  fillblank: { sentence: string; options: string[]; correctIndex: number };
}

const WORD_BANK: WordEntry[] = [
  {
    word: 'conference',
    vocab: { options: ['會議', '競爭', '合約', '廣告'], correctIndex: 0 },
    audio: { options: ['conference', 'confidence', 'consequence', 'convenience'], correctIndex: 0 },
    fillblank: { sentence: 'The annual ___ will be held in Tokyo this March.', options: ['conference', 'reference', 'preference', 'difference'], correctIndex: 0 },
  },
  {
    word: 'deadline',
    vocab: { options: ['頭條新聞', '截止日期', '死路', '交易'], correctIndex: 1 },
    audio: { options: ['decline', 'deadline', 'define', 'design'], correctIndex: 1 },
    fillblank: { sentence: 'We must submit the report before the ___.', options: ['headline', 'deadline', 'guideline', 'streamline'], correctIndex: 1 },
  },
  {
    word: 'negotiate',
    vocab: { options: ['忽視', '航行', '協商', '否定'], correctIndex: 2 },
    audio: { options: ['nominate', 'navigate', 'negotiate', 'generate'], correctIndex: 2 },
    fillblank: { sentence: 'They will ___ the terms of the new contract.', options: ['dominate', 'estimate', 'negotiate', 'eliminate'], correctIndex: 2 },
  },
  {
    word: 'warranty',
    vocab: { options: ['倉庫', '警告', '薪資', '保固'], correctIndex: 3 },
    audio: { options: ['warning', 'wardrobe', 'warehouse', 'warranty'], correctIndex: 3 },
    fillblank: { sentence: 'This product comes with a two-year ___.', options: ['warranty', 'penalty', 'strategy', 'delivery'], correctIndex: 0 },
  },
  {
    word: 'revenue',
    vocab: { options: ['營收', '評論', '修訂', '租金'], correctIndex: 0 },
    audio: { options: ['revenue', 'review', 'rescue', 'resume'], correctIndex: 0 },
    fillblank: { sentence: "The company's ___ increased by 20% this quarter.", options: ['revenue', 'review', 'resource', 'reserve'], correctIndex: 0 },
  },
  {
    word: 'achieve',
    vocab: { options: ['接收', '達成', '相信', '欺騙'], correctIndex: 1 },
    audio: { options: ['receive', 'achieve', 'believe', 'deceive'], correctIndex: 1 },
    fillblank: { sentence: 'She worked hard to ___ her career goals.', options: ['receive', 'achieve', 'believe', 'perceive'], correctIndex: 1 },
  },
  {
    word: 'inventory',
    vocab: { options: ['發明', '投資', '庫存', '調查'], correctIndex: 2 },
    audio: { options: ['investment', 'inventory', 'innovation', 'invitation'], correctIndex: 1 },
    fillblank: { sentence: 'We need to check the ___ before placing a new order.', options: ['investment', 'inventory', 'interview', 'invitation'], correctIndex: 1 },
  },
  {
    word: 'reimburse',
    vocab: { options: ['加強', '重組', '提醒', '報銷'], correctIndex: 3 },
    audio: { options: ['reinforce', 'reimburse', 'reorganize', 'rearrange'], correctIndex: 1 },
    fillblank: { sentence: 'The company will ___ your travel expenses.', options: ['reinforce', 'reimburse', 'remember', 'reorganize'], correctIndex: 1 },
  },
  {
    word: 'profit',
    vocab: { options: ['項目', '過程', '利潤', '產品'], correctIndex: 2 },
    audio: { options: ['project', 'process', 'profit', 'product'], correctIndex: 2 },
    fillblank: { sentence: 'The business reported a significant ___ this year.', options: ['project', 'product', 'profit', 'protect'], correctIndex: 2 },
  },
  {
    word: 'expand',
    vocab: { options: ['出口', '暴露', '期望', '擴展'], correctIndex: 3 },
    audio: { options: ['export', 'expose', 'expect', 'expand'], correctIndex: 3 },
    fillblank: { sentence: 'The company plans to ___ into the Asian market.', options: ['export', 'explore', 'expect', 'expand'], correctIndex: 3 },
  },
  {
    word: 'comply',
    vocab: { options: ['競爭', '比較', '遵守', '抱怨'], correctIndex: 2 },
    audio: { options: ['compete', 'compare', 'comply', 'complain'], correctIndex: 2 },
    fillblank: { sentence: 'All employees must ___ with the safety regulations.', options: ['compete', 'compare', 'comply', 'complain'], correctIndex: 2 },
  },
  {
    word: 'promote',
    vocab: { options: ['提議', '晉升', '提供', '預測'], correctIndex: 1 },
    audio: { options: ['propose', 'promote', 'provide', 'project'], correctIndex: 1 },
    fillblank: { sentence: 'She was ___d to the position of regional manager.', options: ['propose', 'promote', 'provide', 'protect'], correctIndex: 1 },
  },
  {
    word: 'retain',
    vocab: { options: ['退回', '保留', '審查', '拒絕'], correctIndex: 1 },
    audio: { options: ['return', 'retain', 'review', 'refuse'], correctIndex: 1 },
    fillblank: { sentence: 'Please ___ your receipt for future reference.', options: ['return', 'retain', 'review', 'refuse'], correctIndex: 1 },
  },
  {
    word: 'expire',
    vocab: { options: ['出口', '到期', '探索', '期望'], correctIndex: 1 },
    audio: { options: ['export', 'expire', 'explore', 'expect'], correctIndex: 1 },
    fillblank: { sentence: 'Your membership will ___ at the end of this month.', options: ['export', 'expire', 'explore', 'expect'], correctIndex: 1 },
  },
  {
    word: 'postpone',
    vocab: { options: ['延期', '提議', '準備', '處理'], correctIndex: 0 },
    audio: { options: ['postpone', 'propose', 'prepare', 'proceed'], correctIndex: 0 },
    fillblank: { sentence: 'The meeting has been ___d until next week.', options: ['postpone', 'propose', 'prepare', 'proceed'], correctIndex: 0 },
  },
];

export type Difficulty = 'easy' | 'medium' | 'hard';

export function pickQuestions(count: number, weakWords: string[] = [], difficulty: Difficulty = 'medium'): Question[] {
  return generateTSLQuestions(count, weakWords, difficulty);
}

export function pickQuestionsLegacy(count: number): Question[] {
  const shuffled = [...WORD_BANK].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, WORD_BANK.length));

  // Balanced type distribution: ~3 each, remainder random
  const types: QuestionType[] = [];
  const allTypes: QuestionType[] = ['vocab', 'audio', 'fillblank'];
  const perType = Math.floor(count / 3);
  for (const t of allTypes) {
    for (let i = 0; i < perType; i++) types.push(t);
  }
  while (types.length < count) {
    types.push(allTypes[Math.floor(Math.random() * allTypes.length)]!);
  }
  // Shuffle type assignments
  types.sort(() => Math.random() - 0.5);

  return selected.map((entry, i) => {
    const type = types[i]!;

    if (type === 'vocab') {
      return {
        id: `${entry.word}-vocab-${i}`,
        type: 'vocab',
        word: entry.word,
        prompt: entry.word,
        options: entry.vocab.options,
        correctIndex: entry.vocab.correctIndex,
      };
    }

    if (type === 'audio') {
      return {
        id: `${entry.word}-audio-${i}`,
        type: 'audio',
        word: entry.word,
        prompt: '',
        options: entry.audio.options,
        correctIndex: entry.audio.correctIndex,
      };
    }

    // fillblank
    return {
      id: `${entry.word}-fill-${i}`,
      type: 'fillblank',
      word: entry.word,
      prompt: entry.fillblank.sentence,
      options: entry.fillblank.options,
      correctIndex: entry.fillblank.correctIndex,
    };
  });
}
