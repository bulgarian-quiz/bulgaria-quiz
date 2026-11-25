import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PlayerState } from '@/hooks/useMultiplayer';

interface BotConfig {
  difficulty: 'easy' | 'medium' | 'hard';
  gameType: 'quiz' | 'dragdrop' | 'photo';
  totalRegions: number;
  botPlayerId: string | null;
  isActive: boolean;
  onUpdate?: (patch: Partial<PlayerState>) => void;
}

// Bot accuracy and speed based on difficulty
const BOT_CONFIG = {
  easy: { correctChance: 0.25, minDelay: 10000, maxDelay: 20000 },
  medium: { correctChance: 0.4, minDelay: 8000, maxDelay: 15000 },
  hard: { correctChance: 0.55, minDelay: 6000, maxDelay: 12000 },
};

// Drag & drop bot: places regions steadily so progress is visible
const DRAG_BOT_CONFIG = {
  easy: { correctChance: 0.7, minDelay: 5000, maxDelay: 9000 },
  medium: { correctChance: 0.8, minDelay: 4000, maxDelay: 7000 },
  hard: { correctChance: 0.9, minDelay: 3000, maxDelay: 5000 },
};

// Photo game bot: answers one photo at a time
const PHOTO_BOT_CONFIG = {
  easy: { correctChance: 0.45, minDelay: 6000, maxDelay: 11000 },
  medium: { correctChance: 0.65, minDelay: 4500, maxDelay: 8000 },
  hard: { correctChance: 0.8, minDelay: 3000, maxDelay: 6000 },
};

export const useBotSimulation = (config: BotConfig) => {
  const onUpdateRef = useRef(config.onUpdate);
  const configRef = useRef(config);
  onUpdateRef.current = config.onUpdate;
  configRef.current = config;
  const push = useCallback(async (id: string, patch: Partial<PlayerState>) => {
    onUpdateRef.current?.(patch);
    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await supabase.from('game_players').update(patch).eq('id', id).select('id').maybeSingle();
      if (!error && data) return;
      if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 350));
      else console.warn('Bot update failed', error?.message || 'No row updated');
    }
  }, []);
  const intervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const botStateRef = useRef({
    regionsCompleted: 0,
    totalCorrect: 0,
    score: 0,
  });

  const simulateQuizBot = useCallback(async () => {
    const current = configRef.current;
    if (!current.botPlayerId || !current.isActive) return;

    const { correctChance } = BOT_CONFIG[current.difficulty];
    const state = botStateRef.current;

    if (state.regionsCompleted >= current.totalRegions) {
      // Bot finished
      await push(current.botPlayerId, {
        is_finished: true,
        finished_at: new Date().toISOString(),
        regions_completed: state.regionsCompleted,
        total_correct: state.totalCorrect,
        score: state.score,
      });
      
      if (intervalRef.current) clearTimeout(intervalRef.current);
      return;
    }

    // Simulate answering 3 questions for a region
    let regionCorrect = 0;
    for (let q = 0; q < 3; q++) {
      if (Math.random() < correctChance) {
        regionCorrect++;
      }
    }

    state.totalCorrect += regionCorrect;
    state.regionsCompleted += 1;
    state.score += regionCorrect * 10;

    await push(current.botPlayerId, {
      regions_completed: state.regionsCompleted,
      total_correct: state.totalCorrect,
      score: state.score,
      current_question: 0,
    });
  }, [push]);

  const simulateDragDropBot = useCallback(async () => {
    const current = configRef.current;
    if (!current.botPlayerId || !current.isActive) return;

    const state = botStateRef.current;

    if (state.regionsCompleted >= current.totalRegions) {
      await push(current.botPlayerId, {
        is_finished: true,
        finished_at: new Date().toISOString(),
        regions_completed: state.regionsCompleted,
        score: state.regionsCompleted,
      });
      
      if (intervalRef.current) clearTimeout(intervalRef.current);
      return;
    }

    // Bot places one region
    const { correctChance } = DRAG_BOT_CONFIG[current.difficulty];
    if (state.regionsCompleted === 0 || Math.random() < correctChance) {
      state.regionsCompleted += 1;
      state.score += 1;
    }

    await push(current.botPlayerId, {
      regions_completed: state.regionsCompleted,
      score: state.score,
    });
  }, [push]);

  const simulatePhotoBot = useCallback(async () => {
    const current = configRef.current;
    if (!current.botPlayerId || !current.isActive) return;

    const state = botStateRef.current;
    if (state.regionsCompleted >= current.totalRegions) {
      await push(current.botPlayerId, {
        is_finished: true,
        finished_at: new Date().toISOString(),
        regions_completed: state.regionsCompleted,
        total_correct: state.totalCorrect,
        score: state.score,
      });
      if (intervalRef.current) clearTimeout(intervalRef.current);
      return;
    }

    const { correctChance } = PHOTO_BOT_CONFIG[current.difficulty];
    state.regionsCompleted += 1;
    if (Math.random() < correctChance) {
      state.totalCorrect += 1;
      state.score += 10;
    }

    await push(current.botPlayerId, {
      regions_completed: state.regionsCompleted,
      total_correct: state.totalCorrect,
      score: state.score,
      current_question: state.regionsCompleted,
    });
  }, [push]);

  useEffect(() => {
    if (!config.isActive || !config.botPlayerId) return;

    botStateRef.current = { regionsCompleted: 0, totalCorrect: 0, score: 0 };

    const timing = config.gameType === 'quiz' ? BOT_CONFIG : config.gameType === 'photo' ? PHOTO_BOT_CONFIG : DRAG_BOT_CONFIG;
    const { minDelay, maxDelay } = timing[config.difficulty];
    const simulate = config.gameType === 'quiz' ? simulateQuizBot : config.gameType === 'photo' ? simulatePhotoBot : simulateDragDropBot;

    // Random interval for bot actions
    let active = true;
    const scheduleNext = (first = false) => {
      if (!active) return;
      const delay = first ? 1400 : minDelay + Math.random() * (maxDelay - minDelay);
      intervalRef.current = setTimeout(async () => {
        await simulate();
        if (!active) return;
        const current = configRef.current;
        if (current.isActive && botStateRef.current.regionsCompleted < current.totalRegions) {
          scheduleNext();
        }
      }, delay);
    };

    // Start after initial delay
    scheduleNext(true);

    return () => {
      active = false;
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [config.isActive, config.botPlayerId, config.difficulty, config.gameType, simulateQuizBot, simulateDragDropBot, simulatePhotoBot]);

  const reset = useCallback(() => {
    botStateRef.current = { regionsCompleted: 0, totalCorrect: 0, score: 0 };
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { reset };
};
