'use client';

import { useEffect } from 'react';
import { useGameStore, type Phase } from '@/store/gameStore';
import { music, type Track } from '@/lib/music';

const PHASE_TRACK: Record<Phase, Track> = {
  idle: 'lobby',
  matchmaking: 'lobby',
  found: 'lobby',
  countdown: 'game',
  playing: 'game',
  result: 'result',
};

// Mounted once at the root; subscribes to phase changes and crossfades
// the background loop to match. Also unlocks autoplay on the first
// pointer/key event (browsers block <audio>.play() until user gesture).
export default function MusicSync() {
  const phase = useGameStore((s) => s.phase);

  useEffect(() => {
    music.init();

    const unlock = () => {
      music.unlock(PHASE_TRACK[useGameStore.getState().phase]);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('pointerdown', unlock, { once: true });
    window.addEventListener('keydown', unlock, { once: true });

    const onHide = () => {
      if (document.hidden) music.stop();
    };
    document.addEventListener('visibilitychange', onHide);

    return () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, []);

  useEffect(() => {
    music.play(PHASE_TRACK[phase]);
  }, [phase]);

  return null;
}
