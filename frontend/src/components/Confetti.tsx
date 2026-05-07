'use client';

import { useMemo } from 'react';

// Pure-CSS confetti — no canvas, no animation library. Renders ~36
// coloured squares that fall+spin from the top and disappear. Use
// once per mount; pass `key` if you need to replay.
//
// Mount only briefly (e.g. behind a `{isWinner && ...}` guard) — the
// component itself has no auto-unmount; it just runs the keyframes once.

const COLORS = [
  '#fcd34d', // amber-300
  '#34d399', // emerald-400
  '#f472b6', // pink-400
  '#a78bfa', // violet-400
  '#22d3ee', // cyan-400
  '#fb923c', // orange-400
  '#f87171', // rose-400
  '#fde047', // yellow-300
];

interface Particle {
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotate: number;
  drift: number;
}

function generate(count: number, seed: number): Particle[] {
  // Deterministic PRNG so React's strict-mode double-render doesn't
  // produce two different layouts.
  let s = seed >>> 0;
  const next = () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xffffffff;
  };
  return Array.from({ length: count }, () => ({
    left: next() * 100,
    delay: next() * 0.6,
    duration: 1.6 + next() * 1.4,
    size: 6 + Math.floor(next() * 8),
    color: COLORS[Math.floor(next() * COLORS.length)] ?? '#fcd34d',
    rotate: next() * 720 - 360,
    drift: next() * 80 - 40,
  }));
}

interface Props {
  count?: number;
  seed?: number;
}

export default function Confetti({ count = 36, seed = 1 }: Props) {
  const particles = useMemo(() => generate(count, seed), [count, seed]);
  return (
    <div className="pointer-events-none fixed inset-0 z-[55] overflow-hidden">
      {particles.map((p, i) => (
        <span
          key={i}
          aria-hidden
          className="absolute top-[-10%] block animate-confetti-fall"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            background: p.color,
            transform: `rotate(${p.rotate}deg)`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            // CSS custom prop consumed by the keyframe so each piece
            // drifts a different amount horizontally.
            ['--drift' as string]: `${p.drift}px`,
            borderRadius: i % 3 === 0 ? '50%' : '2px',
          }}
        />
      ))}
    </div>
  );
}
