'use client';

import { useEffect, useState } from 'react';
import { Sparkles, KeyRound, ArrowLeft, GraduationCap } from 'lucide-react';
import { useGameStore, type Difficulty } from '@/store/gameStore';
import { useT } from '@/lib/i18n';

const DIFFICULTIES: { id: Difficulty; labelKey: string; descKey: string; color: string }[] = [
  { id: 'easy',   labelKey: 'difficulty.easy',   descKey: 'difficulty.easyDesc',   color: 'bg-emerald-400 text-emerald-950' },
  { id: 'medium', labelKey: 'difficulty.medium', descKey: 'difficulty.mediumDesc', color: 'bg-amber-300 text-amber-950' },
  { id: 'hard',   labelKey: 'difficulty.hard',   descKey: 'difficulty.hardDesc',   color: 'bg-rose-400 text-rose-950' },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

const CODE_LEN = 5;
const CODE_RE = /^[A-Z0-9]{0,5}$/;

type View = 'menu' | 'join';

export default function PlayWithFriendsSheet({ open, onClose }: Props) {
  const t = useT();
  const createPrivateRoom = useGameStore((s) => s.createPrivateRoom);
  const joinPrivateRoom = useGameStore((s) => s.joinPrivateRoom);
  const joinError = useGameStore((s) => s.joinError);
  const phase = useGameStore((s) => s.phase);
  const playerName = useGameStore((s) => s.playerName);
  const [view, setView] = useState<View>('menu');
  const [code, setCode] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');

  useEffect(() => {
    if (!open) {
      setView('menu');
      setCode('');
    }
  }, [open]);

  // Auto-close once the server accepts a join/create
  useEffect(() => {
    if (open && phase === 'matchmaking') onClose();
  }, [open, phase, onClose]);

  if (!open) return null;

  const canStart = !!playerName.trim();
  const canSubmit = code.length === CODE_LEN && canStart;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white/15 backdrop-blur-md border-4 border-white/30
          rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-tilt-pop
          sm:m-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-5 py-2 rounded-full font-black text-sm tracking-widest shadow-[0_5px_0_#92400e] -rotate-2">
            {t('home.playWithFriends')}
          </div>
        </div>

        {view === 'menu' ? (
          <div className="space-y-3">
            {/* Difficulty selector */}
            <div className="mb-1">
              <div className="flex items-center gap-1.5 mb-2 px-1">
                <GraduationCap className="w-4 h-4 text-white/70" strokeWidth={2.5} />
                <span className="text-[11px] font-bold text-white/70 uppercase tracking-widest">{t('difficulty.title')}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    className={`py-2 px-2 rounded-xl text-center cursor-pointer transition-all border-3 ${
                      difficulty === d.id
                        ? `${d.color} border-white/60 shadow-[0_3px_0_rgba(0,0,0,0.3)] scale-105`
                        : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/15'
                    }`}
                  >
                    <div className="text-xs font-black tracking-wider">{t(d.labelKey)}</div>
                    <div className={`text-[9px] font-bold mt-0.5 ${difficulty === d.id ? 'opacity-80' : 'opacity-50'}`}>{t(d.descKey)}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => createPrivateRoom(difficulty)}
              disabled={!canStart}
              className="w-full px-4 py-4 rounded-2xl text-left flex items-center gap-3 cursor-pointer
                bg-amber-300 text-fuchsia-900 border-4 border-amber-400
                shadow-[0_5px_0_rgba(120,53,15,0.5)]
                hover:bg-amber-200 active:translate-y-[3px] active:shadow-[0_2px_0_rgba(120,53,15,0.5)] transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-6 h-6 shrink-0" strokeWidth={2.5} />
              <div className="min-w-0">
                <div className="font-black text-sm tracking-widest">{t('home.createRoom')}</div>
                <div className="text-[11px] font-bold opacity-80">{t('home.createRoomDesc')}</div>
              </div>
            </button>

            <button
              onClick={() => setView('join')}
              disabled={!canStart}
              className="w-full px-4 py-4 rounded-2xl text-left flex items-center gap-3 cursor-pointer
                bg-white/15 text-white border-4 border-white/30
                hover:bg-white/25 active:translate-y-[2px] transition-all
                disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <KeyRound className="w-6 h-6 shrink-0" strokeWidth={2.25} />
              <div className="min-w-0">
                <div className="font-black text-sm tracking-widest">{t('home.joinRoom')}</div>
                <div className="text-[11px] font-bold opacity-70">{t('home.joinRoomDesc')}</div>
              </div>
            </button>

            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl font-bold text-sm tracking-widest cursor-pointer
                bg-white/5 text-white/70 border-2 border-white/15
                hover:bg-white/10 transition-all"
            >
              {t('words.addCancel')}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                const v = e.target.value.toUpperCase();
                if (CODE_RE.test(v)) setCode(v);
              }}
              maxLength={CODE_LEN}
              autoFocus
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              spellCheck={false}
              className="w-full px-5 py-4 rounded-2xl font-black text-2xl tabular-nums text-center tracking-[0.4em]
                bg-white/95 text-fuchsia-900 placeholder-fuchsia-400/50
                border-4 border-white/40
                shadow-[0_5px_0_rgba(0,0,0,0.25)]
                focus:outline-none focus:border-amber-300 transition"
              placeholder={t('home.joinPlaceholder')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && canSubmit) joinPrivateRoom(code);
              }}
            />

            {joinError && (
              <p className="text-center text-xs font-bold text-rose-300">{t(joinError)}</p>
            )}

            <div className="grid grid-cols-[auto_1fr] gap-2">
              <button
                onClick={() => setView('menu')}
                className="px-4 py-3 rounded-2xl font-bold text-sm cursor-pointer
                  bg-white/10 text-white border-4 border-white/20
                  hover:bg-white/20 active:translate-y-[2px] transition-all
                  flex items-center justify-center"
                aria-label="Back"
              >
                <ArrowLeft className="w-4 h-4" strokeWidth={2.5} />
              </button>
              <button
                onClick={() => joinPrivateRoom(code)}
                disabled={!canSubmit}
                className="py-3 rounded-2xl font-black text-sm tracking-widest cursor-pointer
                  bg-amber-300 text-fuchsia-900 border-4 border-amber-400
                  shadow-[0_4px_0_rgba(120,53,15,0.5)]
                  hover:bg-amber-200 active:translate-y-[3px] active:shadow-[0_1px_0_rgba(120,53,15,0.5)] transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-300"
              >
                {t('home.joinSubmit')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
