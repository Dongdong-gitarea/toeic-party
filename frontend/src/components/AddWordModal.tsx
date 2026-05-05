'use client';

import { useEffect, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { useT } from '@/lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function AddWordModal({ open, onClose }: Props) {
  const t = useT();
  const addManualWord = useGameStore((s) => s.addManualWord);
  const [word, setWord] = useState('');
  const [meaning, setMeaning] = useState('');

  useEffect(() => {
    if (!open) {
      setWord('');
      setMeaning('');
    }
  }, [open]);

  if (!open) return null;

  const canSubmit = word.trim().length > 0 && meaning.trim().length > 0;

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
            {t('words.addTitle')}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[10px] font-bold tracking-widest text-white/70 mb-1 pl-1">
              {t('words.addEnglish')}
            </label>
            <input
              type="text"
              value={word}
              onChange={(e) => setWord(e.target.value)}
              maxLength={40}
              autoFocus
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              className="w-full px-4 py-3 rounded-2xl font-bold text-base
                bg-white/95 text-fuchsia-900 placeholder-fuchsia-400/50
                border-4 border-white/40
                shadow-[0_4px_0_rgba(0,0,0,0.2)]
                focus:outline-none focus:border-amber-300 transition"
              placeholder="negotiate"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold tracking-widest text-white/70 mb-1 pl-1">
              {t('words.addMeaning')}
            </label>
            <input
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              maxLength={40}
              className="w-full px-4 py-3 rounded-2xl font-bold text-base
                bg-white/95 text-fuchsia-900 placeholder-fuchsia-400/50
                border-4 border-white/40
                shadow-[0_4px_0_rgba(0,0,0,0.2)]
                focus:outline-none focus:border-amber-300 transition"
              placeholder="協商"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-5">
          <button
            onClick={onClose}
            className="py-3 rounded-2xl font-bold text-sm tracking-widest cursor-pointer
              bg-white/10 text-white border-4 border-white/20
              hover:bg-white/20 active:translate-y-[2px] transition-all"
          >
            {t('words.addCancel')}
          </button>
          <button
            onClick={() => {
              if (!canSubmit) return;
              addManualWord(word.trim(), meaning.trim());
              onClose();
            }}
            disabled={!canSubmit}
            className="py-3 rounded-2xl font-black text-sm tracking-widest cursor-pointer
              bg-amber-300 text-fuchsia-900 border-4 border-amber-400
              shadow-[0_4px_0_rgba(120,53,15,0.5)]
              hover:bg-amber-200 active:translate-y-[3px] active:shadow-[0_1px_0_rgba(120,53,15,0.5)] transition-all
              disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-amber-300"
          >
            {t('words.addSubmit')}
          </button>
        </div>
      </div>
    </div>
  );
}
