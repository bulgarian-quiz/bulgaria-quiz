
-- Fix 1: Restrict game_rooms SELECT to hide invite codes from non-participants
-- Drop existing select policy
DROP POLICY IF EXISTS "game_rooms_select" ON public.game_rooms;

-- Waiting rooms without invite codes (public queue) - visible to all authenticated
-- Waiting rooms WITH invite codes - only visible to creator (others join by code lookup via function)
-- Playing/finished rooms - visible to creator and players
CREATE POLICY "game_rooms_select"
ON public.game_rooms FOR SELECT
USING (
  auth.uid() = created_by
  OR public.is_player_in_room(auth.uid(), id)
  OR (status = 'waiting' AND invite_code IS NULL)
);

-- Create a security definer function for joining by invite code
-- This bypasses RLS so the joiner doesn't need to see the room directly
CREATE OR REPLACE FUNCTION public.find_room_by_invite_code(_code text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.game_rooms
  WHERE invite_code = _code AND status = 'waiting'
  LIMIT 1
$$;

-- Fix 2: Profiles - restrict to only own profile + leaderboard needs
-- The current policy allows any authenticated user to see ALL profiles
-- We keep it since the leaderboard needs display_name + avatar_url for all users
-- But we should ensure no sensitive data is in profiles (it's fine - only display_name, avatar_url, username)
-- Mark as acceptable since profiles only contain public display info
