'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getCharacter, getCharacterIndex } from '@/lib/characters';

const RANK_STYLES = [
  { badge: 'bg-yellow-400', text: 'text-yellow-400', glow: 'shadow-[0_0_24px_rgba(250,204,21,0.35)]' },
  { badge: 'bg-slate-400', text: 'text-slate-300', glow: '' },
  { badge: 'bg-amber-700', text: 'text-amber-600', glow: '' },
  { badge: 'bg-slate-600', text: 'text-slate-500', glow: '' },
];

const LABEL_MAP: Record<string, { label: string; color: string }> = {
  mvp: { label: 'MVP', color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  fastest: { label: 'Fastest', color: 'text-blue-400 bg-blue-500/10 border-blue-500/30' },
  comboKing: { label: 'Combo King', color: 'text-orange-400 bg-orange-500/10 border-orange-500/30' },
};

function getLevelInfo(xp: number) {
  if (xp >= 1500) return { name: 'Gold', color: 'text-yellow-400', barColor: 'bg-yellow-400', progress: 1, nextXP: 0 };
  if (xp >= 500) return { name: 'Silver', color: 'text-slate-300', barColor: 'bg-slate-300', progress: (xp - 500) / 1000, nextXP: 1500 - xp };
  return { name: 'Bronze', color: 'text-amber-600', barColor: 'bg-amber-600', progress: xp / 500, nextXP: 500 - xp };
}

export default function ResultPage() {
  const router = useRouter();
  const { phase, finalRankings, labels, playerId, reviewWords, totalXP, reset, players } =
    useGameStore();
  const [showWords, setShowWords] = useState(false);

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
    gapText = `You were only ${above.score - me.score} pts from ${myRankIdx === 1 ? '1st' : `#${myRankIdx}`}!`;
  } else if (myRankIdx === 0 && finalRankings.length > 1) {
    gapText = `You won by ${finalRankings[0]!.score - finalRankings[1]!.score} pts!`;
  }

  const level = getLevelInfo(totalXP);

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-3 py-6">
      <h1 className="text-4xl font-black mb-1 animate-slide-up">Game Over!</h1>
      {gapText && (
        <p className="text-indigo-400 font-bold text-lg mb-6 animate-slide-up">{gapText}</p>
      )}

      {/* Rankings */}
      <div className="w-full max-w-md space-y-3 mb-8">
        {finalRankings.map((entry, i) => {
          const style = RANK_STYLES[i] ?? RANK_STYLES[3]!;
          const isMe = entry.playerId === playerId;
          const charIdx = getCharacterIndex(entry.playerId, players);
          const char = getCharacter(charIdx);
          const entryLabels = playerLabels.get(entry.name) ?? [];

          return (
            <div
              key={entry.playerId}
              className={`animate-slide-up flex items-center gap-3 p-4 rounded-xl border transition-all ${
                isMe
                  ? `bg-indigo-500/10 border-indigo-500/30 ${style.glow}`
                  : 'bg-slate-800/60 border-slate-700/50'
              }`}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {/* Character avatar */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center p-1.5 shrink-0"
                style={{
                  backgroundColor: char.color + '20',
                  border: `2px solid ${char.color}40`,
                }}
              >
                <img src={`${char.folder}/idle.png`} alt={char.name} className="w-full h-full object-contain" />
              </div>

              {/* Rank badge */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${style.badge} text-black text-sm shrink-0`}
              >
                {i + 1}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold truncate">{entry.name}</span>
                  {isMe && (
                    <span className="text-[10px] bg-indigo-500 px-1.5 py-0.5 rounded-full shrink-0">
                      YOU
                    </span>
                  )}
                  {entry.isAI && !isMe && (
                    <span className="text-[10px] text-slate-500 shrink-0">BOT</span>
                  )}
                </div>
                <div className="flex gap-3 mt-1 text-xs text-slate-400">
                  <span>{entry.correctCount}/10</span>
                  <span>combo x{entry.maxCombo}</span>
                  <span>{entry.avgResponseTime}ms</span>
                </div>
                {entryLabels.length > 0 && (
                  <div className="flex gap-2 mt-1.5">
                    {entryLabels.map((key) => {
                      const l = LABEL_MAP[key];
                      if (!l) return null;
                      return (
                        <span key={key} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${l.color}`}>
                          {l.label}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Score */}
              <div className={`${style.text} font-black text-2xl tabular-nums shrink-0`}>
                {entry.score}
              </div>
            </div>
          );
        })}
      </div>

      {/* Level bar */}
      <div className="w-full max-w-md mb-6 animate-slide-up" style={{ animationDelay: '0.4s' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className={`text-sm font-bold ${level.color}`}>{level.name}</span>
          <span className="text-xs text-slate-500">
            {totalXP} XP{level.nextXP > 0 ? ` / ${level.nextXP} to next` : ''}
          </span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full ${level.barColor} rounded-full transition-all duration-1000`}
            style={{ width: `${Math.max(2, level.progress * 100)}%` }}
          />
        </div>
      </div>

      {/* PLAY AGAIN */}
      <button
        onClick={() => { reset(); router.push('/'); }}
        className="w-full max-w-md py-5 bg-indigo-600 hover:bg-indigo-500 rounded-xl
          font-black text-xl tracking-wide transition-all active:scale-[0.97]
          animate-pulse-glow cursor-pointer"
      >
        PLAY AGAIN
      </button>

      {/* Word Review — all words with full detail + TTS */}
      {reviewWords.length > 0 && (
        <div className="w-full max-w-md mt-4 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          <button
            onClick={() => setShowWords(!showWords)}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-300 py-2 cursor-pointer"
          >
            {showWords ? 'Hide' : 'Review all'} words ({reviewWords.length})
          </button>
          {showWords && (
            <div className="mt-2 space-y-2">
              {reviewWords.map((w, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-xl border ${
                    w.correct
                      ? 'bg-green-500/5 border-green-500/20'
                      : 'bg-red-500/5 border-red-500/20'
                  }`}
                >
                  {/* Word + Play button */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <button
                      onClick={() => {
                        if (typeof window !== 'undefined' && window.speechSynthesis) {
                          window.speechSynthesis.cancel();
                          const u = new SpeechSynthesisUtterance(w.word);
                          u.lang = 'en-US';
                          u.rate = 0.8;
                          window.speechSynthesis.speak(u);
                        }
                      }}
                      className="w-8 h-8 rounded-full bg-slate-700/50 flex items-center justify-center
                        active:scale-90 active:bg-slate-600 cursor-pointer shrink-0"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-slate-300">
                        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                        <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                      </svg>
                    </button>
                    <span className="text-lg font-black text-white">{w.word}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      w.correct
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}>
                      {w.correct ? 'Correct' : 'Wrong'}
                    </span>
                  </div>

                  {/* Definition */}
                  {w.definition && (
                    <p className="text-xs text-slate-400 mb-1.5 leading-relaxed">
                      {w.definition}
                    </p>
                  )}

                  {/* Answer detail */}
                  {!w.correct && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-red-400 line-through">{w.yourAnswer}</span>
                      <span className="text-slate-600">→</span>
                      <span className="text-green-400 font-semibold">{w.correctAnswer}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </main>
  );
}
