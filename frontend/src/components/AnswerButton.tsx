'use client';

// Subtle accent colors used only on the A/B/C/D badge so the actual
// answer text stays on a calm, uniform surface.
const LABEL_COLORS = [
  'bg-cyan-300 text-cyan-950',
  'bg-emerald-300 text-emerald-950',
  'bg-amber-300 text-amber-950',
  'bg-fuchsia-300 text-fuchsia-950',
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
  // During the review phase (someone has been marked right or the
  // correct answer is highlighted), shrink each button so the
  // question card's definition reveal can pull the eye instead.
  const isReview = correct !== null || isCorrectAnswer;
  const sizeClasses = isReview
    ? 'min-h-[48px] px-3 py-2 sm:py-2.5 text-sm sm:text-base'
    : 'min-h-[60px] px-3 py-3 sm:p-4 text-base sm:text-lg';

  let cardClasses =
    `relative w-full ${sizeClasses} rounded-2xl border-4 text-left font-semibold leading-snug transition-all duration-150 cursor-pointer select-none active:translate-y-[3px] active:shadow-[0_2px_0_rgba(0,0,0,0.4)] flex items-center gap-3 `;

  let textColor = 'text-white';
  let labelClass = LABEL_COLORS[index] ?? LABEL_COLORS[0]!;

  if (correct === null) {
    // Idle / not yet answered — uniform calm card with subtle colored accent
    cardClasses +=
      (disabled ? 'opacity-50 cursor-not-allowed ' : '') +
      'bg-slate-900/55 border-white/25 hover:bg-slate-900/75 backdrop-blur-sm shadow-[0_4px_0_rgba(0,0,0,0.35)]';
  } else if (selected && correct) {
    cardClasses +=
      'bg-emerald-300 border-emerald-100 scale-[1.03] shadow-[0_0_28px_rgba(110,231,183,0.7)]';
    textColor = 'text-emerald-950';
    labelClass = 'bg-white text-emerald-700';
  } else if (selected && !correct) {
    cardClasses += 'bg-rose-400 border-rose-200 animate-shake';
    textColor = 'text-rose-950';
    labelClass = 'bg-white text-rose-700';
  } else if (isCorrectAnswer) {
    cardClasses += 'bg-emerald-300/85 border-emerald-200';
    textColor = 'text-emerald-950';
    labelClass = 'bg-white text-emerald-700';
  } else {
    cardClasses += 'bg-slate-900/35 border-white/15 opacity-50';
  }

  return (
    <button
      className={cardClasses}
      onClick={onClick}
      disabled={disabled}
      style={fogged ? { filter: 'blur(8px)' } : undefined}
    >
      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black shrink-0 ${labelClass}`}>
        {LABELS[index]}
      </span>
      <span className={`flex-1 ${textColor}`}>{text}</span>
    </button>
  );
}
