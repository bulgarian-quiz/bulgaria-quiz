
-- Drop all existing policies on both tables
DROP POLICY IF EXISTS "Authenticated users can create game rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Room creator or players can update rooms" ON public.game_rooms;
DROP POLICY IF EXISTS "Users can view their own game rooms" ON public.game_rooms;

DROP POLICY IF EXISTS "Authenticated users can insert game players" ON public.game_players;
DROP POLICY IF EXISTS "Players can update their own record" ON public.game_players;
DROP POLICY IF EXISTS "Users can view game players in their rooms" ON public.game_players;

-- Create security definer functions to break recursion

CREATE OR REPLACE FUNCTION public.is_player_in_room(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_players
    WHERE user_id = _user_id AND room_id = _room_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_room_creator(_user_id uuid, _room_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_rooms
    WHERE id = _room_id AND created_by = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_room_ids(_user_id uuid)
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT room_id FROM public.game_players WHERE user_id = _user_id
$$;

CREATE OR REPLACE FUNCTION public.get_room_status(_room_id uuid)
RETURNS TABLE(status text, invite_code text, created_by uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT gr.status, gr.invite_code, gr.created_by
  FROM public.game_rooms gr
  WHERE gr.id = _room_id
$$;

-- game_rooms policies (no reference to game_players)
CREATE POLICY "game_rooms_insert"
ON public.game_rooms FOR INSERT
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "game_rooms_select"
ON public.game_rooms FOR SELECT
USING (
  auth.uid() = created_by
  OR public.is_player_in_room(auth.uid(), id)
  OR (status = 'waiting')
);

CREATE POLICY "game_rooms_update"
ON public.game_rooms FOR UPDATE
USING (
  auth.uid() = created_by
  OR public.is_player_in_room(auth.uid(), id)
);

-- game_players policies (no reference to game_rooms)
CREATE POLICY "game_players_insert"
ON public.game_players FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "game_players_select"
ON public.game_players FOR SELECT
USING (
  room_id IN (SELECT public.get_user_room_ids(auth.uid()))
  OR public.is_room_creator(auth.uid(), room_id)
  OR (SELECT s.status FROM public.get_room_status(room_id) s LIMIT 1) = 'waiting'
);

CREATE POLICY "game_players_update"
ON public.game_players FOR UPDATE
USING (
  auth.uid() = user_id
  OR (is_bot = true AND room_id IN (SELECT public.get_user_room_ids(auth.uid())))
);
