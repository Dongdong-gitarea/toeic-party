import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import type { Question, QuestionType } from '../types.js';
import { VOCAB_ZH } from './vocabChinese.js';

interface ConfusablePair {
  0: string; 1: string; 2: string; 3: string; 4: string;
}
interface CollocationEntry {
  0: string; 1: string; 2: string;
}
interface LearningExtras {
  confusables: ConfusablePair[];
  collocations: CollocationEntry[];
}

let learningExtras: LearningExtras | null = null;
function loadExtras(): LearningExtras {
  if (learningExtras) return learningExtras;
  try {
    const raw = readFileSync(join(__dirname, 'learningExtras.json'), 'utf-8');
    learningExtras = JSON.parse(raw) as LearningExtras;
  } catch {
    learningExtras = { confusables: [], collocations: [] };
  }
  return learningExtras;
}

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

// ── Generate confusable pair question: "Which word fits?" ──
function generateConfusableQuestions(count: number, used: Set<string>): Question[] {
  const extras = loadExtras();
  const pairs = shuffle(extras.confusables).slice(0, count);

  // Sentence templates for confusable pairs
  const CONF_SENTENCES: Record<string, [string, number]> = {
    'affect|effect': ['The new policy will have a major ___ on productivity.', 1],
    'effect|affect': ['Budget cuts will ___ all departments.', 0],
    'personal|personnel': ['Please contact the ___ department for benefits.', 1],
    'personnel|personal': ['This is a ___ matter, not a work issue.', 0],
    'complement|compliment': ['The wine will ___ the meal perfectly.', 0],
    'compliment|complement': ['The manager paid her a ___ on the presentation.', 0],
    'accept|except': ['We ___ all major credit cards.', 0],
    'except|accept': ['Everyone attended ___ the director.', 0],
    'advise|advice': ['I would ___ you to review the contract carefully.', 0],
    'advice|advise': ['She gave me excellent ___ on the project.', 0],
    'assure|ensure': ['I ___ you that the delivery will arrive on time.', 0],
    'ensure|assure': ['Please ___ all doors are locked before leaving.', 0],
    'stationary|stationery': ['The company ordered new ___ with the updated logo.', 1],
    'precede|proceed': ['After the introduction, we will ___ to the main topic.', 1],
    'eligible|illegible': ['All full-time employees are ___ for the bonus.', 0],
    'economic|economical': ['The ___ forecast for next year looks promising.', 0],
    'economical|economic': ['This car is very ___ on fuel.', 0],
    'rise|raise': ['The company decided to ___ employee salaries by 5%.', 1],
    'raise|rise': ['Prices tend to ___ during the holiday season.', 0],
    'aboard|abroad': ['She has been working ___ for the past three years.', 1],
    'abroad|aboard': ['All passengers are now ___ the aircraft.', 0],
    'access|assess': ['The auditor will ___ the company\'s financial records.', 1],
    'assess|access': ['Employees need a keycard to ___ the building.', 0],
    'adapt|adopt': ['The company decided to ___ a new marketing strategy.', 1],
    'adopt|adapt': ['New employees need time to ___ to the work environment.', 0],
  };

  return pairs.map((pair, idx) => {
    const [w1, zh1, w2, zh2, explanation] = pair as unknown as [string, string, string, string, string];
    const key1 = `${w1}|${w2}`;
    const key2 = `${w2}|${w1}`;
    const template = CONF_SENTENCES[key1] ?? CONF_SENTENCES[key2];

    let prompt: string;
    let correctWord: string;
    let wrongWord: string;

    if (template) {
      prompt = template[0];
      correctWord = template[1] === 0 ? w1 : w2;
      wrongWord = template[1] === 0 ? w2 : w1;
    } else {
      // Fallback: show both meanings, pick which word matches
      prompt = `Which word means "${zh1}"?`;
      correctWord = w1;
      wrongWord = w2;
    }

    // Build 4 options: correct, confusable partner, + 2 random
    const tslWords = loadTSL();
    const randoms = pickRandom(
      tslWords.filter(w => w.word !== correctWord && w.word !== wrongWord),
      2
    ).map(w => w.word);
    const options = shuffle([correctWord, wrongWord, ...randoms]);

    used.add(correctWord.toLowerCase());
    used.add(wrongWord.toLowerCase());

    return withMeta({
      id: `conf-${idx}-${w1}`,
      type: 'confusable' as const,
      word: correctWord,
      prompt,
      options,
      correctIndex: options.indexOf(correctWord),
      definition: explanation,
    });
  });
}

// ── Generate collocation question: "___ a deadline" → meet ──
function generateCollocationQuestions(count: number, used: Set<string>): Question[] {
  const extras = loadExtras();
  const colls = shuffle(extras.collocations).slice(0, count);

  return colls.map((coll, idx) => {
    const [phrase, zh, example] = coll as unknown as [string, string, string];
    // Split phrase into parts — find the key verb/noun
    const parts = phrase.split(' ');
    const keyWord = parts[0]!; // usually the verb (make, submit, meet, etc.)
    const rest = parts.slice(1).join(' ');

    const prompt = `___ ${rest}`;

    // Distractors: other collocation verbs
    const allVerbs = extras.collocations.map(
      (c: unknown) => ((c as [string, string, string])[0]).split(' ')[0]!
    );
    const wrongVerbs = shuffle(
      [...new Set(allVerbs)].filter(v => v !== keyWord)
    ).slice(0, 3);

    const options = shuffle([keyWord, ...wrongVerbs]);

    return withMeta({
      id: `coll-${idx}-${keyWord}`,
      type: 'collocation' as const,
      word: keyWord,
      prompt: `${prompt}\n${zh}`,
      options,
      correctIndex: options.indexOf(keyWord),
      definition: `${phrase} = ${zh}`,
      example,
    });
  });
}

/**
 * Generate N questions with balanced type distribution.
 * 5 types: vocab, audio, definition, confusable, collocation
 * Ratio: ~3 vocab/audio/def + 1 confusable + 1 collocation per 10 questions
 */
export function generateTSLQuestions(count: number, weakWords: string[] = []): Question[] {
  const weakLower = new Set(weakWords.map((w) => w.toLowerCase()));
  const used = new Set<string>();

  // Allocate: 1 confusable + 1 collocation + rest split among vocab/audio/def
  const confCount = Math.min(1, count);
  const collCount = Math.min(1, Math.max(0, count - 1));
  const remaining = count - confCount - collCount;
  const vocabCount = Math.ceil(remaining / 3);
  const audioCount = Math.ceil(remaining / 3);
  const fillCount = remaining - vocabCount - audioCount;

  const confQs = generateConfusableQuestions(confCount, used);
  const collQs = generateCollocationQuestions(collCount, used);

  const vocabQs = generateVocabQuestions(vocabCount, weakLower, used);
  for (const q of vocabQs) used.add(q.word.toLowerCase());

  const audioQs = generateAudioQuestions(audioCount, weakLower, used);
  for (const q of audioQs) used.add(q.word.toLowerCase());

  const fillQs = generateDefinitionQuestions(fillCount, weakLower, used);

  return shuffle([...vocabQs, ...audioQs, ...fillQs, ...confQs, ...collQs]);
}
