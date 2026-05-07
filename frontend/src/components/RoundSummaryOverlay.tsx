'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Check,
  X as XIcon,
  Waves,
  CloudFog,
  TimerOff,
  Lock,
  type LucideIcon,
} from 'lucide-react';
import {
  useGameStore,
  type RoundSummary,
  type SkillType,
} from '@/store/gameStore';
import { getCharacter, getCharacterIndex } from '@/lib/characters';
import { useT } from '@/lib/i18n';

const REVEAL_STAGGER_MS = 400;

const SKILLS: { id: SkillType; Icon: LucideIcon; nameKey: string; descKey: string }[] = [
  { id: 'shake',   Icon: Waves,    nameKey: 'skill.shake.name', descKey: 'skill.shake.desc' },
  { id: 'fog',     Icon: CloudFog, nameKey: 'skill.fog.name',   descKey: 'skill.fog.desc' },
  { id: 'timeCut', Icon: TimerOff, nameKey: 'skill.cut.name',   descKey: 'skill.cut.desc' },
];

interface Props {
  summary: RoundSummary;
}

export default function RoundSummaryOverlay({ summary }: Props) {
  const t = useT();
  const players = useGameStore((s) => s.players);
  const myPlayerId = useGameStore((s) => s.playerId);
  const myUsedSkills = useGameStore((s) => s.myUsedSkills);
  const useSkill = useGameStore((s) => s.useSkill);
  const voteSkipBetween = useGameStore((s) => s.voteSkipBetween);
  const skipVoted = useGameStore((s) => s.skipVoted);

  // Local picked-skill mirror so the cast button visually locks the
  // moment the user taps, even before the server's SKILL_USED arrives.
  const [picked, setPicked] = useState<SkillType | null>(null);

  // Tick to drive both the reveal animation and the countdown ring.
  // We compute remaining time from receivedAt rather than trusting any
  // single setTimeout, so a tab refocus doesn't desync the ring.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 50);
    return () => clearInterval(id);
  }, []);

  // Reset local picked on each new wrap-up
  useEffect(() => {
    setPicked(null);
  }, [summary.questionNumber, summary.receivedAt]);

  const elapsed = now - summary.receivedAt;
  const remaining = Math.max(0, summary.durationMs - elapsed);
  const remainingSec = Math.ceil(remaining / 1000);

  // Sort the per-player results into reveal order: by score DESC.
  // This gives the round summary a "who's leading" feel in addition
  // to a per-question correct/wrong reveal.
  const ordered = useMemo(
    () =>
      [...summary.results].sort((a, b) => b.score - a.score),
    [summary],
  );

  const handlePick = (skill: SkillType) => {
    if (!summary.skillsAllowed) return;
    if (myUsedSkills.includes(skill)) return;
    if (picked) return;
    setPicked(skill);
    useSkill(skill);
  };

  // Circle-countdown geometry
  const R = 22;
  const C = 2 * Math.PI * R;
  const progress = remaining / summary.durationMs; // 1 → 0
  const offset = C * (1 - progress);
  const ringColor = remaining <= 1000 ? '#FBBF24' : '#A78BFA';

  return (
    <div className="fixed inset-0 z-[70] flex flex-col items-center justify-center px-4 bg-black/75 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-gradient-to-b from-fuchsia-700/40 to-slate-900/80 backdrop-blur-md
        border-4 border-white/30 rounded-3xl p-5 shadow-2xl animate-tilt-pop">
        {/* Title + countdown ring */}
        <div className="flex items-center justify-between mb-3">
          <div className="inline-block bg-amber-300 text-fuchsia-900 px-4 py-1 rounded-full font-black text-xs tracking-widest shadow-[0_4px_0_#92400e] -rotate-2">
            Q{summary.questionNumber}
          </div>
          <div className="relative w-12 h-12">
            <svg viewBox="0 0 56 56" className="w-full h-full -rotate-90">
              <circle cx="28" cy="28" r={R} fill="none" stroke="#1E293B" strokeWidth="4" />
              <circle
                cx="28"
                cy="28"
                r={R}
                fill="none"
                stroke={ringColor}
                strokeWidth="4"
                strokeDasharray={C}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-[stroke] duration-300"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-black tabular-nums text-white text-base">
              {remainingSec}
            </span>
          </div>
        </div>

        {/* Player rows — staggered reveal */}
        <div className="space-y-1.5 mb-4">
          {ordered.map((r, i) => {
            const revealAt = i * REVEAL_STAGGER_MS;
            const revealed = elapsed >= revealAt;
            const charIdx = getCharacterIndex(r.playerId, players);
            const char = getCharacter(charIdx);
            const playerName =
              players.find((p) => p.playerId === r.playerId)?.name ?? 'Player';
            const isMe = r.playerId === myPlayerId;

            return (
              <div
                key={r.playerId}
                className={`flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 transition-all duration-300 ${
                  revealed
                    ? r.correct
                      ? 'bg-emerald-400/20 border-emerald-300/50'
                      : 'bg-rose-400/20 border-rose-300/50'
                    : 'bg-white/5 border-white/15 opacity-60'
                } ${isMe ? 'ring-2 ring-amber-300/50' : ''}`}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center p-0.5 border-2 shrink-0"
                  style={{ backgroundColor: char.color + '40', borderColor: char.color }}
                >
                  <img src={`${char.folder}/idle.png`} alt="" className="w-full h-full object-contain" />
                </div>
                <span className={`flex-1 text-sm font-bold truncate ${isMe ? 'text-amber-200' : 'text-white'}`}>
                  {playerName}
                </span>
                <span className="text-amber-300 font-black text-sm tabular-nums shrink-0">{r.score}</span>
                <span className="w-6 inline-flex justify-center shrink-0">
                  {revealed ? (
                    r.correct ? (
                      <Check className="w-4 h-4 text-emerald-300" strokeWidth={3} />
                    ) : (
                      <XIcon className="w-4 h-4 text-rose-300" strokeWidth={3} />
                    )
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
                  )}
                </span>
              </div>
            );
          })}
        </div>

        {/* Skill picker */}
        <div className="space-y-2">
          <p className="text-[10px] font-black tracking-widest text-white/70 uppercase text-center">
            {summary.skillsAllowed ? t('between.pickSkill') : t('between.skillsLocked')}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {SKILLS.map(({ id, Icon, nameKey, descKey }) => {
              const used = myUsedSkills.includes(id);
              const isPicked = picked === id;
              const disabled = !summary.skillsAllowed || used || (picked !== null && !isPicked);
              return (
                <button
                  key={id}
                  onClick={() => handlePick(id)}
                  disabled={disabled}
                  className={`relative rounded-2xl border-2 px-1 py-2 flex flex-col items-center gap-0.5 transition-all ${
                    isPicked
                      ? 'bg-amber-300 text-fuchsia-900 border-amber-400 shadow-[0_3px_0_rgba(120,53,15,0.4)] scale-105'
                      : disabled
                        ? 'bg-white/5 border-white/10 text-white/40 cursor-not-allowed'
                        : 'bg-amber-300/15 border-amber-300/60 text-white hover:bg-amber-300/25 cursor-pointer active:translate-y-[2px]'
                  }`}
                >
                  {!summary.skillsAllowed && (
                    <Lock className="absolute top-1 right-1 w-2.5 h-2.5 text-white/40" strokeWidth={2.5} />
                  )}
                  <Icon className="w-4 h-4" strokeWidth={2.25} />
                  <span className="text-[10px] font-bold tracking-wide leading-none">{t(nameKey)}</span>
                  <span className="text-[8px] font-medium opacity-75 leading-tight text-center">
                    {t(descKey)}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Skip vote */}
          <button
            onClick={voteSkipBetween}
            disabled={skipVoted}
            className={`w-full py-2 rounded-xl font-bold text-[11px] tracking-widest transition-all border-2 ${
              skipVoted
                ? 'bg-emerald-400/20 border-emerald-300/50 text-emerald-200 cursor-default'
                : 'bg-white/10 border-white/25 text-white/85 hover:bg-white/20 active:translate-y-[1px] cursor-pointer'
            }`}
          >
            {skipVoted ? t('between.skipped') : t('between.skip')}
          </button>
        </div>
      </div>
    </div>
  );
}
