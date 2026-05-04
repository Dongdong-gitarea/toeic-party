'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore, type SavedWord } from '@/store/gameStore';
import { speakWord } from '@/lib/speak';

interface PQuestion {
  word: string;
  correctMeaning: string;
  options: string[];
  correctIndex: number;
  definition: string;
  source: SavedWord;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildQuestions(saved: SavedWord[], n: number): PQuestion[] {
  const pool = saved.filter((w) => w.meaning && w.meaning.trim().length > 0);
  if (pool.length < 4) return [];

  // Prioritise: NEED PRACTICE first, then unseen, then easy
  const needPractice = pool.filter((w) => w.wrongCount >= w.correctCount && (w.wrongCount > 0 || w.correctCount === 0));
  const others = pool.filter((w) => !needPractice.includes(w));
  const ordered = [...shuffle(needPractice), ...shuffle(others)];
  const picked = ordered.slice(0, Math.min(n, ordered.length));

  return picked.map((w) => {
    const distractors = shuffle(pool.filter((p) => p.word !== w.word && p.meaning !== w.meaning))
      .slice(0, 3)
      .map((p) => p.meaning);
    const options = shuffle([w.meaning, ...distractors]);
    return {
      word: w.word,
      correctMeaning: w.meaning,
      options,
      correctIndex: options.indexOf(w.meaning),
      definition: w.definition,
      source: w,
    };
  });
}

export default function PracticePage() {
  const router = useRouter();
  const { savedWords } = useGameStore();
  const [questions, setQuestions] = useState<PQuestion[]>([]);
  const [idx, setIdx] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [stats, setStats] = useState({ correct: 0, wrong: 0 });
  const [done, setDone] = useState(false);

  useEffect(() => {
    setQuestions(buildQuestions(savedWords, 10));
  }, [savedWords]);

  const current = questions[idx];
  const total = questions.length;

  const onPick = (i: number) => {
    if (selected !== null || !current) return;
    setSelected(i);
    if (i === current.correctIndex) setStats((s) => ({ ...s, correct: s.correct + 1 }));
    else setStats((s) => ({ ...s, wrong: s.wrong + 1 }));
  };

  const onNext = () => {
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(idx + 1);
      setSelected(null);
    }
  };

  const restart = () => {
    setQuestions(buildQuestions(savedWords, 10));
    setIdx(0);
    setSelected(null);
    setStats({ correct: 0, wrong: 0 });
    setDone(false);
  };

  const accuracyPct = total > 0 ? Math.round((stats.correct / total) * 100) : 0;

  return (
    <main className="min-h-[100dvh] party-bg relative overflow-hidden flex flex-col items-center px-4 py-5">
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
            PRACTICE
          </div>
          <div className="w-[78px]" />
        </div>

        {questions.length === 0 ? (
          <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-8 text-center">
            <p className="text-4xl mb-3">📚</p>
            <p className="text-white font-black text-base mb-2">Need at least 4 saved words</p>
            <p className="text-sm font-bold text-white/70 mb-4">
              Play a few games to build your vocab notebook first.
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-2xl font-black text-sm tracking-widest cursor-pointer
                bg-amber-300 text-fuchsia-900 border-4 border-amber-400
                shadow-[0_5px_0_rgba(120,53,15,0.6)]
                active:translate-y-[3px] active:shadow-[0_2px_0_rgba(120,53,15,0.6)] transition-all"
            >
              START A GAME
            </button>
          </div>
        ) : done ? (
          // ── Summary ──
          <div className="w-full flex flex-col items-center gap-4 animate-tilt-pop">
            <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-6 text-center">
              <p className="text-4xl mb-1">🎉</p>
              <p className="text-2xl font-black text-white mb-1">PRACTICE DONE</p>
              <p className="text-base font-black text-amber-200">{accuracyPct}% accuracy</p>
              <div className="mt-4 flex justify-center gap-6 text-sm font-black tracking-widest">
                <span className="text-emerald-300">✓ {stats.correct}</span>
                <span className="text-rose-300">✗ {stats.wrong}</span>
              </div>
            </div>
            <button
              onClick={restart}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-widest cursor-pointer
                bg-amber-300 text-fuchsia-900 border-4 border-amber-400
                shadow-[0_6px_0_rgba(120,53,15,0.7)]
                hover:bg-amber-200 active:translate-y-[4px] active:shadow-[0_2px_0_rgba(120,53,15,0.7)]
                transition-all"
            >
              PRACTICE AGAIN
            </button>
            <button
              onClick={() => router.push('/words')}
              className="w-full py-3 rounded-2xl font-black text-sm tracking-widest cursor-pointer
                bg-white/15 text-white border-4 border-white/30
                hover:bg-white/25 active:translate-y-[2px] transition-all backdrop-blur-sm"
            >
              📚 BACK TO MY WORDS
            </button>
          </div>
        ) : current ? (
          <>
            {/* Progress */}
            <div className="w-full mb-3 flex items-center justify-between text-xs font-black tracking-widest text-white/80">
              <span>Q{idx + 1} / {total}</span>
              <span className="flex gap-3">
                <span className="text-emerald-300">✓ {stats.correct}</span>
                <span className="text-rose-300">✗ {stats.wrong}</span>
              </span>
            </div>

            {/* Question card */}
            <div
              className={`w-full rounded-3xl border-4 backdrop-blur-sm p-5 text-center mb-4 ${
                selected === null
                  ? 'bg-white/15 border-white/30'
                  : selected === current.correctIndex
                    ? 'bg-emerald-400/25 border-emerald-200'
                    : 'bg-rose-400/25 border-rose-200'
              }`}
            >
              <button
                onClick={() => speakWord(current.word)}
                className="w-12 h-12 rounded-full bg-fuchsia-300 border-4 border-fuchsia-200
                  flex items-center justify-center mx-auto mb-3 active:scale-95 cursor-pointer
                  shadow-[0_4px_0_rgba(112,26,117,0.5)]"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-950">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </button>
              <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                {current.word}
              </p>
              {selected !== null && current.definition && (
                <p className="mt-3 pt-3 border-t-2 border-dashed border-white/30 text-xs text-white/85 leading-relaxed font-medium">
                  {current.definition}
                </p>
              )}
            </div>

            {/* Options */}
            <div className="w-full grid grid-cols-2 gap-2.5 mb-4">
              {current.options.map((opt, i) => {
                const isCorrect = i === current.correctIndex;
                const isPicked = i === selected;
                let cls = 'min-h-[64px] px-3 py-3 rounded-2xl border-4 font-black text-base transition-all cursor-pointer active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.4)] ';
                if (selected === null) {
                  cls += 'bg-white text-fuchsia-900 border-white shadow-[0_5px_0_rgba(0,0,0,0.25)] hover:bg-amber-100';
                } else if (isPicked && isCorrect) {
                  cls += 'bg-emerald-300 text-emerald-950 border-emerald-100 scale-[1.04] shadow-[0_0_24px_rgba(110,231,183,0.7)]';
                } else if (isPicked && !isCorrect) {
                  cls += 'bg-rose-400 text-rose-950 border-rose-200 animate-shake';
                } else if (isCorrect) {
                  cls += 'bg-emerald-300/80 text-emerald-950 border-emerald-200';
                } else {
                  cls += 'bg-white/15 text-white/40 border-white/20 opacity-60';
                }
                return (
                  <button key={i} onClick={() => onPick(i)} disabled={selected !== null} className={cls}>
                    {opt}
                  </button>
                );
              })}
            </div>

            {/* Next button */}
            <button
              onClick={onNext}
              disabled={selected === null}
              className="w-full py-4 rounded-2xl font-black text-lg tracking-widest cursor-pointer
                bg-amber-300 text-fuchsia-900 border-4 border-amber-400
                shadow-[0_6px_0_rgba(120,53,15,0.7)]
                hover:bg-amber-200 active:translate-y-[4px] active:shadow-[0_2px_0_rgba(120,53,15,0.7)]
                transition-all
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-300"
            >
              {idx + 1 >= total ? 'FINISH' : 'NEXT →'}
            </button>
          </>
        ) : null}

        <p className="mt-4 text-center text-[10px] font-bold text-white/60 tracking-wider">
          No timer · No opponents · Pure practice
        </p>
      </div>
    </main>
  );
}
