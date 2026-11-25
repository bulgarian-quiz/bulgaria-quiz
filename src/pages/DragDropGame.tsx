import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTouchMode } from '@/hooks/useTouchMode';
import { MapPin, Trophy, LogOut, Timer } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePoints } from '@/contexts/PointsContext';
import { useAuth } from '@/contexts/AuthContext';
import GameConfigDialog, { GameConfig } from '@/components/GameConfigDialog';
import MatchmakingOverlay from '@/components/MatchmakingOverlay';
import OpponentProgress from '@/components/OpponentProgress';
import MultiplayerEndScreen from '@/components/MultiplayerEndScreen';
import CountdownOverlay from '@/components/CountdownOverlay';
import { useMultiplayer } from '@/hooks/useMultiplayer';
import { useBotSimulation } from '@/hooks/useBotSimulation';
import { toast } from 'sonner';
import RegionAtlas from '@/components/RegionAtlas';
import { useSeo } from "@/seo/useSeo";

interface RegionData {
  id: string;
  name: { bg: string; en: string };
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TouchDragSession {
  pointerId: number;
  regionId: string;
  startX: number;
  startY: number;
  moved: boolean;
}

const regions: RegionData[] = [
  { id: 'vidin', name: { bg: 'Видин', en: 'Vidin' }, x: 4, y: 10, width: 10, height: 15 },
  { id: 'montana', name: { bg: 'Монтана', en: 'Montana' }, x: 12, y: 20, width: 9, height: 12 },
  { id: 'vratsa', name: { bg: 'Враца', en: 'Vratsa' }, x: 18, y: 27, width: 10, height: 12 },
  { id: 'pleven', name: { bg: 'Плевен', en: 'Pleven' }, x: 28, y: 18, width: 16, height: 15 },
  { id: 'lovech', name: { bg: 'Ловеч', en: 'Lovech' }, x: 29, y: 34, width: 14, height: 14 },
  { id: 'velikoTarnovo', name: { bg: 'В. Търново', en: 'V. Tarnovo' }, x: 44, y: 29, width: 13, height: 12 },
  { id: 'gabrovo', name: { bg: 'Габрово', en: 'Gabrovo' }, x: 42, y: 40, width: 11, height: 10 },
  { id: 'ruse', name: { bg: 'Русе', en: 'Ruse' }, x: 50, y: 16, width: 12, height: 11 },
  { id: 'razgrad', name: { bg: 'Разград', en: 'Razgrad' }, x: 61, y: 21, width: 9, height: 9 },
  { id: 'targovishte', name: { bg: 'Търговище', en: 'Targovishte' }, x: 57, y: 29, width: 10, height: 10 },
  { id: 'silistra', name: { bg: 'Силистра', en: 'Silistra' }, x: 64, y: 9, width: 14, height: 11 },
  { id: 'dobrich', name: { bg: 'Добрич', en: 'Dobrich' }, x: 78, y: 12, width: 14, height: 13 },
  { id: 'shumen', name: { bg: 'Шумен', en: 'Shumen' }, x: 66, y: 27, width: 11, height: 12 },
  { id: 'varna', name: { bg: 'Варна', en: 'Varna' }, x: 73, y: 26, width: 14, height: 15 },
  { id: 'sofiaProvince', name: { bg: 'С. област', en: 'Sofia Prov.' }, x: 10, y: 35, width: 14, height: 13 },
  { id: 'pernik', name: { bg: 'Перник', en: 'Pernik' }, x: 6, y: 47, width: 10, height: 11 },
  { id: 'sofiaCity', name: { bg: 'София', en: 'Sofia' }, x: 16, y: 47, width: 6, height: 6 },
  { id: 'kyustendil', name: { bg: 'Кюстендил', en: 'Kyustendil' }, x: 6, y: 58, width: 12, height: 12 },
  { id: 'blagoevgrad', name: { bg: 'Благоевград', en: 'Blagoevgrad' }, x: 10, y: 68, width: 14, height: 20 },
  { id: 'pazardzhik', name: { bg: 'Пазарджик', en: 'Pazardzhik' }, x: 24, y: 58, width: 12, height: 13 },
  { id: 'plovdiv', name: { bg: 'Пловдив', en: 'Plovdiv' }, x: 33, y: 55, width: 13, height: 14 },
  { id: 'smolyan', name: { bg: 'Смолян', en: 'Smolyan' }, x: 30, y: 74, width: 14, height: 14 },
  { id: 'staraZagora', name: { bg: 'Ст. Загора', en: 'St. Zagora' }, x: 44, y: 51, width: 14, height: 14 },
  { id: 'sliven', name: { bg: 'Сливен', en: 'Sliven' }, x: 56, y: 42, width: 13, height: 14 },
  { id: 'haskovo', name: { bg: 'Хасково', en: 'Haskovo' }, x: 46, y: 67, width: 15, height: 13 },
  { id: 'kardzhali', name: { bg: 'Кърджали', en: 'Kardzhali' }, x: 42, y: 78, width: 13, height: 12 },
  { id: 'yambol', name: { bg: 'Ямбол', en: 'Yambol' }, x: 60, y: 55, width: 12, height: 13 },
  { id: 'burgas', name: { bg: 'Бургас', en: 'Burgas' }, x: 68, y: 42, width: 20, height: 24 },
];

const DragDropGame = () => {
  useSeo('/drag-drop-game');
  const navigate = useNavigate();
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const { awardRegionPlaced, awardGameComplete } = usePoints();
  
  const [showConfig, setShowConfig] = useState(true);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameMode, setGameMode] = useState<'solo' | 'multiplayer' | 'bot'>('solo');
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [placedRegions, setPlacedRegions] = useState<Record<string, boolean>>({});
  const [draggedRegion, setDraggedRegion] = useState<string | null>(null);
  const [touchDragPosition, setTouchDragPosition] = useState<{ x: number; y: number } | null>(null);
  const isTouch = useTouchMode();
  const [showExitDialog, setShowExitDialog] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [showMultiplayerEnd, setShowMultiplayerEnd] = useState(false);
  const [showMapReview, setShowMapReview] = useState(false);
  const [score, setScore] = useState(0);
  const [gameCompleted, setGameCompleted] = useState(false);
  
  const mapRef = useRef<HTMLDivElement>(null);
  const draggedRegionRef = useRef<string | null>(null);
  const touchDragRef = useRef<TouchDragSession | null>(null);
  const multiplayer = useMultiplayer();
  const isMultiplayer = gameMode !== 'solo';

  const botSim = useBotSimulation({
    difficulty: (multiplayer.opponent?.bot_difficulty as 'easy' | 'medium' | 'hard') || 'medium',
    gameType: 'dragdrop',
    totalRegions: regions.length,
    botPlayerId: multiplayer.opponent?.is_bot ? multiplayer.opponent.id : null,
    isActive: gameStarted && gameMode !== 'solo' && !!multiplayer.opponent?.is_bot,
    onUpdate: multiplayer.patchOpponent,
  });

  // Shuffle once per game so the tray stays put while the player places regions;
  // placed regions are simply filtered out (no chip jumps to a new position).
  const [shuffleSeed, setShuffleSeed] = useState(0);
  const trayOrder = React.useMemo(() => {
    const shuffled = [...regions];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shuffleSeed]);
  const remainingRegions = React.useMemo(
    () => trayOrder.filter(r => !placedRegions[r.id]),
    [trayOrder, placedRegions],
  );

  const handleConfigConfirm = useCallback(async (config: GameConfig) => {
    if (config.mode !== 'solo' && !user) {
      toast.error(language === 'bg' ? 'Влез в профила си, за да играеш този режим.' : 'Sign in to play this mode.');
      return;
    }
    setGameMode(config.mode);
    setTimerSeconds(config.timerSeconds);
    setTimeLeft(config.timerSeconds);
    setShowConfig(false);
    setGameCompleted(false);
    setPlacedRegions({});
    setShuffleSeed(seed => seed + 1);
    setScore(0);

    if (config.mode === 'solo') {
      setGameStarted(true);
    } else if (config.mode === 'multiplayer') {
      if (config.multiplayerType === 'invite') {
        await multiplayer.createInvite('dragdrop', config.timerSeconds);
      } else if (config.multiplayerType === 'join' && config.inviteCode) {
        const found = await multiplayer.joinByCode(config.inviteCode, 'dragdrop', config.timerSeconds);
        if (!found) {
          toast.error(language === 'bg' ? 'Играта не е намерена' : 'Game not found');
          setShowConfig(true);
          return;
        }
      } else {
        await multiplayer.startSearch('dragdrop', config.timerSeconds);
      }
    } else if (config.mode === 'bot') {
      try {
        await multiplayer.createBotGame('dragdrop', config.timerSeconds, config.botDifficulty || 'medium');
      } catch {
        toast.error(language === 'bg' ? 'Ботът не можа да стартира. Опитай отново.' : 'The bot could not start. Please try again.');
        setShowConfig(true);
      }
    }
  }, [multiplayer, language, user]);

  useEffect(() => {
    if (multiplayer.isConnected && !gameStarted && gameMode !== 'solo') {
      setGameStarted(true);
    }
  }, [multiplayer.isConnected, gameStarted, gameMode]);

  useEffect(() => {
    if (!gameStarted || timeLeft === null || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(prev => prev === null ? null : Math.max(0, prev - 1)), 1000);

    return () => clearInterval(interval);
  }, [gameStarted, timeLeft]);

  useEffect(() => {
    if (!gameStarted || timeLeft !== 0 || gameCompleted) return;
    setGameCompleted(true);
    if (isMultiplayer) {
      void multiplayer.finishGame();
      setShowMultiplayerEnd(true);
    } else {
      setShowCompletionDialog(true);
    }
  }, [gameStarted, timeLeft, gameCompleted, isMultiplayer, multiplayer]);

  useEffect(() => {
    if (remainingRegions.length === 0 && gameStarted && !gameCompleted) {
      setGameCompleted(true);
      awardGameComplete();
      if (isMultiplayer) {
        multiplayer.finishGame();
        setTimeout(() => setShowMultiplayerEnd(true), 1000);
      } else {
        setShowCompletionDialog(true);
      }
    }
  }, [remainingRegions.length, gameStarted, gameCompleted, awardGameComplete, isMultiplayer, multiplayer]);

  const handleDragStart = (regionId: string) => {
    draggedRegionRef.current = regionId;
    setDraggedRegion(regionId);
  };

  const handleDrop = async (targetRegionId: string, sourceRegionId = draggedRegionRef.current) => {
    if (!sourceRegionId || placedRegions[targetRegionId] || gameCompleted) return;
    draggedRegionRef.current = null;
    setDraggedRegion(null);
    setTouchDragPosition(null);

    if (sourceRegionId === targetRegionId) {
      setPlacedRegions(prev => ({ ...prev, [targetRegionId]: true }));
      setScore(prev => prev + 1);
      await awardRegionPlaced();
      
      if (isMultiplayer) {
        const newPlaced = { ...placedRegions, [targetRegionId]: true };
        const placedCount = Object.keys(newPlaced).length;
        await multiplayer.updateProgress({
          regions_completed: placedCount,
          score: placedCount,
        });
      }
    }
    draggedRegionRef.current = null;
    setDraggedRegion(null);
    setTouchDragPosition(null);
  };

  const findDropTarget = useCallback((clientX: number, clientY: number) => {
    const direct = document
      .elementFromPoint(clientX, clientY)
      ?.closest<SVGElement>('[data-drop-region]');
    if (direct?.dataset.dropRegion) return direct.dataset.dropRegion;

    const touchRadius = 22;
    const targets = Array.from(document.querySelectorAll<SVGElement>('[data-drop-region]'));
    let nearest: { id: string; distance: number } | null = null;
    for (const target of targets) {
      const id = target.dataset.dropRegion;
      if (!id) continue;
      const rect = target.getBoundingClientRect();
      const nearestX = Math.max(rect.left, Math.min(clientX, rect.right));
      const nearestY = Math.max(rect.top, Math.min(clientY, rect.bottom));
      const distance = Math.hypot(clientX - nearestX, clientY - nearestY);
      if (distance <= touchRadius && (!nearest || distance < nearest.distance)) nearest = { id, distance };
    }
    return nearest?.id ?? null;
  }, []);

  const handleTouchPointerDown = (event: React.PointerEvent<HTMLDivElement>, regionId: string) => {
    if (!isTouch || event.pointerType === 'mouse') return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    touchDragRef.current = {
      pointerId: event.pointerId,
      regionId,
      startX: event.clientX,
      startY: event.clientY,
      moved: false,
    };
    handleDragStart(regionId);
    setTouchDragPosition({ x: event.clientX, y: event.clientY });
  };

  const handleTouchPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = touchDragRef.current;
    if (!isTouch || !session || session.pointerId !== event.pointerId || event.pointerType === 'mouse') return;
    event.preventDefault();
    if (Math.hypot(event.clientX - session.startX, event.clientY - session.startY) > 8) session.moved = true;
    setTouchDragPosition({ x: event.clientX, y: event.clientY });
  };

  const handleTouchPointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const session = touchDragRef.current;
    if (!isTouch || !session || session.pointerId !== event.pointerId || event.pointerType === 'mouse') return;
    event.preventDefault();
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    const dropRegion = findDropTarget(event.clientX, event.clientY);
    touchDragRef.current = null;
    if (session.moved && dropRegion) {
      void handleDrop(dropRegion, session.regionId);
    } else {
      draggedRegionRef.current = session.regionId;
      setDraggedRegion(session.regionId);
      setTouchDragPosition(null);
    }
  };

  const cancelTouchDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (touchDragRef.current?.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    touchDragRef.current = null;
    setTouchDragPosition(null);
    draggedRegionRef.current = null;
    setDraggedRegion(null);
  };

  const handleRestart = () => {
    setPlacedRegions({});
    setShuffleSeed(seed => seed + 1);
    setScore(0);
    setTimeLeft(timerSeconds);
    setShowCompletionDialog(false);
    setShowMultiplayerEnd(false);
    setShowMapReview(false);
    setShowConfig(true);
    setGameStarted(false);
    setGameCompleted(false);
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

  return (
    <main className="game-shell relative w-full h-screen bg-background overflow-hidden">
      <div className="game-shell__grain cinematic-intro__grain" aria-hidden="true" />
      {/* The visible heading appears once a game starts; until then this names the page. */}
      {!gameStarted && <h1 className="sr-only">{t.dragDropGame}</h1>}

      <GameConfigDialog open={showConfig} onConfirm={handleConfigConfirm} gameType="dragdrop" />

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
          <header className="absolute top-0 left-0 right-0 z-10 p-2 sm:p-4">
            <div className="game-hud flex items-center justify-between max-w-7xl mx-auto p-2 sm:p-4">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 rounded-xl glass-button-primary">
                  <MapPin className="w-4 h-4 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="game-display text-xl sm:text-2xl text-foreground">{t.dragDropGame}</h1>
                  <p className="text-xs sm:text-sm text-muted-foreground">{t.placeRegions}</p>
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
                  <span className="hidden sm:inline text-muted-foreground mr-1">{t.placed}: </span>
                  <span className="font-semibold text-foreground">{score}/{regions.length}</span>
                </div>
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

          {/* Opponent progress */}
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
                gameType="dragdrop"
                totalRegions={regions.length}
              />
            </div>
          )}

          <div className="game-board-layout flex flex-col sm:flex-row h-full w-full max-w-7xl mx-auto pt-20 sm:pt-28 pb-4 px-2 sm:px-4 gap-3 sm:gap-4">
            {/* Phone: map sits under the HUD and the tray takes the rest of the screen,
                so more than one row of regions is reachable without scrolling. */}
            <div className="flex-none sm:flex-1 min-h-0 flex items-center justify-center" ref={mapRef}>
              <div className="relative max-w-4xl w-full">
                <RegionAtlas variant="placement" completed={placedRegions} onDropRegion={(id, source) => void handleDrop(id, source)} onSelect={(id) => void handleDrop(id)} />
              </div>
            </div>

            <div className="game-region-tray w-full sm:w-72 p-3 sm:p-5 overflow-y-auto flex-1 min-h-0 sm:flex-none">
              <h3 className="game-display text-xl text-foreground mb-2 sm:mb-4">{t.regions}</h3>
              {isTouch && (
                <p className="text-xs text-muted-foreground mb-2">
                  {language === 'bg' ? 'Плъзни име до картата или го докосни, после избери мястото' : 'Drag a name onto the map, or tap it then choose its place'}
                </p>
              )}
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {remainingRegions.map((region) => (
                  <div
                    key={region.id}
                    draggable={!isTouch}
                    onDragStart={(event) => { event.dataTransfer.setData('text/plain', region.id); handleDragStart(region.id); }}
                    onPointerDown={(event) => handleTouchPointerDown(event, region.id)}
                    onPointerMove={handleTouchPointerMove}
                    onPointerUp={handleTouchPointerUp}
                    onPointerCancel={cancelTouchDrag}
                    role={isTouch ? 'button' : undefined}
                    aria-pressed={isTouch ? draggedRegion === region.id : undefined}
                    className={`game-region-chip transition-interactive text-xs sm:text-sm select-none ${
                      isTouch
                        ? `min-h-[44px] px-3 cursor-grab active:cursor-grabbing touch-none ${draggedRegion === region.id ? 'ring-2 ring-primary scale-105 bg-primary/20' : ''}`
                        : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {region.name[language]}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {isTouch && draggedRegion && touchDragPosition && (
            <div
              className="fixed z-[80] pointer-events-none glass-tag border-primary bg-primary/20 text-foreground shadow-xl"
              style={{ left: touchDragPosition.x, top: touchDragPosition.y, transform: 'translate(-50%, -140%)' }}
            >
              {regions.find((region) => region.id === draggedRegion)?.name[language]}
            </div>
          )}
        </>
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
            <DialogDescription className="sr-only">{t.placed}: {score}/{regions.length}</DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-lg text-muted-foreground">
                {t.placed}: <span className="font-bold text-foreground">{score}/{regions.length}</span>
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

      {/* Multiplayer end */}
      {isMultiplayer && (
        <MultiplayerEndScreen
          open={showMultiplayerEnd}
          gameType="dragdrop"
          myResult={{
            displayName: user?.user_metadata?.display_name || 'You',
            isBot: false,
            totalCorrect: score,
            regionsCompleted: score,
            regionResults: {},
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
          totalRegions={regions.length}
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
              className="flex-1 bg-destructive hover:bg-destructive/90"
            >
              {t.yes}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
};

export default DragDropGame;
