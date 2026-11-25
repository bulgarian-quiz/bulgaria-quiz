-- Add streak and account milestone tracking columns to user_stats
ALTER TABLE public.user_stats 
ADD COLUMN IF NOT EXISTS current_streak integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_streak_date date DEFAULT NULL,
ADD COLUMN IF NOT EXISTS has_1_month_crown boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS has_1_year_crown boolean DEFAULT false;

-- Add avatar_url update trigger and completed regions tracking
ALTER TABLE public.user_stats
ADD COLUMN IF NOT EXISTS completed_regions text[] DEFAULT '{}';

-- Create function to check and award milestone crowns
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
  -- Get the profile creation date
  SELECT created_at INTO account_created_at 
  FROM public.profiles 
  WHERE user_id = NEW.user_id;
  
  IF account_created_at IS NOT NULL THEN
    days_since_creation := EXTRACT(DAY FROM (NOW() - account_created_at));
    
    -- Check for 1 month (30 days) milestone
    IF days_since_creation >= 30 AND NOT COALESCE(NEW.has_1_month_crown, false) THEN
      NEW.has_1_month_crown := true;
      NEW.total_points := COALESCE(NEW.total_points, 0) + 2000;
    END IF;
    
    -- Check for 1 year (365 days) milestone
    IF days_since_creation >= 365 AND NOT COALESCE(NEW.has_1_year_crown, false) THEN
      NEW.has_1_year_crown := true;
      NEW.total_points := COALESCE(NEW.total_points, 0) + 10000000;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for milestone checking on stats update
DROP TRIGGER IF EXISTS check_milestones_trigger ON public.user_stats;
CREATE TRIGGER check_milestones_trigger
BEFORE UPDATE ON public.user_stats
FOR EACH ROW
EXECUTE FUNCTION public.check_account_milestones();