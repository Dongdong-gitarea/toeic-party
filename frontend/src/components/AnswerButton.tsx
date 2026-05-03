'use client';

const BASE_COLORS = [
  'bg-blue-600 hover:bg-blue-500 border-blue-500/50',
  'bg-emerald-600 hover:bg-emerald-500 border-emerald-500/50',
  'bg-amber-600 hover:bg-amber-500 border-amber-500/50',
  'bg-purple-600 hover:bg-purple-500 border-purple-500/50',
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
    'relative w-full p-4 sm:p-5 rounded-xl border-2 text-left font-bold text-lg sm:text-xl transition-all duration-150 cursor-pointer select-none ';

  if (correct === null) {
    classes += disabled
      ? 'opacity-50 cursor-not-allowed ' + BASE_COLORS[index]
      : BASE_COLORS[index];
  } else if (selected && correct) {
    classes += 'bg-green-500 border-green-300 scale-[1.03] ring-2 ring-green-300/60';
  } else if (selected && !correct) {
    classes += 'bg-red-500 border-red-300 animate-shake';
  } else if (isCorrectAnswer) {
    classes += 'bg-green-500/60 border-green-400';
  } else {
    classes += 'bg-slate-700/40 border-slate-600 opacity-30';
  }

  return (
    <button
      className={classes}
      onClick={onClick}
      disabled={disabled}
      style={fogged ? { filter: 'blur(8px)' } : undefined}
    >
      <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-black/25 text-sm font-black mr-3">
        {LABELS[index]}
      </span>
      {text}
    </button>
  );
}
