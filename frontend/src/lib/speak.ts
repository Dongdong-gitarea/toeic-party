// Pronunciation playback with three tiers:
//  1. localStorage cache hit → play instantly
//  2. Free Dictionary API audio (Wiktionary human recording)
//  3. Browser speechSynthesis fallback, picking the best en-* voice available

const AUDIO_CACHE_KEY = 'tp_audio_cache_v1';
const DICT_API = 'https://api.dictionaryapi.dev/api/v2/entries/en';

let memCache: Map<string, string | null> | null = null;
let currentAudio: HTMLAudioElement | null = null;
let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesPrimed = false;

function loadCache(): Map<string, string | null> {
  if (memCache) return memCache;
  memCache = new Map();
  if (typeof window === 'undefined') return memCache;
  try {
    const raw = localStorage.getItem(AUDIO_CACHE_KEY);
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, string | null>;
      for (const k of Object.keys(obj)) memCache.set(k, obj[k]);
    }
  } catch {
    // ignore
  }
  return memCache;
}

function saveCache() {
  if (!memCache || typeof window === 'undefined') return;
  try {
    const obj: Record<string, string | null> = {};
    memCache.forEach((v, k) => {
      obj[k] = v;
    });
    localStorage.setItem(AUDIO_CACHE_KEY, JSON.stringify(obj));
  } catch {
    // localStorage full — silently drop
  }
}

async function fetchAudioUrl(word: string): Promise<string | null> {
  try {
    const res = await fetch(`${DICT_API}/${encodeURIComponent(word)}`);
    if (!res.ok) return null;
    const data = await res.json();
    if (!Array.isArray(data)) return null;
    for (const entry of data) {
      const phonetics = entry?.phonetics;
      if (!Array.isArray(phonetics)) continue;
      const preferred =
        phonetics.find((p) => typeof p?.audio === 'string' && p.audio.includes('-us.')) ??
        phonetics.find((p) => typeof p?.audio === 'string' && p.audio.includes('-uk.')) ??
        phonetics.find((p) => typeof p?.audio === 'string' && p.audio.length > 0);
      if (preferred?.audio) {
        let url: string = preferred.audio;
        if (url.startsWith('//')) url = 'https:' + url;
        return url;
      }
    }
    return null;
  } catch {
    return null;
  }
}

function primeVoices() {
  if (voicesPrimed) return;
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  // Triggers async voice load on most browsers
  window.speechSynthesis.getVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', () => {
    cachedVoice = null;
  });
  voicesPrimed = true;
}

function pickBestVoice(): SpeechSynthesisVoice | null {
  if (cachedVoice) return cachedVoice;
  if (typeof window === 'undefined' || !window.speechSynthesis) return null;
  primeVoices();
  const all = window.speechSynthesis.getVoices();
  if (!all || all.length === 0) return null;
  const enVoices = all.filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (enVoices.length === 0) return null;

  // Prefer high-quality system voices when present
  const preferences = [
    'Ava (Premium)', 'Ava (Enhanced)',
    'Evan (Premium)', 'Evan (Enhanced)',
    'Samantha', 'Karen', 'Daniel', 'Fred',
    'Google US English', 'Google UK English Female',
    'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Guy',
  ];
  for (const name of preferences) {
    const v = enVoices.find((x) => x.name.includes(name));
    if (v) {
      cachedVoice = v;
      return v;
    }
  }

  // Otherwise prefer en-US, then any en-*
  const us = enVoices.find((v) => v.lang === 'en-US');
  cachedVoice = us ?? enVoices[0] ?? null;
  return cachedVoice;
}

function speakWithTTS(word: string, rate: number) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = rate;
  const v = pickBestVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
}

function stopCurrent() {
  if (currentAudio) {
    try {
      currentAudio.pause();
    } catch {
      // ignore
    }
    currentAudio = null;
  }
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

export async function speakWord(word: string, opts?: { rate?: number }): Promise<void> {
  if (!word) return;
  const rate = opts?.rate ?? 0.9;
  const key = word.toLowerCase().trim();

  stopCurrent();

  const cache = loadCache();
  const cached = cache.get(key);

  // Explicit null = previously confirmed no Dictionary audio for this word
  if (cached === null) {
    speakWithTTS(word, rate);
    return;
  }

  if (cached) {
    try {
      const a = new Audio(cached);
      currentAudio = a;
      await a.play();
      return;
    } catch {
      // cached URL no longer playable; refetch
      cache.delete(key);
    }
  }

  // First time we've seen this word — fetch with a 1.2s budget; otherwise TTS.
  const timeoutMs = 1200;
  const fetched = await Promise.race<string | null>([
    fetchAudioUrl(word),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);

  // Always update the cache when we actually have a definitive answer
  if (fetched !== null) {
    cache.set(key, fetched);
    saveCache();
    try {
      const a = new Audio(fetched);
      currentAudio = a;
      await a.play();
      return;
    } catch {
      // Playback failed — fall through to TTS
    }
  } else {
    // Race timed out OR fetch confirmed there's no audio. We don't know which here,
    // so don't cache "null" yet; it'll be cached on the slower no-audio response next time.
  }

  // Final fallback
  speakWithTTS(word, rate);

  // If the race timed out, still let the fetch finish in the background and cache it.
  if (fetched === null) {
    void fetchAudioUrl(word).then((url) => {
      cache.set(key, url);
      saveCache();
    });
  }
}

export function preloadVoices() {
  primeVoices();
}
