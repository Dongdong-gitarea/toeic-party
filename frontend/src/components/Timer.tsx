'use client';

import { useEffect, useRef, useState } from 'react';
import { sounds } from '@/lib/sounds';

const R = 18;
const C = 2 * Math.PI * R;

export default function Timer({
  duration,
  questionId,
  timeCut = false,
  onTimeUpdate,
  compact = false,
}: {
  duration: number;
  questionId: string;
  timeCut?: boolean;
  onTimeUpdate?: (timeLeft: number) => void;
  compact?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const startRef = useRef(Date.now());
  const cutApplied = useRef(false);
  const cutOffset = useRef(0);
  const lastTickRef = useRef(99);

  useEffect(() => {
    startRef.current = Date.now();
    cutApplied.current = false;
    cutOffset.current = 0;
    lastTickRef.current = 99;
    setTimeLeft(duration);
    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed - cutOffset.current);
      setTimeLeft(remaining);
      onTimeUpdate?.(remaining);
      const sec = Math.ceil(remaining);
      if (sec <= 3 && sec < lastTickRef.current && sec > 0) {
        sounds.tick();
        lastTickRef.current = sec;
      }
      if (remaining <= 0) clearInterval(interval);
    }, 50);
    return () => clearInterval(interval);
  }, [questionId, duration, onTimeUpdate]);

  useEffect(() => {
    if (timeCut && !cutApplied.current) {
      cutApplied.current = true;
      cutOffset.current += 2;
    }
  }, [timeCut]);

  const progress = timeLeft / duration;
  const offset = C * (1 - progress);
  const urgent = timeLeft <= 3;
  const final = timeLeft <= 1;
  const color = timeLeft > 5 ? '#10B981' : timeLeft > 3 ? '#FBBF24' : '#EF4444';

  const size = compact ? 40 : 56;
  const animClass = final
    ? 'animate-timer-pulse-final'
    : urgent
      ? 'animate-timer-pulse'
      : '';
  const haloShadow = urgent
    ? final
      ? '0 0 18px rgba(239,68,68,0.85)'
      : '0 0 12px rgba(239,68,68,0.55)'
    : 'none';

  return (
    <div className={`relative ${animClass}`} style={{ width: size, height: size, filter: `drop-shadow(${haloShadow})` }}>
      <svg viewBox="0 0 44 44" className="w-full h-full -rotate-90">
        <circle cx="22" cy="22" r={R} fill="none" stroke="#1E293B" strokeWidth="4" />
        <circle cx="22" cy="22" r={R} fill="none" stroke={color} strokeWidth="4"
          strokeDasharray={C} strokeDashoffset={offset} strokeLinecap="round"
          className="transition-[stroke] duration-300" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center font-black tabular-nums"
        style={{ color, fontSize: compact ? 12 : 16 }}>
        {timeLeft.toFixed(1)}
      </span>
    </div>
  );
}
