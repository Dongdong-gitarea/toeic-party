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
    joinMatch, leaveMatch, initSocket, socketReady, unlockedChars, gamesPlayed, lobby,
  } = useGameStore();
  const [tickSeconds, setTickSeconds] = useState<number | null>(null);

  useEffect(() => { initSocket(); }, [initSocket]);
  useEffect(() => { if (!playerName) setPlayerName(randomName()); }, [playerName, setPlayerName]);
  useEffect(() => {
    if (phase === 'found' || phase === 'countdown' || phase === 'playing') router.push('/game');
  }, [phase, router]);

  useEffect(() => {
    if (lobby == null) {
      setTickSeconds(null);
      return;
    }
    setTickSeconds(lobby.secondsLeft);
    const interval = setInterval(() => {
      setTickSeconds((s) => (s == null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(interval);
  }, [lobby]);

  const isMatchmaking = phase === 'matchmaking';

  return (
    <main className="min-h-[100dvh] party-bg relative overflow-hidden flex flex-col items-center justify-center px-4 py-6">
      {/* Decorative floating blobs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-amber-300/30 blur-3xl animate-blob-drift" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl animate-blob-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-fuchsia-300/30 blur-3xl animate-blob-drift" style={{ animationDelay: '8s' }} />
      </div>

      {isMatchmaking && lobby ? (
        // ── Lobby takeover ──
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 animate-tilt-pop">
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-6 py-2 rounded-full font-black text-base tracking-widest shadow-[0_6px_0_#92400e] -rotate-2">
            WAITING ROOM
          </div>

          <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-5 shadow-2xl">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Array.from({ length: lobby.capacity }).map((_, i) => {
                const name = lobby.players[i];
                const char = CHARACTERS[i];
                return (
                  <div
                    key={i}
                    className={`rounded-2xl border-4 p-3 text-center ${
                      name
                        ? 'border-white/60 shadow-lg'
                        : 'border-dashed border-white/30 animate-empty-pulse'
                    }`}
                    style={{
                      background: name && char
                        ? `linear-gradient(135deg, ${char.color}55, ${char.color}10)`
                        : 'rgba(0,0,0,0.2)',
                    }}
                  >
                    {name && char ? (
                      <>
                        <img
                          src={`${char.folder}/idle.png`}
                          alt=""
                          className="w-16 h-16 mx-auto object-contain animate-float-bob"
                          style={{ animationDelay: `${i * 0.2}s` }}
                          draggable={false}
                        />
                        <p className="text-sm font-black text-white truncate mt-1">{name}</p>
                      </>
                    ) : (
                      <>
                        <div className="w-16 h-16 mx-auto rounded-full bg-white/10 flex items-center justify-center text-3xl font-black text-white/40">
                          ?
                        </div>
                        <p className="text-xs font-bold text-white/50 mt-1">Waiting…</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-1 pt-2 border-t-2 border-dashed border-white/20">
              <p className="text-[11px] font-black text-white/70 tracking-widest mt-2">
                {lobby.count} / {lobby.capacity} PLAYERS
              </p>
              <div className="text-5xl font-black text-amber-300 tabular-nums leading-none drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                0:{String(tickSeconds ?? lobby.secondsLeft).padStart(2, '0')}
              </div>
              <p className="text-[10px] font-bold text-white/60 tracking-wide">
                until AI fills the rest
              </p>
            </div>
          </div>

          <button
            onClick={leaveMatch}
            className="w-full py-4 rounded-2xl font-black text-base tracking-widest cursor-pointer
              bg-white text-fuchsia-700 border-4 border-white
              shadow-[0_6px_0_rgba(0,0,0,0.3)]
              hover:bg-rose-100 active:translate-y-[3px] active:shadow-[0_3px_0_rgba(0,0,0,0.3)]
              transition-all"
          >
            ← LEAVE LOBBY
          </button>
        </div>
      ) : (
        // ── Home view ──
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5">
          <div className="text-center animate-tilt-pop">
            <h1 className="text-5xl sm:text-6xl font-black tracking-tight leading-none">
              <span className="inline-block animate-wiggle text-amber-300 drop-shadow-[0_4px_0_rgba(0,0,0,0.4)]">
                TOEIC
              </span>
              <br />
              <span
                className="inline-block text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.4)]"
                style={{ animation: 'wiggle 2.5s ease-in-out 0.3s infinite' }}
              >
                PARTY
              </span>
            </h1>
            <p className="mt-2 text-xs font-black text-white/80 uppercase tracking-[0.3em]">
              Fast Quiz Battle
            </p>
          </div>

          <div
            className="w-full bg-white/10 backdrop-blur-sm rounded-3xl border-4 border-white/20 p-3 animate-tilt-pop"
            style={{ animationDelay: '0.05s' }}
          >
            <div className="flex justify-center gap-2">
              {CHARACTERS.map((char, i) => {
                const isLocked = i >= unlockedChars;
                const unlockAt = [0, 3, 5, 10][i]!;
                const gamesLeft = unlockAt - gamesPlayed;
                return (
                  <div key={char.id} className="flex flex-col items-center">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center p-1 ${
                        isLocked ? 'opacity-40 grayscale' : 'animate-float-bob'
                      }`}
                      style={{
                        backgroundColor: char.color + '40',
                        border: `3px solid ${isLocked ? 'rgba(255,255,255,0.2)' : char.color}`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    >
                      <img
                        src={`${char.folder}/idle.png`}
                        alt={char.name}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <span className={`text-[10px] mt-1 font-black ${isLocked ? 'text-white/40' : 'text-white'}`}>
                      {char.name.toUpperCase()}
                    </span>
                    {isLocked && gamesLeft > 0 && (
                      <span className="text-[8px] font-bold text-white/50">{gamesLeft} more</span>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-center text-[10px] font-bold text-white/60 mt-1.5 tracking-wide">
              {unlockedChars}/{CHARACTERS.length} unlocked · {gamesPlayed} games
            </p>
          </div>

          <input
            type="text"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            maxLength={16}
            className="w-full px-5 py-4 rounded-2xl font-black text-lg text-center
              bg-white/95 text-fuchsia-900 placeholder-fuchsia-400/60
              border-4 border-white/40
              shadow-[0_6px_0_rgba(0,0,0,0.25)]
              focus:outline-none focus:border-amber-300 transition"
            placeholder="YOUR NAME"
          />

          <div className="grid grid-cols-2 gap-3 w-full">
            <button
              onClick={() => setGameMode('classic')}
              className={`py-3 rounded-2xl font-black text-sm tracking-widest transition-all border-4 cursor-pointer ${
                gameMode === 'classic'
                  ? 'bg-amber-300 text-fuchsia-900 border-amber-400 shadow-[0_5px_0_rgba(0,0,0,0.25)]'
                  : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
              }`}
            >
              CLASSIC
            </button>
            <button
              onClick={() => setGameMode('jump')}
              className={`py-3 rounded-2xl font-black text-sm tracking-widest transition-all border-4 cursor-pointer ${
                gameMode === 'jump'
                  ? 'bg-amber-300 text-fuchsia-900 border-amber-400 shadow-[0_5px_0_rgba(0,0,0,0.25)]'
                  : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
              }`}
            >
              JUMP
            </button>
          </div>

          <button
            onClick={joinMatch}
            disabled={!socketReady || !playerName.trim()}
            className="w-full py-5 rounded-2xl font-black text-2xl tracking-widest cursor-pointer
              bg-amber-300 text-fuchsia-900 border-4 border-amber-400
              shadow-[0_8px_0_rgba(120,53,15,0.7)]
              hover:bg-amber-200 active:translate-y-[5px] active:shadow-[0_3px_0_rgba(120,53,15,0.7)]
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-300"
          >
            START!
          </button>

          {!socketReady && (
            <p className="text-center text-xs font-bold text-amber-300 -mt-2">Connecting to server...</p>
          )}

          <p className="text-center text-[11px] font-black text-white/60 tracking-widest">
            4 PLAYERS · 10 QUESTIONS · 10s EACH
          </p>
        </div>
      )}
    </main>
  );
}
