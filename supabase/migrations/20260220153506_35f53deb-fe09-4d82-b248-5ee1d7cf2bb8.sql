
-- Fix game_rooms policies: drop RESTRICTIVE and recreate as PERMISSIVE

DROP POLICY IF EXISTS "Authenticated users can create game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Room creator or players can update rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Users can view their own game rooms" ON public.game_rooms;

CREATE POLICY "Authenticated users can create game rooms"
ON public.game_rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creator or players can update rooms"
ON public.game_rooms FOR UPDATE
USING (
  (auth.uid() = created_by) OR 
  (EXISTS (SELECT 1 FROM game_players WHERE game_players.room_id = game_rooms.id AND game_players.user_id = auth.uid()))
);

CREATE POLICY "Users can view their own game rooms"
ON public.game_rooms FOR SELECT
USING (
  (auth.uid() = created_by) OR 
  (EXISTS (SELECT 1 FROM game_players WHERE game_players.room_id = game_rooms.id AND game_players.user_id = auth.uid())) OR 
  (status = 'waiting' AND invite_code IS NULL) OR 
  (status = 'waiting' AND invite_code IS NOT NULL)
);

-- Fix game_players policies: drop RESTRICTIVE and recreate as PERMISSIVE

DROP POLICY IF EXISTS "Authenticated users can insert game players" ON public.game_players;
DROP POLICY IF EXISTS "Players can update their own record" ON public.game_players;
DROP POLICY IF EXISTS "Users can view game players in their rooms" ON public.game_players;

CREATE POLICY "Authenticated users can insert game players"
ON public.game_players FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Players can update their own record"
ON public.game_players FOR UPDATE
USING (
  (auth.uid() = user_id) OR 
  ((is_bot = true) AND (room_id IN (SELECT gp.room_id FROM game_players gp WHERE gp.user_id = auth.uid())))
);

CREATE POLICY "Users can view game players in their rooms"
ON public.game_players FOR SELECT
USING (
  (EXISTS (SELECT 1 FROM game_players gp WHERE gp.room_id = game_players.room_id AND gp.user_id = auth.uid())) OR 
  (EXISTS (SELECT 1 FROM game_rooms gr WHERE gr.id = game_players.room_id AND gr.created_by = auth.uid())) OR 
  (EXISTS (SELECT 1 FROM game_rooms gr WHERE gr.id = game_players.room_id AND gr.status = 'waiting' AND gr.invite_code IS NULL))
);
