'use client';

import { useT } from '@/lib/i18n';

interface Props {
  pos?: string;
  className?: string;
}

const KNOWN = new Set(['noun', 'verb', 'adj', 'adv']);

export default function PosBadge({ pos, className = '' }: Props) {
  const t = useT();
  if (!pos) return null;
  const slug = pos.toLowerCase().trim();
  const label = KNOWN.has(slug) ? t(`pos.${slug}`) : slug;
  return (
    <span
      className={`inline-block text-[9px] font-black tracking-widest uppercase
        bg-cyan-300/20 text-cyan-200 border border-cyan-300/40
        px-1.5 py-0.5 rounded-md ${className}`}
    >
      {label}
    </span>
  );
}
