CREATE TABLE IF NOT EXISTS public.points_rate (
  user_id uuid NOT NULL,
  action text NOT NULL,
  window_start timestamptz NOT NULL DEFAULT now(),
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, action)
);
GRANT ALL ON public.points_rate TO service_role;
ALTER TABLE public.points_rate ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.points_rate FROM anon, authenticated;

CREATE OR REPLACE FUNCTION public.points_take(_user_id uuid, _action text, _amount integer, _limit integer)
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE used integer; granted integer;
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
END; $$;
REVOKE ALL ON FUNCTION public.points_take(uuid, text, integer, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.record_activity(_action text, _count integer DEFAULT 1, _region text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  uid uuid := auth.uid();
  s public.user_stats%ROWTYPE;
  today date := (now() AT TIME ZONE 'Europe/Sofia')::date;
  n integer; pts integer := 0; new_streak integer; secs integer; old_min integer; new_min integer; last_tick timestamptz;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT * INTO s FROM public.user_stats WHERE user_id = uid FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('points', 0, 'streak', 0); END IF;
  new_streak := COALESCE(s.current_streak, 0);
  CASE _action
    WHEN 'correct_answers' THEN
      n := public.points_take(uid, _action, GREATEST(1, LEAST(COALESCE(_count, 1), 3)), 300);
      pts := 10 * n;
      UPDATE public.user_stats SET quiz_points = quiz_points + pts, total_points = total_points + pts, last_active_at = now() WHERE user_id = uid;
    WHEN 'game_complete' THEN
      pts := 200 * public.points_take(uid, _action, 1, 6);
      UPDATE public.user_stats SET quiz_points = quiz_points + pts, total_points = total_points + pts, last_active_at = now() WHERE user_id = uid;
    WHEN 'region_placed' THEN
      pts := 10 * public.points_take(uid, _action, 1, 150);
      UPDATE public.user_stats SET dragdrop_points = dragdrop_points + pts, total_points = total_points + pts, last_active_at = now() WHERE user_id = uid;
    WHEN 'flashcard_viewed' THEN
      n := public.points_take(uid, _action, 1, 300);
      pts := 5 * n;
      UPDATE public.user_stats SET flashcards_viewed = flashcards_viewed + n, flashcard_points = flashcard_points + pts,
        total_points = total_points + pts, last_active_at = now() WHERE user_id = uid;
    WHEN 'game_played' THEN
      n := public.points_take(uid, _action, 1, 30);
      UPDATE public.user_stats SET games_played = games_played + n, last_active_at = now() WHERE user_id = uid;
    WHEN 'region_completed' THEN
      IF _region = ANY (ARRAY['blagoevgrad','burgas','varna','velikoTarnovo','vidin','vratsa','gabrovo','dobrich',
          'kardzhali','kyustendil','lovech','montana','pazardzhik','pernik','pleven','plovdiv','razgrad','ruse',
          'silistra','sliven','smolyan','sofiaCity','sofiaProvince','staraZagora','targovishte','haskovo','shumen','yambol'])
         AND NOT (_region = ANY (COALESCE(s.completed_regions, ARRAY[]::text[]))) THEN
        UPDATE public.user_stats SET completed_regions = array_append(COALESCE(completed_regions, ARRAY[]::text[]), _region) WHERE user_id = uid;
      END IF;
    WHEN 'streak' THEN
      IF s.last_streak_date IS DISTINCT FROM today THEN
        new_streak := CASE WHEN s.last_streak_date = today - 1 THEN COALESCE(s.current_streak, 0) + 1 ELSE 1 END;
        pts := 100;
        UPDATE public.user_stats SET current_streak = new_streak, last_streak_date = today, total_points = total_points + pts, last_active_at = now() WHERE user_id = uid;
      END IF;
    WHEN 'streak_check' THEN
      IF s.last_streak_date IS NOT NULL AND s.last_streak_date < today - 1 AND COALESCE(s.current_streak, 0) > 0 THEN
        new_streak := 0;
        UPDATE public.user_stats SET current_streak = 0 WHERE user_id = uid;
      END IF;
    WHEN 'time' THEN
      SELECT window_start INTO last_tick FROM public.points_rate WHERE user_id = uid AND action = 'time_tick';
      INSERT INTO public.points_rate AS r (user_id, action, window_start, count) VALUES (uid, 'time_tick', now(), 0)
      ON CONFLICT (user_id, action) DO UPDATE SET window_start = now();
      secs := LEAST(GREATEST(COALESCE(_count, 0), 0), 120,
        GREATEST(0, FLOOR(EXTRACT(EPOCH FROM (now() - COALESCE(last_tick, now() - interval '120 seconds'))))::integer));
      IF secs > 0 THEN
        old_min := COALESCE(s.total_time_seconds, 0) / 60;
        new_min := (COALESCE(s.total_time_seconds, 0) + secs) / 60;
        IF old_min < 3 AND new_min >= 3 THEN pts := pts + 20; END IF;
        IF old_min < 20 AND new_min >= 20 THEN pts := pts + 300; END IF;
        UPDATE public.user_stats SET total_time_seconds = COALESCE(total_time_seconds, 0) + secs, total_points = total_points + pts, last_active_at = now() WHERE user_id = uid;
      END IF;
    ELSE
      RAISE EXCEPTION 'unknown action %', _action USING ERRCODE = '22023';
  END CASE;
  RETURN jsonb_build_object('points', pts, 'streak', new_streak);
END; $$;
REVOKE ALL ON FUNCTION public.record_activity(text, integer, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_activity(text, integer, text) TO authenticated;

DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_stats;
DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_stats;
REVOKE INSERT, UPDATE, DELETE ON public.user_stats FROM anon, authenticated;

DROP POLICY IF EXISTS "Authenticated users can view stats for leaderboard" ON public.user_stats;
CREATE POLICY "Users can view their own stats" ON public.user_stats FOR SELECT TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Profiles viewable by authenticated users" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.get_leaderboard(_limit integer DEFAULT 10)
RETURNS TABLE(user_id uuid, total_points integer, display_name text, avatar_url text, has_1_month_crown boolean, has_1_year_crown boolean)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.user_id, s.total_points, p.display_name, p.avatar_url,
         COALESCE(s.has_1_month_crown, false), COALESCE(s.has_1_year_crown, false)
  FROM public.user_stats s LEFT JOIN public.profiles p ON p.user_id = s.user_id
  WHERE auth.uid() IS NOT NULL
  ORDER BY s.total_points DESC
  LIMIT LEAST(GREATEST(COALESCE(_limit, 10), 1), 50)
$$;
REVOKE ALL ON FUNCTION public.get_leaderboard(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_leaderboard(integer) TO authenticated;