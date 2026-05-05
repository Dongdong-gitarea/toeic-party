'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useT } from '@/lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

const CODE_LEN = 5;
const CODE_RE = /^[A-Z0-9]{0,5}$/;

export default function JoinRoomModal({ open, onClose }: Props) {
  const t = useT();
  const joinPrivateRoom = useGameStore((s) => s.joinPrivateRoom);
  const joinError = useGameStore((s) => s.joinError);
  const phase = useGameStore((s) => s.phase);
  const [code, setCode] = useState('');

  useEffect(() => {
    if (!open) setCode('');
  }, [open]);

  // Auto-close once we successfully transition into matchmaking (server accepted)
  useEffect(() => {
    if (open && phase === 'matchmaking') onClose();
  }, [open, phase, onClose]);

  if (!open) return null;

  const handleSubmit = () => {
    if (code.length !== CODE_LEN) return;
    joinPrivateRoom(code);
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center px-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white/15 backdrop-blur-md border-4 border-white/30 rounded-3xl p-5 shadow-2xl animate-tilt-pop"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center mb-4">
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-5 py-2 rounded-full font-black text-sm tracking-widest shadow-[0_5px_0_#92400e] -rotate-2">
            {t('home.joinRoom')}
          </div>
        </div>

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
            if (e.key === 'Enter') handleSubmit();
          }}
        />

        {joinError && (
          <p className="mt-2 text-center text-xs font-bold text-rose-300">
            {t(joinError)}
          </p>
        )}

        <div className="grid grid-cols-2 gap-2 mt-4">
          <button
            onClick={onClose}
            className="py-3 rounded-2xl font-bold text-sm tracking-widest cursor-pointer
              bg-white/10 text-white border-4 border-white/20
              hover:bg-white/20 active:translate-y-[2px] transition-all"
          >
            {t('words.addCancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={code.length !== CODE_LEN}
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
    </div>
  );
}
