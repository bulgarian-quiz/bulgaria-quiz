import React from 'react';
import { User, Bot, MapPin, CheckCircle, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface OpponentProgressProps {
  displayName: string;
  isBot: boolean;
  score: number;
  regionsCompleted: number;
  currentRegion: string | null;
  totalCorrect: number;
  isFinished: boolean;
  gameType: 'quiz' | 'dragdrop' | 'photo';
  totalRegions: number;
}

const OpponentProgress: React.FC<OpponentProgressProps> = ({
  displayName,
  isBot,
  score,
  regionsCompleted,
  currentRegion,
  totalCorrect,
  isFinished,
  gameType,
  totalRegions,
}) => {
  const { language } = useLanguage();

  const t = {
    opponent: language === 'bg' ? 'Противник' : 'Opponent',
    score: language === 'bg' ? 'Точки' : 'Score',
    regions: language === 'bg' ? 'Области' : 'Regions',
    correct: language === 'bg' ? 'Правилни' : 'Correct',
    finished: language === 'bg' ? 'Завършил' : 'Finished',
    playing: language === 'bg' ? 'Играе' : 'Playing',
    currentRegion: language === 'bg' ? 'Текуща област' : 'Current region',
    placed: language === 'bg' ? 'Поставени' : 'Placed',
    answered: language === 'bg' ? 'Снимки' : 'Photos',
  };

  return (
    <div className="game-side-panel p-3 animate-fade-in">
      <div className="flex items-center gap-2 mb-2">
        {isBot ? (
          <Bot className="w-4 h-4 text-warning" />
        ) : (
          <User className="w-4 h-4 text-primary" />
        )}
        <span className="text-sm font-semibold text-foreground truncate">{displayName}</span>
        <span className={`text-xs px-2 py-0.5 rounded-full ${isFinished ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
          {isFinished ? t.finished : t.playing}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        {gameType === 'photo' ? (
          <>
            <div className="glass-tag flex items-center gap-1">
              <Image className="w-3 h-3" />
              <span>{t.answered}: {regionsCompleted}/{totalRegions}</span>
            </div>
            <div className="glass-tag flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>{t.correct}: {totalCorrect}</span>
            </div>
          </>
        ) : gameType === 'quiz' ? (
          <>
            <div className="glass-tag flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>{t.regions}: {regionsCompleted}/{totalRegions}</span>
            </div>
            <div className="glass-tag flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              <span>{t.correct}: {totalCorrect}</span>
            </div>
          </>
        ) : (
          <div className="glass-tag flex items-center gap-1 col-span-2">
            <MapPin className="w-3 h-3" />
            <span>{t.placed}: {regionsCompleted}/{totalRegions}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpponentProgress;
