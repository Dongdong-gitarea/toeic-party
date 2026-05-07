'use client';

import { Crown } from 'lucide-react';
import { getCharacterIndex, getCharacter } from '@/lib/characters';

interface RankEntry {
  playerId: string;
  name: string;
  score: number;
  isAI: boolean;
}

interface PlayerInfo {
  playerId: string;
  name: string;
  isAI: boolean;
}

type RoundStatus = 'pending' | 'correct' | 'wrong';

// Per-status row chrome. `pending` keeps the existing default + my-row
// highlight; correct / wrong override with a coloured tint + border.
function statusClasses(status: RoundStatus, isMe: boolean): string {
  if (status === 'correct') {
    return 'bg-emerald-500/25 border border-emerald-400/60';
  }
  if (status === 'wrong') {
    return 'bg-rose-500/25 border border-rose-400/60';
  }
  return isMe
    ? 'bg-indigo-500/25 border border-indigo-500/30'
    : 'bg-slate-800/50 border border-transparent';
}

export default function RankingBar({
  rankings,
  myPlayerId,
  players = [],
  statuses = {},
}: {
  rankings: RankEntry[];
  myPlayerId: string | null;
  players?: PlayerInfo[];
  statuses?: Record<string, RoundStatus>;
}) {
  if (rankings.length === 0) return null;

  return (
    <div className="flex gap-1 w-full">
      {rankings.map((entry, i) => {
        const isMe = entry.playerId === myPlayerId;
        const charIdx = getCharacterIndex(entry.playerId, players);
        const char = getCharacter(charIdx);
        const medals = ['#FFD700', '#C0C0C0', '#CD7F32', '#6B7280'];
        const status: RoundStatus = statuses[entry.playerId] ?? 'pending';

        return (
          <div
            key={entry.playerId}
            className={`flex-1 flex items-center gap-1 px-1.5 py-1.5 rounded-lg transition-colors duration-300 min-w-0 ${statusClasses(status, isMe)}`}
          >
            <span
              className="shrink-0 w-3 text-center inline-flex items-center justify-center"
              style={{ color: medals[i] }}
            >
              {i === 0 ? (
                <Crown className="w-3 h-3" strokeWidth={2.75} fill="currentColor" />
              ) : (
                <span className="text-[10px] font-black">{i + 1}</span>
              )}
            </span>
            <div
              className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                isMe ? 'ring-2 ring-amber-300 ring-offset-1 ring-offset-slate-900' : ''
              }`}
            >
              <img
                src={`${char.folder}/idle.png`}
                alt={char.name}
                className="w-5 h-5 object-contain"
              />
            </div>
            <span className="text-[10px] font-medium truncate flex-1 min-w-0">
              {isMe ? 'You' : entry.name}
            </span>
            <span className="text-xs font-bold tabular-nums shrink-0">
              {entry.score}
            </span>
          </div>
        );
      })}
    </div>
  );
}
