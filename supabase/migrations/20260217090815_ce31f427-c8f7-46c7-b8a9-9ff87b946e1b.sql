
-- Fix bot update RLS policy - restrict to bots in user's own rooms
DROP POLICY IF EXISTS "Players can update their own record" ON public.game_players;

CREATE POLICY "Players can update their own record"
  ON public.game_players FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR 
    (is_bot = true AND room_id IN (
      SELECT gp.room_id FROM public.game_players gp
      WHERE gp.user_id = auth.uid()
    ))
  );

-- Fix milestone trigger to use OLD record and prevent duplicate awards
CREATE OR REPLACE FUNCTION public.check_account_milestones()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  account_created_at timestamp with time zone;
  days_since_creation integer;
BEGIN
  SELECT created_at INTO account_created_at 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  IF account_created_at IS NOT NULL THEN
    days_since_creation := EXTRACT(DAY FROM (NOW() - account_created_at));
    
    -- Only award if OLD didn't have it
    IF days_since_creation >= 30 
       AND COALESCE(OLD.has_1_month_crown, false) = false
       AND COALESCE(NEW.has_1_month_crown, false) = false THEN
      NEW.has_1_month_crown := true;
      NEW.total_points := COALESCE(NEW.total_points, 0) + 2000;
    END IF;
    
    IF days_since_creation >= 365 
       AND COALESCE(OLD.has_1_year_crown, false) = false
       AND COALESCE(NEW.has_1_year_crown, false) = false THEN
      NEW.has_1_year_crown := true;
      NEW.total_points := COALESCE(NEW.total_points, 0) + 5000;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add profile field length constraints
ALTER TABLE public.profiles
ADD CONSTRAINT display_name_length_check 
CHECK (display_name IS NULL OR char_length(display_name) <= 100);

ALTER TABLE public.profiles
ADD CONSTRAINT username_length_check 
CHECK (username IS NULL OR char_length(username) <= 50);
