-- Security fixes (2026-11-12)
--
-- 1. Points: the browser can no longer write user_stats directly (anyone could
--    set their own leaderboard points and crowns to any value). All scoring goes
--    through public.record_activity(), which awards fixed amounts per action,
--    caps how often each action can pay out, and works out streaks and time
--    bonuses on the server.
-- 2. Multiplayer rooms: the SECURITY DEFINER helpers only answer for the caller,
--    private (invite-code) rooms can only be joined with their code via
--    public.join_room_by_invite_code(), private rooms' players are no longer
--    readable by everyone, and nobody can change a room's owner, invite code or
--    game type, or reopen a room.

-- ============================================================================
-- 1. Points
-- ============================================================================

-- Hourly payout counters per user and action. Only the functions below use it.
CREATE TABLE IF NOT EXISTS public.points_rate (
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action)
);
ALTER TABLE public.points_rate ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.points_rate FROM anon, authenticated;

-- Consumes _amount from the user's hourly budget for _action; returns how much
-- of _amount was allowed (0 when the budget is used up).
CREATE OR REPLACE FUNCTION public.points_take(_user_id uuid, _action text, _amount integer, _limit integer)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  used integer;
  granted integer;
BEGIN
  INSERT INTO public.points_rate AS r (user_id, action, window_start, count)
  VALUES (_user_id, _action, now(), 0)
  ON CONFLICT (user_id, action) DO UPDATE
    SET count = CASE WHEN r.window_start < now() - interval '1 hour' THEN 0 ELSE r.count END,
        window_start = CASE WHEN r.window_start < now() - interval '1 hour' THEN now() ELSE r.window_start END
  RETURNING r.count INTO used;

  granted := GREATEST(0, LEAST(_amount, _limit - used));
  IF granted > 0 THEN
    UPDATE public.points_rate SET count = count + granted WHERE user_id = _user_id AND action = _action;
  END IF;
  RETURN granted;
END;
$$;
REVOKE ALL ON FUNCTION public.points_take(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;

-- The only way to change user_stats from the app. Returns the points awarded
-- and the current streak, e.g. {"points": 10, "streak": 3}.
--   correct_answers (_count 1-3) : +10 quiz points each, max 300 answers/hour
--   game_complete                : +200 quiz points, max 6/hour
--   region_placed                : +10 map-game points, max 150/hour
--   flashcard_viewed             : +5 flashcard points and +1 viewed, max 300/hour
--   game_played                  : +1 game played, max 30/hour
--   region_completed (_region)   : marks one of the 28 provinces completed
--   streak                       : once per day: +100 points, streak +1 (or 1)
--   streak_check                 : resets a lapsed streak to 0
--   time (_count = seconds)      : adds play time (at most the time really elapsed
--                                  since the last report, 120 s per call) and the
--                                  3-minute / 20-minute bonuses
CREATE OR REPLACE FUNCTION public.record_activity(_action text, _count integer DEFAULT 1, _region text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  s public.user_stats%ROWTYPE;
  today date := (now() AT TIME ZONE 'Europe/Sofia')::date;
  n integer;
  pts integer := 0;
  new_streak integer;
  secs integer;
  old_min integer;
  new_min integer;
  last_tick timestamptz;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
  END IF;

  SELECT * INTO s FROM public.user_stats WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('points', 0, 'streak', 0);
  END IF;
  new_streak := COALESCE(s.current_streak, 0);

  CASE _action
    WHEN 'correct_answers' THEN
      n := public.points_take(uid, _action, GREATEST(1, LEAST(COALESCE(_count, 1), 3)), 300);
      pts := 10 * n;
      UPDATE public.user_stats SET quiz_points = quiz_points + pts, total_points = total_points + pts, last_active_at = now()
      WHERE user_id = uid;

    WHEN 'game_complete' THEN
      pts := 200 * public.points_take(uid, _action, 1, 6);
      UPDATE public.user_stats SET quiz_points = quiz_points + pts, total_points = total_points + pts, last_active_at = now()
      WHERE user_id = uid;

    WHEN 'region_placed' THEN
      pts := 10 * public.points_take(uid, _action, 1, 150);
      UPDATE public.user_stats SET dragdrop_points = dragdrop_points + pts, total_points = total_points + pts, last_active_at = now()
      WHERE user_id = uid;

    WHEN 'flashcard_viewed' THEN
      n := public.points_take(uid, _action, 1, 300);
      pts := 5 * n;
      UPDATE public.user_stats
      SET flashcards_viewed = flashcards_viewed + n, flashcard_points = flashcard_points + pts,
          total_points = total_points + pts, last_active_at = now()
      WHERE user_id = uid;

    WHEN 'game_played' THEN
      n := public.points_take(uid, _action, 1, 30);
      UPDATE public.user_stats SET games_played = games_played + n, last_active_at = now() WHERE user_id = uid;

    WHEN 'region_completed' THEN
      IF _region = ANY (ARRAY['blagoevgrad','burgas','varna','velikoTarnovo','vidin','vratsa','gabrovo','dobrich',
          'kardzhali','kyustendil','lovech','montana','pazardzhik','pernik','pleven','plovdiv','razgrad','ruse',
          'silistra','sliven','smolyan','sofiaCity','sofiaProvince','staraZagora','targovishte','haskovo','shumen','yambol'])
         AND NOT (_region = ANY (COALESCE(s.completed_regions, ARRAY[]::text[]))) THEN
        UPDATE public.user_stats
        SET completed_regions = array_append(COALESCE(completed_regions, ARRAY[]::text[]), _region)
        WHERE user_id = uid;
      END IF;

    WHEN 'streak' THEN
      IF s.last_streak_date IS DISTINCT FROM today THEN
        new_streak := CASE WHEN s.last_streak_date = today - 1 THEN COALESCE(s.current_streak, 0) + 1 ELSE 1 END;
        pts := 100;
        UPDATE public.user_stats
        SET current_streak = new_streak, last_streak_date = today, total_points = total_points + pts, last_active_at = now()
        WHERE user_id = uid;
      END IF;

    WHEN 'streak_check' THEN
      IF s.last_streak_date IS NOT NULL AND s.last_streak_date < today - 1 AND COALESCE(s.current_streak, 0) > 0 THEN
        new_streak := 0;
        UPDATE public.user_stats SET current_streak = 0 WHERE user_id = uid;
      END IF;

    WHEN 'time' THEN
      -- Never more than the time that really passed since this user's previous
      -- time report (its own clock in points_rate), and at most 120 s per call.
      SELECT window_start INTO last_tick FROM public.points_rate WHERE user_id = uid AND action = 'time_tick';
      INSERT INTO public.points_rate AS r (user_id, action, window_start, count) VALUES (uid, 'time_tick', now(), 0)
      ON CONFLICT (user_id, action) DO UPDATE SET window_start = now();
      secs := LEAST(
        GREATEST(COALESCE(_count, 0), 0),
        120,
        GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - COALESCE(last_tick, now() - interval '120 seconds'))))::integer)
      );
      IF secs > 0 THEN
        old_min := COALESCE(s.total_time_seconds, 0) / 60;
        new_min := (COALESCE(s.total_time_seconds, 0) + secs) / 60;
        IF old_min < 3 AND new_min >= 3 THEN pts := pts + 20; END IF;
        IF old_min < 20 AND new_min >= 20 THEN pts := pts + 300; END IF;
        UPDATE public.user_stats
        SET total_time_seconds = COALESCE(total_time_seconds, 0) + secs, total_points = total_points + pts, last_active_at = now()
        WHERE user_id = uid;
      END IF;

    ELSE
      RAISE EXCEPTION 'unknown action %', _action USING ERRCODE = '22023';
  END CASE;

  RETURN jsonb_build_object('points', pts, 'streak', new_streak);
END;
$$;
REVOKE ALL ON FUNCTION public.record_activity(text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_activity(text, integer, text) TO authenticated;

-- Close direct writes. Reading (for the leaderboard) stays as it was; the
-- sign-up trigger creates the row with its own rights.
DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_stats;
REVOKE INSERT, UPDATE, DELETE ON public.user_stats FROM anon, authenticated;

-- ============================================================================
-- 2. Multiplayer rooms
-- ============================================================================

-- The helpers keep their signatures (policies call them with auth.uid()), but
-- now answer only for the caller, so calling them directly with someone else's
-- id reveals nothing.
CREATE OR REPLACE FUNCTION public.is_player_in_room(_user_id uuid, _room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.game_players WHERE user_id = _user_id AND room_id = _room_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_room_creator(_user_id uuid, _room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.game_rooms WHERE id = _room_id AND created_by = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.get_user_room_ids(_user_id uuid)
RETURNS SETOF uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT room_id FROM public.game_players WHERE user_id = _user_id AND _user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT _user_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- Whether a room is open to anyone: waiting and without an invite code.
-- (Reveals nothing the game_rooms SELECT policy doesn't already show.)
CREATE OR REPLACE FUNCTION public.is_public_waiting_room(_room_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.game_rooms WHERE id = _room_id AND status = 'waiting' AND invite_code IS NULL
  )
$$;

-- Players of a room: its players and creator, plus anyone while it is a
-- public waiting room (for matchmaking). Private rooms stay private.
DROP POLICY IF EXISTS "game_players_select" ON public.game_players;
CREATE POLICY "game_players_select"
ON public.game_players FOR SELECT
USING (
  room_id IN (SELECT public.get_user_room_ids(auth.uid()))
  OR public.is_room_creator(auth.uid(), room_id)
  OR public.is_public_waiting_room(room_id)
);

-- get_room_status exposed invite codes to anyone who knew a room id, and is no
-- longer used by any policy.
DROP FUNCTION IF EXISTS public.get_room_status(uuid);

-- Joining: yourself, into your own room or a public waiting room. Private rooms
-- are joined only through join_room_by_invite_code(). Bots: room creator only.
DROP POLICY IF EXISTS "game_players_insert" ON public.game_players;
CREATE POLICY "game_players_insert"
ON public.game_players FOR INSERT
TO authenticated
WITH CHECK (
  (is_bot = false AND user_id = auth.uid()
    AND (public.is_room_creator(auth.uid(), room_id) OR public.is_public_waiting_room(room_id)))
  OR
  (is_bot = true AND user_id IS NULL AND public.is_room_creator(auth.uid(), room_id))
);

-- Join a friend's private room with its code. Returns the room id, or NULL if
-- no waiting room has that code.
CREATE OR REPLACE FUNCTION public.join_room_by_invite_code(_code text, _display_name text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  rid uuid;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501';
  END IF;
  SELECT id INTO rid FROM public.game_rooms
  WHERE invite_code = _code AND status = 'waiting'
  LIMIT 1;
  IF rid IS NULL THEN
    RETURN NULL;
  END IF;
  INSERT INTO public.game_players (room_id, user_id, display_name)
  VALUES (rid, uid, COALESCE(NULLIF(left(btrim(_display_name), 50), ''), 'Player'))
  ON CONFLICT DO NOTHING;
  RETURN rid;
END;
$$;
REVOKE ALL ON FUNCTION public.join_room_by_invite_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_room_by_invite_code(text, text) TO authenticated;

-- Players may move a room forward (waiting -> playing -> finished) but never
-- change who owns it, its invite code or game type, or reopen it.
CREATE OR REPLACE FUNCTION public.guard_game_room_update()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.created_by IS DISTINCT FROM OLD.created_by
     OR NEW.invite_code IS DISTINCT FROM OLD.invite_code
     OR NEW.game_type IS DISTINCT FROM OLD.game_type THEN
    RAISE EXCEPTION 'room owner, invite code and game type cannot be changed' USING ERRCODE = '42501';
  END IF;
  IF OLD.status = 'finished' AND NEW.status IS DISTINCT FROM 'finished' THEN
    RAISE EXCEPTION 'a finished room cannot be reopened' USING ERRCODE = '42501';
  END IF;
  IF OLD.status = 'playing' AND NEW.status = 'waiting' THEN
    RAISE EXCEPTION 'a started room cannot go back to waiting' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_game_room_update ON public.game_rooms;
CREATE TRIGGER guard_game_room_update
BEFORE UPDATE ON public.game_rooms
FOR EACH ROW EXECUTE FUNCTION public.guard_game_room_update();
