'use client';

import { useT } from '@/lib/i18n';

interface Props {
  word: string;
  example?: string;
  exampleZh?: string;
}

// Wrap occurrences of the headword (case-insensitive) in <mark>.
function highlight(sentence: string, word: string) {
  if (!word) return sentence;
  const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = sentence.split(new RegExp(`(${escaped})`, 'gi'));
  return parts.map((part, i) =>
    part.toLowerCase() === word.toLowerCase() ? (
      <mark
        key={i}
        className="bg-amber-300/40 text-amber-100 font-black rounded px-0.5"
      >
        {part}
      </mark>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function ExampleBlock({ word, example, exampleZh }: Props) {
  const t = useT();
  if (!example) return null;
  return (
    <div className="mt-2 px-2.5 py-2 rounded-xl bg-black/20 border border-white/10">
      <div className="text-[8px] font-black tracking-[0.2em] text-amber-200/80 mb-0.5">
        {t('vocab.example')}
      </div>
      <p className="text-xs text-white/90 leading-snug">
        {highlight(example, word)}
      </p>
      {exampleZh && (
        <p className="mt-0.5 text-[11px] text-white/60 leading-snug">
          {exampleZh}
        </p>
      )}
    </div>
  );
}
