
-- Game rooms for multiplayer matchmaking
CREATE TABLE public.game_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type TEXT NOT NULL CHECK (game_type IN ('quiz', 'dragdrop')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  timer_seconds INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE
);

-- Players in a game room
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.game_rooms(id) ON DELETE CASCADE,
  user_id UUID,
  display_name TEXT NOT NULL DEFAULT 'Player',
  is_bot BOOLEAN NOT NULL DEFAULT false,
  bot_difficulty TEXT CHECK (bot_difficulty IN ('easy', 'medium', 'hard')),
  score INTEGER NOT NULL DEFAULT 0,
  regions_completed INTEGER NOT NULL DEFAULT 0,
  current_region TEXT,
  current_question INTEGER NOT NULL DEFAULT 0,
  total_correct INTEGER NOT NULL DEFAULT 0,
  region_results JSONB NOT NULL DEFAULT '{}',
  is_finished BOOLEAN NOT NULL DEFAULT false,
  finished_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;

-- RLS Policies for game_rooms
CREATE POLICY "Anyone authenticated can view game rooms"
  ON public.game_rooms FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can create game rooms"
  ON public.game_rooms FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Room creator or players can update rooms"
  ON public.game_rooms FOR UPDATE
  USING (
    auth.uid() = created_by OR 
    EXISTS (SELECT 1 FROM public.game_players WHERE room_id = game_rooms.id AND user_id = auth.uid())
  );

-- RLS Policies for game_players
CREATE POLICY "Anyone authenticated can view game players"
  ON public.game_players FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert game players"
  ON public.game_players FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Players can update their own record"
  ON public.game_players FOR UPDATE
  USING (auth.uid() = user_id OR is_bot = true);

-- Enable realtime for live multiplayer
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_players;

-- Auto-update timestamps
CREATE TRIGGER update_game_players_updated_at
  BEFORE UPDATE ON public.game_players
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for fast matchmaking queries
CREATE INDEX idx_game_rooms_status_type ON public.game_rooms(status, game_type);
CREATE INDEX idx_game_players_room_id ON public.game_players(room_id);
CREATE INDEX idx_game_players_user_id ON public.game_players(user_id);
