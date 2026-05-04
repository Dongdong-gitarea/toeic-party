'use client';

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

const MEDALS = ['1st', '2nd', '3rd', '4th'];

export default function RankingPanel({
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
    <div className="bg-slate-800/80 backdrop-blur rounded-xl p-4 border border-slate-700/50">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
        Live Ranking
      </h3>
      <div className="space-y-2">
        {rankings.map((entry, i) => {
          const isMe = entry.playerId === myPlayerId;
          const charIdx = getCharacterIndex(entry.playerId, players);
          const char = getCharacter(charIdx);

          return (
            <div
              key={entry.playerId}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-500 ${
                isMe
                  ? 'bg-indigo-500/20 border border-indigo-500/30'
                  : 'bg-slate-700/30'
              }`}
            >
              <img src={`${char.folder}/idle.png`} alt={char.name} className="w-7 h-7 object-contain shrink-0" />
              <span className="text-[10px] font-bold text-slate-500 w-6 shrink-0">
                {MEDALS[i]}
              </span>
              <span className="flex-1 text-sm font-medium truncate">
                {entry.name}
                {isMe && (
                  <span className="ml-1 text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded-full">
                    YOU
                  </span>
                )}
              </span>
              <span className="text-sm font-bold tabular-nums">{entry.score}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
