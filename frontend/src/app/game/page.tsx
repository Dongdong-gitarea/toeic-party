'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import Timer from '@/components/Timer';
import AnswerButton from '@/components/AnswerButton';
import RankingPanel from '@/components/RankingPanel';
import ScorePopup from '@/components/ScorePopup';
import SkillBar from '@/components/SkillBar';

export default function GamePage() {
  const router = useRouter();
  const store = useGameStore();
  const {
    phase,
    playerId,
    currentQuestion,
    questionNumber,
    totalQuestions,
    selectedAnswer,
    lastResult,
    rankings,
    myScore,
    myCombo,
    myEnergy,
    countdownValue,
    submitAnswer,
    useSkill,
    players,
    activeEffect,
  } = store;

  useEffect(() => {
    if (phase === 'idle' || phase === 'matchmaking') router.replace('/');
    if (phase === 'result') router.push('/result');
  }, [phase, router]);

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null) return;
      submitAnswer(index);
    },
    [selectedAnswer, submitAnswer],
  );

  // ── TTS for audio questions ──
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
    if (
      currentQuestion?.type === 'audio' &&
      currentQuestion.audioWord &&
      spokenRef.current !== currentQuestion.id
    ) {
      spokenRef.current = currentQuestion.id;
      // Small delay so the UI renders first
      const t = setTimeout(() => speakWord(currentQuestion.audioWord!), 300);
      return () => clearTimeout(t);
    }
  }, [currentQuestion, speakWord]);

  const isAnswered = selectedAnswer !== null;
  const isRevealed = lastResult !== null;
  const isFogged = activeEffect?.skillType === 'fog' && !isRevealed;
  const isShaking = activeEffect?.skillType === 'shake';

  // ── Countdown / Found overlay ──
  if (phase === 'found' || phase === 'countdown') {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4">
        {phase === 'found' && (
          <div className="text-center animate-slide-up">
            <h2 className="text-3xl font-black text-green-400 mb-6">
              Match Found!
            </h2>
            <div className="space-y-2">
              {players.map((p) => (
                <div key={p.playerId} className="text-lg font-semibold text-slate-300">
                  {p.name}
                  {p.playerId === playerId && (
                    <span className="ml-2 text-xs bg-indigo-500 px-2 py-0.5 rounded-full">
                      YOU
                    </span>
                  )}
                  {p.isAI && p.playerId !== playerId && (
                    <span className="ml-2 text-xs text-slate-500">BOT</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        {phase === 'countdown' && (
          <div className="text-center">
            <p className="text-slate-400 text-lg mb-4 font-medium">Get Ready!</p>
            <div
              key={countdownValue}
              className="text-9xl font-black text-indigo-400 animate-countdown-pop"
            >
              {countdownValue > 0 ? countdownValue : 'GO!'}
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── Loading ──
  if (!currentQuestion) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-slate-600 border-t-indigo-400 rounded-full animate-spin-slow" />
      </main>
    );
  }

  const isFinal = currentQuestion.isFinal;

  // ── Main game UI ──
  return (
    <main
      className={`min-h-screen flex flex-col lg:flex-row ${isShaking ? 'animate-screen-shake' : ''}`}
    >
      {/* Skill effect banner */}
      {activeEffect && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] animate-skill-flash">
          <div className="bg-red-500/90 backdrop-blur px-4 py-2 rounded-lg text-sm font-bold text-white shadow-lg">
            {activeEffect.fromName} used{' '}
            {activeEffect.skillType === 'shake'
              ? 'SHAKE!'
              : activeEffect.skillType === 'fog'
                ? 'FOG!'
                : 'TIME CUT -2s!'}
          </div>
        </div>
      )}

      {/* Game area */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4 relative">
        <ScorePopup
          score={lastResult?.totalGained ?? null}
          combo={myCombo}
        />

        {/* Header */}
        <div className="w-full max-w-xl flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-400">
              Q{questionNumber}/{totalQuestions}
            </span>
            {/* Question type badge */}
            {currentQuestion.type === 'vocab' && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">
                Vocab
              </span>
            )}
            {currentQuestion.type === 'audio' && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-400 px-2 py-0.5 rounded-full">
                Listening
              </span>
            )}
            {currentQuestion.type === 'fillblank' && (
              <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">
                Fill blank
              </span>
            )}
            {isFinal && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-red-500/30 text-red-400 px-2 py-0.5 rounded-full border border-red-500/40">
                FINAL x2.5
              </span>
            )}
          </div>
          <Timer
            duration={10}
            questionId={currentQuestion.id}
            timeCut={activeEffect?.skillType === 'timeCut'}
          />
        </div>

        {/* Question */}
        <div className="w-full max-w-xl mb-6 animate-slide-up">
          <div
            className={`rounded-2xl p-6 sm:p-8 border text-center ${
              isFinal
                ? 'bg-red-500/10 border-red-500/30'
                : 'bg-slate-800/60 border-slate-700/50'
            }`}
          >
            {currentQuestion.type === 'vocab' && (
              <p className="text-4xl sm:text-5xl font-black">{currentQuestion.prompt}</p>
            )}
            {currentQuestion.type === 'audio' && currentQuestion.audioWord && (
              <div className="flex flex-col items-center gap-4">
                <p className="text-sm text-slate-400 font-medium uppercase tracking-wider">
                  What word do you hear?
                </p>
                <button
                  onClick={() => speakWord(currentQuestion.audioWord!)}
                  className="w-20 h-20 rounded-full bg-violet-500/20 border-2 border-violet-500/40
                    flex items-center justify-center hover:bg-violet-500/30 active:scale-95
                    transition-all cursor-pointer"
                >
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-300">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
                  </svg>
                </button>
                <p className="text-xs text-slate-500">Tap to replay</p>
              </div>
            )}
            {currentQuestion.type === 'fillblank' && (
              <p className="text-xl sm:text-2xl font-semibold leading-relaxed">
                {currentQuestion.prompt.split('___').map((part, i, arr) => (
                  <span key={i}>
                    {part}
                    {i < arr.length - 1 && (
                      <span className="inline-block w-28 mx-1 border-b-3 border-indigo-400" />
                    )}
                  </span>
                ))}
              </p>
            )}
          </div>
        </div>

        {/* Answer grid */}
        <div className="w-full max-w-xl grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQuestion.options.map((opt, i) => (
            <AnswerButton
              key={i}
              index={i}
              text={opt}
              disabled={isAnswered}
              selected={selectedAnswer === i}
              correct={
                isRevealed
                  ? selectedAnswer === i
                    ? lastResult!.correct
                    : null
                  : null
              }
              isCorrectAnswer={isRevealed && lastResult!.correctIndex === i}
              fogged={isFogged}
              onClick={() => handleAnswer(i)}
            />
          ))}
        </div>

        {/* Score bar + Skills */}
        <div className="w-full max-w-xl mt-4 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <span className="text-slate-400">
                Score:{' '}
                <span className="text-white font-black text-xl">{myScore}</span>
              </span>
              {myCombo > 0 && (
                <span
                  className={`font-black ${
                    myCombo >= 3
                      ? 'text-orange-400 animate-combo-fire text-lg'
                      : 'text-orange-400'
                  }`}
                >
                  x{[1, 1.2, 1.5, 2][Math.min(myCombo, 3)]}
                </span>
              )}
            </div>
            {lastResult && (
              <span
                className={`font-bold ${lastResult.correct ? 'text-green-400' : 'text-red-400'}`}
              >
                {lastResult.correct
                  ? `+${lastResult.totalGained}`
                  : `${lastResult.totalGained} Wrong!`}
              </span>
            )}
          </div>
          <SkillBar
            energy={myEnergy}
            disabled={isAnswered}
            isFinal={isFinal}
            onUse={useSkill}
          />
        </div>
      </div>

      {/* Rankings sidebar */}
      <div className="lg:w-64 p-4 lg:pt-8">
        <RankingPanel rankings={rankings} myPlayerId={playerId} />
      </div>
    </main>
  );
}
