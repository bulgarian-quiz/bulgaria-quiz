import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';

interface PointsNotification {
  id: number;
  points: number;
  reason: string;
}

interface PointsPopupProps {
  notifications: PointsNotification[];
  onRemove: (id: number) => void;
}

const PointsPopup: React.FC<PointsPopupProps> = ({ notifications, onRemove }) => {
  return (
    <div className="fixed top-20 left-4 z-50 flex flex-col gap-2 pointer-events-none">
      {notifications.map((notification) => (
        <PointsNotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

interface PointsNotificationItemProps {
  notification: PointsNotification;
  onRemove: (id: number) => void;
}

const PointsNotificationItem: React.FC<PointsNotificationItemProps> = ({
  notification,
  onRemove,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    // Fade in
    requestAnimationFrame(() => setIsVisible(true));

    // Start fade out after 2.5 seconds
    const leaveTimer = setTimeout(() => {
      setIsLeaving(true);
    }, 2500);

    // Remove after animation completes
    const removeTimer = setTimeout(() => {
      onRemove(notification.id);
    }, 2800);

    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(removeTimer);
    };
  }, [notification.id, onRemove]);

  return (
    <div
      className={cn(
        'glass-panel px-4 py-3 rounded-2xl transition-surface duration-300 ease-out min-w-[200px]',
        isVisible && !isLeaving
          ? 'opacity-100 translate-x-0'
          : 'opacity-0 -translate-x-4'
      )}
    >
      <div className="flex items-center gap-2">
        <span className="text-xl">✨</span>
        <div className="flex flex-col">
          <span className="text-lg font-bold text-primary">
            +{notification.points}
          </span>
          <span className="text-xs text-muted-foreground">
            {notification.reason}
          </span>
        </div>
      </div>
    </div>
  );
};

export default PointsPopup;

// Hook to manage points notifications
export const usePointsNotifications = () => {
  const [notifications, setNotifications] = useState<PointsNotification[]>([]);
  const { language } = useLanguage();

  const showPoints = (points: number, reasonKey: string) => {
    const reasons: Record<string, { bg: string; en: string }> = {
      correctAnswer: { bg: 'Правилен отговор', en: 'Correct answer' },
      gameComplete: { bg: 'Игра завършена', en: 'Game completed' },
      regionPlaced: { bg: 'Област поставена', en: 'Region placed' },
      flashcardViewed: { bg: 'Флашкарта разгледана', en: 'Flashcard viewed' },
      streakUpdated: { bg: 'Серия обновена', en: 'Streak updated' },
      timeMilestone3: { bg: '3 минути в сайта', en: '3 minutes on site' },
      timeMilestone20: { bg: '20 минути в сайта', en: '20 minutes on site' },
      aiChat: { bg: 'Чат с AI', en: 'AI chat' },
    };

    const reason = reasons[reasonKey]?.[language] || reasonKey;

    const newNotification: PointsNotification = {
      id: Date.now() + Math.random(),
      points,
      reason,
    };

    setNotifications((prev) => [...prev, newNotification]);
  };

  const removeNotification = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return { notifications, showPoints, removeNotification };
};
