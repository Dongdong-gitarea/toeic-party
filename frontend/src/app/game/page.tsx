'use client';

import { useEffect, useCallback, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { getCharacter, getCharacterIndex } from '@/lib/characters';
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
    rankings, myScore, myCombo, myEnergy,
    countdownValue, submitAnswer, useSkill, overtakeMsg,
    players, activeEffect,
  } = useGameStore();

  const [flashType, setFlashType] = useState<'correct' | 'wrong' | null>(null);
  const [hitShake, setHitShake] = useState(false);
  const [timeLeft, setTimeLeft] = useState(10);
  const displayScore = useCountUp(myScore);
  const [showFinalIntro, setShowFinalIntro] = useState(false);

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

  // TTS
  const spokenRef = useRef('');
  const speakWord = useCallback((word: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(word);
    u.lang = 'en-US';
    u.rate = 0.85;
    window.speechSynthesis.speak(u);
  }, []);

  useEffect(() => {
    if (currentQuestion?.type === 'audio' && currentQuestion.audioWord && spokenRef.current !== currentQuestion.id) {
      spokenRef.current = currentQuestion.id;
      const t = setTimeout(() => speakWord(currentQuestion.audioWord!), 300);
      return () => clearTimeout(t);
    }
  }, [currentQuestion, speakWord]);

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
              MATCH FOUND!
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
                      <p className="text-sm font-black text-white truncate mt-1">{p.name}</p>
                      {isMe && (
                        <span className="inline-block mt-1 text-[9px] font-black tracking-widest bg-amber-300 text-fuchsia-900 px-2 py-0.5 rounded-full">
                          YOU
                        </span>
                      )}
                      {p.isAI && !isMe && (
                        <span className="inline-block mt-1 text-[9px] font-bold text-white/60">BOT</span>
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
            <p className="text-white/90 text-base font-black uppercase tracking-[0.3em] mb-3 drop-shadow-[0_2px_0_rgba(0,0,0,0.3)]">
              Get Ready!
            </p>
            <div
              key={countdownValue}
              className="text-[10rem] sm:text-[12rem] font-black text-amber-300 leading-none animate-countdown-pop drop-shadow-[0_6px_0_rgba(0,0,0,0.4)]"
            >
              {countdownValue > 0 ? countdownValue : 'GO!'}
            </div>
          </div>
        )}
      </main>
    );
  }

  if (!currentQuestion) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin-slow" />
      </main>
    );
  }

  const isFinal = currentQuestion.isFinal;

  return (
    <main className={`min-h-[100dvh] flex flex-col ${isShaking ? 'animate-screen-shake' : ''} ${hitShake ? 'animate-hit-shake' : ''}`}>

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
            <p className="text-base text-red-400 font-bold uppercase tracking-widest mb-1">Final Round</p>
            <p className="text-6xl sm:text-8xl font-black text-white">x2.5</p>
          </div>
        </div>
      )}
      {activeEffect && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] animate-skill-flash">
          <div className="bg-red-500/90 backdrop-blur px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-lg">
            {activeEffect.fromName}: {activeEffect.skillType === 'shake' ? 'SHAKE!' : activeEffect.skillType === 'fog' ? 'FOG!' : 'TIME CUT!'}
          </div>
        </div>
      )}
      {overtakeMsg && (
        <div className="fixed top-10 left-1/2 -translate-x-1/2 z-[55] animate-slide-up">
          <div className="bg-green-500/90 backdrop-blur px-4 py-1.5 rounded-lg text-xs font-black text-white shadow-lg">{overtakeMsg}</div>
        </div>
      )}

      {/* ── Header: avatar + Q counter + timer ── */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <img src={`${myChar.folder}/idle.png`} alt="" className="w-7 h-7 object-contain" />
          <span className="text-sm font-bold text-slate-300">Q{questionNumber}/{totalQuestions}</span>
          {currentQuestion.type === 'vocab' && <span className="text-[9px] font-bold bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded-full">Vocab</span>}
          {currentQuestion.type === 'audio' && <span className="text-[9px] font-bold bg-violet-500/20 text-violet-400 px-1.5 py-0.5 rounded-full">Listen</span>}
          {currentQuestion.type === 'fillblank' && <span className="text-[9px] font-bold bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">Def</span>}
          {isFinal && <span className="text-[9px] font-black bg-red-500/30 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/40">x2.5</span>}
        </div>
        <Timer duration={10} questionId={currentQuestion.id} compact
          timeCut={activeEffect?.skillType === 'timeCut'} onTimeUpdate={handleTimeUpdate} />
      </div>

      {/* ── Ranking bar ── */}
      <div className="px-2 py-1.5">
        <RankingBar rankings={rankings} myPlayerId={playerId} players={players} />
      </div>

      {/* ── Main game content ── */}
      <div className="flex-1 flex flex-col px-2 py-1 relative overflow-hidden">
        <ScorePopup score={lastResult?.totalGained ?? null} combo={myCombo} />

        {/* Question — compact for Jump, full for Classic */}
        {gameMode === 'jump' ? (
          <div className={`rounded-lg px-3 py-1.5 border text-center mb-1 ${
            isFinal ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/50 border-slate-700/40'
          }`}>
            {currentQuestion.type === 'vocab' && (
              <p className="text-xl sm:text-2xl font-black">{currentQuestion.prompt}</p>
            )}
            {currentQuestion.type === 'audio' && currentQuestion.audioWord && (
              <div className="flex items-center justify-center gap-2">
                <button onClick={() => speakWord(currentQuestion.audioWord!)}
                  className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/40
                    flex items-center justify-center active:scale-95 cursor-pointer">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-violet-300">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                  </svg>
                </button>
                <span className="text-xs text-slate-400">Tap to hear</span>
              </div>
            )}
            {currentQuestion.type === 'fillblank' && (
              <p className="text-sm font-semibold text-slate-200">&ldquo;{currentQuestion.prompt}&rdquo;</p>
            )}
          </div>
        ) : (
          <div className={`rounded-xl p-3 sm:p-4 border text-center mb-2 ${
            isFinal ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800/60 border-slate-700/50'
          }`}>
            {currentQuestion.type === 'vocab' && (
              <p className="text-3xl sm:text-4xl font-black">{currentQuestion.prompt}</p>
            )}
            {currentQuestion.type === 'audio' && currentQuestion.audioWord && (
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => speakWord(currentQuestion.audioWord!)}
                  className="w-12 h-12 rounded-full bg-violet-500/20 border-2 border-violet-500/40
                    flex items-center justify-center active:scale-95 cursor-pointer">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-300">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </button>
                <span className="text-sm text-slate-400">What word do you hear?</span>
              </div>
            )}
            {currentQuestion.type === 'fillblank' && (
              <div>
                <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider mb-1">Which word means:</p>
                <p className="text-lg sm:text-xl font-semibold text-slate-200">&ldquo;{currentQuestion.prompt}&rdquo;</p>
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
            <div className="grid grid-cols-2 gap-2 flex-1 content-center">
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
        <div className="mt-1 space-y-1">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 text-xs">
                Score: <span className="text-white font-black text-base tabular-nums">{displayScore}</span>
              </span>
              {myCombo > 0 && (
                <span className={`font-black text-orange-400 ${myCombo >= 3 ? 'animate-combo-fire text-base' : 'text-sm'}`}>
                  x{[1, 1.2, 1.5, 2][Math.min(myCombo, 3)]}
                </span>
              )}
            </div>
            {lastResult && (
              <span className={`text-xs font-bold ${lastResult.correct ? 'text-green-400' : 'text-red-400'}`}>
                {lastResult.correct ? `+${lastResult.totalGained}` : 'Wrong!'}
              </span>
            )}
          </div>
          <SkillBar energy={myEnergy} disabled={isAnswered} isFinal={isFinal} onUse={useSkill} />
        </div>
      </div>
    </main>
  );
}
