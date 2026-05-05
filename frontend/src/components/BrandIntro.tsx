'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tp_intro_played';

export default function BrandIntro() {
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    // Show once per session — fresh tab triggers it again, navigation doesn't.
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    sessionStorage.setItem(STORAGE_KEY, '1');
    setVisible(true);

    const exitTimer = setTimeout(() => setExiting(true), 1300);
    const hideTimer = setTimeout(() => setVisible(false), 1750);
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center party-bg ${exiting ? 'animate-intro-exit' : ''}`}
      onClick={() => {
        setExiting(true);
        setTimeout(() => setVisible(false), 300);
      }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-amber-300/40 blur-3xl animate-blob-drift" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-cyan-300/30 blur-3xl animate-blob-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-fuchsia-300/40 blur-3xl animate-blob-drift" style={{ animationDelay: '8s' }} />
      </div>

      <div className="relative z-10 text-center">
        <h1 className="text-6xl sm:text-7xl font-black tracking-tight leading-none">
          <span className="inline-block animate-intro-pop text-amber-300 drop-shadow-[0_6px_0_rgba(0,0,0,0.5)]">
            TOEIC
          </span>
          <br />
          <span
            className="inline-block text-white drop-shadow-[0_6px_0_rgba(0,0,0,0.5)]"
            style={{ animation: 'intro-pop 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.18s both' }}
          >
            PARTY
          </span>
        </h1>
        <p
          className="mt-4 text-sm font-bold text-white uppercase tracking-[0.4em]"
          style={{ animation: 'intro-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both' }}
        >
          Quiz Battle
        </p>
      </div>
    </div>
  );
}
