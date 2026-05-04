'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { CHARACTERS } from '@/lib/characters';

const FUN_NAMES = [
  'QuizNinja', 'WordHunter', 'SpeedReader', 'VocabKing',
  'GrammarBoss', 'TestAce', 'BrainStorm', 'FlashMind',
];

function randomName() {
  return FUN_NAMES[Math.floor(Math.random() * FUN_NAMES.length)] + Math.floor(Math.random() * 100);
}

export default function LobbyPage() {
  const router = useRouter();
  const {
    phase, gameMode, playerName, setPlayerName, setGameMode,
    joinMatch, initSocket, socketReady, unlockedChars, gamesPlayed,
  } = useGameStore();
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => { initSocket(); }, [initSocket]);
  useEffect(() => { if (!playerName) setPlayerName(randomName()); }, [playerName, setPlayerName]);
  useEffect(() => {
    if (phase === 'found' || phase === 'countdown' || phase === 'playing') router.push('/game');
  }, [phase, router]);
  useEffect(() => {
    if (phase !== 'matchmaking') return;
    const interval = setInterval(() => setDotCount((d) => (d + 1) % 4), 500);
    return () => clearInterval(interval);
  }, [phase]);

  const isMatchmaking = phase === 'matchmaking';

  return (
    <main className="min-h-[100dvh] flex flex-col items-center justify-center px-4 py-6">

      {/* Logo */}
      <div className="text-center mb-8 animate-slide-up">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="text-indigo-400">TOEIC</span>{' '}
          <span className="text-white">PARTY</span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-400 font-medium">Fast Quiz Battle</p>
      </div>

      {/* Characters showcase */}
      <div className="w-full max-w-sm mb-6 animate-slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="flex justify-center gap-3">
          {CHARACTERS.map((char, i) => {
            const isLocked = i >= unlockedChars;
            const unlockAt = [0, 3, 5, 10][i]!;
            const gamesLeft = unlockAt - gamesPlayed;
            return (
              <div key={char.id} className="flex flex-col items-center">
                <div
                  className={`w-16 h-16 rounded-xl flex items-center justify-center p-1 ${isLocked ? 'opacity-30 grayscale' : ''}`}
                  style={{ backgroundColor: char.color + '15', border: `2px solid ${isLocked ? '#334155' : char.color + '40'}` }}
                >
                  <img src={`${char.folder}/idle.png`} alt={char.name} className="w-full h-full object-contain" draggable={false} />
                </div>
                <span className={`text-[10px] mt-1 font-semibold ${isLocked ? 'text-slate-600' : 'text-slate-400'}`}>{char.name}</span>
                {isLocked && gamesLeft > 0 && (
                  <span className="text-[9px] text-slate-600">{gamesLeft} more</span>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-center text-[10px] text-slate-600 mt-1.5">
          {unlockedChars}/{CHARACTERS.length} unlocked · {gamesPlayed} games played
        </p>
      </div>

      {/* Name + Mode + Start */}
      <div className="w-full max-w-sm space-y-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <input
          type="text"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          maxLength={16}
          disabled={isMatchmaking}
          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl
            text-white font-semibold text-center text-base
            focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent
            disabled:opacity-50 transition"
          placeholder="Your name..."
        />

        {/* Mode selector */}
        <div className="flex rounded-xl overflow-hidden border border-slate-700">
          <button onClick={() => setGameMode('classic')}
            className={`flex-1 py-3 text-sm font-bold transition-all cursor-pointer ${
              gameMode === 'classic' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
            Classic
          </button>
          <button onClick={() => setGameMode('jump')}
            className={`flex-1 py-3 text-sm font-bold transition-all cursor-pointer ${
              gameMode === 'jump' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
            }`}>
            Jump Mode
          </button>
        </div>

        {/* Start button */}
        <button
          onClick={joinMatch}
          disabled={!socketReady || isMatchmaking || !playerName.trim()}
          className={`w-full py-4 rounded-xl font-black text-lg transition-all duration-300 ${
            isMatchmaking
              ? 'bg-slate-700 text-slate-300 cursor-wait'
              : 'bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] animate-pulse-glow cursor-pointer'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {isMatchmaking ? (
            <span className="flex items-center justify-center gap-3">
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin-slow" />
              Finding match{'.'.repeat(dotCount)}
            </span>
          ) : (
            'START MATCH'
          )}
        </button>

        {!socketReady && (
          <p className="text-center text-xs text-amber-400">Connecting to server...</p>
        )}
      </div>

      {/* Rules */}
      <p className="mt-6 text-center text-[11px] text-slate-600 animate-slide-up" style={{ animationDelay: '0.2s' }}>
        4 players · 10 questions · 10s each · answer fast!
      </p>
    </main>
  );
}
