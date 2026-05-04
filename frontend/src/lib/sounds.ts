let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType = 'sine',
  vol = 0.15,
  delay = 0,
) {
  const c = getCtx();
  const t = c.currentTime + delay;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain).connect(c.destination);
  osc.start(t);
  osc.stop(t + dur);
}

export const sounds = {
  correct() {
    tone(523, 0.1);            // C5
    tone(659, 0.15, 'sine', 0.15, 0.08); // E5
  },

  wrong() {
    tone(200, 0.25, 'sawtooth', 0.08);
    tone(150, 0.3, 'sawtooth', 0.06, 0.1);
  },

  combo() {
    tone(523, 0.08, 'sine', 0.12);
    tone(659, 0.08, 'sine', 0.12, 0.06);
    tone(784, 0.1, 'sine', 0.14, 0.12);
    tone(1047, 0.2, 'sine', 0.16, 0.18);
  },

  tick() {
    tone(800, 0.04, 'square', 0.04);
  },

  gameStart() {
    tone(392, 0.15, 'sine', 0.12);        // G4
    tone(523, 0.15, 'sine', 0.14, 0.15);  // C5
    tone(659, 0.2, 'sine', 0.16, 0.3);    // E5
  },

  gameEnd() {
    tone(523, 0.15, 'sine', 0.12);
    tone(659, 0.15, 'sine', 0.12, 0.15);
    tone(784, 0.15, 'sine', 0.14, 0.3);
    tone(1047, 0.35, 'sine', 0.16, 0.45);
  },

  skillReceived() {
    tone(300, 0.08, 'sawtooth', 0.07);
    tone(450, 0.08, 'sawtooth', 0.07, 0.06);
    tone(300, 0.08, 'sawtooth', 0.07, 0.12);
  },

  rankUp() {
    tone(440, 0.1, 'sine', 0.12);
    tone(554, 0.1, 'sine', 0.14, 0.08);
    tone(659, 0.15, 'sine', 0.16, 0.16);
  },
};
