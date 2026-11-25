DROP POLICY IF EXISTS "game_players_insert" ON public.game_players;

CREATE POLICY "game_players_insert"
ON public.game_players
FOR INSERT
TO authenticated
WITH CHECK (
  (is_bot = false AND user_id = auth.uid())
  OR
  (is_bot = true AND user_id IS NULL AND public.is_room_creator(auth.uid(), room_id))
);