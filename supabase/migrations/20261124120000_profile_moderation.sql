-- Profile moderation (2026-11-24)
--
-- Names and profile photos are checked before they are saved. Someone who sets
-- an inappropriate name or photo is suspended from the site for 24 hours.
--
-- 1. user_bans holds suspensions; is_banned() answers whether one is running.
-- 2. The browser can no longer change display_name or avatar_url itself: both
--    go through the moderate-profile edge function, which checks them first.
-- 3. A name typed at sign-up is checked here against a word list too (the app
--    also asks the AI before signing up); a blocked one is replaced and the new
--    account is suspended.
-- 4. A suspended account earns no points and cannot create or join rooms, and
--    a player's name in a room always comes from their (checked) profile.

-- ============================================================================
-- 1. Suspensions
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.user_bans (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  banned_until timestamptz NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_bans FROM anon, authenticated;
GRANT SELECT ON public.user_bans TO authenticated;
GRANT ALL ON public.user_bans TO service_role;

DROP POLICY IF EXISTS "Users can see their own suspension" ON public.user_bans;
CREATE POLICY "Users can see their own suspension"
ON public.user_bans FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.is_banned(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_bans WHERE user_id = _user_id AND banned_until > now())
$$;
REVOKE ALL ON FUNCTION public.is_banned(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.is_banned(uuid) TO service_role;

-- Suspends a user for 24 hours from now (a running suspension starts again).
CREATE OR REPLACE FUNCTION public.ban_user_24h(_user_id uuid, _reason text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  until timestamptz := now() + interval '24 hours';
BEGIN
  INSERT INTO public.user_bans (user_id, banned_until, reason, created_at)
  VALUES (_user_id, until, left(_reason, 200), now())
  ON CONFLICT (user_id) DO UPDATE SET banned_until = EXCLUDED.banned_until, reason = EXCLUDED.reason, created_at = now();
  RETURN until;
END;
$$;
REVOKE ALL ON FUNCTION public.ban_user_24h(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ban_user_24h(uuid, text) TO service_role;

-- ============================================================================
-- 2. Names and photos change only through the moderate-profile function
-- ============================================================================

CREATE OR REPLACE FUNCTION public.guard_profile_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF auth.role() IN ('authenticated', 'anon')
     AND (NEW.display_name IS DISTINCT FROM OLD.display_name OR NEW.avatar_url IS DISTINCT FROM OLD.avatar_url) THEN
    RAISE EXCEPTION 'names and photos are changed through the moderation check' USING ERRCODE = '42501';
  END IF;
  IF auth.role() IN ('authenticated', 'anon') AND NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    RAISE EXCEPTION 'a profile cannot change owner' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_profile_update ON public.profiles;
CREATE TRIGGER guard_profile_update
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.guard_profile_update();

-- ============================================================================
-- 3. Sign-up names
-- ============================================================================

-- Clearly offensive words in Bulgarian and English (also typed with digits for
-- letters). The AI check in the edge function catches what this list misses.
CREATE OR REPLACE FUNCTION public.name_is_blocked(_name text)
RETURNS boolean LANGUAGE sql IMMUTABLE SET search_path = public
AS $$
  -- Cyrillic capitals are folded by hand so this works whatever the database's locale.
  SELECT translate(
      lower(coalesce(_name, '')),
      'АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЬЮЯ0134@$',
      'абвгдежзийклмнопрстуфхцчшщъьюяoieaas'
    ) ~
    ('(^|[^a-zа-я])(fuck|fuk|shit|bitch|cunt|nigg|fagg|whore|slut|porn|hitler|penis|vagina|asshole|pussy|putk|kurv|pederas|shiban|kopele|'
     || 'хуй|хуя|путк|путьо|педерас|педал|курв|шибан|еба|ебеш|ебем|ебя|копеле|духач)')
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  chosen text := left(btrim(COALESCE(NEW.raw_user_meta_data->>'display_name', '')), 50);
BEGIN
  IF chosen = '' THEN
    chosen := 'User';
  ELSIF public.name_is_blocked(chosen) THEN
    chosen := 'Играч';
    PERFORM public.ban_user_24h(NEW.id, 'name');
  END IF;

  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, chosen);

  INSERT INTO public.user_stats (user_id)
  VALUES (NEW.id);

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================================
-- 4. What a suspended account cannot do
-- ============================================================================

-- No points, streaks or play time (record_activity's updates are skipped).
CREATE OR REPLACE FUNCTION public.guard_stats_while_banned()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF public.is_banned(NEW.user_id) THEN
    RETURN NULL;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_stats_while_banned ON public.user_stats;
CREATE TRIGGER guard_stats_while_banned
BEFORE UPDATE ON public.user_stats
FOR EACH ROW EXECUTE FUNCTION public.guard_stats_while_banned();

-- No new rooms.
CREATE OR REPLACE FUNCTION public.guard_room_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF public.is_banned(NEW.created_by) THEN
    RAISE EXCEPTION 'account suspended' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_room_insert ON public.game_rooms;
CREATE TRIGGER guard_room_insert
BEFORE INSERT ON public.game_rooms
FOR EACH ROW EXECUTE FUNCTION public.guard_room_insert();

-- No joining rooms, and a player's name always comes from their profile (the
-- browser used to send any name it liked). Bots keep the name they are given.
CREATE OR REPLACE FUNCTION public.guard_player_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  profile_name text;
BEGIN
  IF COALESCE(NEW.is_bot, false) THEN
    RETURN NEW;
  END IF;
  IF public.is_banned(NEW.user_id) THEN
    RAISE EXCEPTION 'account suspended' USING ERRCODE = '42501';
  END IF;
  SELECT display_name INTO profile_name FROM public.profiles WHERE user_id = NEW.user_id;
  NEW.display_name := COALESCE(NULLIF(btrim(profile_name), ''), 'Player');
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_player_insert ON public.game_players;
CREATE TRIGGER guard_player_insert
BEFORE INSERT ON public.game_players
FOR EACH ROW EXECUTE FUNCTION public.guard_player_insert();

-- Players cannot rename themselves inside a room either.
CREATE OR REPLACE FUNCTION public.guard_player_update()
RETURNS trigger LANGUAGE plpgsql SET search_path = public
AS $$
BEGIN
  IF NEW.display_name IS DISTINCT FROM OLD.display_name AND NOT COALESCE(OLD.is_bot, false) THEN
    NEW.display_name := OLD.display_name;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS guard_player_update ON public.game_players;
CREATE TRIGGER guard_player_update
BEFORE UPDATE ON public.game_players
FOR EACH ROW EXECUTE FUNCTION public.guard_player_update();
