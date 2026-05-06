import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export function getDB(): SupabaseClient | null {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}

const DEVICE_ID_KEY = 'tp_device_id';

export function getDeviceId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ── Sync saved words: local → Supabase ──

interface SavedWordRow {
  word: string;
  correct_answer: string;
  definition: string;
  meaning: string;
  pos: string;
  example: string;
  correct_count: number;
  wrong_count: number;
  starred: boolean;
}

interface LocalSavedWord {
  word: string;
  correctAnswer: string;
  definition: string;
  meaning: string;
  pos?: string;
  example?: string;
  correctCount: number;
  wrongCount: number;
  starred: boolean;
  lastSeen: number;
}

async function getPlayerId(): Promise<string | null> {
  const db = getDB();
  if (!db) return null;
  const deviceId = getDeviceId();
  if (!deviceId) return null;

  const { data } = await db
    .from('players')
    .select('id')
    .eq('device_id', deviceId)
    .single();

  return data?.id ?? null;
}

export async function pushWordsToCloud(localWords: LocalSavedWord[]): Promise<void> {
  const db = getDB();
  if (!db || localWords.length === 0) return;

  const playerId = await getPlayerId();
  if (!playerId) return;

  try {
    for (const w of localWords) {
      await db.from('saved_words').upsert({
        player_id: playerId,
        word: w.word.toLowerCase(),
        correct_answer: w.correctAnswer || '',
        definition: w.definition || '',
        meaning: w.meaning || '',
        pos: w.pos || '',
        example: w.example || '',
        correct_count: w.correctCount,
        wrong_count: w.wrongCount,
        starred: w.starred,
        last_seen: new Date(w.lastSeen).toISOString(),
      }, { onConflict: 'player_id,word' });
    }
  } catch (err) {
    console.warn('[DB] pushWords error:', err);
  }
}

export async function pullWordsFromCloud(): Promise<LocalSavedWord[]> {
  const db = getDB();
  if (!db) return [];

  const playerId = await getPlayerId();
  if (!playerId) return [];

  try {
    const { data, error } = await db
      .from('saved_words')
      .select('*')
      .eq('player_id', playerId);

    if (error || !data) return [];

    return data.map((row: SavedWordRow) => ({
      word: row.word,
      correctAnswer: row.correct_answer,
      definition: row.definition,
      meaning: row.meaning,
      pos: row.pos,
      example: row.example,
      correctCount: row.correct_count,
      wrongCount: row.wrong_count,
      starred: row.starred,
      lastSeen: Date.now(),
    }));
  } catch {
    return [];
  }
}

// Merge cloud words into local (cloud wins for counts, local wins for starred)
export function mergeCloudIntoLocal(
  local: LocalSavedWord[],
  cloud: LocalSavedWord[],
): LocalSavedWord[] {
  const map = new Map<string, LocalSavedWord>();

  for (const w of local) map.set(w.word.toLowerCase(), w);

  for (const cw of cloud) {
    const key = cw.word.toLowerCase();
    const existing = map.get(key);
    if (existing) {
      // Take higher counts + merge starred
      map.set(key, {
        ...existing,
        correctCount: Math.max(existing.correctCount, cw.correctCount),
        wrongCount: Math.max(existing.wrongCount, cw.wrongCount),
        starred: existing.starred || cw.starred,
        definition: cw.definition || existing.definition,
        meaning: cw.meaning || existing.meaning,
        pos: cw.pos || existing.pos,
        example: cw.example || existing.example,
      });
    } else {
      map.set(key, cw);
    }
  }

  return [...map.values()];
}
