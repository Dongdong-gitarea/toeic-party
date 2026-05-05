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

export default function RankingBar({
  rankings,
  myPlayerId,
  players = [],
}: {
  rankings: RankEntry[];
  myPlayerId: string | null;
  players?: PlayerInfo[];
}) {
  if (rankings.length === 0) return null;

  return (
    <div className="flex gap-1 w-full">
      {rankings.map((entry, i) => {
        const isMe = entry.playerId === myPlayerId;
        const charIdx = getCharacterIndex(entry.playerId, players);
        const char = getCharacter(charIdx);
        const medals = ['#FFD700', '#C0C0C0', '#CD7F32', '#6B7280'];

        return (
          <div
            key={entry.playerId}
            className={`flex-1 flex items-center gap-1 px-1.5 py-1.5 rounded-lg transition-all duration-500 min-w-0 ${
              isMe
                ? 'bg-indigo-500/25 border border-indigo-500/30'
                : 'bg-slate-800/50'
            }`}
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
            <img
              src={`${char.folder}/idle.png`}
              alt={char.name}
              className="w-5 h-5 object-contain shrink-0"
            />
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
