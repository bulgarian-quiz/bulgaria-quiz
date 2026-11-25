import React, { useState, useEffect } from 'react';
import { Swords } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface CountdownOverlayProps {
  opponentName: string;
  onComplete: () => void;
}

const CountdownOverlay: React.FC<CountdownOverlayProps> = ({ opponentName, onComplete }) => {
  const { language } = useLanguage();
  const [count, setCount] = useState(3);

  useEffect(() => {
    if (count <= 0) {
      onComplete();
      return;
    }
    const timer = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [count, onComplete]);

  const t = {
    vs: language === 'bg' ? 'срещу' : 'vs',
    starting: language === 'bg' ? 'Играта започва след' : 'Starting game in',
    seconds: language === 'bg' ? 'сек...' : 'sec...',
    go: language === 'bg' ? 'СТАРТ!' : 'GO!',
  };

  return (
    <div className="game-quiz-backdrop fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="editorial-dialog p-10 max-w-md w-full mx-4 text-center space-y-6">
        <div className="flex justify-center">
          <div className="p-5 rounded-sm glass-button-primary">
            <Swords className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wider">{t.vs}</p>
          <h2 className="text-2xl font-bold text-foreground">{opponentName}</h2>
        </div>

        <div className="space-y-2">
          <p className="text-muted-foreground">{t.starting}</p>
          <div className="text-6xl font-black text-primary animate-pulse">
            {count > 0 ? count : t.go}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CountdownOverlay;
