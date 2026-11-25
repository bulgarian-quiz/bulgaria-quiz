import { supabase } from '@/integrations/supabase/client';

/**
 * Points, streaks, play time and completed provinces are recorded on the server
 * by the record_activity database function (the browser cannot write user_stats
 * directly). It awards fixed amounts per action and caps how often each action
 * pays out; see supabase/migrations/20261112120000_secure_points_and_rooms.sql.
 */
export type ActivityAction =
  | 'correct_answers'
  | 'game_complete'
  | 'region_placed'
  | 'flashcard_viewed'
  | 'game_played'
  | 'region_completed'
  | 'streak'
  | 'streak_check'
  | 'time';

export interface ActivityResult { points: number; streak: number }

export async function recordActivity(action: ActivityAction, count = 1, region?: string): Promise<ActivityResult | null> {
  const { data, error } = await supabase.rpc('record_activity', { _action: action, _count: count, _region: region ?? null });
  if (error || !data || typeof data !== 'object') return null;
  const result = data as { points?: unknown; streak?: unknown };
  return { points: Number(result.points) || 0, streak: Number(result.streak) || 0 };
}
