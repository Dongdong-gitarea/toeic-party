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
type SynAntPair = [string, string[]]; // [target, [list of syn/ant]]
interface LearningExtras {
  confusables: ConfusablePair[];
  collocations: CollocationEntry[];
  synonyms?: SynAntPair[];
  antonyms?: SynAntPair[];
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

import type { Difficulty } from './questions.js';

interface TSLWord {
  rank: number;
  word: string;
  ipa: string;
  pos: string;
  definition_en: string;
}

// Difficulty → TSL rank cutoff + whether to include confusable/collocation
// 'curve' isn't in here — it has its own dedicated generator below that
// stitches together easy + medium + hard tiers within a single match.
const DIFFICULTY_CONFIG: Record<Exclude<Difficulty, 'curve'>, { maxRank: number; confusable: boolean; collocation: boolean }> = {
  easy:   { maxRank: 400, confusable: false, collocation: false },
  medium: { maxRank: 800, confusable: true,  collocation: true },
  hard:   { maxRank: 9999, confusable: true, collocation: true },
};

// Filter VOCAB_ZH by TSL rank (words not in TSL are treated as rank 9999)
function filterVocabByDifficulty(maxRank: number): typeof VOCAB_ZH {
  if (maxRank >= 9999) return VOCAB_ZH;
  const tslMap = new Map(loadTSL().map((w) => [w.word.toLowerCase(), w.rank]));
  return VOCAB_ZH.filter((entry) => {
    const rank = tslMap.get(entry[0].toLowerCase());
    return rank !== undefined && rank <= maxRank;
  });
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

// Bias selection toward `weakLower`: take ~30% from weak pool, pad with random.
// Only activates when weak pool has ≥10 words (otherwise too repetitive).
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
  // Only bias when weak pool is large enough to avoid repetition
  if (weakPool.length < 10) return pickRandom(available, n);
  // Cap at 30% weak (was 70% — too aggressive, caused same words every game)
  const targetWeak = Math.min(weakPool.length, Math.ceil(n * 0.3));
  const fromWeak = pickRandom(weakPool, targetWeak);
  const fromOther = pickRandom(otherPool, n - fromWeak.length);
  return shuffle([...fromWeak, ...fromOther]).slice(0, n);
}

function truncDef(s: string, max = 35): string {
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

// Look up TSL definition for a word
// Words to deprioritize in question generation (not TOEIC-relevant)
const NON_TOEIC = new Set([
  'sparrow','turkey','parrot','pigeon','eagle','whale','dolphin','penguin',
  'butterfly','mosquito','squirrel','deer','wolf','lion','tiger','elephant',
  'monkey','rabbit','fox','bear','snake','turtle','frog','ant','bee',
  'rooster','hen','goat','sheep','donkey','camel','giraffe',
  'curry','pizza','hamburger','popcorn','cookie','candy','chocolate',
  'spaghetti','noodle','dumpling','pancake','sandwich','toast','cereal',
  'knee','elbow','ankle','wrist','thumb','forehead','chin',
  'cheek','eyebrow','tongue','throat','lung','liver','kidney','bone','muscle',
  'rainbow','thunder','lightning','snowflake','earthquake','volcano',
  'waterfall','cliff','cave','valley','jungle','marsh','swamp',
  'geometry','algebra','biology','chemistry','physics','geography','calculus',
  'basketball','baseball','soccer','tennis','volleyball','badminton',
  'swimming','skiing','skating','surfing','bowling','chess','poker',
  'sweater','jacket','scarf','glove','sock','boot','sandal','slipper',
  'pillow','blanket','curtain','carpet','towel','broom','bucket',
  'candle','vase','mirror',
  'jealous','greedy','selfish','stubborn','shy','lonely','homesick',
  'church','temple','mosque','cathedral','churchyard','prayer','monk',
  'murder','robbery','theft','kidnap','arson','assault','bullet','sword',
  'surgery','tumor','diabetes','allergy','asthma','measles','pneumonia',
  'casino','circus','fairy','ghost','dragon','wizard','pirate',
  'firework','lantern','kite','puppet','cradle','coffin',
  'birthday','wedding','funeral','divorce','pregnancy',
  'sparrow','robin','crow','hawk','swan','dove',
]);

function isToeicWord(word: string): boolean {
  return !NON_TOEIC.has(word.toLowerCase());
}

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

// ── Generate vocab (English → Chinese) ──
function generateVocabQuestions(count: number, weakLower: Set<string>, excludeLower: Set<string>): Question[] {
  return generateVocabQuestionsFromPool(VOCAB_ZH, count, weakLower, excludeLower);
}

function generateVocabQuestionsFromPool(vocabPool: typeof VOCAB_ZH, count: number, weakLower: Set<string>, excludeLower: Set<string>): Question[] {
  const toeicPool = vocabPool.filter((e) => isToeicWord(e[0]) || weakLower.has(e[0].toLowerCase()));
  const pool = toeicPool.length >= count ? toeicPool : vocabPool;
  const selected = pickWeighted(pool, (e) => e[0], weakLower, Math.min(count, pool.length), excludeLower);
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
  return generateAudioQuestionsFromPool(VOCAB_ZH, count, weakLower, excludeLower);
}

function generateAudioQuestionsFromPool(vocabPool: typeof VOCAB_ZH, count: number, weakLower: Set<string>, excludeLower: Set<string>): Question[] {
  const toeicPool = vocabPool.filter((e) => isToeicWord(e[0]) || weakLower.has(e[0].toLowerCase()));
  const pool = toeicPool.length >= count ? toeicPool : vocabPool;
  const selected = pickWeighted(pool, (e) => e[0], weakLower, Math.min(count, pool.length), excludeLower);
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
function generateDefinitionQuestions(count: number, weakLower: Set<string>, excludeLower: Set<string>, maxRank = 9999): Question[] {
  const words = loadTSL().filter((w) => w.definition_en.length >= 5 && w.rank <= maxRank);
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
      prompt: truncDef(w.definition_en, 90),
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
    // Round 7 additions — high-value TOEIC traps
    'fewer|less': ['___ employees attended this year than last.', 0],
    'less|fewer': ['Please use ___ paper to save the trees.', 0],
    'amount|number': ['A large ___ of customers complained about delays.', 1],
    'number|amount': ['The store ordered a small ___ of imported wine.', 1],
    'between|among': ['The candidate had to choose ___ five offers.', 1],
    'among|between': ['The agreement was signed ___ the two parties.', 1],
    'good|well': ['She speaks Spanish very ___.', 1],
    'well|good': ['The presentation made a ___ impression on the client.', 1],
    'bring|take': ['Please ___ your umbrella with you when you leave.', 1],
    'take|bring': ['Could you ___ me a cup of coffee from the kitchen?', 1],
    'price|prize': ['The first ___ for the contest is a free vacation.', 1],
    'prize|price': ['The ___ of gas has gone up again this month.', 1],
    'breath|breathe': ['Please take a deep ___ before answering.', 0],
    'breathe|breath': ['It is hard to ___ comfortably at high altitude.', 0],
    'choose|chose': ['Yesterday the panel ___ the new logo for our brand.', 1],
    'chose|choose': ['Customers can ___ from three colour options online.', 1],
    'expand|expend': ['The company plans to ___ into Asian markets next year.', 0],
    'expend|expand': ['We had to ___ extra resources to fix the bug.', 0],
    'assistant|assistance': ['My ___ will reply to your email shortly.', 0],
    'assistance|assistant': ['Please call us if you need any ___.', 0],
    'emergency|emergent': ['Call this number in case of an ___.', 0],
    'emergent|emergency': ['___ technologies are reshaping the industry.', 0],
    'since|for': ['I have worked at this company ___ 2018.', 0],
    'for|since': ['She has lived in Tokyo ___ ten years.', 0],
    'boring|bored': ['The lecture was so ___ that everyone fell asleep.', 0],
    'bored|boring': ['I felt ___ during the long meeting.', 0],
    'interested|interesting': ['I am very ___ in your new proposal.', 0],
    'interesting|interested': ['That was the most ___ talk of the day.', 0],
    'statute|statue': ['A bronze ___ of the founder stands in the lobby.', 1],
    'statue|statute': ['The new safety ___ requires monthly inspections.', 1],
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

    // Distractors: other collocation verbs, but exclude verbs that ALSO
    // collocate with the same noun tail. e.g. for "hold a meeting", we
    // skip {postpone, chair, adjourn, reschedule, …} because each is a
    // real English collocation with "a meeting" (just a different sense)
    // and would feel like a valid alternative answer to a learner.
    const sameNounVerbs = new Set(
      extras.collocations
        .filter((c: unknown) => {
          const ph = (c as [string, string, string])[0];
          return ph.split(' ').slice(1).join(' ') === rest;
        })
        .map((c: unknown) => ((c as [string, string, string])[0]).split(' ')[0]!),
    );
    const allVerbs = extras.collocations.map(
      (c: unknown) => ((c as [string, string, string])[0]).split(' ')[0]!
    );
    const safeVerbs = [...new Set(allVerbs)].filter((v) => v !== keyWord && !sameNounVerbs.has(v));
    const wrongVerbs = shuffle(safeVerbs).slice(0, 3);

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

// ── Generate sentence cloze: real example sentence with target word blanked out ──
// Distractor strategy (Task 2 baked in):
//   1. Same POS (adj/adv/noun/verb) — grammatically plausible in the slot
//   2. Length within ±3 chars — visually similar option set
//   3. Prefer same first letter when available — adds phonetic confusion
function pickClozeDistractors(target: TSLWord, all: TSLWord[]): string[] {
  const samePos = all.filter(
    (w) => w.word !== target.word && w.pos === target.pos && Math.abs(w.word.length - target.word.length) <= 3,
  );
  // Try first-letter neighbors first
  const sameInitial = samePos.filter((w) => w.word[0]?.toLowerCase() === target.word[0]?.toLowerCase());
  const distractors: string[] = [];
  for (const w of pickRandom(sameInitial, 2)) distractors.push(w.word);
  // Fill the rest from broader same-POS pool
  const remaining = samePos.filter((w) => !distractors.includes(w.word));
  for (const w of pickRandom(remaining, 3 - distractors.length)) distractors.push(w.word);
  // Last-resort fallback to any TSL word of same length range
  if (distractors.length < 3) {
    const fallback = all
      .filter((w) => w.word !== target.word && Math.abs(w.word.length - target.word.length) <= 3 && !distractors.includes(w.word));
    for (const w of pickRandom(fallback, 3 - distractors.length)) distractors.push(w.word);
  }
  return distractors;
}

// Build a regex that matches the lemma OR common inflected forms of `word`.
// Handles:
//   plural -s/-es, possessive 's, past -ed/-d, gerund -ing, comparatives -er/-est,
//   adverb -ly, y→ied (try/tried) and y→ies (try/tries), doubled consonant
//   forms (jam→jamming, equip→equipped) for short CVC verbs.
function buildClozeMatcher(word: string): RegExp {
  const stripDiacritics = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '');
  const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const escaped = escapeRe(word);
  const variants = new Set<string>([escaped]);
  // Diacritic-stripped variant — matches "resume" in text when lemma is "résumé"
  const stripped = stripDiacritics(word);
  if (stripped !== word) variants.add(escapeRe(stripped));
  variants.add(escaped + 's');
  variants.add(escaped + 'es');
  variants.add(escaped + "'s");
  variants.add(escaped + 'ed');
  variants.add(escaped + 'd');
  variants.add(escaped + 'ing');
  variants.add(escaped + 'er');
  variants.add(escaped + 'est');
  variants.add(escaped + 'ly');
  // y → ies / ied (e.g. try → tried/tries, certify → certifies/certified)
  if (word.endsWith('y') && word.length > 2 && !/[aeiou]y$/.test(word)) {
    const stem = escaped.slice(0, -1);
    variants.add(stem + 'ies');
    variants.add(stem + 'ied');
  }
  // Doubled consonant inflection for short CVC verbs (jam/jammed, equip/equipping)
  if (/^[a-z]*[^aeiouy][aeiouy][^aeiouwxy]$/i.test(word) && word.length <= 6) {
    const last = word[word.length - 1]!;
    variants.add(escaped + last + 'ed');
    variants.add(escaped + last + 'ing');
  }
  // Drop trailing -e for -ing / -ed forms (e.g. dine → dined/dining)
  if (word.endsWith('e') && word.length > 2) {
    const stem = escaped.slice(0, -1);
    variants.add(stem + 'ed');
    variants.add(stem + 'ing');
  }
  // Sort longest-first so the regex prefers the most specific match
  const sorted = [...variants].sort((a, b) => b.length - a.length);
  return new RegExp(`\\b(?:${sorted.join('|')})\\b`, 'i');
}

function generateClozeQuestions(count: number, weakLower: Set<string>, excludeLower: Set<string>, maxRank = 9999): Question[] {
  const examples = loadExamples();
  const all = loadTSL();
  // Eligible: word has an example AND the example contains the lemma OR a
  // standard inflected form of the word.
  const eligible = all.filter((w) => {
    if (w.rank > maxRank) return false;
    const ex = examples[w.word.toLowerCase()];
    if (!ex || ex.length < 10) return false;
    return buildClozeMatcher(w.word).test(ex);
  });
  const selected = pickWeighted(eligible, (w) => w.word, weakLower, Math.min(count, eligible.length), excludeLower);
  return selected.map((w, idx) => {
    const ex = examples[w.word.toLowerCase()]!;
    const re = buildClozeMatcher(w.word);
    // Replace first occurrence with ___
    const prompt = ex.replace(re, '___');
    const distractors = pickClozeDistractors(w, all);
    const options = shuffle([w.word, ...distractors]);
    return withMeta({
      id: `cloze-${idx}-${w.rank}`,
      type: 'cloze' as const,
      word: w.word,
      prompt,
      options,
      correctIndex: options.indexOf(w.word),
      definition: w.definition_en,
      example: ex,
    });
  });
}

// ── Generate synonym/antonym question: pick word closest in / opposite in meaning ──
// Internally randomizes mode (syn or ant). Prompt makes the task explicit.
function generateSynonymQuestions(count: number, used: Set<string>): Question[] {
  const extras = loadExtras();
  const synPairs = extras.synonyms ?? [];
  const antPairs = extras.antonyms ?? [];
  const all = loadTSL();
  // Build a combined pool of {target, correctList, mode}
  type Entry = { target: string; correct: string[]; mode: 'syn' | 'ant' };
  const pool: Entry[] = [
    ...synPairs.map((p) => ({ target: p[0], correct: p[1], mode: 'syn' as const })),
    ...antPairs.map((p) => ({ target: p[0], correct: p[1], mode: 'ant' as const })),
  ].filter((e) => !used.has(e.target.toLowerCase()));

  const selected = pickRandom(pool, Math.min(count, pool.length));
  return selected.map((e, idx) => {
    // Pick one synonym/antonym at random as the correct option
    const correctWord = pickRandom(e.correct, 1)[0]!;
    // Distractors: same-POS TSL words, exclude target, correct, and other valid syn/ant
    const targetWord = all.find((w) => w.word === e.target);
    const targetPos = targetWord?.pos;
    const exclude = new Set<string>([e.target.toLowerCase(), ...e.correct.map((w) => w.toLowerCase())]);
    const candidates = all.filter(
      (w) => !exclude.has(w.word.toLowerCase()) && (!targetPos || w.pos === targetPos),
    );
    const distractors = pickRandom(candidates, 3).map((w) => w.word);
    const options = shuffle([correctWord, ...distractors]);
    used.add(e.target.toLowerCase());
    used.add(correctWord.toLowerCase());

    const prompt = e.mode === 'syn'
      ? `Closest in meaning to: ${e.target}`
      : `OPPOSITE of: ${e.target}`;
    const definition = e.mode === 'syn'
      ? `${e.target} ≈ ${e.correct.join(', ')}`
      : `${e.target} ↔ ${e.correct.join(', ')}`;

    return withMeta({
      id: `synant-${idx}-${e.target}`,
      type: 'synonym' as const,
      word: e.target,
      prompt,
      options,
      correctIndex: options.indexOf(correctWord),
      definition,
    });
  });
}

/**
 * Generate N questions with balanced type distribution.
 * 7 types: vocab, audio, fillblank (def→word), confusable, collocation, cloze (sentence→word), synonym
 */
export function generateTSLQuestions(count: number, weakWords: string[] = [], difficulty: Difficulty = 'curve'): Question[] {
  if (difficulty === 'curve') {
    return generateCurvedQuestions(count, weakWords);
  }

  const weakLower = new Set(weakWords.map((w) => w.toLowerCase()));
  const used = new Set<string>();
  const cfg = DIFFICULTY_CONFIG[difficulty];

  // Confusable + collocation + synonym only for medium/hard
  const confCount = cfg.confusable ? Math.min(1, count) : 0;
  const collCount = cfg.collocation ? Math.min(1, Math.max(0, count - confCount)) : 0;
  const synCount = cfg.confusable ? Math.min(1, Math.max(0, count - confCount - collCount)) : 0;
  const remaining = count - confCount - collCount - synCount;
  const vocabCount = Math.ceil(remaining / 4);
  const audioCount = Math.ceil((remaining - vocabCount) / 3);
  const fillCount = Math.ceil((remaining - vocabCount - audioCount) / 2);
  const clozeCount = remaining - vocabCount - audioCount - fillCount;

  const confQs = confCount > 0 ? generateConfusableQuestions(confCount, used) : [];
  const collQs = collCount > 0 ? generateCollocationQuestions(collCount, used) : [];
  const synQs = synCount > 0 ? generateSynonymQuestions(synCount, used) : [];

  const filteredVocab = filterVocabByDifficulty(cfg.maxRank);
  const vocabQs = generateVocabQuestionsFromPool(filteredVocab, vocabCount, weakLower, used);
  for (const q of vocabQs) used.add(q.word.toLowerCase());

  const audioQs = generateAudioQuestionsFromPool(filteredVocab, audioCount, weakLower, used);
  for (const q of audioQs) used.add(q.word.toLowerCase());

  const fillQs = generateDefinitionQuestions(fillCount, weakLower, used, cfg.maxRank);
  for (const q of fillQs) used.add(q.word.toLowerCase());

  const clozeQs = clozeCount > 0 ? generateClozeQuestions(clozeCount, weakLower, used, cfg.maxRank) : [];

  return shuffle([...vocabQs, ...audioQs, ...fillQs, ...clozeQs, ...confQs, ...collQs, ...synQs]);
}

/**
 * 'curve' generator — every match self-paces from easy → medium → hard.
 *
 *   For a 10-question match the layout is:
 *     Q1-3 (easy):    vocab + audio + definition, all from TSL rank 1-400
 *     Q4-7 (medium):  vocab + audio + 1 confusable + 1 collocation, rank 1-800
 *     Q8-10 (hard):   vocab + audio + definition, full pool incl. extra TOEIC
 *
 *   Question types are shuffled WITHIN each tier so the order isn't always
 *   vocab → audio → def, but tiers themselves stay in order so the player
 *   feels the ramp. Headwords are de-duped across all tiers via the shared
 *   `used` set.
 *
 *   Counts scale roughly with `count` if it isn't 10 — mostly there's no
 *   reason to call with a different count, but it stays robust.
 */
function generateCurvedQuestions(count: number, weakWords: string[]): Question[] {
  const weakLower = new Set(weakWords.map((w) => w.toLowerCase()));
  const used = new Set<string>();

  // Tier sizes — keep proportions if `count` !== 10.
  const easySize = Math.max(1, Math.round(count * 0.3));
  const hardSize = Math.max(1, Math.round(count * 0.3));
  const medSize = Math.max(0, count - easySize - hardSize);

  const easyVocab = filterVocabByDifficulty(DIFFICULTY_CONFIG.easy.maxRank);
  const medVocab = filterVocabByDifficulty(DIFFICULTY_CONFIG.medium.maxRank);
  const hardVocab = VOCAB_ZH; // full pool

  // Per-tier type allocation. Easy is pure vocab/audio/def/cloze.
  // Medium adds 1 confusable + 1 collocation. Hard adds 1 synonym/antonym
  // (the deepest test of vocabulary mastery).
  const easyMix = splitFourWays(easySize);

  // Medium: 1 confusable + 1 collocation, rest 4-way
  const medConf = medSize >= 4 ? 1 : 0;
  const medColl = medSize >= 4 ? 1 : 0;
  const medRest = Math.max(0, medSize - medConf - medColl);
  const medMix = splitFourWays(medRest);

  // Hard: 1 synonym/antonym
  const hardSyn = hardSize >= 3 ? 1 : 0;
  const hardRest = Math.max(0, hardSize - hardSyn);
  const hardMix = splitFourWays(hardRest);

  const tier = (name: 'easy' | 'medium' | 'hard'): Question[] => {
    const isEasy = name === 'easy';
    const isMed = name === 'medium';
    const pool = isEasy ? easyVocab : isMed ? medVocab : hardVocab;
    const maxRank = isEasy
      ? DIFFICULTY_CONFIG.easy.maxRank
      : isMed
        ? DIFFICULTY_CONFIG.medium.maxRank
        : 9999;
    const mix = isEasy ? easyMix : isMed ? medMix : hardMix;

    const out: Question[] = [];
    if (mix.vocab > 0) {
      const vqs = generateVocabQuestionsFromPool(pool, mix.vocab, weakLower, used);
      for (const q of vqs) used.add(q.word.toLowerCase());
      out.push(...vqs);
    }
    if (mix.audio > 0) {
      const aqs = generateAudioQuestionsFromPool(pool, mix.audio, weakLower, used);
      for (const q of aqs) used.add(q.word.toLowerCase());
      out.push(...aqs);
    }
    if (mix.def > 0) {
      const dqs = generateDefinitionQuestions(mix.def, weakLower, used, maxRank);
      for (const q of dqs) used.add(q.word.toLowerCase());
      out.push(...dqs);
    }
    if (mix.cloze > 0) {
      const cqs = generateClozeQuestions(mix.cloze, weakLower, used, maxRank);
      for (const q of cqs) used.add(q.word.toLowerCase());
      out.push(...cqs);
    }
    return shuffle(out);
  };

  const easyQs = tier('easy');
  const medCore = tier('medium');
  const medExtras: Question[] = [];
  if (medConf > 0) medExtras.push(...generateConfusableQuestions(medConf, used));
  if (medColl > 0) medExtras.push(...generateCollocationQuestions(medColl, used));
  const medQs = shuffle([...medCore, ...medExtras]);

  const hardCore = tier('hard');
  const hardExtras: Question[] = [];
  if (hardSyn > 0) hardExtras.push(...generateSynonymQuestions(hardSyn, used));
  const hardQs = shuffle([...hardCore, ...hardExtras]);

  return [...easyQs, ...medQs, ...hardQs];
}

/** Distribute n questions across vocab / audio / def / cloze in a 1:1:1:1-ish ratio.
 *  When n isn't a multiple of 4, the leftover units are sprinkled to randomly
 *  chosen types so no type is systematically starved. */
function splitFourWays(n: number): { vocab: number; audio: number; def: number; cloze: number } {
  if (n <= 0) return { vocab: 0, audio: 0, def: 0, cloze: 0 };
  const base = Math.floor(n / 4);
  const extras = n % 4;
  const result = { vocab: base, audio: base, def: base, cloze: base };
  const order = shuffle<keyof typeof result>(['vocab', 'audio', 'def', 'cloze']);
  for (let i = 0; i < extras; i++) result[order[i]!]++;
  return result;
}
