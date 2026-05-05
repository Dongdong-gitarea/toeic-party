'use client';

import { Settings as SettingsIcon, Globe, X as XIcon } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useT, LANGUAGES } from '@/lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function SettingsModal({ open, onClose }: Props) {
  const t = useT();
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);

  if (!open) return null;

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
          <div className="inline-flex items-center gap-1.5 bg-amber-300 text-fuchsia-900 px-5 py-2 rounded-full font-black text-sm tracking-widest shadow-[0_5px_0_#92400e] -rotate-2">
            <SettingsIcon className="w-4 h-4" strokeWidth={2.75} />
            {t('settings.title')}
          </div>
        </div>

        <div className="space-y-2">
          <p className="inline-flex items-center gap-1.5 text-[11px] font-black text-white/70 tracking-widest pl-1">
            <Globe className="w-3.5 h-3.5" strokeWidth={2.5} />
            {t('settings.language')}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {LANGUAGES.map((l) => {
              const active = locale === l.id;
              return (
                <button
                  key={l.id}
                  onClick={() => setLocale(l.id)}
                  className={`py-3 rounded-2xl font-black text-sm tracking-wider transition-all border-4 cursor-pointer ${
                    active
                      ? 'bg-amber-300 text-fuchsia-900 border-amber-400 shadow-[0_4px_0_rgba(120,53,15,0.5)]'
                      : 'bg-white/10 text-white/70 border-white/20 hover:bg-white/20'
                  }`}
                >
                  {l.label}
                </button>
              );
            })}
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-3 rounded-2xl font-black text-sm tracking-widest cursor-pointer
            bg-white text-fuchsia-700 border-4 border-white
            shadow-[0_5px_0_rgba(0,0,0,0.3)]
            hover:bg-amber-100 active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.3)]
            transition-all
            inline-flex items-center justify-center gap-1.5"
        >
          <XIcon className="w-4 h-4" strokeWidth={2.75} />
          {t('settings.close')}
        </button>
      </div>
    </div>
  );
}
