'use client';

import { useEffect, useState } from 'react';

export default function ScorePopup({
  score,
  combo,
}: {
  score: number | null;
  combo: number;
}) {
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(0);
  const [displayCombo, setDisplayCombo] = useState(0);

  useEffect(() => {
    if (score !== null && score !== 0) {
      setDisplay(score);
      setDisplayCombo(combo);
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 900);
      return () => clearTimeout(t);
    }
  }, [score, combo]);

  if (!visible) return null;

  const isPositive = display > 0;

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
      {isPositive && displayCombo >= 3 && (
        <span className="animate-combo-fire text-2xl font-black text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]">
          COMBO x{displayCombo}
        </span>
      )}
    </div>
  );
}
