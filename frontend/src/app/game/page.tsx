'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Volume2,
  Brain,
  Headphones,
  FileText,
  Flame,
  Waves,
  CloudFog,
  TimerOff,
  Check,
  X as XIcon,
  type LucideIcon,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { getCharacter, getCharacterIndex } from '@/lib/characters';
import { speakWord } from '@/lib/speak';
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
    players, activeEffect,
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

  // Auto-play audio prompts once per question
  const spokenRef = useRef('');
  useEffect(() => {
    if (currentQuestion?.type === 'audio' && currentQuestion.audioWord && spokenRef.current !== currentQuestion.id) {
      spokenRef.current = currentQuestion.id;
      const t = setTimeout(() => { void speakWord(currentQuestion.audioWord!); }, 300);
      return () => clearTimeout(t);
    }
  }, [currentQuestion]);

  const handleAnswer = useCallback(
    (index: number) => { if (selectedAnswer === null) submitAnswer(index); },
    [selectedAnswer, submitAnswer],
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
          <div className="relative z-10 text-center">
            <p className="text-white/90 text-base font-bold uppercase tracking-[0.3em] mb-3 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">
              {t('game.getReady')}
            </p>
            <div
              key={countdownValue}
              className="text-[10rem] sm:text-[12rem] font-black text-amber-300 leading-none animate-countdown-pop drop-shadow-[0_6px_0_rgba(0,0,0,0.4)]"
            >
              {countdownValue > 0 ? countdownValue : t('game.go')}
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
          <div className="bg-emerald-300 text-emerald-950 px-4 py-2 rounded-full text-xs font-bold tracking-wider shadow-[0_4px_0_rgba(0,0,0,0.4)]">
            {overtakeMsg}
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
            <img src={`${myChar.folder}/idle.png`} alt="" className="w-full h-full object-contain" />
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
        <RankingBar rankings={rankings} myPlayerId={playerId} players={players} />
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
            {currentQuestion.type === 'fillblank' && (
              <p className="text-sm font-bold text-white">&ldquo;{currentQuestion.prompt}&rdquo;</p>
            )}
          </div>
        ) : (
          <div className={`rounded-3xl p-4 sm:p-5 border-4 text-center mb-2 backdrop-blur-sm ${
            wrongReveal
              ? 'bg-rose-400/25 border-rose-200'
              : isRevealed
                ? 'bg-emerald-400/25 border-emerald-200'
                : isFinal
                  ? 'bg-rose-300/30 border-rose-200'
                  : 'bg-white/15 border-white/30'
          }`}>
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
            {currentQuestion.type === 'fillblank' && (
              <div>
                <p className="text-[10px] font-bold text-amber-200 uppercase tracking-[0.25em] mb-1">{t('game.whichMeans')}</p>
                <p className="text-lg sm:text-xl font-bold text-white">&ldquo;{currentQuestion.prompt}&rdquo;</p>
              </div>
            )}

            {/* Definition reveal during review phase */}
            {isRevealed && lastResult && (lastResult.definition || lastResult.meaning) && (
              <div className="mt-3 pt-3 border-t-2 border-dashed border-white/30">
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
          <SkillBar usedSkills={myUsedSkills} disabled={isAnswered} isFinal={isFinal} onUse={useSkill} />
        </div>
      </div>

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
