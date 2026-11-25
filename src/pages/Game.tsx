import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import BulgariaMap from '@/components/BulgariaMap';
import QuizPopup from '@/components/QuizPopup';
import GameConfigDialog, { GameConfig } from '@/components/GameConfigDialog';
import MatchmakingOverlay from '@/components/MatchmakingOverlay';
import CountdownOverlay from '@/components/CountdownOverlay';
import OpponentProgress from '@/components/OpponentProgress';
import MultiplayerEndScreen from '@/components/MultiplayerEndScreen';
import { regionsData } from '@/data/questions';
import { MapPin, Trophy, LogOut, Timer, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePoints } from '@/contexts/PointsContext';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useBotSimulation } from '@/hooks/useBotSimulation';
import { toast } from 'sonner';
import { useSeo } from "@/seo/useSeo";

interface RegionResult {
  score: number;
  total: number;
}

const Game = () => {
  useSeo('/game');
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, markRegionCompleted } = useAuth();
  const { awardCorrectAnswer, awardGameComplete } = usePoints();
  
  const [showConfig, setShowConfig] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer' | 'bot'>('solo');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [gameSessionId, setGameSessionId] = useState<number>(Date.now());
  
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, RegionResult>>({});
  const [isClosing, setIsClosing] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [lockedRegions, setLockedRegions] = useState<Set<string>>(new Set());
  const [showMultiplayerEnd, setShowMultiplayerEnd] = useState(false);
  const [showMapReview, setShowMapReview] = useState(false);
  const completionHandledRef = useRef(false);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const multiplayer = useMultiplayer();

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    };
  }, []);
  const totalRegions = Object.keys(regionsData).length;

  const botSim = useBotSimulation({
    difficulty: (multiplayer.opponent?.bot_difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    gameType: 'quiz',
    totalRegions,
    botPlayerId: multiplayer.opponent?.is_bot ? multiplayer.opponent.id : null,
    isActive: gameStarted && gameMode !== 'solo' && !!multiplayer.opponent?.is_bot,
    onUpdate: multiplayer.patchOpponent,
  });

  const isMultiplayer = gameMode !== 'solo';

  const handleConfigConfirm = useCallback(async (config: GameConfig) => {
    if (config.mode !== 'solo' && !user) {
      toast.error(language === 'bg' ? 'Влез в профила си, за да играеш този режим.' : 'Sign in to play this mode.');
      return;
    }
    setGameMode(config.mode);
    setTimerSeconds(config.timerSeconds);
    setTimeLeft(config.timerSeconds);
    setShowConfig(false);
    setGameSessionId(Date.now());
    setLockedRegions(new Set());
    setResults({});
    completionHandledRef.current = false;

    if (config.mode === 'solo') {
      setGameStarted(true);
    } else if (config.mode === 'multiplayer') {
      if (config.multiplayerType === 'invite') {
        await multiplayer.createInvite('quiz', config.timerSeconds);
      } else if (config.multiplayerType === 'join' && config.inviteCode) {
        const found = await multiplayer.joinByCode(config.inviteCode, 'quiz', config.timerSeconds);
        if (!found) {
          toast.error(language === 'bg' ? 'Играта не е намерена' : 'Game not found');
          setShowConfig(true);
          return;
        }
      } else {
        await multiplayer.startSearch('quiz', config.timerSeconds);
      }
    } else if (config.mode === 'bot') {
      try {
        await multiplayer.createBotGame('quiz', config.timerSeconds, config.botDifficulty || 'medium');
      } catch {
        toast.error(language === 'bg' ? 'Ботът не можа да стартира. Опитай отново.' : 'The bot could not start. Please try again.');
        setShowConfig(true);
      }
    }
  }, [multiplayer, user, language]);

  // When countdown completes, start game
  useEffect(() => {
    if (multiplayer.isConnected && !gameStarted && gameMode !== 'solo') {
      setGameStarted(true);
    }
  }, [multiplayer.isConnected, gameStarted, gameMode]);

  useEffect(() => {
    if (!gameStarted || timeLeft === null || timeLeft <= 0 || selectedRegion) return;
    const interval = setInterval(() => setTimeLeft(prev => prev === null ? null : Math.max(0, prev - 1)), 1000);

    return () => clearInterval(interval);
  }, [gameStarted, timeLeft, selectedRegion]);

  useEffect(() => {
    if (!gameStarted || timeLeft !== 0 || completionHandledRef.current) return;
    completionHandledRef.current = true;
    if (isMultiplayer) {
      void multiplayer.finishGame();
      setShowMultiplayerEnd(true);
    } else {
      setShowCompletionDialog(true);
    }
  }, [gameStarted, timeLeft, isMultiplayer, multiplayer]);

  const handleRegionClick = useCallback((regionId: string) => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
    if (lockedRegions.has(regionId)) {
      toast.info(language === 'bg' ? 'Област заключена' : 'Region locked', {
        position: 'top-center',
      });
      return;
    }

    if (regionsData[regionId]) {
      setSelectedRegion(regionId);
      setIsClosing(false);
      
      if (isMultiplayer) {
        multiplayer.updateProgress({ current_region: regionId });
      }
    }
  }, [lockedRegions, language, isMultiplayer, multiplayer]);

  const handleClosePopup = useCallback(() => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    setIsClosing(true);
    closeTimeoutRef.current = setTimeout(() => {
      setSelectedRegion(null);
      setIsClosing(false);
      closeTimeoutRef.current = null;
    }, 500);
  }, []);

  const handleComplete = useCallback(async (score: number, total: number) => {
    if (selectedRegion) {
      setResults((prev) => ({
        ...prev,
        [selectedRegion]: { score, total },
      }));
      
      setLockedRegions(prev => new Set([...prev, selectedRegion]));
      
      if (score > 0) {
        await awardCorrectAnswer(score);
      }
      
      if (user) {
        await markRegionCompleted(selectedRegion);
      }

      if (isMultiplayer) {
        const newResults = { ...results, [selectedRegion]: { score, total } };
        const totalCorrect = Object.values(newResults).reduce((sum, r) => sum + r.score, 0);
        await multiplayer.updateProgress({
          regions_completed: Object.keys(newResults).length,
          total_correct: totalCorrect,
          score: totalCorrect * 10,
          region_results: newResults,
          current_region: null,
        });
      }
    }
    handleClosePopup();
  }, [selectedRegion, handleClosePopup, awardCorrectAnswer, user, markRegionCompleted, isMultiplayer, multiplayer, results]);

  const completedCount = Object.keys(results).length;
  const perfectCount = Object.values(results).filter((r) => r.score === r.total).length;
  const totalCorrect = Object.values(results).reduce((sum, r) => sum + r.score, 0);
  const totalQuestions = totalRegions * 3;

  // Check game completion
  useEffect(() => {
    if (completedCount === totalRegions && completedCount > 0 && !completionHandledRef.current) {
      completionHandledRef.current = true;
      awardGameComplete();
      if (isMultiplayer) {
        multiplayer.finishGame();
        // Wait a moment for opponent data to sync
        setTimeout(() => setShowMultiplayerEnd(true), 1000);
      } else {
        setShowCompletionDialog(true);
      }
    }
  }, [completedCount, totalRegions, awardGameComplete, isMultiplayer, multiplayer]);

  // Check if opponent finished (multiplayer)
  useEffect(() => {
    if (isMultiplayer && multiplayer.opponent?.is_finished && completedCount === totalRegions) {
      setShowMultiplayerEnd(true);
    }
  }, [isMultiplayer, multiplayer.opponent?.is_finished, completedCount, totalRegions]);

  const handleRestart = () => {
    setResults({});
    setShowCompletionDialog(false);
    setShowMultiplayerEnd(false);
    setShowMapReview(false);
    setTimeLeft(timerSeconds);
    setShowConfig(true);
    setGameStarted(false);
    setGameSessionId(Date.now());
    setLockedRegions(new Set());
    completionHandledRef.current = false;
    botSim.reset();
  };

  const handleExitConfirm = () => {
    if (isMultiplayer) multiplayer.finishGame();
    navigate('/games');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const displayResults = useMemo(() => {
    const merged = { ...results };
    lockedRegions.forEach(regionId => {
      if (!merged[regionId]) {
        merged[regionId] = { score: 0, total: 3 };
      }
    });
    return merged;
  }, [results, lockedRegions]);

  return (
    <main className="game-shell relative w-full h-screen bg-background overflow-hidden">
      <div className="game-shell__grain cinematic-intro__grain" aria-hidden="true" />
      {/* The visible heading appears once a game starts; until then this names the page. */}
      {!gameStarted && <h1 className="sr-only">{t.bulgariaQuiz}</h1>}

      <GameConfigDialog open={showConfig} onConfirm={handleConfigConfirm} gameType="quiz" />

      {multiplayer.isSearching && (
        <MatchmakingOverlay
          timeLeft={multiplayer.searchTimeLeft}
          onCancel={() => { multiplayer.cancelSearch(); setShowConfig(true); }}
          inviteCode={multiplayer.inviteCode}
        />
      )}

      {multiplayer.showCountdown && multiplayer.opponent && (
        <CountdownOverlay
          opponentName={multiplayer.opponent.display_name}
          onComplete={multiplayer.onCountdownComplete}
        />
      )}

      {gameStarted && (
        <>
           <header className="absolute top-0 left-0 right-0 z-10 p-2 sm:p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="game-hud flex items-center justify-between max-w-7xl mx-auto p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl glass-button-primary">
                  <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="game-display text-xl sm:text-2xl text-foreground">{t.bulgariaQuiz}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t.geographyQuiz}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-3 text-xs sm:text-sm">
                {timeLeft !== null && (
                  <div className={`glass-tag ${timeLeft <= 10 ? 'bg-destructive/20 text-destructive animate-pulse-glow' : ''}`}>
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    <span className="font-semibold">{formatTime(timeLeft)}</span>
                  </div>
                )}
                <div className="glass-tag">
                  <span className="hidden sm:inline text-muted-foreground mr-1">{t.completed}: </span>
                  <span className="font-semibold text-foreground">{completedCount}/{totalRegions}</span>
                </div>
                {perfectCount > 0 && (
                  <div className="glass-tag bg-success/20">
                    <span className="text-success font-semibold">🏆 {perfectCount}</span>
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setShowExitDialog(true); }}
                  className="gap-1 sm:gap-2 glass-button hover:bg-destructive/20 hover:text-destructive hover:border-destructive/40 transition-interactive text-xs sm:text-sm px-2 sm:px-3"
                >
                  <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">{t.endGame}</span>
                </Button>
              </div>
            </div>
          </header>

          {/* Opponent progress panel */}
          {isMultiplayer && multiplayer.opponent && (
            <div className="absolute top-20 sm:top-24 left-2 sm:left-4 z-10 w-44 sm:w-56 animate-fade-in">
              <OpponentProgress
                displayName={multiplayer.opponent.display_name}
                isBot={multiplayer.opponent.is_bot}
                score={multiplayer.opponent.score}
                regionsCompleted={multiplayer.opponent.regions_completed}
                currentRegion={multiplayer.opponent.current_region}
                totalCorrect={multiplayer.opponent.total_correct}
                isFinished={multiplayer.opponent.is_finished}
                gameType="quiz"
                totalRegions={totalRegions}
              />
            </div>
          )}

           <div className="game-map-stage flex items-center justify-center w-full h-full p-2 sm:p-8 pt-20 sm:pt-28 animate-scale-in" style={{ animationDelay: '0.2s' }}>
            <BulgariaMap 
              onRegionClick={handleRegionClick} 
              results={displayResults}
              lockedRegions={lockedRegions}
            />
          </div>

          <div className="game-side-panel absolute bottom-4 left-2 sm:left-4 p-2 sm:p-4 animate-slide-up hidden sm:block" style={{ animationDelay: '0.3s' }}>
            <h3 className="text-sm font-semibold text-foreground mb-3">{t.legend}</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-lg bg-map-perfect" />
                <span className="text-muted-foreground">{t.correct3}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-lg bg-map-good" />
                <span className="text-muted-foreground">{t.correct2}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-lg bg-map-poor" />
                <span className="text-muted-foreground">{t.correct01}</span>
              </div>
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {language === 'bg' ? 'Заключена' : 'Locked'}
                </span>
              </div>
            </div>
          </div>

          <div className="game-side-panel absolute bottom-4 right-2 sm:right-4 p-2 sm:p-4 max-w-xs animate-slide-up hidden sm:block" style={{ animationDelay: '0.4s' }}>
            <p className="text-sm text-muted-foreground">{t.clickRegion}</p>
          </div>
        </>
      )}

      {selectedRegion && regionsData[selectedRegion] && (
        <QuizPopup
          key={`${selectedRegion}-${gameSessionId}`}
          region={regionsData[selectedRegion]}
          onClose={handleClosePopup}
          onComplete={handleComplete}
          isClosing={isClosing}
        />
      )}

      {/* Solo completion */}
      <Dialog open={showCompletionDialog} onOpenChange={(open) => {
        setShowCompletionDialog(open);
        if (!open) setShowMapReview(true);
      }}>
        <DialogContent className="editorial-dialog sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center justify-center mb-4">
              <div className="p-4 rounded-full glass-button-primary animate-pulse-glow">
                <Trophy className="w-12 h-12 text-primary-foreground" />
              </div>
            </div>
            <DialogTitle className="text-center text-2xl">
              {timeLeft === 0 ? t.timeUp : t.bravo}
            </DialogTitle>
            <DialogDescription className="sr-only">{t.answeredCorrectly}: {totalCorrect}/{totalQuestions}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-lg text-muted-foreground">
                {t.answeredCorrectly}: <span className="font-bold text-foreground">{totalCorrect}/{totalQuestions}</span>
              </p>
              <p className="text-lg text-muted-foreground">
                {t.perfectRegions}: <span className="font-bold text-foreground">{perfectCount}/{totalRegions}</span>
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Button onClick={handleRestart} size="lg" className="flex-1 glass-button-primary">
              {t.tryAgain}
            </Button>
            <Button onClick={() => {
              setShowCompletionDialog(false);
              setShowMapReview(true);
            }} variant="outline" size="lg" className="flex-1 glass-button">
              {language === 'bg' ? 'Виж картата' : 'View Map'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Map review after completion */}
      {showMapReview && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-3 animate-fade-in">
          <Button onClick={handleRestart} className="glass-button-primary">
            {t.tryAgain}
          </Button>
          <Button onClick={() => navigate('/games')} variant="outline" className="glass-button">
            {language === 'bg' ? 'Към игрите' : 'Games'}
          </Button>
        </div>
      )}

      {/* Multiplayer end screen */}
      {isMultiplayer && (
        <MultiplayerEndScreen
          open={showMultiplayerEnd}
          gameType="quiz"
          myResult={{
            displayName: user?.user_metadata?.display_name || 'You',
            isBot: false,
            totalCorrect,
            regionsCompleted: completedCount,
            regionResults: results,
            finishedAt: new Date().toISOString(),
          }}
          opponentResult={{
            displayName: multiplayer.opponent?.display_name || 'Opponent',
            isBot: multiplayer.opponent?.is_bot || false,
            totalCorrect: multiplayer.opponent?.total_correct || 0,
            regionsCompleted: multiplayer.opponent?.regions_completed || 0,
            regionResults: multiplayer.opponent?.region_results || {},
            finishedAt: multiplayer.opponent?.finished_at || null,
          }}
          onRestart={handleRestart}
          onHome={() => navigate('/games')}
          totalRegions={totalRegions}
        />
      )}

      {/* Exit dialog */}
      <Dialog open={showExitDialog} onOpenChange={setShowExitDialog}>
        <DialogContent className="editorial-dialog sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t.confirmLeave}</DialogTitle>
            <DialogDescription className="sr-only">{t.confirmLeave}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              onClick={() => { setShowExitDialog(false); }} 
              className="flex-1 glass-button"
            >
              {t.no}
            </Button>
            <Button 
              onClick={() => { handleExitConfirm(); }} 
              className="flex-1 bg-destructive hover:bg-destructive/90 transition-interactive"
            >
              {t.yes}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default Game;
