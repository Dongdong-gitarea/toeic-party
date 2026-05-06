'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Settings as SettingsIcon,
  Dices,
  Check,
  BookMarked,
  Target,
  Users,
  UserPlus,
  ListChecks,
  Clock,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { CHARACTERS } from '@/lib/characters';
import { useT } from '@/lib/i18n';
import SettingsModal from '@/components/SettingsModal';
import BrandIntro from '@/components/BrandIntro';
import PlayWithFriendsSheet from '@/components/PlayWithFriendsSheet';

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
    phase, playerName, setPlayerName,
    joinMatch, leaveMatch, setReady, initSocket, socketReady,
    lobby, savedWords, selectedCharIdx, setSelectedChar, myReady,
  } = useGameStore();
  const [tickSeconds, setTickSeconds] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [copyDone, setCopyDone] = useState(false);
  const t = useT();

  useEffect(() => { initSocket(); }, [initSocket]);
  // Generate a random name only on first mount when nothing is saved.
  // After that, the input is fully under the user's control.
  useEffect(() => {
    if (!playerName) setPlayerName(randomName());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
      <BrandIntro />
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-amber-300/30 blur-3xl animate-blob-drift" />
        <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl animate-blob-drift" style={{ animationDelay: '4s' }} />
        <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-fuchsia-300/30 blur-3xl animate-blob-drift" style={{ animationDelay: '8s' }} />
      </div>

      {/* Settings gear button (top-right) */}
      <button
        onClick={() => setSettingsOpen(true)}
        aria-label={t('settings.title')}
        className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full
          bg-white/15 backdrop-blur-sm border-2 border-white/30 text-white
          hover:bg-white/25 active:scale-95 transition-all cursor-pointer
          flex items-center justify-center shadow-[0_3px_0_rgba(0,0,0,0.25)]"
      >
        <SettingsIcon className="w-5 h-5" strokeWidth={2.25} />
      </button>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <PlayWithFriendsSheet open={friendsOpen} onClose={() => setFriendsOpen(false)} />

      {isMatchmaking && lobby ? (
        // ── Lobby takeover ──
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5 animate-tilt-pop">
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-6 py-2 rounded-full font-black text-base tracking-widest shadow-[0_6px_0_#92400e] -rotate-2">
            {lobby.isPrivate ? t('lobby.private') : t('lobby.waitingRoom')}
          </div>

          {/* Room code chip — private rooms only */}
          {lobby.code && (
            <div className="w-full bg-fuchsia-500/15 border-4 border-fuchsia-300/40 rounded-2xl px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold tracking-widest text-fuchsia-200/80">
                  {t('lobby.roomCode')}
                </p>
                <p className="text-3xl font-black text-white tabular-nums tracking-[0.3em] mt-0.5">
                  {lobby.code}
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    if (typeof navigator !== 'undefined' && navigator.share) {
                      await navigator.share({
                        title: 'TOEIC PARTY',
                        text: `加入我的房間：${lobby.code}`,
                      });
                    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
                      await navigator.clipboard.writeText(lobby.code!);
                      setCopyDone(true);
                      setTimeout(() => setCopyDone(false), 1500);
                    }
                  } catch {
                    // user cancelled share or clipboard blocked
                  }
                }}
                className="shrink-0 px-4 py-3 rounded-xl font-bold text-xs tracking-widest
                  bg-amber-300 text-fuchsia-900 border-2 border-amber-200
                  shadow-[0_3px_0_rgba(120,53,15,0.5)]
                  hover:bg-amber-200 active:translate-y-[2px] active:shadow-[0_1px_0_rgba(120,53,15,0.5)]
                  transition-all cursor-pointer"
              >
                {copyDone ? t('lobby.copied') : t('lobby.share')}
              </button>
            </div>
          )}

          {/* Character picker — moved here from home so players choose during the wait */}
          <div className="w-full bg-white/10 backdrop-blur-sm rounded-3xl border-4 border-white/20 p-3">
            <p className="text-center text-[10px] font-bold text-white/70 tracking-widest mb-2">
              {t('home.pickChar')}
            </p>
            <div className="grid grid-cols-4 gap-2">
              {CHARACTERS.map((char, i) => {
                const selected = i === selectedCharIdx;
                return (
                  <button
                    key={char.id}
                    onClick={() => setSelectedChar(i)}
                    className={`flex flex-col items-center p-1.5 rounded-2xl border-4 transition-all cursor-pointer ${
                      selected
                        ? 'shadow-[0_0_20px_rgba(252,211,77,0.5)] -translate-y-0.5'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                    style={{
                      backgroundColor: char.color + (selected ? '50' : '20'),
                      borderColor: selected ? '#fcd34d' : char.color + '60',
                    }}
                  >
                    <div className={`w-10 h-10 ${selected ? 'animate-float-bob' : ''}`}>
                      <img
                        src={`${char.folder}/idle.png`}
                        alt={char.name}
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <span className={`text-[9px] mt-0.5 font-bold ${selected ? 'text-white' : 'text-white/70'}`}>
                      {char.name.toUpperCase()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-5 shadow-2xl">
            <div className="grid grid-cols-2 gap-3 mb-4">
              {Array.from({ length: lobby.capacity }).map((_, i) => {
                const slot = lobby.players[i];
                // Use each player's chosen character. Fallback to slot index
                // for legacy server payloads without charIdx.
                const charIdxForSlot =
                  typeof slot?.charIdx === 'number' ? slot.charIdx : i;
                const char = CHARACTERS[charIdxForSlot];
                return (
                  <div
                    key={i}
                    className={`relative rounded-2xl border-4 px-2.5 py-2 text-center ${
                      slot
                        ? slot.ready
                          ? 'border-emerald-300 shadow-[0_0_24px_rgba(52,211,153,0.4)]'
                          : slot.you
                            ? 'border-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.4)]'
                            : 'border-white/60'
                        : 'border-dashed border-white/30 animate-empty-pulse'
                    }`}
                    style={{
                      background: slot && char
                        ? `linear-gradient(135deg, ${char.color}55, ${char.color}10)`
                        : 'rgba(0,0,0,0.2)',
                    }}
                  >
                    {slot && char ? (
                      <>
                        {slot.you && (
                          <span className="absolute top-1 left-1 text-[8px] font-black tracking-widest bg-amber-300 text-fuchsia-900 px-1.5 py-0.5 rounded-full shadow-[0_2px_0_rgba(120,53,15,0.5)]">
                            {t('common.you')}
                          </span>
                        )}
                        <img
                          src={`${char.folder}/idle.png`}
                          alt=""
                          className="w-14 h-14 mx-auto object-contain animate-float-bob"
                          style={{ animationDelay: `${i * 0.2}s` }}
                          draggable={false}
                        />
                        <p className={`text-xs font-bold truncate ${slot.you ? 'text-amber-200' : 'text-white'}`}>{slot.name}</p>
                        {slot.ready && (
                          <span className="inline-flex items-center gap-1 mt-1 text-[9px] font-black tracking-widest bg-emerald-300 text-emerald-950 px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" strokeWidth={3} />
                            {t('lobby.readyDone')}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center text-white/40">
                          <UserPlus className="w-7 h-7" strokeWidth={1.75} />
                        </div>
                        <p className="text-xs font-bold text-white/50 mt-1">{t('lobby.waiting')}</p>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col items-center gap-1 pt-2 border-t-2 border-dashed border-white/20">
              <p className="text-[11px] font-bold text-white/70 tracking-widest mt-2">
                {lobby.count} / {lobby.capacity} {t('lobby.players')}
              </p>
              {!lobby.isPrivate && (
                <div className="text-5xl font-black text-amber-300 tabular-nums leading-none drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">
                  0:{String(tickSeconds ?? lobby.secondsLeft).padStart(2, '0')}
                </div>
              )}
              <p className="text-[10px] font-bold text-white/60 tracking-wide">
                {lobby.isPrivate
                  ? t('lobby.allReadyHint')
                  : lobby.count === 1
                    ? t('lobby.soloHint')
                    : t('lobby.allReadyHint')}
              </p>
            </div>
          </div>

          {/* READY toggle */}
          <button
            onClick={() => setReady(!myReady)}
            className={`w-full py-5 rounded-2xl font-black text-2xl tracking-widest cursor-pointer transition-all border-4 inline-flex items-center justify-center gap-2 ${
              myReady
                ? 'bg-emerald-400 text-emerald-950 border-emerald-500 shadow-[0_8px_0_rgba(6,78,59,0.7)] active:translate-y-[5px] active:shadow-[0_3px_0_rgba(6,78,59,0.7)]'
                : 'bg-amber-300 text-fuchsia-900 border-amber-400 shadow-[0_8px_0_rgba(120,53,15,0.7)] active:translate-y-[5px] active:shadow-[0_3px_0_rgba(120,53,15,0.7)] hover:bg-amber-200'
            }`}
          >
            {myReady && <Check className="w-6 h-6" strokeWidth={3} />}
            {myReady ? t('lobby.readyDone') : t('lobby.imReady')}
          </button>

          <button
            onClick={leaveMatch}
            className="w-full py-3 rounded-2xl font-bold text-sm tracking-widest cursor-pointer
              bg-white/15 text-white border-4 border-white/30
              hover:bg-white/25 active:translate-y-[2px] transition-all backdrop-blur-sm"
          >
            {t('lobby.leave')}
          </button>
        </div>
      ) : (
        // ── Home view ──
        <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-4">
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
            <p className="mt-2 text-xs font-bold text-white/80 uppercase tracking-[0.3em]">
              {t('home.subtitle')}
            </p>
          </div>

          <div className="w-full relative">
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              maxLength={16}
              className="w-full pl-5 pr-14 py-4 rounded-2xl font-black text-lg text-center
                bg-white/95 text-fuchsia-900 placeholder-fuchsia-400/60
                border-4 border-white/40
                shadow-[0_6px_0_rgba(0,0,0,0.25)]
                focus:outline-none focus:border-amber-300 transition"
              placeholder={t('home.namePlaceholder')}
            />
            <button
              type="button"
              onClick={() => setPlayerName(randomName())}
              aria-label="Generate random name"
              className="absolute top-1/2 right-2 -translate-y-1/2 w-10 h-10 rounded-xl
                bg-amber-300 text-fuchsia-900 border-2 border-amber-400
                shadow-[0_3px_0_rgba(120,53,15,0.5)]
                hover:bg-amber-200
                transition-colors cursor-pointer flex items-center justify-center"
            >
              <Dices className="w-5 h-5" strokeWidth={2.25} />
            </button>
          </div>

          <button
            onClick={joinMatch}
            disabled={!socketReady || !playerName.trim()}
            className="w-full py-3 rounded-2xl font-black text-sm tracking-wider whitespace-nowrap cursor-pointer
              bg-amber-300 text-fuchsia-900 border-4 border-amber-400
              shadow-[0_6px_0_rgba(120,53,15,0.7)]
              hover:bg-amber-200 active:translate-y-[4px] active:shadow-[0_2px_0_rgba(120,53,15,0.7)]
              transition-all
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-amber-300"
          >
            {t('home.start')}
          </button>

          <button
            onClick={() => setFriendsOpen(true)}
            disabled={!socketReady || !playerName.trim()}
            className="w-full py-3 rounded-2xl font-bold text-sm tracking-widest cursor-pointer
              bg-fuchsia-500/25 text-white border-4 border-fuchsia-300/50
              hover:bg-fuchsia-500/40 active:translate-y-[2px] transition-all backdrop-blur-sm
              disabled:opacity-40 disabled:cursor-not-allowed
              inline-flex items-center justify-center gap-2"
          >
            <Users className="w-4 h-4" strokeWidth={2.5} />
            {t('home.playWithFriends')}
          </button>

          {/* Study row — demoted, lives at the bottom */}
          <div className="w-full flex items-center justify-center gap-2 mt-1 flex-wrap">
            <button
              onClick={() => router.push('/words')}
              className="px-4 py-2 rounded-xl font-bold text-[11px] tracking-widest cursor-pointer
                bg-white/10 text-white/85 border-2 border-white/20
                hover:bg-white/20 active:translate-y-[1px] transition-all backdrop-blur-sm
                inline-flex items-center gap-1.5"
            >
              <BookMarked className="w-3.5 h-3.5" strokeWidth={2.5} />
              <span>{t('words.title')}</span>
              {savedWords.length > 0 && (
                <span className="ml-0.5 text-[10px] font-black tabular-nums bg-amber-300 text-fuchsia-900 px-1.5 py-0.5 rounded-full">
                  {savedWords.length}
                </span>
              )}
            </button>

            {savedWords.length >= 4 ? (
              <button
                onClick={() => router.push('/practice')}
                className="px-4 py-2 rounded-xl font-bold text-[11px] tracking-widest cursor-pointer
                  bg-white/10 text-white/85 border-2 border-white/20
                  hover:bg-white/20 active:translate-y-[1px] transition-all backdrop-blur-sm
                  inline-flex items-center gap-1.5"
              >
                <Target className="w-3.5 h-3.5" strokeWidth={2.5} />
                <span>{t('home.practice')}</span>
              </button>
            ) : (
              <span className="px-3 py-2 text-[10px] font-bold tracking-wide text-white/45 italic">
                {t('home.practiceLockedHint')}
              </span>
            )}
          </div>

          {!socketReady && (
            <p className="text-center text-xs font-bold text-amber-300 -mt-2">{t('common.connecting')}</p>
          )}

          <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-white/60 tracking-wider">
            <span className="inline-flex items-center gap-1">
              <Users className="w-3 h-3" strokeWidth={2.5} />
              4
            </span>
            <span className="text-white/30">·</span>
            <span className="inline-flex items-center gap-1">
              <ListChecks className="w-3 h-3" strokeWidth={2.5} />
              10
            </span>
            <span className="text-white/30">·</span>
            <span className="inline-flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={2.5} />
              10s
            </span>
          </div>
        </div>
      )}
    </main>
  );
}
