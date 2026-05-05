import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Question, QuestionType } from '../types.js';
import { VOCAB_ZH } from './vocabChinese.js';

interface TSLWord {
  rank: number;
  word: string;
  ipa: string;
  pos: string;
  definition_en: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let tslWords: TSLWord[] = [];
let examplesMap: Record<string, string> = {};

function loadTSL(): TSLWord[] {
  if (tslWords.length > 0) return tslWords;
  const raw = readFileSync(join(__dirname, 'tsl.json'), 'utf-8');
  tslWords = JSON.parse(raw) as TSLWord[];
  return tslWords;
}

function loadExamples(): Record<string, string> {
  if (Object.keys(examplesMap).length > 0) return examplesMap;
  try {
    const raw = readFileSync(join(__dirname, 'examples.json'), 'utf-8');
    examplesMap = JSON.parse(raw) as Record<string, string>;
  } catch {
    examplesMap = {};
  }
  return examplesMap;
}

export function lookupExample(word: string): string {
  const examples = loadExamples();
  return examples[word.toLowerCase()] ?? '';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function pickRandom<T>(arr: T[], n: number): T[] {
  return shuffle(arr).slice(0, n);
}

// Bias selection toward `weakLower`: take ~70% from weak pool, pad with random.
// `excludeLower` words are skipped entirely so the same headword doesn't
// appear twice in one match (e.g. once as vocab, once as audio).
function pickWeighted<T>(
  pool: T[],
  getWord: (entry: T) => string,
  weakLower: Set<string>,
  n: number,
  excludeLower: Set<string> = new Set(),
): T[] {
  if (n <= 0 || pool.length === 0) return [];
  const available = excludeLower.size > 0
    ? pool.filter((p) => !excludeLower.has(getWord(p).toLowerCase()))
    : pool;
  if (weakLower.size === 0) return pickRandom(available, n);
  const weakPool = available.filter((p) => weakLower.has(getWord(p).toLowerCase()));
  const otherPool = available.filter((p) => !weakLower.has(getWord(p).toLowerCase()));
  const targetWeak = Math.min(weakPool.length, Math.ceil(n * 0.7));
  const fromWeak = pickRandom(weakPool, targetWeak);
  const fromOther = pickRandom(otherPool, n - fromWeak.length);
  return shuffle([...fromWeak, ...fromOther]).slice(0, n);
}

function truncDef(s: string, max = 35): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// Look up TSL definition for a word
function lookupDef(word: string): string {
  const w = loadTSL().find((t) => t.word.toLowerCase() === word.toLowerCase());
  return w?.definition_en ?? '';
}

// Look up TSL part-of-speech for a word
export function lookupPos(word: string): string {
  const w = loadTSL().find((t) => t.word.toLowerCase() === word.toLowerCase());
  return w?.pos ?? '';
}

// Attach pos + example onto a Question, looked up by the headword.
function withMeta<T extends { word: string }>(q: T): T & {
  pos: string;
  example: string;
} {
  return {
    ...q,
    pos: lookupPos(q.word),
    example: lookupExample(q.word),
  };
}

// ── Generate vocab (English → Chinese) from hand-crafted bank ──
function generateVocabQuestions(count: number, weakLower: Set<string>, excludeLower: Set<string>): Question[] {
  const selected = pickWeighted(VOCAB_ZH, (e) => e[0], weakLower, Math.min(count, VOCAB_ZH.length), excludeLower);
  return selected.map(([word, correct, w1, w2, w3], idx) => {
    const options = shuffle([correct, w1, w2, w3]);
    return withMeta({
      id: `zh-v-${idx}-${word}`,
      type: 'vocab' as const,
      word,
      prompt: word,
      options,
      correctIndex: options.indexOf(correct),
      definition: lookupDef(word),
    });
  });
}

// ── Generate audio (hear word → pick Chinese meaning) from vocab bank ──
function generateAudioQuestions(count: number, weakLower: Set<string>, excludeLower: Set<string>): Question[] {
  const selected = pickWeighted(VOCAB_ZH, (e) => e[0], weakLower, Math.min(count, VOCAB_ZH.length), excludeLower);
  return selected.map(([word, correct, w1, w2, w3], idx) => {
    const options = shuffle([correct, w1, w2, w3]);
    return withMeta({
      id: `zh-a-${idx}-${word}`,
      type: 'audio' as const,
      word,
      prompt: '',
      options,
      correctIndex: options.indexOf(correct),
      definition: lookupDef(word),
    });
  });
}

// ── Generate definition match: show definition → pick correct word ──
function generateDefinitionQuestions(count: number, weakLower: Set<string>, excludeLower: Set<string>): Question[] {
  const words = loadTSL().filter((w) => w.definition_en.length >= 5);
  const selected = pickWeighted(words, (w) => w.word, weakLower, Math.min(count, words.length), excludeLower);
  return selected.map((w, idx) => {
    const wrongWords = pickRandom(
      words.filter((o) => o.word !== w.word),
      3,
    ).map((o) => o.word);
    const options = shuffle([w.word, ...wrongWords]);
    return withMeta({
      id: `tsl-d-${idx}-${w.rank}`,
      type: 'fillblank' as const,
      word: w.word,
      prompt: truncDef(w.definition_en, 50),
      options,
      correctIndex: options.indexOf(w.word),
      definition: w.definition_en,
    });
  });
}

/**
 * Generate N questions with balanced type distribution. When `weakWords`
 * is non-empty, ~70% of questions are biased toward those words.
 *
 * Headwords are de-duped across types within a single match — so the
 * same word can't appear once as a vocab question and again as audio
 * (which used to feel like the round was repeating words).
 */
export function generateTSLQuestions(count: number, weakWords: string[] = []): Question[] {
  const weakLower = new Set(weakWords.map((w) => w.toLowerCase()));
  const vocabCount = Math.ceil(count / 3);
  const audioCount = Math.ceil(count / 3);
  const fillCount = count - vocabCount - audioCount;

  const used = new Set<string>();

  const vocabQs = generateVocabQuestions(vocabCount, weakLower, used);
  for (const q of vocabQs) used.add(q.word.toLowerCase());

  const audioQs = generateAudioQuestions(audioCount, weakLower, used);
  for (const q of audioQs) used.add(q.word.toLowerCase());

  const fillQs = generateDefinitionQuestions(fillCount, weakLower, used);

  return shuffle([...vocabQs, ...audioQs, ...fillQs]);
}
