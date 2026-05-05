'use client';

import type { SkillType } from '@/store/gameStore';
import { useT } from '@/lib/i18n';

const SKILL_DEFS: { type: SkillType; emoji: string; nameKey: string; descKey: string }[] = [
  { type: 'shake', emoji: '🌀', nameKey: 'skill.shake.name', descKey: 'skill.shake.desc' },
  { type: 'fog', emoji: '🌫️', nameKey: 'skill.fog.name', descKey: 'skill.fog.desc' },
  { type: 'timeCut', emoji: '⏱️', nameKey: 'skill.cut.name', descKey: 'skill.cut.desc' },
];

const COST = 3;
const MAX_ENERGY = 9;

interface Props {
  energy: number;
  disabled: boolean;
  isFinal: boolean;
  onUse: (type: SkillType) => void;
}

export default function SkillBar({ energy, disabled, isFinal, onUse }: Props) {
  const t = useT();
  const canAffordSkill = energy >= COST;
  const canUse = canAffordSkill && !disabled && !isFinal;

  const filled = Math.min(energy, MAX_ENERGY);

  return (
    <div className="space-y-1.5">
      {/* Energy meter */}
      <div className="flex items-center gap-2 px-1">
        <span className="text-[10px] font-bold text-white/70 tracking-widest shrink-0">
          {t('skill.energy')}
        </span>
        <div className="flex-1 flex gap-0.5">
          {Array.from({ length: MAX_ENERGY }).map((_, i) => {
            const isFilled = i < filled;
            const isCostMarker = (i + 1) % COST === 0; // visual tick at 3, 6, 9
            return (
              <div
                key={i}
                className={`flex-1 h-2 rounded-sm transition-all duration-300 ${
                  isFilled
                    ? canAffordSkill
                      ? 'bg-amber-300 shadow-[0_0_4px_rgba(252,211,77,0.6)]'
                      : 'bg-amber-300/50'
                    : 'bg-white/10'
                } ${isCostMarker && !isFilled ? 'border-r-2 border-white/30' : ''}`}
              />
            );
          })}
        </div>
        <span className={`text-[11px] font-bold tabular-nums shrink-0 ${canAffordSkill ? 'text-amber-300' : 'text-white/50'}`}>
          {energy}/{MAX_ENERGY}
        </span>
      </div>

      {/* Skill buttons */}
      <div className="grid grid-cols-3 gap-2">
        {SKILL_DEFS.map((skill) => {
          const usableNow = canUse;
          return (
            <button
              key={skill.type}
              onClick={() => onUse(skill.type)}
              disabled={!usableNow}
              className={`relative min-h-[60px] px-2 py-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                usableNow
                  ? 'bg-amber-300/15 border-amber-300/60 text-white hover:bg-amber-300/25 active:translate-y-[2px] active:shadow-[0_2px_0_rgba(120,53,15,0.4)] shadow-[0_3px_0_rgba(120,53,15,0.4)] cursor-pointer'
                  : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <span className="text-xl leading-none">{skill.emoji}</span>
              <span className="text-[11px] font-bold tracking-wide leading-none">
                {t(skill.nameKey)}
              </span>
              <span className={`text-[9px] font-bold tracking-wider leading-none ${
                usableNow ? 'text-amber-300' : 'text-white/40'
              }`}>
                ⚡{COST}
              </span>
              {/* Always-visible mini description */}
              <span className="text-[9px] text-white/55 leading-tight text-center mt-0.5 line-clamp-1">
                {t(skill.descKey)}
              </span>
            </button>
          );
        })}
      </div>

      {isFinal && (
        <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest text-center">
          {t('skill.noFinal')}
        </p>
      )}
    </div>
  );
}
