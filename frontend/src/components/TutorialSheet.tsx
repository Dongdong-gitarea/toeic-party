'use client';

import { useEffect, useState } from 'react';
import {
  GraduationCap,
  ChevronLeft,
  ChevronRight,
  X as XIcon,
  Crown,
  Flame,
  Waves,
  CloudFog,
  TimerOff,
  Check,
  Users,
  Brain,
} from 'lucide-react';
import { CHARACTERS } from '@/lib/characters';
import { useT } from '@/lib/i18n';

interface Props {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = 'tp_tutorial_seen';

export function hasSeenTutorial(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem(STORAGE_KEY) === '1';
}

export function markTutorialSeen() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, '1');
}

const STEPS_COUNT = 5;

export default function TutorialSheet({ open, onClose }: Props) {
  const t = useT();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) setStep(0);
  }, [open]);

  if (!open) return null;

  const close = () => {
    markTutorialSeen();
    onClose();
  };

  const prev = () => setStep((s) => Math.max(0, s - 1));
  const next = () => {
    if (step < STEPS_COUNT - 1) setStep((s) => s + 1);
    else close();
  };

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-md bg-gradient-to-b from-fuchsia-700/40 to-slate-900/80 backdrop-blur-md
          border-4 border-white/30 rounded-t-3xl sm:rounded-3xl p-5 sm:m-4 shadow-2xl animate-tilt-pop"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="inline-flex items-center gap-1.5 bg-amber-300 text-fuchsia-900 px-4 py-1.5 rounded-full font-black text-xs tracking-widest shadow-[0_4px_0_#92400e] -rotate-2">
            <GraduationCap className="w-4 h-4" strokeWidth={2.75} />
            {t('tutorial.title')}
          </div>
          <button
            onClick={close}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center cursor-pointer text-white/80"
            aria-label={t('tutorial.skip')}
          >
            <XIcon className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>

        {/* Step indicator dots */}
        <div className="flex justify-center gap-1.5 mb-3">
          {Array.from({ length: STEPS_COUNT }).map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step
                  ? 'w-6 bg-amber-300'
                  : i < step
                    ? 'w-1.5 bg-amber-300/60'
                    : 'w-1.5 bg-white/25'
              }`}
            />
          ))}
        </div>

        {/* Step content (mock screenshot + caption) */}
        <div className="bg-black/30 rounded-2xl p-4 mb-4 min-h-[260px] flex flex-col items-center justify-center">
          {step === 0 && <Step0 />}
          {step === 1 && <Step1 />}
          {step === 2 && <Step2 t={t} />}
          {step === 3 && <Step3 t={t} />}
          {step === 4 && <Step4 t={t} />}
        </div>

        {/* Caption */}
        <div className="text-center mb-4 min-h-[60px]">
          <h3 className="text-sm font-black text-white tracking-wide mb-1">
            {t(`tutorial.step${step}.title`)}
          </h3>
          <p className="text-xs text-white/75 leading-relaxed">
            {t(`tutorial.step${step}.desc`)}
          </p>
        </div>

        {/* Nav */}
        <div className="grid grid-cols-[auto_1fr] gap-2">
          <button
            onClick={prev}
            disabled={step === 0}
            className="px-4 py-2.5 rounded-2xl font-bold text-xs cursor-pointer
              bg-white/10 text-white border-4 border-white/20
              hover:bg-white/20 active:translate-y-[1px] transition-all
              disabled:opacity-30 disabled:cursor-not-allowed
              inline-flex items-center justify-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" strokeWidth={2.5} />
          </button>
          <button
            onClick={next}
            className="py-2.5 rounded-2xl font-black text-xs tracking-widest cursor-pointer
              bg-amber-300 text-fuchsia-900 border-4 border-amber-400
              shadow-[0_4px_0_rgba(120,53,15,0.5)]
              hover:bg-amber-200 active:translate-y-[2px] active:shadow-[0_2px_0_rgba(120,53,15,0.5)] transition-all
              inline-flex items-center justify-center gap-1.5"
          >
            {step < STEPS_COUNT - 1 ? (
              <>
                {t('tutorial.next')}
                <ChevronRight className="w-4 h-4" strokeWidth={3} />
              </>
            ) : (
              <>
                <Check className="w-4 h-4" strokeWidth={3} />
                {t('tutorial.start')}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Step illustrations ─────────────────────────────────────────────────
// Each is just real Tailwind HTML that mimics the actual screen so it
// stays in sync with the design without us shipping any PNG / GIF.

function Step0() {
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="text-center">
        <h2 className="text-3xl font-black tracking-tight">
          <span className="text-amber-300 drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">TOEIC</span>
          <br />
          <span className="text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">PARTY</span>
        </h2>
      </div>
      <div className="flex gap-1">
        {CHARACTERS.map((c, i) => (
          <div key={c.id}
            className="w-12 h-12 rounded-xl flex items-center justify-center p-1 border-2"
            style={{ backgroundColor: c.color + '40', borderColor: c.color }}>
            <img
              src={`${c.folder}/idle.png`}
              alt=""
              className="w-full h-full object-contain"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          </div>
        ))}
      </div>
      <div className="inline-flex items-center gap-1 text-[10px] font-bold text-white/70 tracking-widest mt-1">
        <Users className="w-3 h-3" strokeWidth={2.5} /> 4 PLAYERS · 10 Q · 10s EACH
      </div>
    </div>
  );
}

function Step1() {
  return (
    <div className="grid grid-cols-2 gap-1.5 w-44">
      {CHARACTERS.slice(0, 4).map((c, i) => {
        const isYou = i === 0;
        const isReady = i === 0 || i === 2;
        return (
          <div
            key={c.id}
            className={`relative rounded-xl border-2 p-1.5 text-center ${
              isYou
                ? 'border-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.5)]'
                : isReady
                  ? 'border-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.4)]'
                  : 'border-white/40'
            }`}
            style={{ background: `linear-gradient(135deg, ${c.color}55, ${c.color}10)` }}
          >
            {isYou && (
              <span className="absolute top-0.5 left-0.5 text-[7px] font-black bg-amber-300 text-fuchsia-900 px-1 py-0.5 rounded-full">
                YOU
              </span>
            )}
            <img src={`${c.folder}/idle.png`} alt="" className="w-8 h-8 mx-auto" />
            {isReady && (
              <span className="inline-flex items-center gap-0.5 mt-0.5 text-[7px] font-black bg-emerald-300 text-emerald-950 px-1 py-0.5 rounded-full">
                <Check className="w-2 h-2" strokeWidth={3} />
                READY
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Step2({ t }: { t: (k: string) => string }) {
  return (
    <div className="w-full max-w-[260px] flex flex-col gap-2">
      {/* Question card */}
      <div className="rounded-2xl border-2 border-white/30 bg-white/15 p-3 text-center">
        <div className="flex items-center justify-center gap-1 mb-1">
          <span className="inline-flex items-center gap-0.5 text-[7px] font-bold bg-cyan-300 text-cyan-950 px-1 py-0.5 rounded-full">
            <Brain className="w-2 h-2" strokeWidth={2.75} />
            VOCAB
          </span>
        </div>
        <p className="text-2xl font-black text-white">negotiate</p>
      </div>
      {/* Options */}
      <div className="grid grid-cols-2 gap-1">
        {[
          { label: 'A', text: '協商', cls: 'bg-cyan-300/95 text-cyan-950', highlight: true },
          { label: 'B', text: '忽視', cls: 'bg-white/85 text-slate-800' },
          { label: 'C', text: '航行', cls: 'bg-white/85 text-slate-800' },
          { label: 'D', text: '否定', cls: 'bg-white/85 text-slate-800' },
        ].map((o) => (
          <div
            key={o.label}
            className={`px-2 py-1.5 rounded-lg border-2 ${o.cls} ${
              o.highlight
                ? 'border-emerald-200 shadow-[0_0_12px_rgba(110,231,183,0.6)]'
                : 'border-white/40'
            } text-[11px] font-bold text-left flex items-center gap-1.5`}
          >
            <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-white/60 text-[8px] font-black">
              {o.label}
            </span>
            {o.text}
          </div>
        ))}
      </div>
      {/* Timer */}
      <div className="flex items-center justify-center gap-1 text-[10px] font-black text-rose-400">
        <span className="inline-flex w-5 h-5 items-center justify-center rounded-full bg-rose-500/30 border-2 border-rose-400 tabular-nums">
          3
        </span>
        <span className="tracking-widest">TIME</span>
      </div>
    </div>
  );
}

function Step3({ t }: { t: (k: string) => string }) {
  return (
    <div className="w-full max-w-[280px] flex flex-col gap-2.5">
      {/* Score row glowing */}
      <div className="rounded-2xl px-3 py-2 bg-orange-500/20 border-2 border-orange-300/60 shadow-[0_0_18px_rgba(251,146,60,0.4)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold text-white/80">SCORE</span>
          <span className="text-amber-300 font-black text-base tabular-nums">128</span>
          <span className="inline-flex items-center gap-0.5 font-black text-orange-300 text-sm">
            <Flame className="w-3 h-3" strokeWidth={2.75} fill="currentColor" />
            ×1.5
          </span>
        </div>
        <span className="inline-flex items-center gap-0.5 text-xs font-bold text-emerald-300">
          <Check className="w-3 h-3" strokeWidth={3} />
          +12
        </span>
      </div>
      {/* Skill bar */}
      <div className="grid grid-cols-3 gap-1.5">
        {[
          { Icon: Waves, name: 'SHAKE' },
          { Icon: CloudFog, name: 'FOG' },
          { Icon: TimerOff, name: 'CUT' },
        ].map((s) => (
          <div
            key={s.name}
            className="rounded-xl border-2 border-amber-300/60 bg-amber-300/15 px-1 py-1.5 flex flex-col items-center gap-0.5"
          >
            <s.Icon className="w-4 h-4 text-white" strokeWidth={2.25} />
            <span className="text-[8px] font-bold text-white tracking-wide">{s.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Step4({ t }: { t: (k: string) => string }) {
  return (
    <div className="w-full max-w-[260px] flex flex-col gap-1.5">
      {[
        { rank: 0, name: 'YOU', score: 248, char: 0 },
        { rank: 1, name: 'AI-Beta', score: 196, char: 1 },
        { rank: 2, name: 'AI-Alpha', score: 142, char: 2 },
        { rank: 3, name: 'AI-Gamma', score: 88, char: 3 },
      ].map((p) => {
        const c = CHARACTERS[p.char]!;
        const isMe = p.name === 'YOU';
        return (
          <div
            key={p.rank}
            className={`flex items-center gap-2 rounded-xl border-2 px-2 py-1.5 ${
              isMe ? 'border-amber-300 bg-white/15' : 'border-white/30 bg-white/5'
            }`}
          >
            <span className="w-5 inline-flex justify-center">
              {p.rank === 0 ? (
                <Crown className="w-4 h-4 text-amber-300" strokeWidth={2.5} fill="currentColor" />
              ) : (
                <span className="text-[10px] font-black text-white/60">{p.rank + 1}</span>
              )}
            </span>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center p-0.5 border-2 ${
                isMe ? 'ring-2 ring-amber-300/60' : ''
              }`}
              style={{ backgroundColor: c.color + '40', borderColor: c.color }}
            >
              <img src={`${c.folder}/idle.png`} alt="" className="w-full h-full object-contain" />
            </div>
            <span className={`flex-1 text-xs font-bold truncate ${isMe ? 'text-amber-200' : 'text-white'}`}>
              {p.name}
            </span>
            <span className="text-amber-300 font-black text-sm tabular-nums">{p.score}</span>
          </div>
        );
      })}
    </div>
  );
}
