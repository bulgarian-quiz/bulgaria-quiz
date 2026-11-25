import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Check, ImageOff, Loader2, LogOut, Timer, Trophy, XCircle } from 'lucide-react';
import GameConfigDialog, { GameConfig } from '@/components/GameConfigDialog';
import MatchmakingOverlay from '@/components/MatchmakingOverlay';
import CountdownOverlay from '@/components/CountdownOverlay';
import OpponentProgress from '@/components/OpponentProgress';
import MultiplayerEndScreen from '@/components/MultiplayerEndScreen';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { photoQuestions, PHOTO_QUESTION_COUNT, type PhotoQuestion } from '@/data/photoQuestions';
import { checkTypedAnswer } from '@/lib/answerMatch';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/contexts/PointsContext';
import { useMultiplayer, type GameType } from '@/hooks/useMultiplayer';
import { useBotSimulation } from '@/hooks/useBotSimulation';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSeo } from '@/seo/useSeo';

type AnswerMode = 'choice' | 'typed';
type Phase = 'answering' | 'checking' | 'revealed';

interface Round {
  question: PhotoQuestion;
  /** The photo's number (1–30), which names its file and its placeholder. */
  number: number;
  options: { bg: string[]; en: string[] };
  correctIndex: number;
}

interface RoundResult {
  correct: boolean;
  /** What the player picked or typed (empty when they skipped). */
  given: string;
}

const CHOICE_ADVANCE_MS = 1400;
const LABELS = ['а)', 'б)', 'в)', 'г)'];
const LABELS_EN = ['a)', 'b)', 'c)', 'd)'];

const shuffle = <T,>(items: T[]): T[] => {
  const out = [...items];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

/** A new game: the photos in a random order, each with its four options shuffled. */
function buildRounds(): Round[] {
  return shuffle(photoQuestions.map((question, index) => ({ question, number: index + 1 }))).map(({ question, number }) => {
    const order = shuffle([0, 1, 2, 3]);
    const all = {
      bg: [question.answer.bg, ...question.wrong.bg],
      en: [question.answer.en, ...question.wrong.en],
    };
    return {
      question,
      number,
      options: { bg: order.map((i) => all.bg[i]), en: order.map((i) => all.en[i]) },
      correctIndex: order.indexOf(0),
    };
  });
}

/** The photo, or a numbered placeholder until the photo file is added. */
const Photo: React.FC<{ src: string; number: number; language: 'bg' | 'en' }> = ({ src, number, language }) => {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  const label = language === 'bg' ? `Снимка ${number}` : `Photo ${number}`;

  if (failed) {
    return (
      <div className="photo-quiz__placeholder" role="img" aria-label={label}>
        <ImageOff className="w-8 h-8" aria-hidden="true" />
        <span className="photo-quiz__placeholder-number">{String(number).padStart(2, '0')}</span>
        <span className="text-xs">{language === 'bg' ? 'Снимката ще бъде добавена' : 'Photo coming soon'}</span>
      </div>
    );
  }
  // The whole photo is shown (portraits are not cropped), over a blurred copy
  // of itself that fills the frame. The alt text names only the photo's number:
  // it must not give the answer away.
  return (
    <>
      <img src={src} alt="" aria-hidden="true" className="photo-quiz__backdrop" draggable={false} />
      <img src={src} alt={label} className="photo-quiz__image" onError={() => setFailed(true)} draggable={false} />
    </>
  );
};

const PhotoQuiz: React.FC = () => {
  useSeo('/photo-quiz');
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const { awardCorrectAnswer, awardGameComplete } = usePoints();
  const multiplayer = useMultiplayer();

  const [showConfig, setShowConfig] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<GameConfig['mode']>('solo');
  const [answerMode, setAnswerMode] = useState<AnswerMode>('choice');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const [rounds, setRounds] = useState<Round[]>(() => buildRounds());
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('answering');
  const [picked, setPicked] = useState<number | null>(null);
  const [typed, setTyped] = useState('');
  const [results, setResults] = useState<RoundResult[]>([]);
  const [showCompletion, setShowCompletion] = useState(false);
  const [showMultiplayerEnd, setShowMultiplayerEnd] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);

  const finishedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const advanceTimerRef = useRef<number | null>(null);

  const isMultiplayer = gameMode !== 'solo';
  const total = PHOTO_QUESTION_COUNT;
  const round = rounds[index];
  const answered = results.length;
  const correctCount = results.filter((r) => r.correct).length;
  const lastResult = results[index];
  const roomType: GameType = answerMode === 'typed' ? 'photo_typed' : 'photo';

  const botSim = useBotSimulation({
    difficulty: (multiplayer.opponent?.bot_difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    gameType: 'photo',
    totalRegions: total,
    botPlayerId: multiplayer.opponent?.is_bot ? multiplayer.opponent.id : null,
    isActive: gameStarted && isMultiplayer && !!multiplayer.opponent?.is_bot,
    onUpdate: multiplayer.patchOpponent,
  });

  const resetRound = useCallback(() => {
    setIndex(0);
    setPhase('answering');
    setPicked(null);
    setTyped('');
    setResults([]);
    finishedRef.current = false;
  }, []);

  const handleConfigConfirm = useCallback(async (config: GameConfig) => {
    if (config.mode !== 'solo' && !user) {
      toast.error(language === 'bg' ? 'Влез в профила си, за да играеш този режим.' : 'Sign in to play this mode.');
      return;
    }
    const mode: AnswerMode = config.answerMode ?? 'choice';
    setGameMode(config.mode);
    setAnswerMode(mode);
    setTimerSeconds(config.timerSeconds);
    setTimeLeft(config.timerSeconds);
    setRounds(buildRounds());
    resetRound();
    setShowConfig(false);

    const type: GameType = mode === 'typed' ? 'photo_typed' : 'photo';
    if (config.mode === 'solo') {
      setGameStarted(true);
    } else if (config.mode === 'multiplayer') {
      if (config.multiplayerType === 'invite') {
        await multiplayer.createInvite(type, config.timerSeconds);
      } else if (config.multiplayerType === 'join' && config.inviteCode) {
        const found = await multiplayer.joinByCode(config.inviteCode, type, config.timerSeconds);
        if (!found) {
          toast.error(language === 'bg' ? 'Играта не е намерена' : 'Game not found');
          setShowConfig(true);
          return;
        }
        // The friend who made the code chose the mode: play the same one.
        const { data: room } = await supabase.from('game_rooms').select('game_type').eq('invite_code', config.inviteCode).maybeSingle();
        if (room?.game_type === 'photo' || room?.game_type === 'photo_typed') {
          setAnswerMode(room.game_type === 'photo_typed' ? 'typed' : 'choice');
        } else if (room?.game_type) {
          toast.error(language === 'bg' ? 'Този код е за друга игра.' : 'This code is for a different game.');
          void multiplayer.finishGame();
          setShowConfig(true);
        }
      } else {
        await multiplayer.startSearch(type, config.timerSeconds);
      }
    } else {
      try {
        await multiplayer.createBotGame(type, config.timerSeconds, config.botDifficulty || 'medium');
      } catch {
        toast.error(language === 'bg' ? 'Ботът не можа да стартира. Опитай отново.' : 'The bot could not start. Please try again.');
        setShowConfig(true);
      }
    }
  }, [user, language, multiplayer, resetRound]);

  // Multiplayer and bot games start when the countdown ends.
  useEffect(() => {
    if (multiplayer.isConnected && !gameStarted && isMultiplayer) setGameStarted(true);
  }, [multiplayer.isConnected, gameStarted, isMultiplayer]);

  const finish = useCallback((byTimer: boolean) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    if (!byTimer) void awardGameComplete();
    if (isMultiplayer) {
      void multiplayer.finishGame();
      window.setTimeout(() => setShowMultiplayerEnd(true), 800);
    } else {
      setShowCompletion(true);
    }
  }, [awardGameComplete, isMultiplayer, multiplayer]);

  // Game timer (paused while an answer is being checked, so a slow check costs nothing).
  useEffect(() => {
    if (!gameStarted || timeLeft === null || timeLeft <= 0 || phase === 'checking' || finishedRef.current) return;
    const id = window.setInterval(() => setTimeLeft((prev) => (prev === null ? null : Math.max(0, prev - 1))), 1000);
    return () => window.clearInterval(id);
  }, [gameStarted, timeLeft, phase]);

  useEffect(() => {
    if (gameStarted && timeLeft === 0 && !finishedRef.current) {
      finish(true);
    }
  }, [gameStarted, timeLeft, finish]);

  // Load the next photo in the background so it appears without a wait.
  useEffect(() => {
    const next = rounds[index + 1];
    if (next) {
      const img = new Image();
      img.src = next.question.image;
    }
  }, [rounds, index]);

  const record = useCallback(async (correct: boolean, given: string) => {
    const nextResults = [...results];
    nextResults[index] = { correct, given };
    setResults(nextResults);
    setPhase('revealed');
    if (correct) {
      void awardCorrectAnswer(1);
    }
    if (isMultiplayer) {
      const totalCorrect = nextResults.filter((r) => r?.correct).length;
      void multiplayer.updateProgress({
        regions_completed: nextResults.length,
        total_correct: totalCorrect,
        score: totalCorrect * 10,
        current_question: nextResults.length,
      });
    }
  }, [results, index, awardCorrectAnswer, isMultiplayer, multiplayer]);

  const goNext = useCallback(() => {
    if (advanceTimerRef.current) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
    if (finishedRef.current) return;
    if (index >= total - 1) {
      finish(false);
      return;
    }
    setIndex((i) => i + 1);
    setPhase('answering');
    setPicked(null);
    setTyped('');
  }, [index, total, finish]);

  const goNextRef = useRef(goNext);
  goNextRef.current = goNext;
  useEffect(() => () => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
  }, []);

  // Easy mode: picking an option answers at once, then the next photo follows by itself.
  const choose = useCallback((option: number) => {
    if (phase !== 'answering' || !round) return;
    setPicked(option);
    void record(option === round.correctIndex, round.options[language][option]);
    advanceTimerRef.current = window.setTimeout(goNextRef.current, CHOICE_ADVANCE_MS);
  }, [phase, round, language, record]);

  // Advanced mode: check the typed answer (on the device, then with the AI if needed).
  const submitTyped = useCallback(async (skip = false) => {
    if (phase !== 'answering' || !round) return;
    const text = skip ? '' : typed.trim();
    if (!skip && !text) {
      inputRef.current?.focus();
      return;
    }
    if (skip) {
      void record(false, '');
      return;
    }
    setPhase('checking');
    const verdict = await checkTypedAnswer({
      typed: text,
      question: round.question.question[language],
      accepted: [round.question.answer[language], ...round.question.accepts[language]],
      lang: language,
    });
    void record(verdict.correct, text);
  }, [phase, round, typed, language, record]);

  // After a typed answer is revealed, the Next button takes focus so Enter moves on.
  useEffect(() => {
    if (phase === 'revealed' && answerMode === 'typed') nextButtonRef.current?.focus();
    if (phase === 'answering' && answerMode === 'typed' && gameStarted) inputRef.current?.focus();
  }, [phase, answerMode, gameStarted, index]);

  // Easy mode keys: 1–4 pick an option.
  useEffect(() => {
    if (!gameStarted || answerMode !== 'choice') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const n = Number(e.key);
      if (n >= 1 && n <= 4) choose(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [gameStarted, answerMode, choose]);

  // Multiplayer: show the comparison once both players are done.
  useEffect(() => {
    if (isMultiplayer && multiplayer.opponent?.is_finished && finishedRef.current) setShowMultiplayerEnd(true);
  }, [isMultiplayer, multiplayer.opponent?.is_finished]);

  const handleRestart = () => {
    if (advanceTimerRef.current) window.clearTimeout(advanceTimerRef.current);
    setShowCompletion(false);
    setShowMultiplayerEnd(false);
    setGameStarted(false);
    setRounds(buildRounds());
    resetRound();
    setTimeLeft(timerSeconds);
    botSim.reset();
    setShowConfig(true);
  };

  const handleExitConfirm = () => {
    if (isMultiplayer) void multiplayer.finishGame();
    navigate('/games');
  };

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;

  const missed = useMemo(
    () => results.map((r, i) => ({ r, round: rounds[i] })).filter(({ r }) => r && !r.correct),
    [results, rounds],
  );

  const title = language === 'bg' ? 'Познай мястото' : 'Guess the Place';
  const subtitle = answerMode === 'typed'
    ? (language === 'bg' ? 'Напреднало · напиши отговора' : 'Advanced · type the answer')
    : (language === 'bg' ? 'Лесно · избери отговор' : 'Easy · choose an answer');
  const correctAnswer = round?.question.answer[language] ?? '';
  const labels = language === 'bg' ? LABELS : LABELS_EN;

  return (
    <main className="game-shell photo-quiz relative w-full min-h-[100svh] bg-background overflow-x-hidden">
      <div className="game-shell__grain cinematic-intro__grain" aria-hidden="true" />
      {!gameStarted && <h1 className="sr-only">{title}</h1>}

      <GameConfigDialog open={showConfig} onConfirm={handleConfigConfirm} gameType="photo" />

      {multiplayer.isSearching && (
        <MatchmakingOverlay
          timeLeft={multiplayer.searchTimeLeft}
          onCancel={() => { multiplayer.cancelSearch(); setShowConfig(true); }}
          inviteCode={multiplayer.inviteCode}
        />
      )}

      {multiplayer.showCountdown && multiplayer.opponent && (
        <CountdownOverlay opponentName={multiplayer.opponent.display_name} onComplete={multiplayer.onCountdownComplete} />
      )}

      {gameStarted && round && (
        <>
          <header className="sticky top-0 z-10 p-2 sm:p-4 animate-fade-in">
            <div className="game-hud flex items-center justify-between max-w-5xl mx-auto p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                <div className="p-1.5 sm:p-2 rounded-xl glass-button-primary">
                  <Camera className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <h1 className="game-display text-base sm:text-2xl text-foreground truncate">{title}</h1>
                  <p className="hidden sm:block text-xs sm:text-sm text-muted-foreground">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm">
                {timeLeft !== null && (
                  <div className={cn('glass-tag', timeLeft <= 10 && 'bg-destructive/20 text-destructive animate-pulse-glow')}>
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" aria-hidden="true" />
                    <span className="font-semibold">{formatTime(timeLeft)}</span>
                  </div>
                )}
                <div className="glass-tag" aria-label={language === 'bg' ? `Снимка ${index + 1} от ${total}` : `Photo ${index + 1} of ${total}`}>
                  <span className="font-semibold text-foreground">{index + 1}/{total}</span>
                </div>
                <div className="glass-tag bg-success/15">
                  <Check className="w-3 h-3 sm:w-4 sm:h-4 mr-1 text-success" aria-hidden="true" />
                  <span className="font-semibold text-success">{correctCount}</span>
                  <span className="sr-only">{language === 'bg' ? ' верни' : ' correct'}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowExitDialog(true); }}
                  className="gap-1 sm:gap-2 glass-button hover:bg-destructive/20 hover:text-destructive hover:border-destructive/40 transition-interactive text-xs sm:text-sm px-2 sm:px-3"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{t.endGame}</span>
                </Button>
              </div>
            </div>
          </header>

          {isMultiplayer && multiplayer.opponent && (
            <div className="photo-quiz__opponent">
              <OpponentProgress
                displayName={multiplayer.opponent.display_name}
                isBot={multiplayer.opponent.is_bot}
                score={multiplayer.opponent.score}
                regionsCompleted={multiplayer.opponent.regions_completed}
                currentRegion={multiplayer.opponent.current_region}
                totalCorrect={multiplayer.opponent.total_correct}
                isFinished={multiplayer.opponent.is_finished}
                gameType="photo"
                totalRegions={total}
              />
            </div>
          )}

          <section className="relative z-[1] max-w-3xl mx-auto px-3 sm:px-4 pb-8" aria-live="polite">
            <div className="photo-quiz__progress" aria-hidden="true">
              <span style={{ transform: `scaleX(${answered / total})` }} />
            </div>

            <article className="quiz-popup-card photo-quiz__card" key={round.question.id}>
              <div className="photo-quiz__frame">
                <Photo src={round.question.image} number={round.number} language={language} />
              </div>

              <div className={cn('p-4 sm:p-6', index > 0 && 'quiz-step-in')}>
                <h2 className="text-lg sm:text-xl font-semibold text-foreground mb-4">{round.question.question[language]}</h2>

                {answerMode === 'choice' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {round.options[language].map((option, i) => {
                      const revealed = phase !== 'answering';
                      const isCorrect = i === round.correctIndex;
                      const isPicked = picked === i;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => { choose(i); }}
                          disabled={revealed}
                          className={cn('quiz-answer-option', revealed && isCorrect && 'revealed-correct', revealed && isPicked && !isCorrect && 'incorrect')}
                          style={{ '--i': i } as React.CSSProperties}
                        >
                          <span className="flex items-center gap-3">
                            <span className="font-semibold text-muted-foreground">{labels[i]}</span>
                            <span className="text-foreground text-left">{option}</span>
                            {revealed && isCorrect && <Check className="icon-pop w-5 h-5 text-success ml-auto shrink-0" aria-hidden="true" />}
                            {revealed && isPicked && !isCorrect && <XCircle className="icon-pop w-5 h-5 text-destructive ml-auto shrink-0" aria-hidden="true" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <form
                    className="space-y-3"
                    onSubmit={(e) => { e.preventDefault(); void submitTyped(); }}
                  >
                    <label htmlFor="photo-answer" className="sr-only">{language === 'bg' ? 'Твоят отговор' : 'Your answer'}</label>
                    <Input
                      id="photo-answer"
                      ref={inputRef}
                      value={typed}
                      onChange={(e) => setTyped(e.target.value)}
                      disabled={phase !== 'answering'}
                      maxLength={80}
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      enterKeyHint="send"
                      placeholder={language === 'bg' ? 'Напиши какво е на снимката…' : 'Type what is in the photo…'}
                      className={cn(
                        'h-12 text-base glass-input',
                        lastResult && phase === 'revealed' && (lastResult.correct ? 'border-success/60' : 'border-destructive/60'),
                      )}
                    />
                    {phase !== 'revealed' && (
                      <div className="flex gap-2">
                        <Button type="submit" className="flex-1 glass-button-primary" disabled={phase === 'checking' || !typed.trim()}>
                          {phase === 'checking' ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />{language === 'bg' ? 'Проверяваме…' : 'Checking…'}</>
                          ) : (language === 'bg' ? 'Провери' : 'Check')}
                        </Button>
                        <Button type="button" variant="outline" className="glass-button" disabled={phase === 'checking'} onClick={() => void submitTyped(true)}>
                          {language === 'bg' ? 'Не знам' : "I don't know"}
                        </Button>
                      </div>
                    )}
                  </form>
                )}

                {phase === 'revealed' && lastResult && (
                  <div
                    className={cn(
                      'mt-4 p-4 rounded-2xl text-center feedback-in',
                      lastResult.correct ? 'bg-success/20 text-success border border-success/30' : 'bg-destructive/20 text-destructive border border-destructive/30',
                    )}
                    role="status"
                  >
                    <p className="font-semibold">{lastResult.correct ? t.correctAnswer : t.wrongAnswer}</p>
                    {(answerMode === 'typed' || !lastResult.correct) && (
                      <p className="mt-1 text-sm text-foreground">
                        {language === 'bg' ? 'Отговорът е: ' : 'The answer is: '}
                        <strong>{correctAnswer}</strong>
                      </p>
                    )}
                  </div>
                )}

                {phase === 'revealed' && answerMode === 'typed' && (
                  <div className="flex justify-end mt-4">
                    <Button ref={nextButtonRef} onClick={goNext} className="px-6 glass-button-primary">
                      {index >= total - 1 ? t.finish : t.nextQuestion}
                    </Button>
                  </div>
                )}
              </div>
            </article>
          </section>
        </>
      )}

      {/* Solo results */}
      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
        <DialogContent className="editorial-dialog sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-full glass-button-primary animate-pulse-glow">
                <Trophy className="w-12 h-12 text-primary-foreground" aria-hidden="true" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">{timeLeft === 0 ? t.timeUp : t.bravo}</DialogTitle>
            <DialogDescription className="text-center text-lg">
              {t.answeredCorrectly}: <span className="font-bold text-foreground">{correctCount}/{total}</span>
            </DialogDescription>
          </DialogHeader>

          {missed.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">{language === 'bg' ? 'Да запомним' : 'Worth remembering'}</h3>
              <ul className="space-y-1.5 text-sm max-h-52 overflow-y-auto pr-1">
                {missed.map(({ r, round: rd }) => (
                  <li key={rd.question.id} className="flex gap-2">
                    <span className="text-muted-foreground tabular-nums shrink-0">{String(rd.number).padStart(2, '0')}</span>
                    <span>
                      <span className="text-foreground font-medium">{rd.question.answer[language]}</span>
                      {r.given && <span className="text-muted-foreground"> · {language === 'bg' ? 'твоят отговор' : 'you said'}: {r.given}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex gap-4 pt-2">
            <Button onClick={handleRestart} size="lg" className="flex-1 glass-button-primary">{t.tryAgain}</Button>
            <Button onClick={() => navigate('/games')} variant="outline" size="lg" className="flex-1 glass-button">
              {language === 'bg' ? 'Към игрите' : 'Games'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {isMultiplayer && (
        <MultiplayerEndScreen
          open={showMultiplayerEnd}
          gameType="photo"
          myResult={{
            displayName: user?.user_metadata?.display_name || 'You',
            isBot: false,
            totalCorrect: correctCount,
            regionsCompleted: answered,
            regionResults: {},
            finishedAt: new Date().toISOString(),
          }}
          opponentResult={{
            displayName: multiplayer.opponent?.display_name || 'Opponent',
            isBot: multiplayer.opponent?.is_bot || false,
            totalCorrect: multiplayer.opponent?.total_correct || 0,
            regionsCompleted: multiplayer.opponent?.regions_completed || 0,
            regionResults: {},
            finishedAt: multiplayer.opponent?.finished_at || null,
          }}
          onRestart={handleRestart}
          onHome={() => navigate('/games')}
          totalRegions={total}
        />
      )}

      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="editorial-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t.confirmLeave}</DialogTitle>
            <DialogDescription className="sr-only">{t.confirmLeave}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 pt-4">
            <Button variant="outline" onClick={() => { setShowExitDialog(false); }} className="flex-1 glass-button">{t.no}</Button>
            <Button onClick={() => { handleExitConfirm(); }} className="flex-1 bg-destructive hover:bg-destructive/90 transition-interactive">{t.yes}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default PhotoQuiz;
