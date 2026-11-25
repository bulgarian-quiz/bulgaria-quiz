import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timer, TimerOff, X, Users, User, Bot, Swords, Copy, Search, Link2, ListChecks, Keyboard } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface GameConfig {
  mode: 'solo' | 'multiplayer' | 'bot';
  timerSeconds: number | null;
  botDifficulty?: 'easy' | 'medium' | 'hard';
  multiplayerType?: 'queue' | 'invite' | 'join';
  inviteCode?: string;
  /** Photo game only: choose from four answers (easy) or type the answer (advanced). */
  answerMode?: 'choice' | 'typed';
}

interface GameConfigDialogProps {
  open: boolean;
  onConfirm: (config: GameConfig) => void;
  gameType: 'quiz' | 'dragdrop' | 'photo';
}

const GameConfigDialog: React.FC<GameConfigDialogProps> = ({ open, onConfirm, gameType }) => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [mode, setMode] = useState<'solo' | 'multiplayer' | 'bot'>('solo');
  const [useTimer, setUseTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);
  const [botDifficulty, setBotDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [multiplayerType, setMultiplayerType] = useState<'queue' | 'invite' | 'join' | null>(null);
  const [joinCode, setJoinCode] = useState('');
  const [answerMode, setAnswerMode] = useState<'choice' | 'typed'>('choice');

  const t = {
    configure: language === 'bg' ? 'Конфигурация' : 'Configure',
    gameMode: language === 'bg' ? 'Режим на игра' : 'Game Mode',
    solo: language === 'bg' ? 'Соло' : 'Solo',
    multiplayer: language === 'bg' ? 'Мултиплейър' : 'Multiplayer',
    vsBot: language === 'bg' ? 'Срещу бот' : 'VS Bot',
    timer: language === 'bg' ? 'Таймер' : 'Timer',
    timerQuestion: language === 'bg' ? 'Искате ли таймер?' : 'Do you want a timer?',
    timerDuration: language === 'bg' ? 'Време (секунди)' : 'Time (seconds)',
    yes: language === 'bg' ? 'Да' : 'Yes',
    no: language === 'bg' ? 'Не' : 'No',
    seconds: language === 'bg' ? 'сек.' : 'sec.',
    startGame: language === 'bg' ? 'Започни играта' : 'Start Game',
    botDifficulty: language === 'bg' ? 'Трудност на бота' : 'Bot Difficulty',
    easy: language === 'bg' ? 'Лесно' : 'Easy',
    medium: language === 'bg' ? 'Средно' : 'Medium',
    hard: language === 'bg' ? 'Трудно' : 'Hard',
    soloDesc: language === 'bg' ? 'Играй сам' : 'Play alone',
    multiDesc: language === 'bg' ? 'Намери противник онлайн' : 'Find an opponent online',
    botDesc: language === 'bg' ? 'Играй срещу AI' : 'Play against AI',
    findMatch: language === 'bg' ? 'Търси мач' : 'Find Match',
    findMatchDesc: language === 'bg' ? 'Автоматично намиране' : 'Auto matchmaking',
    inviteFriend: language === 'bg' ? 'Покани приятел' : 'Invite Friend',
    inviteFriendDesc: language === 'bg' ? 'Генерирай код' : 'Generate a code',
    joinGame: language === 'bg' ? 'Присъедини се' : 'Join Game',
    joinGameDesc: language === 'bg' ? 'Въведи код' : 'Enter a code',
    enterCode: language === 'bg' ? 'Въведи код на играта' : 'Enter game code',
    back: language === 'bg' ? 'Назад' : 'Back',
    multiplayerOption: language === 'bg' ? 'Как искаш да играеш?' : 'How do you want to play?',
    difficulty: language === 'bg' ? 'Трудност' : 'Difficulty',
    advanced: language === 'bg' ? 'Напреднало' : 'Advanced',
    choiceDesc: language === 'bg' ? 'Избери от 4 отговора' : 'Pick from 4 answers',
    typedDesc: language === 'bg' ? 'Напиши отговора сам' : 'Type the answer yourself',
  };

  const description =
    gameType === 'quiz' ? (language === 'bg' ? 'Избери как ще изследваш картата.' : 'Choose how you will explore the map.')
    : gameType === 'photo' ? (language === 'bg' ? '27 снимки от България. Познай какво има на всяка.' : '27 photos of Bulgaria. Name what is in each one.')
    : (language === 'bg' ? 'Избери как ще подредиш областите.' : 'Choose how you will arrange the regions.');

  const handleConfirm = () => {
    if (mode === 'multiplayer' && multiplayerType === 'join' && !joinCode.trim()) {
      toast.error(language === 'bg' ? 'Моля въведете код' : 'Please enter a code');
      return;
    }

    onConfirm({
      mode,
      timerSeconds: useTimer ? timerSeconds : null,
      botDifficulty: mode === 'bot' ? botDifficulty : undefined,
      multiplayerType: mode === 'multiplayer' ? (multiplayerType || 'queue') : undefined,
      inviteCode: mode === 'multiplayer' && multiplayerType === 'join' ? joinCode.trim().toUpperCase() : undefined,
      answerMode: gameType === 'photo' ? answerMode : undefined,
    });
  };

  const handleClose = () => {
    navigate('/games');
  };

  const handleModeChange = (newMode: 'solo' | 'multiplayer' | 'bot') => {
    setMode(newMode);
    if (newMode !== 'multiplayer') {
      setMultiplayerType(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="editorial-dialog sm:max-w-xl max-h-[90vh] overflow-y-auto" hideCloseButton onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute right-4 top-4 z-10"
          aria-label={language === 'bg' ? 'Затвори' : 'Close'}
        >
          <X className="h-4 w-4 text-foreground" />
        </Button>

        <DialogHeader className="pt-9 sm:pt-0 sm:px-10">
          <DialogTitle className="game-display text-center text-2xl sm:text-3xl flex flex-wrap items-center justify-center gap-2">
            <Swords className="w-6 h-6 shrink-0" />
            {t.configure}
          </DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Photo game: easy (4 answers) or advanced (typed) */}
          {gameType === 'photo' && (
            <div className="space-y-2">
              <label id="answer-mode-label" className="text-sm font-medium text-foreground">{t.difficulty}</label>
              <div className="grid grid-cols-2 gap-2" role="group" aria-labelledby="answer-mode-label">
                {[
                  { key: 'choice' as const, icon: ListChecks, label: t.easy, desc: t.choiceDesc },
                  { key: 'typed' as const, icon: Keyboard, label: t.advanced, desc: t.typedDesc },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <Button
                    type="button"
                    variant="ghost"
                    key={key}
                    onClick={() => setAnswerMode(key)}
                    aria-pressed={answerMode === key}
                    className={cn(
                      'editorial-choice h-auto flex flex-col items-center gap-2 p-4 transition-interactive duration-200 border',
                      answerMode === key
                        ? 'bg-primary/20 border-primary/40 shadow-md'
                        : 'glass-button border-white/10 hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Game Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.gameMode}</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'solo' as const, icon: User, label: t.solo, desc: t.soloDesc },
                { key: 'multiplayer' as const, icon: Users, label: t.multiplayer, desc: t.multiDesc },
                { key: 'bot' as const, icon: Bot, label: t.vsBot, desc: t.botDesc },
              ].map(({ key, icon: Icon, label, desc }) => (
                <Button
                  type="button"
                  variant="ghost"
                  key={key}
                  onClick={() => handleModeChange(key)}
                  aria-pressed={mode === key}
                  className={cn(
                    'editorial-choice h-auto flex flex-col items-center gap-2 p-4 transition-interactive duration-200 border',
                    mode === key
                      ? 'bg-primary/20 border-primary/40 shadow-md'
                      : 'glass-button border-white/10 hover:bg-white/10'
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{label}</span>
                  <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Multiplayer sub-options */}
          {mode === 'multiplayer' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-foreground">{t.multiplayerOption}</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'queue' as const, icon: Search, label: t.findMatch, desc: t.findMatchDesc },
                  { key: 'invite' as const, icon: Link2, label: t.inviteFriend, desc: t.inviteFriendDesc },
                  { key: 'join' as const, icon: Copy, label: t.joinGame, desc: t.joinGameDesc },
                ].map(({ key, icon: Icon, label, desc }) => (
                  <Button
                    type="button"
                    variant="ghost"
                    key={key}
                    onClick={() => setMultiplayerType(key)}
                    aria-pressed={multiplayerType === key}
                    className={cn(
                      'editorial-choice h-auto flex flex-col items-center gap-2 p-4 transition-interactive duration-200 border',
                      multiplayerType === key
                        ? 'bg-primary/20 border-primary/40 shadow-md'
                        : 'glass-button border-white/10 hover:bg-white/10'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-xs font-semibold">{label}</span>
                    <span className="text-[10px] text-muted-foreground leading-tight">{desc}</span>
                  </Button>
                ))}
              </div>

              {multiplayerType === 'join' && (
                <div className="animate-fade-in">
                  <Input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder={t.enterCode}
                    className="text-center glass-input text-lg tracking-widest font-mono"
                    maxLength={6}
                  />
                </div>
              )}
            </div>
          )}

          {/* Bot Difficulty */}
          {mode === 'bot' && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-foreground">{t.botDifficulty}</label>
              <div className="flex gap-2">
                {(['easy', 'medium', 'hard'] as const).map((diff) => (
                  <Button
                    key={diff}
                    variant={botDifficulty === diff ? 'default' : 'outline'}
                    onClick={() => setBotDifficulty(diff)}
                    aria-pressed={botDifficulty === diff}
                    className="flex-1 glass-button text-xs"
                    size="sm"
                  >
                    {t[diff]}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Timer */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">{t.timer}</label>
            <p className="text-xs text-muted-foreground">{t.timerQuestion}</p>
            <div className="flex gap-2">
              <Button
                variant={useTimer ? 'default' : 'outline'}
                onClick={() => setUseTimer(true)}
                aria-pressed={useTimer}
                className="flex-1 gap-2 glass-button"
                size="sm"
              >
                <Timer className="w-4 h-4" />
                {t.yes}
              </Button>
              <Button
                variant={!useTimer ? 'default' : 'outline'}
                onClick={() => setUseTimer(false)}
                aria-pressed={!useTimer}
                className="flex-1 gap-2 glass-button"
                size="sm"
              >
                <TimerOff className="w-4 h-4" />
                {t.no}
              </Button>
            </div>

            {useTimer && (
              <div className="flex items-center gap-2 animate-fade-in">
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Math.max(5, Math.min(300, parseInt(e.target.value) || 30)))}
                  className="text-center glass-input"
                />
                <span className="text-muted-foreground text-sm">{t.seconds}</span>
              </div>
            )}
          </div>
        </div>

        <Button
          onClick={handleConfirm}
          size="lg"
          className="w-full glass-button-primary"
          disabled={mode === 'multiplayer' && !multiplayerType}
        >
          {t.startGame}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default GameConfigDialog;
