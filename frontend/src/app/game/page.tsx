'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Volume2,
  Brain,
  Headphones,
  Ear,
  AudioLines,
  FileText,
  AlertTriangle,
  Puzzle,
  Pencil,
  ArrowLeftRight,
  Flame,
  Waves,
  CloudFog,
  TimerOff,
  Check,
  X as XIcon,
  ChevronUp,
  ChevronDown,
  type LucideIcon,
} from 'lucide-react';
import { useGameStore, type SkillType } from '@/store/gameStore';
import { getCharacter, getCharacterIndex } from '@/lib/characters';
import { speakWord, speakClozePair } from '@/lib/speak';
import { useT } from '@/lib/i18n';
import Timer from '@/components/Timer';
import AnswerButton from '@/components/AnswerButton';
import GameArena from '@/components/GameArena';
import RankingBar from '@/components/RankingBar';
import ScorePopup from '@/components/ScorePopup';
import SkillBar from '@/components/SkillBar';

function useCountUp(target: number, duration = 500) {
  const [display, setDisplay] = useState(target);
  const prevRef = useRef(target);
  useEffect(() => {
    const from = prevRef.current;
    const diff = target - from;
    if (diff === 0) return;
    prevRef.current = target;
    const start = Date.now();
    const interval = setInterval(() => {
      const t = Math.min((Date.now() - start) / duration, 1);
      setDisplay(Math.round(from + (target - from) * (1 - Math.pow(1 - t, 3))));
      if (t >= 1) clearInterval(interval);
    }, 16);
    return () => clearInterval(interval);
  }, [target, duration]);
  return display;
}

export default function GamePage() {
  const router = useRouter();
  const {
    phase, gameMode, playerId, currentQuestion,
    questionNumber, totalQuestions, selectedAnswer, lastResult,
    rankings, myScore, myCombo, myUsedSkills,
    countdownValue, submitAnswer, useSkill, overtakeMsg,
    players, activeEffect, answeredCount, totalCount, roundStatuses,
  } = useGameStore();

  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const [hitShake, setHitShake] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const displayScore = useCountUp(myScore);
  const [showFinalIntro, setShowFinalIntro] = useState(false);
  const [showComboFlash, setShowComboFlash] = useState(false);
  const t = useT();

  // Final round entrance
  useEffect(() => {
    if (currentQuestion?.isFinal && questionNumber === totalQuestions) {
      setShowFinalIntro(true);
      const t = setTimeout(() => setShowFinalIntro(false), 1800);
      return () => clearTimeout(t);
    }
  }, [currentQuestion?.isFinal, questionNumber, totalQuestions]);

  const myCharIdx = playerId ? getCharacterIndex(playerId, players) : 0;
  const myChar = getCharacter(myCharIdx);

  // Navigation
  useEffect(() => {
    if (phase === 'idle' || phase === 'matchmaking') router.replace('/');
    if (phase === 'result') router.push('/result');
  }, [phase, router]);

  // Screen flash + shake
  useEffect(() => {
    if (!lastResult) return;
    setFlashType(lastResult.correct ? 'correct' : 'wrong');
    if (!lastResult.correct) setHitShake(true);
    const t1 = setTimeout(() => setFlashType(null), 400);
    const t2 = setTimeout(() => setHitShake(false), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [lastResult]);

  // Mega-combo fullscreen flash — fires once each time combo lands at >= 7
  useEffect(() => {
    if (!lastResult?.correct) return;
    if (lastResult.combo >= 7) {
      setShowComboFlash(true);
      const t = setTimeout(() => setShowComboFlash(false), 800);
      return () => clearTimeout(t);
    }
  }, [lastResult]);

  // When the answer reveal kicks in, make sure the definition block is
  // actually visible — fillblank prompts can be long and on small
  // viewports the reveal would otherwise sit below the fold.
  const revealRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!lastResult) return;
    const id = setTimeout(() => {
      revealRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 80); // small delay so the DOM has time to render the new block
    return () => clearTimeout(id);
  }, [lastResult]);

  // Auto-play audio prompts once per question (audio + listen + audiocloze types)
  const spokenRef = useRef('');
  useEffect(() => {
    if (!currentQuestion?.audioWord) return;
    if (spokenRef.current === currentQuestion.id) return;
    if (currentQuestion.type === 'audio' || currentQuestion.type === 'listen') {
      spokenRef.current = currentQuestion.id;
      const t = setTimeout(() => { void speakWord(currentQuestion.audioWord!); }, 300);
      return () => clearTimeout(t);
    }
    if (currentQuestion.type === 'audiocloze') {
      spokenRef.current = currentQuestion.id;
      const [before, after] = currentQuestion.audioWord.split('|||');
      const t = setTimeout(() => { void speakClozePair(before ?? '', after ?? ''); }, 300);
      return () => clearTimeout(t);
    }
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (index: number) => { if (selectedAnswer === null) submitAnswer(index); },
    [selectedAnswer, submitAnswer],
  );

  // Briefly switch the header avatar to a "cast" pose when the local
  // player fires off a skill, so it feels like *they* did something
  // (the skill effect is shown to the receivers, not the caster).
  const [castPose, setCastPose] = useState(false);
  const castSkill = useCallback(
    (type: SkillType) => {
      useSkill(type);
      setCastPose(true);
      setTimeout(() => setCastPose(false), 600);
    },
    [useSkill],
  );

  const handleTimeUpdate = useCallback((t: number) => setTimeLeft(t), []);

  const isAnswered = selectedAnswer !== null;
  const isRevealed = lastResult !== null;
  const isFogged = activeEffect?.skillType === 'fog' && !isRevealed;
  const isShaking = activeEffect?.skillType === 'shake';
  const urgency = Math.max(0, 1 - timeLeft / 4);

  // ── Countdown / Found ──
  if (phase === 'found' || phase === 'countdown') {
    return (
      <main className="min-h-[100dvh] party-bg relative overflow-hidden flex flex-col items-center justify-center px-4">
        {/* Decorative floating blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 -left-20 w-72 h-72 rounded-full bg-amber-300/30 blur-3xl animate-blob-drift" />
          <div className="absolute top-1/3 -right-24 w-96 h-96 rounded-full bg-cyan-300/20 blur-3xl animate-blob-drift" style={{ animationDelay: '4s' }} />
          <div className="absolute -bottom-24 left-1/4 w-80 h-80 rounded-full bg-fuchsia-300/30 blur-3xl animate-blob-drift" style={{ animationDelay: '8s' }} />
        </div>

        {phase === 'found' && (
          <div className="relative z-10 text-center w-full max-w-md flex flex-col items-center gap-5 animate-tilt-pop">
            <div className="inline-block bg-amber-300 text-fuchsia-900 px-6 py-2 rounded-full font-black text-base tracking-widest shadow-[0_6px_0_#92400e] -rotate-2">
              {t('game.matchFound')}
            </div>

            <div className="w-full bg-white/15 backdrop-blur-md rounded-3xl border-4 border-white/30 p-5 shadow-2xl">
              <div className="grid grid-cols-2 gap-3">
                {players.map((p, i) => {
                  const char = getCharacter(i);
                  const isMe = p.playerId === playerId;
                  return (
                    <div
                      key={p.playerId}
                      className={`rounded-2xl border-4 p-3 text-center animate-bounce-in ${
                        isMe ? 'border-amber-300 shadow-[0_0_24px_rgba(252,211,77,0.5)]' : 'border-white/60'
                      }`}
                      style={{
                        animationDelay: `${i * 0.12}s`,
                        background: `linear-gradient(135deg, ${char.color}55, ${char.color}10)`,
                      }}
                    >
                      <img
                        src={`${char.folder}/idle.png`}
                        alt={char.name}
                        className="w-16 h-16 mx-auto object-contain animate-float-bob"
                        style={{ animationDelay: `${i * 0.2}s` }}
                        draggable={false}
                      />
                      <p className="text-sm font-bold text-white truncate mt-1">{p.name}</p>
                      {isMe && (
                        <span className="inline-block mt-1 text-[9px] font-black tracking-widest bg-amber-300 text-fuchsia-900 px-2 py-0.5 rounded-full">
                          {t('common.you')}
                        </span>
                      )}
                      {p.isAI && !isMe && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-white/60">{t('common.bot')}</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {phase === 'countdown' && (
          <div className="relative z-10 text-center flex flex-col items-center gap-4">
            <p className="text-white/90 text-base font-bold uppercase tracking-[0.3em] drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">
              {t('game.getReady')}
            </p>
            <div
              key={countdownValue}
              // Big numerals (3/2/1) are narrow so a 10rem digit fits;
              // 「開始！」 is three CJK chars and would wrap, so cap it
              // at a smaller size.
              className={`font-black text-amber-300 leading-none animate-countdown-pop drop-shadow-[0_6px_0_rgba(0,0,0,0.4)] ${
                countdownValue > 0
                  ? 'text-[8rem] sm:text-[10rem]'
                  : 'text-6xl sm:text-7xl tracking-widest'
              }`}
            >
              {countdownValue > 0 ? countdownValue : t('game.go')}
            </div>

            {/* All four contestants warming up below the digit, so the
                middle of the screen isn't a slab of empty purple. Each
                avatar gets a staggered float-bob so the line feels alive. */}
            <div className="flex items-end justify-center gap-3 mt-1">
              {players.slice(0, 4).map((p, i) => {
                const charIdx = getCharacterIndex(p.playerId, players);
                const c = getCharacter(charIdx);
                return (
                  <div
                    key={p.playerId}
                    className="flex flex-col items-center gap-1 animate-float-bob"
                    style={{ animationDelay: `${i * 0.18}s`, animationDuration: '1.4s' }}
                  >
                    <div
                      className="w-14 h-14 rounded-2xl flex items-center justify-center p-1 border-2 backdrop-blur-sm"
                      style={{ backgroundColor: c.color + '40', borderColor: c.color }}
                    >
                      <img
                        src={`${c.folder}/${countdownValue === 0 ? 'cheer1' : 'idle'}.png`}
                        alt=""
                        className="w-full h-full object-contain"
                        draggable={false}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-white/85 tracking-wide truncate max-w-[64px]">
                      {p.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="min-h-screen party-bg flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-white/30 border-t-amber-300 rounded-full animate-spin-slow" />
      </main>
    );
  }

  const isFinal = currentQuestion.isFinal;
  const wrongReveal = isRevealed && lastResult && !lastResult.correct;

  return (
    <main className={`min-h-[100dvh] bg-game-dark relative overflow-hidden flex flex-col ${isShaking ? 'animate-screen-shake' : ''} ${hitShake ? 'animate-hit-shake' : ''}`}>

      {/* Overlays */}
      {flashType && (
        <div key={`${flashType}-${questionNumber}`}
          className={`fixed inset-0 pointer-events-none z-40 ${flashType === 'correct' ? 'animate-flash-correct' : 'animate-flash-wrong'}`} />
      )}
      {urgency > 0 && (
        <div className="fixed inset-0 pointer-events-none z-30"
          style={{ background: `radial-gradient(ellipse at center, transparent ${65 - urgency * 30}%, rgba(239,68,68,${urgency * 0.25}) 100%)` }} />
      )}
      {showFinalIntro && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 pointer-events-none">
          <div className="text-center animate-countdown-pop">
            <div className="inline-flex items-center justify-center gap-1.5 mb-1">
              <Flame className="w-4 h-4 text-amber-300" strokeWidth={2.75} />
              <p className="text-base text-amber-300 font-bold uppercase tracking-[0.3em] drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">{t('game.finalRound')}</p>
              <Flame className="w-4 h-4 text-amber-300" strokeWidth={2.75} />
            </div>
            <p className="text-6xl sm:text-8xl font-black text-white drop-shadow-[0_4px_0_rgba(0,0,0,0.5)]">×2.5</p>
          </div>
        </div>
      )}
      {showComboFlash && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center pointer-events-none animate-skill-flash">
          <div className="absolute inset-0 bg-orange-500/20" />
          <div className="relative inline-flex items-center gap-2 bg-orange-400 text-orange-950 px-6 py-3 rounded-2xl border-4 border-orange-200 shadow-[0_8px_0_rgba(0,0,0,0.4)]">
            <Flame className="w-7 h-7" strokeWidth={2.75} fill="currentColor" />
            <p className="text-2xl font-black tracking-widest">ON FIRE!</p>
            <Flame className="w-7 h-7" strokeWidth={2.75} fill="currentColor" />
          </div>
        </div>
      )}
      {activeEffect && (
        <div
          key={`${activeEffect.fromName}-${activeEffect.skillType}-${Date.now()}`}
          className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] animate-skill-flash"
        >
          <div className="relative inline-flex flex-col items-stretch overflow-hidden bg-rose-400 text-rose-950 px-4 py-2 rounded-2xl shadow-[0_4px_0_rgba(0,0,0,0.4)] border-2 border-rose-200">
            <div className="inline-flex items-center justify-center gap-1.5 text-xs font-bold tracking-widest">
              {(() => {
                const map: Record<string, { Icon: LucideIcon; label: string }> = {
                  shake: { Icon: Waves, label: 'SHAKE!' },
                  fog: { Icon: CloudFog, label: 'FOG!' },
                  timeCut: { Icon: TimerOff, label: 'TIME CUT!' },
                };
                const e = map[activeEffect.skillType] ?? map.shake!;
                return (
                  <>
                    <e.Icon className="w-4 h-4" strokeWidth={2.75} />
                    <span>{activeEffect.fromName}: {e.label}</span>
                  </>
                );
              })()}
            </div>
            {/* Countdown bar — shrinks from full width to 0 over the
                same 2s the store keeps activeEffect alive */}
            <span
              className="absolute left-0 bottom-0 h-1 w-full origin-left bg-rose-700/70"
              style={{ animation: 'effect-shrink 2s linear forwards' }}
            />
          </div>
        </div>
      )}
      {overtakeMsg && (
        <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[55] animate-slide-up">
          <div
            className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold tracking-wider shadow-[0_4px_0_rgba(0,0,0,0.4)] ${
              overtakeMsg.kind === 'up'
                ? 'bg-emerald-300 text-emerald-950'
                : 'bg-rose-300 text-rose-950'
            }`}
          >
            {overtakeMsg.kind === 'up' ? (
              <ChevronUp className="w-3.5 h-3.5" strokeWidth={3} />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" strokeWidth={3} />
            )}
            {overtakeMsg.text}
          </div>
        </div>
      )}

      {/* ── Header: avatar + Q counter + timer ── */}
      <div className="relative z-10 flex items-center justify-between px-3 py-2 bg-white/10 backdrop-blur-md border-b-4 border-white/20">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center p-1 border-2"
            style={{ backgroundColor: myChar.color + '40', borderColor: myChar.color }}
          >
            <img
              src={`${myChar.folder}/${castPose ? 'cheer1' : 'idle'}.png`}
              alt=""
              className={`w-full h-full object-contain ${castPose ? 'animate-tilt-pop' : ''}`}
            />
          </div>
          <span className="text-sm font-bold text-white tracking-wider">Q{questionNumber}/{totalQuestions}</span>
          {currentQuestion.type === 'vocab' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-cyan-300 text-cyan-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <Brain className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.vocab')}
            </span>
          )}
          {currentQuestion.type === 'audio' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-fuchsia-300 text-fuchsia-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <Headphones className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.audio')}
            </span>
          )}
          {currentQuestion.type === 'fillblank' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-amber-300 text-amber-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <FileText className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.fillblank')}
            </span>
          )}
          {currentQuestion.type === 'confusable' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-rose-300 text-rose-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <AlertTriangle className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.confusable')}
            </span>
          )}
          {currentQuestion.type === 'collocation' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-emerald-300 text-emerald-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <Puzzle className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.collocation')}
            </span>
          )}
          {currentQuestion.type === 'cloze' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-sky-300 text-sky-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <Pencil className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.cloze')}
            </span>
          )}
          {currentQuestion.type === 'synonym' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-violet-300 text-violet-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <ArrowLeftRight className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.synonym')}
            </span>
          )}
          {currentQuestion.type === 'listen' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-orange-300 text-orange-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <Ear className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.listen')}
            </span>
          )}
          {currentQuestion.type === 'audiocloze' && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-pink-300 text-pink-950 px-1.5 py-0.5 rounded-full tracking-wider">
              <AudioLines className="w-3 h-3" strokeWidth={2.75} />
              {t('game.qType.audiocloze')}
            </span>
          )}
          {isFinal && (
            <span className="inline-flex items-center gap-1 text-[9px] font-bold bg-rose-400 text-rose-950 px-1.5 py-0.5 rounded-full border-2 border-rose-200 tracking-wider">
              <Flame className="w-3 h-3" strokeWidth={2.75} />
              ×2.5
            </span>
          )}
        </div>
        <Timer duration={10} questionId={currentQuestion.id} compact
          timeCut={activeEffect?.skillType === 'timeCut'} onTimeUpdate={handleTimeUpdate} />
      </div>

      {/* ── Ranking bar ── */}
      <div className="relative z-10 px-2 py-1.5">
        <RankingBar rankings={rankings} myPlayerId={playerId} players={players} statuses={roundStatuses} />
      </div>

      {/* ── Main game content ── */}
      <div className="relative z-10 flex-1 flex flex-col px-2 py-1 overflow-hidden">
        <ScorePopup
          score={lastResult?.totalGained ?? null}
          combo={myCombo}
          breakdown={
            lastResult && lastResult.correct
              ? {
                  base: lastResult.baseScore,
                  speed: lastResult.speedBonus,
                  combo: lastResult.comboMultiplier,
                }
              : null
          }
        />

        {/* Question card */}
        {gameMode === 'jump' ? (
          <div className={`rounded-2xl px-3 py-1.5 border-4 text-center mb-1 ${
            isFinal ? 'bg-rose-300/30 border-rose-200' : 'bg-white/15 border-white/30'
          }`}>
            {currentQuestion.type === 'vocab' && (
              <p className="text-xl sm:text-2xl font-black text-white drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">{currentQuestion.prompt}</p>
            )}
            {currentQuestion.type === 'audio' && currentQuestion.audioWord && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => speakWord(currentQuestion.audioWord!)}
                  className="w-9 h-9 rounded-full bg-fuchsia-300 border-2 border-fuchsia-200
                    flex items-center justify-center active:scale-95 cursor-pointer shadow-[0_3px_0_rgba(112,26,117,0.5)] text-fuchsia-950">
                  <Volume2 className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <span className="text-xs font-medium text-white/80">{t('game.tapToHear')}</span>
              </div>
            )}
            {currentQuestion.type === 'listen' && currentQuestion.audioWord && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => speakWord(currentQuestion.audioWord!)}
                  className="w-9 h-9 rounded-full bg-orange-300 border-2 border-orange-200
                    flex items-center justify-center active:scale-95 cursor-pointer shadow-[0_3px_0_rgba(154,52,18,0.5)] text-orange-950">
                  <Ear className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <span className="text-xs font-medium text-white/80">{t('game.tapToHear')}</span>
              </div>
            )}
            {currentQuestion.type === 'audiocloze' && currentQuestion.audioWord && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => {
                  const [before, after] = currentQuestion.audioWord!.split('|||');
                  void speakClozePair(before ?? '', after ?? '');
                }}
                  className="w-9 h-9 rounded-full bg-pink-300 border-2 border-pink-200
                    flex items-center justify-center active:scale-95 cursor-pointer shadow-[0_3px_0_rgba(157,23,77,0.5)] text-pink-950">
                  <AudioLines className="w-4 h-4" strokeWidth={2.5} />
                </button>
                <span className="text-xs font-medium text-white/80">{t('game.tapToHear')}</span>
              </div>
            )}
            {currentQuestion.type === 'fillblank' && (
              <p className="text-sm font-bold text-white">&ldquo;{currentQuestion.prompt}&rdquo;</p>
            )}
            {currentQuestion.type === 'cloze' && (
              <p className="text-sm font-bold text-white">{currentQuestion.prompt}</p>
            )}
            {currentQuestion.type === 'synonym' && (
              <p className="text-sm font-bold text-white">{currentQuestion.prompt}</p>
            )}
          </div>
        ) : (
          <div
            // Re-key on each new audio question so the telegraph
            // pulse re-runs when the question changes.
            key={currentQuestion.type === 'audio' ? `audio-${currentQuestion.id}` : 'q-card'}
            className={`rounded-3xl p-4 sm:p-5 border-4 text-center mb-2 backdrop-blur-sm ${
              wrongReveal
                ? 'bg-rose-400/25 border-rose-200'
                : isRevealed
                  ? 'bg-emerald-400/25 border-emerald-200'
                  : isFinal
                    ? 'bg-rose-300/30 border-rose-200'
                    : 'bg-white/15 border-white/30'
            }`}
            style={
              currentQuestion.type === 'audio' && !isRevealed
                ? { animation: 'audio-telegraph 0.7s ease-out 1' }
                : undefined
            }
          >
            {currentQuestion.type === 'vocab' && (
              <p className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_3px_0_rgba(0,0,0,0.4)]">{currentQuestion.prompt}</p>
            )}
            {currentQuestion.type === 'audio' && currentQuestion.audioWord && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => speakWord(currentQuestion.audioWord!)}
                  className="w-14 h-14 rounded-full bg-fuchsia-300 border-4 border-fuchsia-200
                    flex items-center justify-center active:scale-95 cursor-pointer shadow-[0_5px_0_rgba(112,26,117,0.5)] text-fuchsia-950">
                  <Volume2 className="w-6 h-6" strokeWidth={2.5} />
                </button>
                <span className="text-sm font-medium text-white/90">{t('game.tapToHear')}</span>
              </div>
            )}
            {currentQuestion.type === 'listen' && currentQuestion.audioWord && (
              <div>
                <p className="text-[10px] font-bold text-orange-200 uppercase tracking-[0.25em] mb-2">{t('game.qType.listenHint')}</p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => speakWord(currentQuestion.audioWord!)}
                    className="w-16 h-16 rounded-full bg-orange-300 border-4 border-orange-200
                      flex items-center justify-center active:scale-95 cursor-pointer shadow-[0_5px_0_rgba(154,52,18,0.5)] text-orange-950">
                    <Ear className="w-7 h-7" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
            {currentQuestion.type === 'audiocloze' && currentQuestion.audioWord && (
              <div>
                <p className="text-[10px] font-bold text-pink-200 uppercase tracking-[0.25em] mb-2">{t('game.qType.audioclozeHint')}</p>
                <p className="text-base sm:text-lg font-bold text-white leading-relaxed mb-3">
                  {currentQuestion.prompt.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="inline-block w-20 mx-1 border-b-3 border-pink-300 align-middle" />
                      )}
                    </span>
                  ))}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button onClick={() => {
                    const [before, after] = currentQuestion.audioWord!.split('|||');
                    void speakClozePair(before ?? '', after ?? '');
                  }}
                    className="w-12 h-12 rounded-full bg-pink-300 border-4 border-pink-200
                      flex items-center justify-center active:scale-95 cursor-pointer shadow-[0_5px_0_rgba(157,23,77,0.5)] text-pink-950">
                    <AudioLines className="w-5 h-5" strokeWidth={2.5} />
                  </button>
                  <span className="text-xs font-medium text-white/80">{t('game.tapToHear')}</span>
                </div>
              </div>
            )}
            {currentQuestion.type === 'fillblank' && (
              <div>
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-[0.25em] mb-1">{t('game.whichMeans')}</p>
                <p className="text-lg sm:text-xl font-bold text-white">&ldquo;{currentQuestion.prompt}&rdquo;</p>
              </div>
            )}
            {currentQuestion.type === 'confusable' && (
              <div>
                <p className="text-[10px] font-bold text-rose-200 uppercase tracking-[0.25em] mb-1">{t('game.qType.confusableHint')}</p>
                <p className="text-lg sm:text-xl font-bold text-white">
                  {currentQuestion.prompt.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="inline-block w-20 mx-1 border-b-3 border-rose-300" />
                      )}
                    </span>
                  ))}
                </p>
              </div>
            )}
            {currentQuestion.type === 'collocation' && (
              <div>
                <p className="text-[10px] font-bold text-emerald-200 uppercase tracking-[0.25em] mb-1">{t('game.qType.collocationHint')}</p>
                {currentQuestion.prompt.split('\n').map((line, i) => (
                  <p key={i} className={i === 0
                    ? 'text-xl sm:text-2xl font-black text-white'
                    : 'text-sm text-emerald-200 mt-1'
                  }>
                    {i === 0 ? line.split('___').map((part, j, arr) => (
                      <span key={j}>
                        {part}
                        {j < arr.length - 1 && (
                          <span className="inline-block w-20 mx-1 border-b-3 border-emerald-300" />
                        )}
                      </span>
                    )) : line}
                  </p>
                ))}
              </div>
            )}
            {currentQuestion.type === 'cloze' && (
              <div>
                <p className="text-[10px] font-bold text-sky-200 uppercase tracking-[0.25em] mb-1">{t('game.qType.clozeHint')}</p>
                <p className="text-base sm:text-lg font-bold text-white leading-relaxed">
                  {currentQuestion.prompt.split('___').map((part, i, arr) => (
                    <span key={i}>
                      {part}
                      {i < arr.length - 1 && (
                        <span className="inline-block w-20 mx-1 border-b-3 border-sky-300 align-middle" />
                      )}
                    </span>
                  ))}
                </p>
              </div>
            )}
            {currentQuestion.type === 'synonym' && (
              <div>
                <p className="text-[10px] font-bold text-violet-200 uppercase tracking-[0.25em] mb-1">{t('game.qType.synonymHint')}</p>
                <p className="text-lg sm:text-xl font-bold text-white">{currentQuestion.prompt}</p>
              </div>
            )}

            {/* Definition reveal during review phase */}
            {isRevealed && lastResult && (lastResult.definition || lastResult.meaning) && (
              <div
                ref={revealRef}
                className="mt-3 pt-3 border-t-2 border-dashed border-white/30 scroll-mt-24"
              >
                <div className="flex items-center gap-2 mb-1 justify-center">
                  <span className="text-sm font-bold uppercase tracking-widest text-amber-200">
                    {lastResult.word}
                  </span>
                  {lastResult.meaning && (
                    <>
                      <span className="text-[10px] font-bold text-white/70">→</span>
                      <span className="text-base font-bold text-emerald-200">
                        {lastResult.meaning}
                      </span>
                    </>
                  )}
                </div>
                {lastResult.definition && (
                  <p className="text-[11px] sm:text-xs text-white/85 leading-relaxed font-medium text-center">
                    {lastResult.definition}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Answer area */}
        <div className="flex-1 flex flex-col" style={isFogged ? { filter: 'blur(6px)' } : undefined}>
          {gameMode === 'jump' ? (
            <GameArena
              options={currentQuestion.options}
              onAnswer={handleAnswer}
              locked={isAnswered}
              character={myChar}
              selected={selectedAnswer}
              correctIndex={isRevealed ? lastResult!.correctIndex : null}
              questionId={currentQuestion.id}
            />
          ) : (
            <div className="grid grid-cols-2 gap-2.5 flex-1 content-center">
              {currentQuestion.options.map((opt, i) => (
                <AnswerButton key={i} index={i} text={opt}
                  disabled={isAnswered} selected={selectedAnswer === i}
                  correct={isRevealed ? (selectedAnswer === i ? lastResult!.correct : null) : null}
                  isCorrectAnswer={isRevealed && lastResult!.correctIndex === i}
                  fogged={false} onClick={() => handleAnswer(i)} />
              ))}
            </div>
          )}
        </div>

        {/* Score + Skills */}
        <div className={`mt-2 space-y-1.5 backdrop-blur-sm rounded-2xl px-3 py-2 transition-[background,border,box-shadow] ${
          myCombo >= 5
            ? 'bg-orange-500/20 border-2 border-orange-300/60 shadow-[0_0_24px_rgba(251,146,60,0.45)]'
            : 'bg-white/10 border-2 border-white/20'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-white/80 tracking-wider">
                {t('game.score')} <span className="ml-1 text-amber-300 font-black text-base tabular-nums drop-shadow-[0_2px_0_rgba(0,0,0,0.4)]">{displayScore}</span>
              </span>
              {myCombo > 0 && (
                <span className={`inline-flex items-center gap-0.5 font-black text-orange-300 ${myCombo >= 3 ? 'animate-combo-fire text-base' : 'text-sm'}`}>
                  {myCombo >= 3 && <Flame className="w-3.5 h-3.5" strokeWidth={2.75} fill="currentColor" />}
                  ×{[1, 1.2, 1.5, 2][Math.min(myCombo, 3)]}
                </span>
              )}
            </div>
            {lastResult && (
              <span className={`inline-flex items-center gap-0.5 text-xs font-bold tracking-wider ${lastResult.correct ? 'text-emerald-300' : 'text-rose-300'}`}>
                {lastResult.correct ? (
                  <>
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                    +{lastResult.totalGained}
                  </>
                ) : (
                  <>
                    <XIcon className="w-3.5 h-3.5" strokeWidth={3} />
                    {t('game.wrong')}
                  </>
                )}
              </span>
            )}
          </div>
          <SkillBar usedSkills={myUsedSkills} disabled={isAnswered} isFinal={isFinal} onUse={castSkill} />
        </div>
      </div>

      {/* Waiting-on-others hint — only between "I answered" and "everyone
          answered / round resolved". Once isRevealed flips on, the
          review bar takes over. */}
      {isAnswered && !isRevealed && totalCount > 1 && answeredCount < totalCount && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[40] pointer-events-none animate-slide-up">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 text-white/80 text-[10px] font-bold tracking-widest border border-white/15 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
            {t('game.waitingOthers', { n: totalCount - answeredCount })}
          </span>
        </div>
      )}

      {/* Review-phase ETA bar — fills over the same window the server pauses
          (keyed off question id so it resets cleanly each round). The
          duration is set to match the longer of the two server pauses
          (5s); if the next question lands earlier, the bar gets
          interrupted, which is fine. */}
      {isRevealed && (
        <div
          key={`review-bar-${currentQuestion.id}`}
          className="absolute bottom-0 left-0 right-0 h-1 bg-amber-300/15 overflow-hidden pointer-events-none"
        >
          <span
            className="block h-full origin-left bg-amber-300"
            style={{ animation: 'review-fill 5s linear forwards' }}
          />
        </div>
      )}
    </main>
  );
}
