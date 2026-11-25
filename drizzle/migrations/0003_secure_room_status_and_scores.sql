CREATE OR REPLACE FUNCTION public.get_room_status(_room_id uuid)
 RETURNS TABLE(status text, invite_code text, created_by uuid)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT gr.status,
         CASE WHEN gr.created_by = auth.uid() OR public.is_player_in_room(auth.uid(), gr.id) THEN gr.invite_code END,
         CASE WHEN gr.created_by = auth.uid() OR public.is_player_in_room(auth.uid(), gr.id) THEN gr.created_by END
  FROM public.game_rooms gr WHERE gr.id = _room_id
$$;

CREATE OR REPLACE FUNCTION public.guard_player_progress()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.score < OLD.score OR NEW.score - OLD.score > 30 OR NEW.score > 1000
     OR NEW.total_correct < OLD.total_correct OR NEW.total_correct - OLD.total_correct > 3
     OR NEW.regions_completed < OLD.regions_completed OR NEW.regions_completed - OLD.regions_completed > 1
     OR NEW.regions_completed > 28
     OR (OLD.is_finished AND (NEW.score <> OLD.score OR NOT NEW.is_finished)) THEN
    RAISE EXCEPTION 'invalid progress update' USING ERRCODE = '22023';
  END IF;
  NEW.room_id := OLD.room_id; NEW.user_id := OLD.user_id; NEW.is_bot := OLD.is_bot;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS guard_player_progress ON public.game_players;
CREATE TRIGGER guard_player_progress BEFORE UPDATE ON public.game_players
FOR EACH ROW EXECUTE FUNCTION public.guard_player_progress();