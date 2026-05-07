'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  X as XIcon,
  Crown,
  Zap,
  Flame,
  Volume2,
  Star,
  RotateCw,
  ChevronDown,
  ChevronUp,
  type LucideIcon,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getCharacter, getCharacterIndex } from '@/lib/characters';
import { speakWord } from '@/lib/speak';
import { useT } from '@/lib/i18n';
import PosBadge from '@/components/PosBadge';
import ExampleBlock from '@/components/ExampleBlock';
import Confetti from '@/components/Confetti';

const RANK_BG = [
  { bg: 'bg-amber-300', text: 'text-fuchsia-900', glow: 'shadow-[0_0_30px_rgba(252,211,77,0.6)]' },
  { bg: 'bg-slate-200', text: 'text-fuchsia-900', glow: '' },
  { bg: 'bg-orange-400', text: 'text-orange-950', glow: '' },
  { bg: 'bg-white/40', text: 'text-white', glow: '' },
];

const RANK_LABEL_KEYS = ['result.rank1', 'result.rank2', 'result.rank3', 'result.rank4'];

const LABEL_BG: Record<string, string> = {
  mvp: 'bg-amber-300 text-fuchsia-900',
  fastest: 'bg-cyan-300 text-fuchsia-900',
  comboKing: 'bg-orange-300 text-fuchsia-900',
};
const LABEL_KEYS: Record<string, string> = {
  mvp: 'result.label.mvp',
  fastest: 'result.label.fastest',
  comboKing: 'result.label.comboKing',
};
const LABEL_ICON: Record<string, LucideIcon> = {
  mvp: Crown,
  fastest: Zap,
  comboKing: Flame,
};

function getLevelInfo(xp: number) {
  if (xp >= 1500) return { key: 'result.level.gold', color: 'text-amber-300', bar: 'bg-amber-300', progress: 1, nextXP: 0 };
  if (xp >= 500) return { key: 'result.level.silver', color: 'text-slate-200', bar: 'bg-slate-200', progress: (xp - 500) / 1000, nextXP: 1500 - xp };
  return { key: 'result.level.bronze', color: 'text-orange-300', bar: 'bg-orange-300', progress: xp / 500, nextXP: 500 - xp };
}

export default function ResultPage() {
  const router = useRouter();
  const {
    phase, finalRankings, labels, playerId, reviewWords,
    totalXP, reset, players, savedWords, toggleStarWord, joinMatch,
  } = useGameStore();
  const [showWords, setShowWords] = useState(false);
  const t = useT();

  useEffect(() => {
    if (phase !== 'result' || finalRankings.length === 0) {
      router.replace('/');
    }
  }, [phase, finalRankings, router]);

  if (phase !== 'result' || finalRankings.length === 0) return null;

  const playerLabels = new Map<string, string[]>();
  if (labels) {
    for (const [key, name] of Object.entries(labels)) {
      const existing = playerLabels.get(name) ?? [];
      existing.push(key);
      playerLabels.set(name, existing);
    }
  }

  const myRankIdx = finalRankings.findIndex((r) => r.playerId === playerId);
  let gapText = '';
  if (myRankIdx > 0) {
    const above = finalRankings[myRankIdx - 1]!;
    const me = finalRankings[myRankIdx]!;
    gapText = t('result.gapBehind', { pts: above.score - me.score, rank: myRankIdx });
  } else if (myRankIdx === 0 && finalRankings.length > 1) {
    gapText = t('result.wonBy', { pts: finalRankings[0]!.score - finalRankings[1]!.score });
  }

  const level = getLevelInfo(totalXP);
  const isWinner = myRankIdx === 0;

  const isStarred = (word: string) =>
    savedWords.some(
      (w) => w.word.toLowerCase() === word.toLowerCase() && w.starred,
    );

  return (
    <main className="min-h-[100dvh] party-bg relative overflow-hidden flex flex-col items-center px-3 py-6">
      {/* Decorative floating blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-amber-300/30 blur-3xl animate-blob-drift" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl animate-blob-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-fuchsia-300/30 blur-3xl animate-blob-drift" style={{ animationDelay: '8s' }} />
      </div>

      {/* Winner-only confetti shower — animation runs once, then sits idle.
          The component re-mounts each time the result page does. */}
      {isWinner && <Confetti />}

      <div className="relative z-10 w-full max-w-md flex flex-col items-center">
        {/* Title */}
        <div className="text-center mb-3 animate-tilt-pop">
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-6 py-2 rounded-full font-black text-base tracking-widest shadow-[0_6px_0_#92400e] -rotate-2">
            {isWinner ? t('result.youWon') : t('result.gameOver')}
          </div>
          {gapText && (
            <p className="mt-3 text-sm font-bold text-white/90 tracking-wide drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">
              {gapText}
            </p>
          )}
        </div>

        {/* Rankings */}
        <div className="w-full space-y-2.5 mb-5">
          {finalRankings.map((entry, i) => {
            const style = RANK_BG[i] ?? RANK_BG[3]!;
            const rankLabelKey = RANK_LABEL_KEYS[i] ?? RANK_LABEL_KEYS[3]!;
            const isMe = entry.playerId === playerId;
            const charIdx = getCharacterIndex(entry.playerId, players);
            const char = getCharacter(charIdx);
            const entryLabels = playerLabels.get(entry.name) ?? [];

            return (
              <div
                key={entry.playerId}
                className={`animate-bounce-in flex items-center gap-3 p-3 rounded-2xl border-4 ${style.glow} ${
                  isMe
                    ? 'bg-white/20 border-amber-300'
                    : 'bg-white/10 border-white/30'
                }`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-[10px] shrink-0 ${style.bg} ${style.text}`}
                >
                  {t(rankLabelKey)}
                </div>

                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center p-1.5 shrink-0 border-2"
                  style={{
                    backgroundColor: char.color + '40',
                    borderColor: char.color,
                  }}
                >
                  <img src={`${char.folder}/idle.png`} alt={char.name} className="w-full h-full object-contain" draggable={false} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-white truncate">{entry.name}</span>
                    {isMe && (
                      <span className="text-[9px] bg-amber-300 text-fuchsia-900 px-1.5 py-0.5 rounded-full font-black tracking-widest shrink-0">
                        {t('common.you')}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-0.5 text-[10px] font-bold text-white/70 tracking-wide">
                    <span>{entry.correctCount}/10 {t('result.correct')}</span>
                    <span>×{entry.maxCombo} {t('result.combo')}</span>
                  </div>
                  {entryLabels.length > 0 && (
                    <div className="flex gap-1.5 mt-1.5 flex-wrap">
                      {entryLabels.map((key) => {
                        const bg = LABEL_BG[key];
                        const lkey = LABEL_KEYS[key];
                        const Icon = LABEL_ICON[key];
                        if (!bg || !lkey) return null;
                        return (
                          <span
                            key={key}
                            className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full tracking-wider ${bg}`}
                          >
                            {Icon && <Icon className="w-3 h-3" strokeWidth={2.75} />}
                            {t(lkey)}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="text-amber-300 font-black text-2xl tabular-nums shrink-0 drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">
                  {entry.score}
                </div>
              </div>
            );
          })}
        </div>

        {/* Level bar */}
        <div className="w-full mb-4 px-1 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-sm font-black tracking-widest ${level.color}`}>{t(level.key)}</span>
            <span className="text-xs font-bold text-white/80 tabular-nums">
              {totalXP} XP{level.nextXP > 0 ? t('result.toNext', { n: level.nextXP }) : ''}
            </span>
          </div>
          <div className="w-full h-3 bg-black/30 rounded-full overflow-hidden border-2 border-white/20">
            <div
              className={`h-full ${level.bar} rounded-full transition-all duration-1000`}
              style={{ width: `${Math.max(2, level.progress * 100)}%` }}
            />
          </div>
        </div>

        {/* REMATCH — primary CTA */}
        <button
          onClick={() => { reset(); joinMatch(); router.push('/'); }}
          className="w-full py-5 mb-2 rounded-2xl font-black text-2xl tracking-widest cursor-pointer
            bg-amber-300 text-fuchsia-900 border-4 border-amber-400
            shadow-[0_8px_0_rgba(120,53,15,0.7)]
            hover:bg-amber-200 active:translate-y-[5px] active:shadow-[0_3px_0_rgba(120,53,15,0.7)]
            transition-all
            inline-flex items-center justify-center gap-2"
        >
          <RotateCw className="w-6 h-6" strokeWidth={3} />
          {t('result.rematch')}
        </button>

        {/* PLAY AGAIN — back to home for character/mode change */}
        <button
          onClick={() => { reset(); router.push('/'); }}
          className="w-full py-3 mb-3 rounded-2xl font-bold text-sm tracking-widest cursor-pointer
            bg-white/15 text-white border-4 border-white/30
            hover:bg-white/25 active:translate-y-[2px] transition-all backdrop-blur-sm"
        >
          {t('result.playAgain')}
        </button>

        {/* Word Review */}
        {reviewWords.length > 0 && (
          <div className="w-full">
            <button
              onClick={() => setShowWords(!showWords)}
              className="w-full py-2.5 rounded-2xl font-bold text-xs tracking-widest cursor-pointer
                bg-white/10 text-white/80 border-2 border-white/20
                hover:bg-white/15 transition-all
                inline-flex items-center justify-center gap-1.5"
            >
              {showWords ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" strokeWidth={2.75} />
                  {t('result.hide')}
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" strokeWidth={2.75} />
                  {t('result.review', { n: reviewWords.length })}
                </>
              )}
            </button>

            {showWords && (
              <div className="mt-2.5 space-y-2">
                {reviewWords.map((w, i) => {
                  const starred = isStarred(w.word);
                  return (
                    <div
                      key={i}
                      className={`p-3 rounded-2xl border-4 ${
                        w.correct
                          ? 'bg-emerald-400/15 border-emerald-300/50'
                          : 'bg-rose-400/15 border-rose-300/50'
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
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full shrink-0 ${
                          w.correct ? 'bg-emerald-400 text-emerald-950' : 'bg-rose-400 text-rose-950'
                        }`}>
                          {w.correct
                            ? <Check className="w-3.5 h-3.5" strokeWidth={3} />
                            : <XIcon className="w-3.5 h-3.5" strokeWidth={3} />}
                        </span>
                        <button
                          onClick={() => toggleStarWord(w.word)}
                          className={`w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shrink-0 transition-all border-2 ${
                            starred
                              ? 'bg-amber-300 border-amber-200 text-fuchsia-900 shadow-[0_3px_0_rgba(120,53,15,0.5)] active:translate-y-[2px] active:shadow-[0_1px_0_rgba(120,53,15,0.5)]'
                              : 'bg-white/10 border-white/30 text-white/60 hover:bg-white/20'
                          }`}
                          aria-label={starred ? t('result.unstar') : t('result.save')}
                        >
                          <Star
                            className="w-3.5 h-3.5"
                            strokeWidth={2.5}
                            fill={starred ? 'currentColor' : 'none'}
                          />
                        </button>
                      </div>

                      {w.meaning && (
                        <p className="mt-2 text-base font-bold text-amber-200">
                          {w.meaning}
                        </p>
                      )}
                      {w.definition && (
                        <p className="mt-1 text-xs text-white/75 leading-relaxed font-normal">
                          {w.definition}
                        </p>
                      )}

                      {w.example && (
                        <p className="mt-1 text-[11px] text-white/55 leading-relaxed font-normal italic">
                          &ldquo;{w.example}&rdquo;
                        </p>
                      )}

                      {!w.correct && (
                        <div className="mt-2 flex items-center gap-2 text-xs font-bold">
                          <span className="text-rose-200 line-through">{w.yourAnswer}</span>
                          <span className="text-white/50">→</span>
                          <span className="text-emerald-200">{w.correctAnswer}</span>
                        </div>
                      )}

                      <ExampleBlock word={w.word} example={w.example} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
