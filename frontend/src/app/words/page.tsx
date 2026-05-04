'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, type SavedWord } from '@/store/gameStore';

type Filter = 'all' | 'starred' | 'practice' | 'mastered';

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'ALL' },
  { id: 'starred', label: '⭐ STARRED' },
  { id: 'practice', label: 'NEED PRACTICE' },
  { id: 'mastered', label: 'MASTERED' },
];

function speakWord(word: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(word);
  u.lang = 'en-US';
  u.rate = 0.8;
  window.speechSynthesis.speak(u);
}

function isMastered(w: SavedWord) {
  return w.correctCount >= 2 && w.correctCount > w.wrongCount;
}

function needsPractice(w: SavedWord) {
  return w.wrongCount > 0 && w.wrongCount >= w.correctCount;
}

export default function WordsPage() {
  const router = useRouter();
  const { savedWords, toggleStarWord, removeSavedWord } = useGameStore();
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    const list = savedWords.filter((w) => {
      if (filter === 'starred') return w.starred;
      if (filter === 'practice') return needsPractice(w);
      if (filter === 'mastered') return isMastered(w);
      return true;
    });
    return list.sort((a, b) => b.lastSeen - a.lastSeen);
  }, [savedWords, filter]);

  const counts = useMemo(
    () => ({
      all: savedWords.length,
      starred: savedWords.filter((w) => w.starred).length,
      practice: savedWords.filter(needsPractice).length,
      mastered: savedWords.filter(isMastered).length,
    }),
    [savedWords],
  );

  return (
    <main className="min-h-[100dvh] party-bg relative overflow-hidden flex flex-col items-center px-3 py-5">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-amber-300/30 blur-3xl animate-blob-drift" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl animate-blob-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-fuchsia-300/30 blur-3xl animate-blob-drift" style={{ animationDelay: '8s' }} />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Header */}
        <div className="w-full flex items-center justify-between mb-3">
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 rounded-xl font-black text-xs tracking-widest cursor-pointer
              bg-white/15 text-white border-4 border-white/30
              hover:bg-white/25 active:translate-y-[2px] transition-all"
          >
            ← HOME
          </button>
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-5 py-2 rounded-full font-black text-sm tracking-widest shadow-[0_5px_0_#92400e] -rotate-2">
            MY WORDS
          </div>
          <div className="w-[78px]" />
        </div>

        {/* Filter pills */}
        <div className="w-full grid grid-cols-2 gap-2 mb-4">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`py-2.5 rounded-2xl font-black text-[11px] tracking-widest transition-all border-4 cursor-pointer ${
                  active
                    ? 'bg-amber-300 text-fuchsia-900 border-amber-400 shadow-[0_4px_0_rgba(0,0,0,0.25)]'
                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                }`}
              >
                {f.label} · {counts[f.id]}
              </button>
            );
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-8 text-center">
            <p className="text-4xl mb-2">📭</p>
            <p className="text-white font-black text-sm tracking-wide">
              {filter === 'all'
                ? 'No words yet. Play a game to start collecting!'
                : 'Nothing here yet.'}
            </p>
          </div>
        ) : (
          <div className="w-full space-y-2.5">
            {filtered.map((w) => {
              const total = w.correctCount + w.wrongCount;
              const accuracy = total > 0 ? Math.round((w.correctCount / total) * 100) : 0;
              const mastered = isMastered(w);
              const practice = needsPractice(w);
              return (
                <div
                  key={w.word}
                  className={`p-3 rounded-2xl border-4 backdrop-blur-sm ${
                    practice
                      ? 'bg-rose-400/15 border-rose-300/50'
                      : mastered
                        ? 'bg-emerald-400/15 border-emerald-300/50'
                        : 'bg-white/10 border-white/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => speakWord(w.word)}
                      className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center
                        active:scale-90 cursor-pointer shrink-0 border-2 border-white/30"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-white">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    </button>
                    <span className="text-lg font-black text-white truncate flex-1">{w.word}</span>
                    <button
                      onClick={() => toggleStarWord(w.word)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-all border-2 ${
                        w.starred
                          ? 'bg-amber-300 border-amber-200 text-fuchsia-900 shadow-[0_3px_0_rgba(120,53,15,0.5)]'
                          : 'bg-white/10 border-white/30 text-white/60'
                      }`}
                      aria-label={w.starred ? 'Unstar' : 'Star'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill={w.starred ? 'currentColor' : 'none'}
                        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    </button>
                  </div>

                  {w.correctAnswer && (
                    <p className="mt-1.5 text-sm text-amber-200 font-black">{w.correctAnswer}</p>
                  )}
                  {w.definition && (
                    <p className="mt-1 text-xs text-white/75 leading-relaxed">{w.definition}</p>
                  )}

                  <div className="mt-2 flex items-center gap-3 text-[10px] font-black text-white/80 tracking-wider">
                    <span className="text-emerald-300">✓ {w.correctCount}</span>
                    <span className="text-rose-300">✗ {w.wrongCount}</span>
                    <span>{accuracy}% · {total} times</span>
                    <button
                      onClick={() => {
                        if (confirm(`Remove "${w.word}" from notebook?`)) removeSavedWord(w.word);
                      }}
                      className="ml-auto text-white/40 hover:text-rose-300 cursor-pointer"
                      aria-label="Remove"
                    >
                      DELETE
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-center text-[10px] font-bold text-white/60 tracking-wider">
          Words are saved automatically after each game
        </p>
      </div>
    </main>
  );
}
