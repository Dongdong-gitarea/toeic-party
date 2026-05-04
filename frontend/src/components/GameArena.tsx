'use client';

import { useEffect, useRef, useState } from 'react';
import type { Character, CharPose } from '@/lib/characters';
import { spriteSrc } from '@/lib/characters';
import { sounds } from '@/lib/sounds';

// ── Logical pixel space (scaled to fit container) ──
const W = 800;
const H = 360;
const CHAR = 52;
const PW = 155;
const PH = 58;
const GRAV = 0.55;
const JUMP_V = -14;
const SPD = 6;
const FLOOR = H - 32;

const LABELS = ['A', 'B', 'C', 'D'];
const PCOLORS = [
  { bg: '#3B82F6', top: '#60A5FA', dark: '#2563EB' },
  { bg: '#10B981', top: '#34D399', dark: '#059669' },
  { bg: '#F59E0B', top: '#FBBF24', dark: '#D97706' },
  { bg: '#8B5CF6', top: '#A78BFA', dark: '#7C3AED' },
];

// ── 6 platform layouts — shuffled per question ──
const LAYOUTS = [
  // Row
  [{ x: 25, y: 210 }, { x: 200, y: 210 }, { x: 400, y: 210 }, { x: 600, y: 210 }],
  // Staircase up
  [{ x: 20, y: 270 }, { x: 200, y: 235 }, { x: 400, y: 200 }, { x: 590, y: 175 }],
  // Staircase down
  [{ x: 20, y: 175 }, { x: 200, y: 200 }, { x: 400, y: 235 }, { x: 590, y: 270 }],
  // Diamond
  [{ x: 310, y: 175 }, { x: 30, y: 230 }, { x: 590, y: 230 }, { x: 310, y: 270 }],
  // Scattered
  [{ x: 40, y: 190 }, { x: 430, y: 180 }, { x: 200, y: 265 }, { x: 590, y: 255 }],
  // V shape
  [{ x: 25, y: 185 }, { x: 210, y: 260 }, { x: 410, y: 260 }, { x: 595, y: 185 }],
];

function pickLayout(): { x: number; y: number }[] {
  return LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)]!;
}

const CX0 = W / 2 - CHAR / 2;
const CY0 = FLOOR - CHAR;

interface Props {
  options: string[];
  onAnswer: (index: number) => void;
  locked: boolean;
  character: Character;
  selected: number | null;
  correctIndex: number | null;
  questionId: string;
}

export default function GameArena({
  options, onAnswer, locked, character, selected, correctIndex, questionId,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.8);
  const [cx, setCx] = useState(CX0);
  const [cy, setCy] = useState(CY0);
  const [face, setFace] = useState(1);
  const [pose, setPose] = useState<CharPose>('idle');
  const [wf, setWf] = useState(0);
  const [standingOn, setStandingOn] = useState(-1); // which platform (-1 = none)
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [layout, setLayout] = useState(LAYOUTS[0]!);
  const [attacking, setAttacking] = useState(false);

  const pos = useRef({ x: CX0, y: CY0 });
  const vel = useRef({ x: 0, y: 0 });
  const onFloor = useRef(true);
  const keys = useRef(new Set<string>());
  const done = useRef(false);
  const cbRef = useRef(onAnswer);
  cbRef.current = onAnswer;
  const lockedRef = useRef(locked);
  lockedRef.current = locked;
  const fc = useRef(0);
  const pid = useRef(0);
  const standRef = useRef(-1);
  const attackCooldown = useRef(false);

  // Measure container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setScale(el.clientWidth / W);
    update();
    const obs = new ResizeObserver(update);
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  // Reset on new question + pick layout
  useEffect(() => {
    pos.current = { x: CX0, y: CY0 };
    vel.current = { x: 0, y: 0 };
    onFloor.current = true;
    done.current = false;
    standRef.current = -1;
    attackCooldown.current = false;
    fc.current = 0;
    setCx(CX0);
    setCy(CY0);
    setPose('idle');
    setStandingOn(-1);
    setParticles([]);
    setAttacking(false);
    setLayout(pickLayout());
  }, [questionId]);

  // Keyboard
  useEffect(() => {
    const d = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' ', 'w', 'a', 's', 'd', 'x', 'z', 'j', 'Enter'].includes(e.key))
        e.preventDefault();
      keys.current.add(e.key);

      // Attack key
      if (['x', 'z', 'j', 'Enter'].includes(e.key) && !done.current && !lockedRef.current && !attackCooldown.current) {
        if (standRef.current >= 0) {
          attackCooldown.current = true;
          done.current = true;
          setAttacking(true);
          // Brief attack pose then submit
          setTimeout(() => {
            setAttacking(false);
            const idx = standRef.current;
            // Particles
            const pl = LAYOUTS.flat()[0]; // just for safety
            const currentLayout = layout;
            if (currentLayout[idx]) {
              const px = currentLayout[idx]!.x + PW / 2;
              const py = currentLayout[idx]!.y;
              const newP = Array.from({ length: 10 }, (_, i) => ({
                id: ++pid.current,
                x: px + Math.random() * 60 - 30,
                y: py + Math.random() * 15 - 5,
              }));
              setParticles(newP);
              setTimeout(() => setParticles([]), 600);
            }
            sounds.correct();
            cbRef.current(idx);
          }, 200);
        }
      }
    };
    const u = (e: KeyboardEvent) => keys.current.delete(e.key);
    window.addEventListener('keydown', d);
    window.addEventListener('keyup', u);
    return () => { window.removeEventListener('keydown', d); window.removeEventListener('keyup', u); };
  }, [layout]); // eslint-disable-line

  // Game loop
  useEffect(() => {
    let raf: number;
    let active = true;
    const tick = () => {
      if (!active) return;
      fc.current++;

      if (!done.current) {
        const k = keys.current;
        const p = pos.current;
        const v = vel.current;

        let mx = 0;
        if (k.has('ArrowLeft') || k.has('a')) { mx = -1; setFace(-1); }
        if (k.has('ArrowRight') || k.has('d')) { mx = 1; setFace(1); }

        if ((k.has('ArrowUp') || k.has('w') || k.has(' ')) && onFloor.current) {
          v.y = JUMP_V;
          onFloor.current = false;
          sounds.tick();
        }

        v.y += GRAV;
        p.x += mx * SPD;
        p.y += v.y;
        if (p.x < 0) p.x = 0;
        if (p.x > W - CHAR) p.x = W - CHAR;

        // Floor
        if (p.y >= FLOOR - CHAR) {
          p.y = FLOOR - CHAR;
          v.y = 0;
          onFloor.current = true;
        }

        // Platform collision (one-way, land only)
        let currentStand = -1;
        if (v.y >= 0) {
          for (let i = 0; i < layout.length; i++) {
            const pl = layout[i]!;
            const bot = p.y + CHAR;
            if (p.x + CHAR > pl.x + 4 && p.x < pl.x + PW - 4 && bot >= pl.y && bot <= pl.y + 22) {
              p.y = pl.y - CHAR;
              v.y = 0;
              onFloor.current = true;
              currentStand = i;
              break;
            }
          }
        }
        // Also check if still standing on a platform
        if (onFloor.current && currentStand === -1) {
          for (let i = 0; i < layout.length; i++) {
            const pl = layout[i]!;
            const bot = p.y + CHAR;
            if (p.x + CHAR > pl.x + 4 && p.x < pl.x + PW - 4 && Math.abs(bot - pl.y) < 3) {
              currentStand = i;
              break;
            }
          }
        }
        standRef.current = currentStand;
        setStandingOn(currentStand);

        // Pose
        if (attacking) setPose('stand'); // attack pose
        else if (!onFloor.current && v.y < 0) setPose('jump');
        else if (!onFloor.current && v.y > 0) setPose('fall');
        else if (mx !== 0) {
          if (fc.current % 8 === 0) setWf((f) => (f + 1) % 2);
          setPose(wf === 0 ? 'walk1' : 'walk2');
        } else setPose('idle');

        setCx(p.x);
        setCy(p.y);
      } else {
        // After answering
        if (correctIndex !== null) {
          setPose(selected !== null && selected === correctIndex ? 'cheer1' : 'hurt');
        } else {
          setPose('stand');
        }
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { active = false; cancelAnimationFrame(raf); };
  }, [questionId, correctIndex, selected, layout, attacking]); // eslint-disable-line

  const revealed = correctIndex !== null;

  return (
    <div ref={containerRef} className="w-full max-w-2xl mx-auto">
      <div style={{ height: H * scale, overflow: 'hidden', borderRadius: 16 }}>
        <div style={{
          width: W, height: H, position: 'relative',
          transform: `scale(${scale})`, transformOrigin: 'top left',
          borderRadius: 16, overflow: 'hidden',
          border: '2px solid rgba(99,102,241,0.15)',
        }}>
          {/* Sky */}
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(180deg, #0F172A 0%, #1E293B 35%, #334155 65%, #475569 100%)',
          }} />

          {/* Stars */}
          {[[65,25,2],[170,40,1.5],[310,18,2.5],[450,35,1.5],[580,22,2],
            [710,45,1.5],[120,55,1],[400,50,1],[530,15,2],[750,30,1.5]
          ].map(([x,y,s], i) => (
            <div key={i} style={{
              position: 'absolute', left: x, top: y,
              width: s, height: s, borderRadius: '50%',
              background: 'white', opacity: 0.25 + (i % 3) * 0.15,
            }} />
          ))}

          {/* Mountains */}
          <svg viewBox="0 0 800 60" style={{ position: 'absolute', left: 0, right: 0, top: FLOOR - 70, height: 60 }}>
            <path d="M0 60 L0 35 Q100 5 200 30 Q300 10 400 28 Q500 2 600 25 Q700 12 800 30 L800 60Z" fill="#1E293B" opacity="0.6" />
            <path d="M0 60 L0 45 Q80 20 180 40 Q280 22 380 38 Q480 15 580 35 Q680 24 800 40 L800 60Z" fill="#1E293B" opacity="0.8" />
          </svg>

          {/* Ground */}
          <div style={{ position: 'absolute', left: 0, right: 0, top: FLOOR, bottom: 0 }}>
            <div style={{ height: 4, background: '#22C55E' }} />
            <div style={{ height: '100%', background: 'linear-gradient(180deg, #854D0E, #422006)' }} />
          </div>

          {/* Grass */}
          {[40, 150, 280, 420, 540, 660, 750].map((x, i) => (
            <div key={i} style={{
              position: 'absolute', left: x, top: FLOOR - 8,
              width: 0, height: 0,
              borderLeft: '4px solid transparent', borderRight: '4px solid transparent',
              borderBottom: '8px solid #16A34A', opacity: 0.5,
            }} />
          ))}

          {/* ── PLATFORMS ── */}
          {layout.map((pl, i) => {
            const c = PCOLORS[i]!;
            let bg = c.bg, top = c.top, dk = c.dark;
            let glow = `0 6px 20px ${bg}40`;
            let shake = false;
            const isStandingHere = standingOn === i && !done.current;

            if (revealed) {
              if (i === correctIndex) {
                bg = '#22C55E'; top = '#4ADE80'; dk = '#15803D';
                glow = '0 0 28px rgba(34,197,94,0.7)';
              } else if (i === selected) {
                bg = '#EF4444'; top = '#F87171'; dk = '#B91C1C';
                glow = '0 0 28px rgba(239,68,68,0.6)';
                shake = true;
              } else {
                bg = '#334155'; top = '#475569'; dk = '#1E293B';
                glow = 'none';
              }
            } else if (isStandingHere) {
              glow = `0 0 20px ${c.bg}80, 0 0 40px ${c.bg}40`;
            }

            return (
              <div
                key={i}
                className={shake ? 'animate-shake' : ''}
                style={{
                  position: 'absolute', left: pl.x, top: pl.y,
                  width: PW, height: PH,
                  borderRadius: 14,
                  background: bg,
                  borderTop: `4px solid ${top}`,
                  borderBottom: `4px solid ${dk}`,
                  boxShadow: glow,
                  display: 'flex', alignItems: 'center',
                  padding: '0 10px', gap: 8,
                  transition: 'box-shadow 0.15s',
                  transform: isStandingHere ? 'scale(1.03)' : 'scale(1)',
                }}
              >
                <span style={{
                  background: dk, borderRadius: 6,
                  width: 28, height: 28, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 900, color: 'white',
                }}>
                  {LABELS[i]}
                </span>
                <span style={{
                  flex: 1, fontSize: 16, fontWeight: 700, color: 'white',
                  overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                }}>
                  {options[i] ?? '—'}
                </span>
                {/* "Attack" hint when standing here */}
                {isStandingHere && !locked && (
                  <span style={{
                    position: 'absolute', top: -24, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 11, fontWeight: 700, color: '#FBBF24',
                    whiteSpace: 'nowrap', textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                  }}>
                    ATTACK!
                  </span>
                )}
              </div>
            );
          })}

          {/* Particles */}
          {particles.map((p) => (
            <div
              key={p.id}
              className="animate-float-up"
              style={{
                position: 'absolute', left: p.x, top: p.y,
                width: 6, height: 6, borderRadius: '50%',
                background: '#FBBF24', boxShadow: '0 0 6px #FBBF24',
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* Character */}
          <div style={{
            position: 'absolute', left: cx, top: cy,
            width: CHAR, height: CHAR,
            transform: `scaleX(${face})`,
            zIndex: 10, pointerEvents: 'none',
          }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={spriteSrc(character, attacking ? 'stand' : pose)}
              alt={character.name}
              style={{
                width: '100%', height: '100%', objectFit: 'contain',
                filter: 'drop-shadow(0 3px 6px rgba(0,0,0,0.5))',
              }}
              draggable={false}
            />
          </div>
        </div>
      </div>

      {/* Touch / keyboard controls */}
      <div className="flex justify-between items-center mt-2 px-1 select-none">
        {/* D-pad left */}
        <div className="flex items-center gap-2">
          <button
            className="w-16 h-16 rounded-2xl bg-slate-800/90 border-2 border-slate-600 flex items-center justify-center text-2xl text-white active:bg-slate-600 active:scale-90 touch-none"
            onPointerDown={() => keys.current.add('ArrowLeft')}
            onPointerUp={() => keys.current.delete('ArrowLeft')}
            onPointerLeave={() => keys.current.delete('ArrowLeft')}
          >
            ◀
          </button>
          <button
            className="w-16 h-16 rounded-2xl bg-slate-800/90 border-2 border-slate-600 flex items-center justify-center text-2xl text-white active:bg-slate-600 active:scale-90 touch-none"
            onPointerDown={() => keys.current.add('ArrowRight')}
            onPointerUp={() => keys.current.delete('ArrowRight')}
            onPointerLeave={() => keys.current.delete('ArrowRight')}
          >
            ▶
          </button>
        </div>

        {/* Action buttons right */}
        <div className="flex items-center gap-3">
          <button
            className="w-16 h-16 rounded-full bg-blue-600/90 border-2 border-blue-400 flex items-center justify-center text-[11px] font-black text-white active:bg-blue-500 active:scale-90 touch-none shadow-[0_0_12px_rgba(59,130,246,0.3)]"
            onPointerDown={() => keys.current.add('ArrowUp')}
            onPointerUp={() => keys.current.delete('ArrowUp')}
            onPointerLeave={() => keys.current.delete('ArrowUp')}
          >
            JUMP
          </button>
          <button
            className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-[11px] font-black text-white active:scale-90 touch-none ${
              standingOn >= 0 && !done.current
                ? 'bg-yellow-500/90 border-yellow-300 shadow-[0_0_16px_rgba(234,179,8,0.5)] animate-combo-fire'
                : 'bg-yellow-600/50 border-yellow-600/40'
            }`}
            onPointerDown={() => {
              if (!done.current && !lockedRef.current && standRef.current >= 0 && !attackCooldown.current) {
                attackCooldown.current = true;
                done.current = true;
                setAttacking(true);
                setTimeout(() => {
                  setAttacking(false);
                  const idx = standRef.current;
                  if (layout[idx]) {
                    const px = layout[idx]!.x + PW / 2;
                    const py = layout[idx]!.y;
                    setParticles(Array.from({ length: 10 }, (_, i) => ({
                      id: ++pid.current,
                      x: px + Math.random() * 60 - 30,
                      y: py + Math.random() * 15 - 5,
                    })));
                    setTimeout(() => setParticles([]), 600);
                  }
                  sounds.correct();
                  cbRef.current(idx);
                }, 200);
              }
            }}
          >
            ATK
          </button>
        </div>
      </div>
    </div>
  );
}
