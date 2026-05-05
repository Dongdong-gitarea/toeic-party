'use client';

import { useEffect, useState } from 'react';
import { Zap, Flame } from 'lucide-react';

interface Breakdown {
  base: number;
  speed: number;
  combo: number; // multiplier (1, 1.2, 1.5, 2)
}

export default function ScorePopup({
  score,
  combo,
  breakdown,
}: {
  score: number | null;
  combo: number;
  breakdown?: Breakdown | null;
}) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(0);
  const [displayCombo, setDisplayCombo] = useState(0);
  const [displayBreakdown, setDisplayBreakdown] = useState<Breakdown | null>(null);

  useEffect(() => {
    if (score !== null && score !== 0) {
      setDisplay(score);
      setDisplayCombo(combo);
      setDisplayBreakdown(breakdown ?? null);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 1100);
      return () => clearTimeout(t);
    }
  }, [score, combo, breakdown]);

  if (!visible) return null;

  const isPositive = display > 0;
  const showBreakdown =
    isPositive &&
    displayBreakdown != null &&
    (displayBreakdown.speed > 0 || displayBreakdown.combo > 1);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center z-50 gap-1">
      <span
        className={`animate-float-up text-5xl font-black drop-shadow-lg ${
          isPositive
            ? 'text-green-400 drop-shadow-[0_0_16px_rgba(74,222,128,0.7)]'
            : 'text-red-400 drop-shadow-[0_0_16px_rgba(248,113,113,0.7)]'
        }`}
      >
        {isPositive ? '+' : ''}{display}
      </span>
      {showBreakdown && (
        <div className="animate-float-up flex items-center gap-2 text-[11px] font-black tracking-widest opacity-90">
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-300/40">
            BASE {displayBreakdown!.base}
          </span>
          {displayBreakdown!.speed > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/30 text-cyan-100 border border-cyan-300/40">
              <Zap className="w-3 h-3" strokeWidth={2.75} />
              +{displayBreakdown!.speed}
            </span>
          )}
          {displayBreakdown!.combo > 1 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/30 text-orange-100 border border-orange-300/40">
              <Flame className="w-3 h-3" strokeWidth={2.75} fill="currentColor" />
              ×{displayBreakdown!.combo}
            </span>
          )}
        </div>
      )}
      {isPositive && displayCombo >= 3 && (
        <span className="animate-combo-fire text-2xl font-black text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.6)] mt-1">
          COMBO x{displayCombo}
        </span>
      )}
    </div>
  );
}
