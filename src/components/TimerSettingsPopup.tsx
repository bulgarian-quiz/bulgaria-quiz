import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Timer, TimerOff, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface TimerSettingsPopupProps {
  open: boolean;
  onConfirm: (timerSeconds: number | null) => void;
}

const TimerSettingsPopup: React.FC<TimerSettingsPopupProps> = ({ open, onConfirm }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [useTimer, setUseTimer] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(30);

  const handleConfirm = () => {
    onConfirm(useTimer ? timerSeconds : null);
  };

  const handleClose = () => {
    navigate('/games');
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
      <DialogContent className="sm:max-w-md glass-card border-white/20" hideCloseButton onPointerDownOutside={(e) => e.preventDefault()} onEscapeKeyDown={(e) => e.preventDefault()}>
        {/* Custom close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 z-10 rounded-full p-1.5 glass-button hover:bg-white/20 transition-interactive"
        >
          <X className="h-4 w-4 text-foreground" />
        </button>
        
        <DialogHeader>
          <DialogTitle className="text-center text-xl flex items-center justify-center gap-2">
            <Timer className="w-6 h-6" />
            {t.timerSettings}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <p className="text-center text-muted-foreground">{t.timerQuestion}</p>

          <div className="flex gap-4">
            <Button
              variant={useTimer ? 'default' : 'outline'}
              onClick={() => setUseTimer(true)}
              aria-pressed={useTimer}
              className="flex-1 gap-2 glass-button"
            >
              <Timer className="w-4 h-4" />
              {t.yes}
            </Button>
            <Button
              variant={!useTimer ? 'default' : 'outline'}
              onClick={() => setUseTimer(false)}
              aria-pressed={!useTimer}
              className="flex-1 gap-2 glass-button"
            >
              <TimerOff className="w-4 h-4" />
              {t.no}
            </Button>
          </div>

          {useTimer && (
            <div className="space-y-2 animate-fade-in">
              <label className="text-sm font-medium text-foreground">{t.timerDuration}</label>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={5}
                  max={300}
                  value={timerSeconds}
                  onChange={(e) => setTimerSeconds(Math.max(5, Math.min(300, parseInt(e.target.value) || 30)))}
                  className="text-center glass-input"
                />
                <span className="text-muted-foreground">{t.seconds}</span>
              </div>
            </div>
          )}
        </div>

        <Button onClick={handleConfirm} size="lg" className="w-full glass-button-primary">
          {t.startGame}
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TimerSettingsPopup;
