import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, Medal, Crown, RotateCcw, Home, User, Bot } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

interface PlayerResult {
  displayName: string;
  isBot: boolean;
  totalCorrect: number;
  regionsCompleted: number;
  regionResults: Record<string, { score: number; total: number }>;
  finishedAt: string | null;
}

interface MultiplayerEndScreenProps {
  open: boolean;
  gameType: 'quiz' | 'dragdrop' | 'photo';
  myResult: PlayerResult;
  opponentResult: PlayerResult;
  onRestart: () => void;
  onHome: () => void;
  totalRegions: number;
}

const MultiplayerEndScreen: React.FC<MultiplayerEndScreenProps> = ({
  open,
  gameType,
  myResult,
  opponentResult,
  onRestart,
  onHome,
  totalRegions,
}) => {
  const { language } = useLanguage();

  const t = {
    gameOver: language === 'bg' ? 'Играта приключи!' : 'Game Over!',
    youWin: language === 'bg' ? 'Ти спечели! 🎉' : 'You win! 🎉',
    youLose: language === 'bg' ? 'Ти загуби 😔' : 'You lose 😔',
    draw: language === 'bg' ? 'Равенство! 🤝' : 'Draw! 🤝',
    you: language === 'bg' ? 'Ти' : 'You',
    opponent: language === 'bg' ? 'Противник' : 'Opponent',
    correctAnswers: language === 'bg' ? 'Правилни отговори' : 'Correct answers',
    regionsCompleted: language === 'bg' ? 'Завършени области' : 'Regions completed',
    regionsPlaced: language === 'bg' ? 'Поставени области' : 'Regions placed',
    photosAnswered: language === 'bg' ? 'Отговорени снимки' : 'Photos answered',
    time: language === 'bg' ? 'Време' : 'Time',
    playAgain: language === 'bg' ? 'Играй пак' : 'Play Again',
    home: language === 'bg' ? 'Начало' : 'Home',
    comparison: language === 'bg' ? 'Сравнение' : 'Comparison',
  };

  // Determine winner
  let result: 'win' | 'lose' | 'draw';
  if (gameType === 'quiz' || gameType === 'photo') {
    if (myResult.totalCorrect > opponentResult.totalCorrect) result = 'win';
    else if (myResult.totalCorrect < opponentResult.totalCorrect) result = 'lose';
    else result = 'draw';
  } else {
    // Drag-drop: more placed = better, if equal check speed
    if (myResult.regionsCompleted > opponentResult.regionsCompleted) result = 'win';
    else if (myResult.regionsCompleted < opponentResult.regionsCompleted) result = 'lose';
    else {
      // Check who finished first
      if (myResult.finishedAt && opponentResult.finishedAt) {
        result = new Date(myResult.finishedAt) < new Date(opponentResult.finishedAt) ? 'win' : 'lose';
      } else {
        result = 'draw';
      }
    }
  }

  const resultText = result === 'win' ? t.youWin : result === 'lose' ? t.youLose : t.draw;
  const ResultIcon = result === 'win' ? Crown : result === 'draw' ? Medal : Trophy;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="editorial-dialog sm:max-w-lg" hideCloseButton onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center justify-center mb-2">
            <div className={cn(
              'p-4 rounded-full animate-pulse-glow',
              result === 'win' ? 'bg-success/20' : result === 'lose' ? 'bg-destructive/20' : 'bg-warning/20'
            )}>
              <ResultIcon className={cn(
                'w-10 h-10',
                result === 'win' ? 'text-success' : result === 'lose' ? 'text-destructive' : 'text-warning'
              )} />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">{resultText}</DialogTitle>
          <DialogDescription className="sr-only">{t.comparison}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <h3 className="text-sm font-semibold text-center text-muted-foreground">{t.comparison}</h3>
          
          {/* Side by side comparison */}
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            {/* Headers */}
            <div className="flex items-center justify-center gap-1 font-semibold text-primary">
              <User className="w-4 h-4" />
              {t.you}
            </div>
            <div className="text-muted-foreground text-xs flex items-center justify-center">VS</div>
            <div className="flex items-center justify-center gap-1 font-semibold text-destructive">
              {opponentResult.isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              {opponentResult.displayName}
            </div>

            {/* Correct answers / regions placed */}
            <div className={cn(
              'glass-tag justify-center text-lg font-bold',
              result === 'win' ? 'text-success' : 'text-foreground'
            )}>
              {gameType === 'dragdrop' ? myResult.regionsCompleted : myResult.totalCorrect}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              {gameType === 'dragdrop' ? t.regionsPlaced : t.correctAnswers}
            </div>
            <div className={cn(
              'glass-tag justify-center text-lg font-bold',
              result === 'lose' ? 'text-success' : 'text-foreground'
            )}>
              {gameType === 'dragdrop' ? opponentResult.regionsCompleted : opponentResult.totalCorrect}
            </div>

            {/* Regions completed */}
            <div className="glass-tag justify-center font-semibold">
              {myResult.regionsCompleted}/{totalRegions}
            </div>
            <div className="text-xs text-muted-foreground flex items-center justify-center">
              {gameType === 'photo' ? t.photosAnswered : t.regionsCompleted}
            </div>
            <div className="glass-tag justify-center font-semibold">
              {opponentResult.regionsCompleted}/{totalRegions}
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <Button onClick={onRestart} size="lg" className="flex-1 glass-button-primary gap-2">
            <RotateCcw className="w-4 h-4" />
            {t.playAgain}
          </Button>
          <Button onClick={onHome} variant="outline" size="lg" className="flex-1 glass-button gap-2">
            <Home className="w-4 h-4" />
            {t.home}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MultiplayerEndScreen;
