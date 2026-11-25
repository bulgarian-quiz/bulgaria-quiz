import React from 'react';
import { Flame } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const StreakBadge: React.FC = () => {
  const { user, stats } = useAuth();

  if (!user || !stats) return null;

  const streak = stats.current_streak || 0;

  if (streak === 0) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold",
      "bg-gradient-to-r from-orange-500/20 to-red-500/20",
      "border border-orange-500/30",
      "text-orange-500"
    )}>
      <Flame className="w-3.5 h-3.5" />
      <span>{streak}</span>
    </div>
  );
};

export default StreakBadge;
