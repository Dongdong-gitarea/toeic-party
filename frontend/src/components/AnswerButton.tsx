'use client';

const BASE_COLORS = [
  'bg-cyan-400 text-cyan-950 border-cyan-200 shadow-[0_5px_0_rgba(8,51,68,0.6)]',
  'bg-emerald-400 text-emerald-950 border-emerald-200 shadow-[0_5px_0_rgba(6,78,59,0.6)]',
  'bg-amber-300 text-amber-950 border-amber-100 shadow-[0_5px_0_rgba(120,53,15,0.6)]',
  'bg-fuchsia-400 text-fuchsia-950 border-fuchsia-200 shadow-[0_5px_0_rgba(112,26,117,0.6)]',
];

const LABELS = ['A', 'B', 'C', 'D'];

interface Props {
  index: number;
  text: string;
  disabled: boolean;
  selected: boolean;
  correct: boolean | null;
  isCorrectAnswer: boolean;
  fogged: boolean;
  onClick: () => void;
}

export default function AnswerButton({
  index,
  text,
  disabled,
  selected,
  correct,
  isCorrectAnswer,
  fogged,
  onClick,
}: Props) {
  let classes =
    'relative w-full min-h-[56px] px-3 py-3 sm:p-4 rounded-2xl border-4 text-left font-black text-base sm:text-lg transition-all duration-150 cursor-pointer select-none active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.4)] ';

  if (correct === null) {
    classes += disabled
      ? 'opacity-50 cursor-not-allowed ' + BASE_COLORS[index]
      : BASE_COLORS[index];
  } else if (selected && correct) {
    classes += 'bg-emerald-300 text-emerald-950 border-emerald-100 scale-[1.04] shadow-[0_0_28px_rgba(110,231,183,0.7)]';
  } else if (selected && !correct) {
    classes += 'bg-rose-400 text-rose-950 border-rose-200 animate-shake';
  } else if (isCorrectAnswer) {
    classes += 'bg-emerald-300/80 text-emerald-950 border-emerald-200';
  } else {
    classes += 'bg-white/10 text-white/40 border-white/20 opacity-40';
  }

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      style={fogged ? { filter: 'blur(8px)' } : undefined}
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-black/20 text-sm font-black mr-2.5 shrink-0">
        {LABELS[index]}
      </span>
      {text}
    </button>
  );
}
