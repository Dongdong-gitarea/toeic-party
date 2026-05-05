'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Volume2,
  Star,
  Inbox,
  Plus,
  ArrowLeft,
  Check,
  X as XIcon,
  Layers,
  AlertCircle,
  CheckCircle2,
  type LucideIcon,
} from 'lucide-react';
import { useGameStore, type SavedWord } from '@/store/gameStore';
import { speakWord } from '@/lib/speak';
import { useT } from '@/lib/i18n';
import AddWordModal from '@/components/AddWordModal';
import PosBadge from '@/components/PosBadge';
import ExampleBlock from '@/components/ExampleBlock';

type Filter = 'all' | 'starred' | 'practice' | 'mastered';

const FILTER_KEYS: { id: Filter; key: string; Icon: LucideIcon }[] = [
  { id: 'all', key: 'words.filter.all', Icon: Layers },
  { id: 'starred', key: 'words.filter.starred', Icon: Star },
  { id: 'practice', key: 'words.filter.practice', Icon: AlertCircle },
  { id: 'mastered', key: 'words.filter.mastered', Icon: CheckCircle2 },
];

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
  const [addOpen, setAddOpen] = useState(false);
  const t = useT();

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
            className="px-3 py-2 rounded-xl font-bold text-xs tracking-widest cursor-pointer
              bg-white/15 text-white border-4 border-white/30
              hover:bg-white/25 active:translate-y-[2px] transition-all
              inline-flex items-center justify-center"
            aria-label={t('words.home')}
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-5 py-2 rounded-full font-black text-sm tracking-widest shadow-[0_5px_0_#92400e] -rotate-2">
            {t('words.title')}
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="px-3 py-2 rounded-xl font-bold text-xs tracking-widest cursor-pointer
              bg-amber-300 text-fuchsia-900 border-4 border-amber-400
              shadow-[0_3px_0_rgba(120,53,15,0.5)]
              hover:bg-amber-200 active:translate-y-[2px] active:shadow-[0_1px_0_rgba(120,53,15,0.5)] transition-all
              inline-flex items-center justify-center"
            aria-label={t('words.add')}
          >
            <Plus className="w-4 h-4" strokeWidth={3} />
          </button>
        </div>

        <AddWordModal open={addOpen} onClose={() => setAddOpen(false)} />

        {/* Filter pills */}
        <div className="w-full grid grid-cols-2 gap-2 mb-4">
          {FILTER_KEYS.map(({ id, key, Icon }) => {
            const active = filter === id;
            return (
              <button
                key={id}
                onClick={() => setFilter(id)}
                className={`py-2.5 rounded-2xl font-bold text-[11px] tracking-widest transition-all border-4 cursor-pointer
                  inline-flex items-center justify-center gap-1.5 ${
                  active
                    ? 'bg-amber-300 text-fuchsia-900 border-amber-400 shadow-[0_4px_0_rgba(0,0,0,0.25)]'
                    : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                }`}
              >
                <Icon
                  className="w-3.5 h-3.5"
                  strokeWidth={2.5}
                  fill={active && id === 'starred' ? 'currentColor' : 'none'}
                />
                <span>{t(key)}</span>
                <span className={`text-[10px] font-black tabular-nums ${
                  active ? 'opacity-70' : 'opacity-60'
                }`}>
                  {counts[id]}
                </span>
              </button>
            );
          })}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-8 text-center">
            <Inbox className="w-10 h-10 mx-auto mb-2 text-white/60" strokeWidth={1.75} />
            <p className="text-white font-bold text-sm tracking-wide">
              {filter === 'all' ? t('words.empty') : t('words.empty2')}
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
                        active:scale-90 cursor-pointer shrink-0 border-2 border-white/30 text-white"
                    >
                      <Volume2 className="w-3.5 h-3.5" strokeWidth={2.5} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg font-bold text-white truncate">{w.word}</span>
                        <PosBadge pos={w.pos} />
                      </div>
                    </div>
                    <button
                      onClick={() => toggleStarWord(w.word)}
                      className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-all border-2 ${
                        w.starred
                          ? 'bg-amber-300 border-amber-200 text-fuchsia-900 shadow-[0_3px_0_rgba(120,53,15,0.5)]'
                          : 'bg-white/10 border-white/30 text-white/60'
                      }`}
                      aria-label={w.starred ? t('result.unstar') : t('result.save')}
                    >
                      <Star
                        className="w-3.5 h-3.5"
                        strokeWidth={2.5}
                        fill={w.starred ? 'currentColor' : 'none'}
                      />
                    </button>
                  </div>

                  {w.meaning && (
                    <p className="mt-1.5 text-base text-amber-200 font-bold">{w.meaning}</p>
                  )}
                  {w.definition && (
                    <p className="mt-1 text-xs text-white/75 leading-relaxed">{w.definition}</p>
                  )}

                  <ExampleBlock word={w.word} example={w.example} />

                  <div className="mt-2 flex items-center gap-3 text-[10px] font-bold text-white/80 tracking-wider">
                    <span className="inline-flex items-center gap-0.5 text-emerald-300">
                      <Check className="w-3 h-3" strokeWidth={3} />
                      {w.correctCount}
                    </span>
                    <span className="inline-flex items-center gap-0.5 text-rose-300">
                      <XIcon className="w-3 h-3" strokeWidth={3} />
                      {w.wrongCount}
                    </span>
                    <span>{t('words.times', { pct: accuracy, n: total })}</span>
                    <button
                      onClick={() => {
                        if (confirm(t('words.deleteConfirm', { word: w.word }))) removeSavedWord(w.word);
                      }}
                      className="ml-auto text-white/40 hover:text-rose-300 cursor-pointer"
                      aria-label={t('words.delete')}
                    >
                      {t('words.delete')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="mt-4 text-center text-[10px] font-bold text-white/60 tracking-wider">
          {t('words.note')}
        </p>
      </div>
    </main>
  );
}
