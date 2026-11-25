
-- Fix game_rooms SELECT policy to allow joining by invite code
DROP POLICY IF EXISTS "Users can view their own game rooms" ON public.game_rooms;

CREATE POLICY "Users can view their own game rooms"
  ON public.game_rooms FOR SELECT
  USING (
    (auth.uid() = created_by)
    OR (EXISTS (
      SELECT 1 FROM game_players
      WHERE game_players.room_id = game_rooms.id AND game_players.user_id = auth.uid()
    ))
    OR (status = 'waiting' AND invite_code IS NULL)
    OR (status = 'waiting' AND invite_code IS NOT NULL)
  );
