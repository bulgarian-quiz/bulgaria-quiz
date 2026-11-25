CREATE OR REPLACE FUNCTION public.join_room_by_invite_code(_code text, _display_name text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE uid uuid := auth.uid(); rid uuid;
BEGIN
  IF uid IS NULL THEN RAISE EXCEPTION 'not signed in' USING ERRCODE = '42501'; END IF;
  SELECT id INTO rid FROM public.game_rooms WHERE invite_code = _code AND status = 'waiting' LIMIT 1;
  IF rid IS NULL THEN RETURN NULL; END IF;
  INSERT INTO public.game_players (room_id, user_id, display_name)
  VALUES (rid, uid, COALESCE(NULLIF(left(btrim(_display_name), 50), ''), 'Player'))
  ON CONFLICT DO NOTHING;
  RETURN rid;
END; $$;
REVOKE ALL ON FUNCTION public.join_room_by_invite_code(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.join_room_by_invite_code(text, text) TO authenticated;