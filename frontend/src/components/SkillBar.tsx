'use client';

import type { SkillType } from '@/store/gameStore';

const SKILLS: { type: SkillType; label: string; desc: string }[] = [
  { type: 'shake', label: 'SHAKE', desc: 'Screen shake 2s' },
  { type: 'fog', label: 'FOG', desc: 'Blur options 2s' },
  { type: 'timeCut', label: '-2s', desc: 'Cut opponent time' },
];

interface Props {
  energy: number;
  disabled: boolean;
  isFinal: boolean;
  onUse: (type: SkillType) => void;
}

export default function SkillBar({ energy, disabled, isFinal, onUse }: Props) {
  const canUse = energy >= 3 && !disabled && !isFinal;

  return (
    <div className="flex items-center gap-3">
      {/* Energy dots */}
      <div className="flex gap-1 mr-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
              energy > i
                ? 'bg-yellow-400 shadow-[0_0_6px_rgba(250,204,21,0.6)]'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Skill buttons */}
      {SKILLS.map((skill) => (
        <button
          key={skill.type}
          onClick={() => onUse(skill.type)}
          disabled={!canUse}
          title={skill.desc}
          className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all ${
            canUse
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 hover:bg-yellow-500/30 active:scale-95 cursor-pointer'
              : 'bg-slate-800/50 text-slate-600 border border-slate-700/30 cursor-not-allowed'
          }`}
        >
          {skill.label}
        </button>
      ))}

      {isFinal && (
        <span className="text-[10px] text-red-400 font-bold uppercase">
          No skills on final Q
        </span>
      )}
    </div>
  );
}
