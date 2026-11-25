
-- Fix profiles: only authenticated users can view profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix user_stats: only authenticated users can view stats (for leaderboard)
DROP POLICY IF EXISTS "Users can view all stats for leaderboard" ON public.user_stats;
CREATE POLICY "Authenticated users can view stats for leaderboard"
ON public.user_stats
FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix game_rooms: users can only see rooms they created or participate in
DROP POLICY IF EXISTS "Anyone authenticated can view game rooms" ON public.game_rooms;
CREATE POLICY "Users can view their own game rooms"
ON public.game_rooms
FOR SELECT
USING (
  auth.uid() = created_by
  OR EXISTS (
    SELECT 1 FROM public.game_players
    WHERE game_players.room_id = game_rooms.id
    AND game_players.user_id = auth.uid()
  )
  OR (status = 'waiting' AND invite_code IS NULL)
);

-- Fix game_players: users can only see players in rooms they participate in
DROP POLICY IF EXISTS "Anyone authenticated can view game players" ON public.game_players;
CREATE POLICY "Users can view game players in their rooms"
ON public.game_players
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.game_players gp
    WHERE gp.room_id = game_players.room_id
    AND gp.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.game_rooms gr
    WHERE gr.id = game_players.room_id
    AND gr.created_by = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.game_rooms gr
    WHERE gr.id = game_players.room_id
    AND gr.status = 'waiting'
    AND gr.invite_code IS NULL
  )
);
