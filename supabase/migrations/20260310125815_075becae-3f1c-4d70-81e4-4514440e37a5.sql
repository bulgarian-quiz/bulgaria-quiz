
-- Add unique constraint on game_players(room_id, user_id) for non-null user_ids
-- First clean up any duplicates
DELETE FROM public.game_players a
USING public.game_players b
WHERE a.user_id IS NOT NULL
  AND a.user_id = b.user_id
  AND a.room_id = b.room_id
  AND a.created_at > b.created_at;

-- Create unique index (only for non-null user_ids since bots have null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_game_players_room_user 
ON public.game_players(room_id, user_id) 
WHERE user_id IS NOT NULL;
