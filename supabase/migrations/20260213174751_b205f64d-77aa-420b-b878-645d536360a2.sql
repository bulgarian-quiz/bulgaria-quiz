
-- Add invite_code column to game_rooms for private invites
ALTER TABLE public.game_rooms ADD COLUMN invite_code TEXT UNIQUE;

-- Create index for fast lookups by invite code
CREATE INDEX idx_game_rooms_invite_code ON public.game_rooms (invite_code) WHERE invite_code IS NOT NULL;
