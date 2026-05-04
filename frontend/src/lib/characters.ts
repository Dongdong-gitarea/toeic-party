export interface Character {
  id: string;
  name: string;
  color: string;
  folder: string; // /characters/p1, p2, ...
}

export const CHARACTERS: Character[] = [
  { id: 'p1', name: 'Player', color: '#10B981', folder: '/characters/p1' },
  { id: 'p2', name: 'Female', color: '#3B82F6', folder: '/characters/p2' },
  { id: 'p3', name: 'Adventurer', color: '#F59E0B', folder: '/characters/p3' },
  { id: 'p4', name: 'Zombie', color: '#8B5CF6', folder: '/characters/p4' },
];

export type CharPose = 'idle' | 'jump' | 'walk1' | 'walk2' | 'fall' | 'cheer1' | 'hurt' | 'stand';

export function getCharacter(index: number): Character {
  return CHARACTERS[index % CHARACTERS.length]!;
}

export function getCharacterIndex(
  playerId: string,
  players: { playerId: string; charIdx?: number }[],
): number {
  const player = players.find((p) => p.playerId === playerId);
  if (player?.charIdx !== undefined) return player.charIdx % CHARACTERS.length;
  const idx = players.findIndex((p) => p.playerId === playerId);
  return idx >= 0 ? idx % CHARACTERS.length : 0;
}

export function spriteSrc(char: Character, pose: CharPose): string {
  return `${char.folder}/${pose}.png`;
}
