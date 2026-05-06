// Background music manager — loops a track per game phase, smoothly
// crossfades between them, and respects a localStorage on/off toggle.
//
// Track files live in /public/audio/music/. They are intentionally
// missing from git; the user drops Kenney CC0 files in there and the
// manager picks them up at runtime. If a file 404s, audio playback
// silently no-ops (we never want music errors to crash gameplay).

const TRACKS = {
  lobby: '/audio/music/lobby.ogg',
  game: '/audio/music/game.ogg',
  result: '/audio/music/result.ogg',
} as const;

export type Track = keyof typeof TRACKS;

const VOLUME = 0.35;
const FADE_MS = 600;

const ENABLED_KEY = 'tp_music_enabled';

function readEnabled(): boolean {
  if (typeof window === 'undefined') return false;
  // Default: ON. Users who explicitly disabled stay off.
  return localStorage.getItem(ENABLED_KEY) !== '0';
}

let enabled = false;
let currentTrack: Track | null = null;
let currentEl: HTMLAudioElement | null = null;
const cache = new Map<Track, HTMLAudioElement>();
let unlocked = false;

function ensureEl(track: Track): HTMLAudioElement | null {
  if (typeof window === 'undefined') return null;
  let el = cache.get(track);
  if (!el) {
    el = new Audio(TRACKS[track]);
    el.loop = true;
    el.preload = 'auto';
    el.volume = 0;
    // Don't crash on missing file or any decode error
    el.addEventListener('error', () => {
      cache.delete(track);
    });
    cache.set(track, el);
  }
  return el;
}

function fade(el: HTMLAudioElement, from: number, to: number, ms: number) {
  const start = performance.now();
  const tick = () => {
    const t = Math.min(1, (performance.now() - start) / ms);
    el.volume = from + (to - from) * t;
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function stopCurrent() {
  if (!currentEl) return;
  const el = currentEl;
  fade(el, el.volume, 0, FADE_MS);
  setTimeout(() => {
    el.pause();
    el.currentTime = 0;
  }, FADE_MS + 20);
  currentEl = null;
  currentTrack = null;
}

async function startTrack(track: Track) {
  if (!enabled) return;
  const el = ensureEl(track);
  if (!el) return;
  try {
    el.volume = 0;
    await el.play();
    currentEl = el;
    currentTrack = track;
    fade(el, 0, VOLUME, FADE_MS);
  } catch {
    // Autoplay was blocked; silently bail. The next user gesture will
    // re-unlock and `play(track)` will succeed.
  }
}

export const music = {
  /** Initialise on app boot. Reads stored preference. */
  init() {
    enabled = readEnabled();
  },

  /** Switch background loop. No-op if same track or disabled. */
  play(track: Track) {
    if (!enabled) return;
    if (currentTrack === track) return;
    stopCurrent();
    void startTrack(track);
  },

  /** Stop everything (used on tab hide / route away). */
  stop() {
    stopCurrent();
  },

  /** Turn music on/off and persist. Resumes the lobby track on enable. */
  setEnabled(next: boolean, fallbackTrack: Track = 'lobby') {
    enabled = next;
    if (typeof window !== 'undefined') {
      localStorage.setItem(ENABLED_KEY, next ? '1' : '0');
    }
    if (!next) {
      stopCurrent();
    } else if (!currentTrack) {
      void startTrack(fallbackTrack);
    }
  },

  isEnabled(): boolean {
    return enabled;
  },

  /**
   * Browsers block autoplay until a user gesture. Call this from any
   * pointer/key handler the first time the user interacts so subsequent
   * `play()` calls work without the user thinking the volume is broken.
   */
  unlock(initialTrack: Track = 'lobby') {
    if (unlocked) return;
    unlocked = true;
    if (enabled && !currentTrack) {
      void startTrack(initialTrack);
    }
  },
};
