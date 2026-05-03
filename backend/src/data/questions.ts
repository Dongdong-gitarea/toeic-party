import type { Question } from '../types.js';

export const QUESTION_POOL: Question[] = [
  // ─── Vocab: English → Chinese ───
  {
    id: 'v01', type: 'vocab', word: 'conference',
    prompt: 'conference',
    options: ['會議', '競爭', '合約', '廣告'], correctIndex: 0,
  },
  {
    id: 'v02', type: 'vocab', word: 'deadline',
    prompt: 'deadline',
    options: ['頭條新聞', '截止日期', '死路', '交易'], correctIndex: 1,
  },
  {
    id: 'v03', type: 'vocab', word: 'negotiate',
    prompt: 'negotiate',
    options: ['忽視', '航行', '協商', '否定'], correctIndex: 2,
  },
  {
    id: 'v04', type: 'vocab', word: 'warranty',
    prompt: 'warranty',
    options: ['倉庫', '警告', '薪資', '保固'], correctIndex: 3,
  },
  {
    id: 'v05', type: 'vocab', word: 'revenue',
    prompt: 'revenue',
    options: ['營收', '評論', '修訂', '租金'], correctIndex: 0,
  },
  {
    id: 'v06', type: 'vocab', word: 'achieve',
    prompt: 'achieve',
    options: ['���收', '達成', '相信', '欺騙'], correctIndex: 1,
  },
  {
    id: 'v07', type: 'vocab', word: 'inventory',
    prompt: 'inventory',
    options: ['發明', '投資', '庫存', '調查'], correctIndex: 2,
  },
  {
    id: 'v08', type: 'vocab', word: 'reimburse',
    prompt: 'reimburse',
    options: ['加強', '重組', '提醒', '報銷'], correctIndex: 3,
  },

  // ─── Audio: hear the word → pick correct spelling ───
  {
    id: 'a01', type: 'audio', word: 'conference',
    prompt: '',
    options: ['conference', 'confidence', 'consequence', 'convenience'], correctIndex: 0,
  },
  {
    id: 'a02', type: 'audio', word: 'deadline',
    prompt: '',
    options: ['decline', 'deadline', 'define', 'design'], correctIndex: 1,
  },
  {
    id: 'a03', type: 'audio', word: 'negotiate',
    prompt: '',
    options: ['nominate', 'navigate', 'negotiate', 'generate'], correctIndex: 2,
  },
  {
    id: 'a04', type: 'audio', word: 'achieve',
    prompt: '',
    options: ['receive', 'believe', 'deceive', 'achieve'], correctIndex: 3,
  },
  {
    id: 'a05', type: 'audio', word: 'revenue',
    prompt: '',
    options: ['revenue', 'review', 'rescue', 'resume'], correctIndex: 0,
  },
  {
    id: 'a06', type: 'audio', word: 'inventory',
    prompt: '',
    options: ['investment', 'inventory', 'innovation', 'invitation'], correctIndex: 1,
  },
  {
    id: 'a07', type: 'audio', word: 'profit',
    prompt: '',
    options: ['project', 'process', 'profit', 'product'], correctIndex: 2,
  },
  {
    id: 'a08', type: 'audio', word: 'warranty',
    prompt: '',
    options: ['warning', 'wardrobe', 'warehouse', 'warranty'], correctIndex: 3,
  },

  // ─── Fill-in-the-blank ───
  {
    id: 'f01', type: 'fillblank', word: 'postponed',
    prompt: 'The meeting has been ___ to next Monday.',
    options: ['postponed', 'canceled', 'attended', 'scheduled'], correctIndex: 0,
  },
  {
    id: 'f02', type: 'fillblank', word: 'retain',
    prompt: 'Please ___ your receipt for future reference.',
    options: ['return', 'retain', 'review', 'refuse'], correctIndex: 1,
  },
  {
    id: 'f03', type: 'fillblank', word: 'comply',
    prompt: 'All employees must ___ with the new policy.',
    options: ['compete', 'compare', 'comply', 'complain'], correctIndex: 2,
  },
  {
    id: 'f04', type: 'fillblank', word: 'expand',
    prompt: 'The company plans to ___ its operations overseas.',
    options: ['export', 'expose', 'expect', 'expand'], correctIndex: 3,
  },
  {
    id: 'f05', type: 'fillblank', word: 'promoted',
    prompt: 'She was ___ to the position of senior manager.',
    options: ['promoted', 'proposed', 'provided', 'projected'], correctIndex: 0,
  },
  {
    id: 'f06', type: 'fillblank', word: 'expire',
    prompt: 'The contract will ___ at the end of this month.',
    options: ['export', 'expire', 'explore', 'expect'], correctIndex: 1,
  },
  {
    id: 'f07', type: 'fillblank', word: 'achieve',
    prompt: 'I want to ___ my goal before the deadline.',
    options: ['receive', 'believe', 'achieve', 'deceive'], correctIndex: 2,
  },
  {
    id: 'f08', type: 'fillblank', word: 'identify',
    prompt: 'We need to ___ a new supplier for this project.',
    options: ['import', 'ignore', 'imitate', 'identify'], correctIndex: 3,
  },
];

export function pickQuestions(count: number): Question[] {
  const shuffled = [...QUESTION_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
