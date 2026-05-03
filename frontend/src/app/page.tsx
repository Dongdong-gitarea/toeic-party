'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';

const FUN_NAMES = [
  'QuizNinja', 'WordHunter', 'SpeedReader', 'VocabKing',
  'GrammarBoss', 'TestAce', 'BrainStorm', 'FlashMind',
];

function randomName() {
  const base = FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)];
  const num = Math.floor(Math.random() * 100);
  return `${base}${num}`;
}

export default function LobbyPage() {
  const router = useRouter();
  const {
    phase,
    playerName,
    setPlayerName,
    joinMatch,
    initSocket,
    socketReady,
    players,
  } = useGameStore();

  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    initSocket();
  }, [initSocket]);

  useEffect(() => {
    if (!playerName) setPlayerName(randomName());
  }, [playerName, setPlayerName]);

  // Navigate to game on match found
  useEffect(() => {
    if (phase === 'found' || phase === 'countdown' || phase === 'playing') {
      router.push('/game');
    }
  }, [phase, router]);

  // Matchmaking dots animation
  useEffect(() => {
    if (phase !== 'matchmaking') return;
    const interval = setInterval(() => setDotCount((d) => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, [phase]);

  const isMatchmaking = phase === 'matchmaking';

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <div className="text-center mb-12 animate-slide-up">
        <h1 className="text-5xl sm:text-6xl font-black tracking-tight">
          <span className="text-indigo-400">TOEIC</span>{' '}
          <span className="text-white">PARTY</span>
        </h1>
        <p className="mt-3 text-lg text-slate-400 font-medium">
          Fast Quiz Battle
        </p>
      </div>

      {/* Name input */}
      <div className="w-full max-w-sm space-y-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-2">
            Your Name
          </label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
            disabled={isMatchmaking}
            className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
              text-white font-semibold text-center text-lg
              focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
              disabled:opacity-50 transition"
            placeholder="Enter name..."
          />
        </div>

        {/* Start / Matchmaking button */}
        <button
          onClick={joinMatch}
          disabled={!socketReady || isMatchmaking || !playerName.trim()}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 ${
            isMatchmaking
              ? 'bg-slate-700 text-slate-300 cursor-wait'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] animate-pulse-glow cursor-pointer'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isMatchmaking ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
              Finding match{'.'.repeat(dotCount)}
            </span>
          ) : (
            'Start Match'
          )}
        </button>

        {!socketReady && (
          <p className="text-center text-sm text-amber-400">
            Connecting to server...
          </p>
        )}
      </div>

      {/* Game rules */}
      <div
        className="mt-12 text-center text-sm text-slate-500 max-w-xs space-y-1 animate-slide-up"
        style={{ animationDelay: '0.2s' }}
      >
        <p>4 players / 10 questions / 3s per question</p>
        <p>Answer fast for bonus points!</p>
      </div>
    </main>
  );
}
