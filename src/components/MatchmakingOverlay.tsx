import React from 'react';
import { Loader2, X, Users, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState } from 'react';
import { toast } from 'sonner';

interface MatchmakingOverlayProps {
  timeLeft: number;
  onCancel: () => void;
  inviteCode?: string | null;
}

const MatchmakingOverlay: React.FC<MatchmakingOverlayProps> = ({ timeLeft, onCancel, inviteCode }) => {
  const { language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const t = {
    searching: language === 'bg' ? 'Търсене на противник...' : 'Searching for opponent...',
    waitingFriend: language === 'bg' ? 'Чакане на приятел...' : 'Waiting for friend...',
    autoBot: language === 'bg' ? 'Автоматичен бот след' : 'Auto-bot in',
    seconds: language === 'bg' ? 'сек.' : 'sec.',
    cancel: language === 'bg' ? 'Отказ' : 'Cancel',
    shareCode: language === 'bg' ? 'Сподели кода с приятел' : 'Share the code with a friend',
    copied: language === 'bg' ? 'Копирано!' : 'Copied!',
  };

  const handleCopy = async () => {
    if (inviteCode) {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      toast.success(t.copied);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isInvite = !!inviteCode;

  return (
    <div className="game-quiz-backdrop fixed inset-0 z-50 flex items-center justify-center animate-fade-in p-4">
      <div className="editorial-dialog p-6 sm:p-8 max-w-sm w-full text-center space-y-4 sm:space-y-6">
        <div className="flex justify-center">
          <div className="relative">
            <div className="p-6 rounded-sm glass-button-primary animate-pulse">
              <Users className="w-10 h-10 text-primary-foreground" />
            </div>
            <Loader2 className="absolute -top-2 -right-2 w-8 h-8 text-primary animate-spin" />
          </div>
        </div>

        <div>
          <h2 className="text-xl font-bold text-foreground mb-2">
            {isInvite ? t.waitingFriend : t.searching}
          </h2>

          {isInvite ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{t.shareCode}</p>
              <div className="flex items-center justify-center gap-2">
                <div className="text-3xl font-mono font-black tracking-[0.3em] text-primary glass-tag px-6 py-3">
                  {inviteCode}
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-xl glass-button hover:bg-white/20 transition-interactive"
                >
                  {copied ? <Check className="w-5 h-5 text-success" /> : <Copy className="w-5 h-5 text-muted-foreground" />}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">
              {t.autoBot} <span className="font-bold text-primary">{timeLeft}</span> {t.seconds}
            </p>
          )}
        </div>

        {/* Progress bar (only for queue) */}
        {!isInvite && (
          <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-[width] duration-1000 ease-linear"
              style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
            />
          </div>
        )}

        <Button
          variant="outline"
          onClick={onCancel}
          className="glass-button gap-2"
        >
          <X className="w-4 h-4" />
          {t.cancel}
        </Button>
      </div>
    </div>
  );
};

export default MatchmakingOverlay;
