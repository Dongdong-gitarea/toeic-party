'use client';

import { useEffect, useRef, useState } from 'react';

const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Timer({
  duration,
  questionId,
  timeCut = false,
}: {
  duration: number;
  questionId: string;
  timeCut?: boolean;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const startRef = useRef(Date.now());
  const cutApplied = useRef(false);
  const cutOffset = useRef(0);

  useEffect(() => {
    startRef.current = Date.now();
    cutApplied.current = false;
    cutOffset.current = 0;
    setTimeLeft(duration);

    const interval = setInterval(() => {
      const elapsed = (Date.now() - startRef.current) / 1000;
      const remaining = Math.max(0, duration - elapsed - cutOffset.current);
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    return () => clearInterval(interval);
  }, [questionId, duration]);

  // Apply time cut effect
  useEffect(() => {
    if (timeCut && !cutApplied.current) {
      cutApplied.current = true;
      cutOffset.current += 2;
    }
  }, [timeCut]);

  const progress = timeLeft / duration;
  const offset = CIRCUMFERENCE * (1 - progress);
  const color =
    timeLeft > 2 ? '#10B981' : timeLeft > 1 ? '#FBBF24' : '#EF4444';

  return (
    <div className="relative w-20 h-20">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none" stroke="#1E293B" strokeWidth="6"
        />
        <circle
          cx="50" cy="50" r={RADIUS}
          fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-[stroke] duration-300"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-2xl font-black tabular-nums"
        style={{ color }}
      >
        {timeLeft.toFixed(1)}
      </span>
    </div>
  );
}
