'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  Check,
  PartyPopper,
  Volume2,
  X as XIcon,
} from 'lucide-react';
import { useGameStore, type SavedWord } from '@/store/gameStore';
import { speakWord } from '@/lib/speak';
import { useT } from '@/lib/i18n';

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

  const t = useT();

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
            className="px-3 py-2 rounded-xl font-bold text-xs tracking-widest cursor-pointer
              bg-white/15 text-white border-4 border-white/30
              hover:bg-white/25 active:translate-y-[2px] transition-all
              inline-flex items-center justify-center"
            aria-label={t('practice.home')}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-5 py-2 rounded-full font-black text-sm tracking-widest shadow-[0_5px_0_#92400e] -rotate-2">
            {t('practice.title')}
          </div>
          <div className="w-10 h-10" />
        </div>

        {questions.length === 0 ? (
          <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-8 text-center">
            <BookMarked className="w-10 h-10 mx-auto mb-3 text-white/70" strokeWidth={1.75} />
            <p className="text-white font-bold text-base mb-2">{t('practice.needMore')}</p>
            <p className="text-sm font-bold text-white/70 mb-4">
              {t('practice.howTo')}
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-3 rounded-2xl font-black text-sm tracking-widest cursor-pointer
                bg-amber-300 text-fuchsia-900 border-4 border-amber-400
                shadow-[0_5px_0_rgba(120,53,15,0.6)]
                active:translate-y-[3px] active:shadow-[0_2px_0_rgba(120,53,15,0.6)] transition-all"
            >
              {t('practice.startGame')}
            </button>
          </div>
        ) : done ? (
          // ── Summary ──
          <div className="w-full flex flex-col items-center gap-4 animate-tilt-pop">
            <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-6 text-center">
              <PartyPopper className="w-9 h-9 mx-auto mb-1 text-amber-300" strokeWidth={2} />
              <p className="text-2xl font-black text-white mb-1">{t('practice.done')}</p>
              <p className="text-base font-bold text-amber-200">{t('practice.accuracy', { pct: accuracyPct })}</p>
              <div className="mt-4 flex justify-center gap-6 text-sm font-bold tracking-widest">
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <Check className="w-4 h-4" strokeWidth={3} />
                  {stats.correct}
                </span>
                <span className="inline-flex items-center gap-1 text-rose-300">
                  <XIcon className="w-4 h-4" strokeWidth={3} />
                  {stats.wrong}
                </span>
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
              {t('practice.again')}
            </button>
            <button
              onClick={() => router.push('/words')}
              className="w-full py-3 rounded-2xl font-bold text-sm tracking-widest cursor-pointer
                bg-white/15 text-white border-4 border-white/30
                hover:bg-white/25 active:translate-y-[2px] transition-all backdrop-blur-sm
                inline-flex items-center justify-center gap-2"
            >
              <BookMarked className="w-4 h-4" strokeWidth={2.5} />
              {t('practice.backToWords')}
            </button>
          </div>
        ) : current ? (
          <>
            {/* Progress */}
            <div className="w-full mb-3 flex items-center justify-between text-xs font-bold tracking-widest text-white/80">
              <span>{t('practice.qProgress', { n: idx + 1, total })}</span>
              <span className="flex gap-3">
                <span className="inline-flex items-center gap-0.5 text-emerald-300">
                  <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  {stats.correct}
                </span>
                <span className="inline-flex items-center gap-0.5 text-rose-300">
                  <XIcon className="w-3.5 h-3.5" strokeWidth={3} />
                  {stats.wrong}
                </span>
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
                  shadow-[0_4px_0_rgba(112,26,117,0.5)] text-fuchsia-950"
              >
                <Volume2 className="w-5 h-5" strokeWidth={2.5} />
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
                let cls = 'min-h-[64px] px-3 py-3 rounded-2xl border-4 font-semibold text-base transition-all cursor-pointer active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.4)] ';
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
                disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-300
                inline-flex items-center justify-center gap-2"
            >
              {idx + 1 >= total ? t('practice.finish') : t('practice.next')}
              {idx + 1 < total && <ArrowRight className="w-5 h-5" strokeWidth={3} />}
            </button>
          </>
        ) : null}

        <p className="mt-4 text-center text-[10px] font-bold text-white/60 tracking-wider">
          {t('practice.untimed')}
        </p>
      </div>
    </main>
  );
}
