'use client';

import type { SkillType } from '@/store/gameStore';
import { useT } from '@/lib/i18n';

const SKILL_DEFS: { type: SkillType; emoji: string; nameKey: string; descKey: string }[] = [
  { type: 'shake', emoji: '🌀', nameKey: 'skill.shake.name', descKey: 'skill.shake.desc' },
  { type: 'fog', emoji: '🌫️', nameKey: 'skill.fog.name', descKey: 'skill.fog.desc' },
  { type: 'timeCut', emoji: '⏱️', nameKey: 'skill.cut.name', descKey: 'skill.cut.desc' },
];

interface Props {
  usedSkills: SkillType[];
  disabled: boolean;
  isFinal: boolean;
  onUse: (type: SkillType) => void;
}

export default function SkillBar({ usedSkills, disabled, isFinal, onUse }: Props) {
  const t = useT();

  return (
    <div className="space-y-1.5">
      {/* Skill buttons */}
      <div className="grid grid-cols-3 gap-2">
        {SKILL_DEFS.map((skill) => {
          const used = usedSkills.includes(skill.type);
          const usableNow = !used && !disabled && !isFinal;
          return (
            <button
              key={skill.type}
              onClick={() => onUse(skill.type)}
              disabled={!usableNow}
              className={`relative min-h-[60px] px-2 py-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                usableNow
                  ? 'bg-amber-300/15 border-amber-300/60 text-white hover:bg-amber-300/25 active:translate-y-[2px] active:shadow-[0_2px_0_rgba(120,53,15,0.4)] shadow-[0_3px_0_rgba(120,53,15,0.4)] cursor-pointer'
                  : used
                    ? 'bg-white/5 border-white/10 text-white/30 cursor-not-allowed'
                    : 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
              }`}
            >
              <span className={`text-xl leading-none ${used ? 'grayscale opacity-50' : ''}`}>
                {skill.emoji}
              </span>
              <span className="text-[11px] font-bold tracking-wide leading-none">
                {t(skill.nameKey)}
              </span>
              <span className="text-[9px] text-white/55 leading-tight text-center mt-0.5 line-clamp-1">
                {used ? t('skill.used') : t(skill.descKey)}
              </span>
              {used && (
                <span className="absolute top-1 right-1 text-[9px] font-black tracking-widest text-rose-300/80">
                  ✓
                </span>
              )}
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
