import React, { createContext, useContext, useState, ReactNode, useCallback, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useLanguage } from './LanguageContext';
import { recordActivity, type ActivityAction } from '@/lib/recordActivity';
import PointsPopup from '@/components/PointsPopup';
import { localDateKey } from '@/lib/utils';

interface PointsNotification {
  id: number;
  points: number;
  reason: string;
}

interface PointsContextType {
  awardCorrectAnswer: (count?: number) => Promise<void>;
  awardGameComplete: () => Promise<void>;
  awardRegionPlaced: () => Promise<void>;
  awardFlashcardViewed: () => Promise<void>;
  triggerActivity: () => Promise<void>;
}

// Static lookup, kept outside the component so it is not rebuilt every render.
const POINT_REASONS: Record<string, { bg: string; en: string }> = {
  correctAnswer: { bg: 'Правилен отговор', en: 'Correct answer' },
  gameComplete: { bg: 'Игра завършена', en: 'Game completed' },
  regionPlaced: { bg: 'Област поставена', en: 'Region placed' },
  flashcardViewed: { bg: 'Флашкарта разгледана', en: 'Flashcard viewed' },
  streakUpdated: { bg: 'Серия обновена', en: 'Streak updated' },
  timeMilestone3: { bg: '3 минути в сайта', en: '3 minutes on site' },
  timeMilestone20: { bg: '20 минути в сайта', en: '20 minutes on site' },
  aiChat: { bg: 'Чат с AI', en: 'AI chat' },
};

const PointsContext = createContext<PointsContextType | undefined>(undefined);

export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, stats, refreshStats } = useAuth();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<PointsNotification[]>([]);
  const lastActivityCheck = useRef<string | null>(null);
  const midnightCheckRef = useRef<ReturnType<typeof setTimeout> | null>(null);


  const showNotification = useCallback((points: number, reasonKey: string) => {
    const reason = POINT_REASONS[reasonKey]?.[language] || reasonKey;
    const newNotification: PointsNotification = {
      id: Date.now() + Math.random(),
      points,
      reason,
    };
    setNotifications((prev) => [...prev, newNotification]);
  }, [language]);

  const removeNotification = useCallback((id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  // Check for midnight streak reset
  useEffect(() => {
    if (!user || !stats) return;

    // A lapsed streak is reset on the server (record_activity 'streak_check').
    const checkMidnightReset = () => {
      if (!stats.last_streak_date || !stats.current_streak) return;
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (stats.last_streak_date < localDateKey(yesterday)) {
        void recordActivity('streak_check').then(() => refreshStats());
      }
    };

    // Check immediately
    checkMidnightReset();

    // Calculate time until next midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const msUntilMidnight = tomorrow.getTime() - now.getTime();

    // Set timeout for midnight check
    midnightCheckRef.current = setTimeout(() => {
      checkMidnightReset();
      // Then check every 24 hours
      midnightCheckRef.current = setInterval(checkMidnightReset, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => {
      if (midnightCheckRef.current) {
        clearTimeout(midnightCheckRef.current);
        clearInterval(midnightCheckRef.current);
      }
    };
  }, [user, stats, refreshStats]);

  // Use a ref to always have latest stats without re-creating callbacks
  const statsRef = useRef(stats);
  useEffect(() => { statsRef.current = stats; }, [stats]);

  /** Records an action on the server and shows the points it actually awarded. */
  const award = useCallback(async (action: ActivityAction, reasonKey: string, count = 1) => {
    if (!user) return;
    const result = await recordActivity(action, count);
    if (result && result.points > 0) showNotification(result.points, reasonKey);
    await refreshStats();
  }, [user, refreshStats, showNotification]);

  const triggerActivity = useCallback(async () => {
    if (!user) return;

    const today = localDateKey();
    // Prevent multiple activity triggers on the same day
    if (lastActivityCheck.current === today) return;
    lastActivityCheck.current = today;
    if (statsRef.current?.last_streak_date === today) return;

    const result = await recordActivity('streak');
    if (result && result.points > 0) showNotification(result.points, 'streakUpdated');
    await refreshStats();
  }, [user, refreshStats, showNotification]);

  const awardCorrectAnswer = useCallback(async (count: number = 1) => {
    if (count <= 0) return;
    await award('correct_answers', 'correctAnswer', count);
    await triggerActivity();
  }, [award, triggerActivity]);

  const awardGameComplete = useCallback(async () => {
    await award('game_complete', 'gameComplete');
  }, [award]);

  const awardRegionPlaced = useCallback(async () => {
    await award('region_placed', 'regionPlaced');
    await triggerActivity();
  }, [award, triggerActivity]);

  const awardFlashcardViewed = useCallback(async () => {
    await award('flashcard_viewed', 'flashcardViewed');
    await triggerActivity();
  }, [award, triggerActivity]);

  return (
    <PointsContext.Provider
      value={{
        awardCorrectAnswer,
        awardGameComplete,
        awardRegionPlaced,
        awardFlashcardViewed,
        triggerActivity,
      }}
    >
      {children}
      <PointsPopup notifications={notifications} onRemove={removeNotification} />
    </PointsContext.Provider>
  );
};

export const usePoints = () => {
  const context = useContext(PointsContext);
  if (!context) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};
