-- Remove duplicate non-bot player rows per room before enforcing uniqueness
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY room_id, user_id
      ORDER BY created_at ASC, id ASC
    ) AS rn
  FROM public.game_players
  WHERE user_id IS NOT NULL
)
DELETE FROM public.game_players gp
USING ranked r
WHERE gp.id = r.id
  AND r.rn > 1;

-- Enforce one non-bot player row per user per room
CREATE UNIQUE INDEX IF NOT EXISTS game_players_room_user_unique_idx
ON public.game_players (room_id, user_id)
WHERE user_id IS NOT NULL;