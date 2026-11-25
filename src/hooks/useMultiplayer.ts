import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Database, Json } from '@/integrations/supabase/types';

type PlayerRow = Database['public']['Tables']['game_players']['Row'];
type PlayerUpdate = Database['public']['Tables']['game_players']['Update'];

/** Room game types. The photo game has one per answer mode, so public
 *  matchmaking pairs players who chose the same mode. */
export type GameType = 'quiz' | 'dragdrop' | 'photo' | 'photo_typed';

export interface PlayerState {
  id: string;
  user_id: string | null;
  display_name: string;
  is_bot: boolean;
  bot_difficulty: string | null;
  score: number;
  regions_completed: number;
  current_region: string | null;
  current_question: number;
  total_correct: number;
  region_results: Record<string, { score: number; total: number }>;
  is_finished: boolean;
  finished_at: string | null;
}

export interface UseMultiplayerReturn {
  roomId: string | null;
  isSearching: boolean;
  isConnected: boolean;
  showCountdown: boolean;
  opponent: PlayerState | null;
  myPlayer: PlayerState | null;
  searchTimeLeft: number;
  inviteCode: string | null;
  startSearch: (gameType: GameType, timerSeconds: number | null) => Promise<void>;
  createInvite: (gameType: GameType, timerSeconds: number | null) => Promise<void>;
  joinByCode: (code: string, gameType: GameType, timerSeconds: number | null) => Promise<boolean>;
  cancelSearch: () => void;
  updateProgress: (data: Partial<PlayerState>) => Promise<void>;
  finishGame: () => Promise<void>;
  createBotGame: (gameType: GameType, timerSeconds: number | null, botDifficulty: string) => Promise<void>;
  onCountdownComplete: () => void;
  patchOpponent: (patch: Partial<PlayerState>) => void;
}

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  for (let i = 0; i < 6; i++) code += chars[bytes[i] % chars.length];
  return code;
}

function toPlayerState(row: PlayerRow): PlayerState {
  return {
    id: row.id,
    user_id: row.user_id,
    display_name: row.display_name,
    is_bot: row.is_bot,
    bot_difficulty: row.bot_difficulty,
    score: row.score ?? 0,
    regions_completed: row.regions_completed ?? 0,
    current_region: row.current_region ?? null,
    current_question: row.current_question ?? 0,
    total_correct: row.total_correct ?? 0,
    region_results: (row.region_results as unknown as PlayerState['region_results']) || {},
    is_finished: row.is_finished ?? false,
    finished_at: row.finished_at ?? null,
  };
}

export const useMultiplayer = (): UseMultiplayerReturn => {
  const { user, profile } = useAuth();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);
  const [opponent, setOpponent] = useState<PlayerState | null>(null);
  const [myPlayer, setMyPlayer] = useState<PlayerState | null>(null);
  const [searchTimeLeft, setSearchTimeLeft] = useState(30);
  const [inviteCode, setInviteCode] = useState<string | null>(null);

  const searchTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const roomIdRef = useRef<string | null>(null);
  const myPlayerIdRef = useRef<string | null>(null);
  const countdownShownRef = useRef(false);

  const cleanup = useCallback(() => {
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    countdownShownRef.current = false;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  const getDisplayName = useCallback(() => {
    // The server uses the (checked) profile name in any case.
    return profile?.display_name || user?.user_metadata?.display_name || 'Player';
  }, [user, profile]);

  // Simple insert — no upsert needed
  const insertMyPlayer = useCallback(async (rId: string): Promise<PlayerState | null> => {
    if (!user) return null;

    // Check if already in room
    const { data: existing } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', rId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      const ps = toPlayerState(existing);
      setMyPlayer(ps);
      myPlayerIdRef.current = ps.id;
      return ps;
    }

    const { data, error } = await supabase
      .from('game_players')
      .insert({ room_id: rId, user_id: user.id, display_name: getDisplayName() })
      .select()
      .single();

    if (error || !data) {
      const { data: racedPlayer } = await supabase
        .from('game_players')
        .select('*')
        .eq('room_id', rId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (!racedPlayer) {
        console.error('insertMyPlayer error:', error);
        return null;
      }
      const racedState = toPlayerState(racedPlayer);
      setMyPlayer(racedState);
      myPlayerIdRef.current = racedState.id;
      return racedState;
    }

    const ps = toPlayerState(data);
    setMyPlayer(ps);
    myPlayerIdRef.current = ps.id;
    return ps;
  }, [user, getDisplayName]);

  // Find opponent by querying players in the room
  const findOpponent = useCallback(async (rId: string): Promise<PlayerState | null> => {
    if (!user) return null;
    const { data: players } = await supabase
      .from('game_players')
      .select('*')
      .eq('room_id', rId);

    if (players) {
      const opp = players.find(p => p.user_id !== user.id);
      if (opp) {
        const ps = toPlayerState(opp);
        setOpponent(ps);
        return ps;
      }
    }
    return null;
  }, [user]);

  // Poll for opponent with retries
  const pollForOpponent = useCallback(async (rId: string, maxAttempts = 20): Promise<PlayerState | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      const opp = await findOpponent(rId);
      if (opp) return opp;
      await new Promise(r => setTimeout(r, 500));
    }
    return null;
  }, [findOpponent]);

  // Trigger countdown exactly once
  const triggerCountdown = useCallback(() => {
    if (countdownShownRef.current) return;
    countdownShownRef.current = true;
    if (searchTimerRef.current) {
      clearInterval(searchTimerRef.current);
      searchTimerRef.current = null;
    }
    setIsSearching(false);
    setShowCountdown(true);
  }, []);

  // Subscribe to realtime changes for opponent progress updates
  const subscribeToRoom = useCallback((rId: string) => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`room-${rId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_players', filter: `room_id=eq.${rId}` },
        (payload) => {
          const data = payload.new as PlayerRow | null;
          if (!data || !data.id) return;
          const ps = toPlayerState(data);

          if (user && data.user_id === user.id) {
            setMyPlayer(ps);
            myPlayerIdRef.current = ps.id;
          } else {
            // Opponent appeared or updated
            setOpponent(ps);
            triggerCountdown();
          }
        }
      )
      .subscribe();

    channelRef.current = channel;
  }, [user, triggerCountdown]);

  const setRoomPlaying = useCallback(async (rId: string, timerSeconds: number | null) => {
    await supabase
      .from('game_rooms')
      .update({
        status: 'playing',
        started_at: new Date().toISOString(),
        timer_seconds: timerSeconds,
      })
      .eq('id', rId)
      .eq('status', 'waiting');
  }, []);

  const onCountdownComplete = useCallback(() => {
    setShowCountdown(false);
    setIsConnected(true);
  }, []);

  // ── Public matchmaking ──
  const startSearch = useCallback(async (gameType: GameType, timerSeconds: number | null) => {
    if (!user || isSearching) return;

    setIsSearching(true);
    setSearchTimeLeft(30);
    setInviteCode(null);
    setOpponent(null);
    setMyPlayer(null);
    countdownShownRef.current = false;

    // Look for an existing waiting room to join
    const { data: existingRooms } = await supabase
      .from('game_rooms')
      .select('id, created_by')
      .eq('game_type', gameType)
      .eq('status', 'waiting')
      .is('invite_code', null)
      .neq('created_by', user.id)
      .order('created_at', { ascending: true })
      .limit(5);

    let joinedRoomId: string | null = null;

    if (existingRooms?.length) {
      for (const room of existingRooms) {
        const { data: players } = await supabase
          .from('game_players')
          .select('user_id')
          .eq('room_id', room.id);

        const count = players?.length ?? 0;
        const alreadyIn = players?.some(p => p.user_id === user.id);
        if (count === 1 && !alreadyIn) {
          joinedRoomId = room.id;
          break;
        }
      }
    }

    if (joinedRoomId) {
      // Join existing room
      roomIdRef.current = joinedRoomId;
      setRoomId(joinedRoomId);
      subscribeToRoom(joinedRoomId);
      await insertMyPlayer(joinedRoomId);
      await setRoomPlaying(joinedRoomId, timerSeconds);

      const opp = await pollForOpponent(joinedRoomId);
      if (opp) triggerCountdown();
      return;
    }

    // Create new room and wait for someone
    const { data: newRoom, error: roomError } = await supabase
      .from('game_rooms')
      .insert({ game_type: gameType, timer_seconds: timerSeconds, created_by: user.id })
      .select('id')
      .single();

    if (roomError || !newRoom) {
      console.error('Room creation failed:', roomError);
      setIsSearching(false);
      return;
    }

    roomIdRef.current = newRoom.id;
    setRoomId(newRoom.id);
    subscribeToRoom(newRoom.id);
    await insertMyPlayer(newRoom.id);

    // Timeout: fall back to bot after 30s
    let timeLeft = 30;
    searchTimerRef.current = setInterval(async () => {
      timeLeft--;
      setSearchTimeLeft(timeLeft);

      if (timeLeft <= 0) {
        if (searchTimerRef.current) {
          clearInterval(searchTimerRef.current);
          searchTimerRef.current = null;
        }

        const currentRoomId = roomIdRef.current;
        if (!currentRoomId || countdownShownRef.current) return;

        const existingOpponent = await findOpponent(currentRoomId);
        if (existingOpponent) {
          await setRoomPlaying(currentRoomId, timerSeconds);
          triggerCountdown();
          return;
        }

        // Insert bot
        const { data: botData } = await supabase
          .from('game_players')
          .insert({
            room_id: currentRoomId,
            user_id: null,
            display_name: 'Bot 🤖',
            is_bot: true,
            bot_difficulty: 'medium',
          })
          .select()
          .single();

        if (botData) setOpponent(toPlayerState(botData));
        await setRoomPlaying(currentRoomId, timerSeconds);
        triggerCountdown();
      }
    }, 1000);
  }, [user, isSearching, insertMyPlayer, subscribeToRoom, setRoomPlaying, pollForOpponent, findOpponent, triggerCountdown]);

  // ── Invite friend ──
  const createInvite = useCallback(async (gameType: GameType, timerSeconds: number | null) => {
    if (!user || isSearching) return;

    setIsSearching(true);
    setSearchTimeLeft(999);
    setOpponent(null);
    setMyPlayer(null);
    countdownShownRef.current = false;

    const code = generateCode();
    setInviteCode(code);

    const { data: newRoom } = await supabase
      .from('game_rooms')
      .insert({ game_type: gameType, timer_seconds: timerSeconds, created_by: user.id, invite_code: code })
      .select('id')
      .single();

    if (!newRoom) {
      setIsSearching(false);
      return;
    }

    roomIdRef.current = newRoom.id;
    setRoomId(newRoom.id);
    await insertMyPlayer(newRoom.id);
    subscribeToRoom(newRoom.id);
  }, [user, isSearching, insertMyPlayer, subscribeToRoom]);

  // ── Join by code ──
  const joinByCode = useCallback(async (code: string, _gameType: GameType, timerSeconds: number | null): Promise<boolean> => {
    if (!user) return false;

    setOpponent(null);
    setMyPlayer(null);
    countdownShownRef.current = false;

    // Private rooms are joined on the server with the code; the browser cannot
    // add itself to a private room any other way.
    const { data: foundRoomId } = await supabase.rpc('join_room_by_invite_code', { _code: code.trim().toUpperCase(), _display_name: getDisplayName() });
    if (!foundRoomId) return false;

    roomIdRef.current = foundRoomId;
    setRoomId(foundRoomId);
    subscribeToRoom(foundRoomId);
    await insertMyPlayer(foundRoomId); // already a player: this just loads the row
    await setRoomPlaying(foundRoomId, timerSeconds);

    const opp = await pollForOpponent(foundRoomId);
    if (opp) triggerCountdown();
    return true;
  }, [user, getDisplayName, insertMyPlayer, subscribeToRoom, setRoomPlaying, pollForOpponent, triggerCountdown]);

  // ── Cancel search ──
  const cancelSearch = useCallback(async () => {
    cleanup();
    if (roomIdRef.current) {
      await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', roomIdRef.current);
    }
    setIsSearching(false);
    setRoomId(null);
    setInviteCode(null);
    setOpponent(null);
    setMyPlayer(null);
    roomIdRef.current = null;
    myPlayerIdRef.current = null;
  }, [cleanup]);

  // ── Bot game ──
  const createBotGame = useCallback(async (gameType: GameType, timerSeconds: number | null, botDifficulty: string) => {
    if (!user) return;

    setOpponent(null);
    setMyPlayer(null);
    countdownShownRef.current = false;

    // Create room already in 'playing' state
    const { data: newRoom } = await supabase
      .from('game_rooms')
      .insert({
        game_type: gameType,
        timer_seconds: timerSeconds,
        created_by: user.id,
        status: 'playing',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (!newRoom) return;

    roomIdRef.current = newRoom.id;
    setRoomId(newRoom.id);

    // Insert myself first and do not start a half-created match.
    const humanPlayer = await insertMyPlayer(newRoom.id);
    if (!humanPlayer) {
      await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', newRoom.id);
      throw new Error('Unable to create player');
    }

    subscribeToRoom(newRoom.id);

    // Insert the bot with one retry before allowing the countdown to begin.
    let botData: PlayerRow | null = null;
    for (let attempt = 0; attempt < 2 && !botData; attempt++) {
      const { data } = await supabase
        .from('game_players')
        .insert({
          room_id: newRoom.id,
          user_id: null,
          display_name: 'Bot 🤖',
          is_bot: true,
          bot_difficulty: botDifficulty,
        })
        .select()
        .single();
      botData = data;
      if (!botData && attempt === 0) await new Promise(resolve => setTimeout(resolve, 400));
    }

    if (!botData) {
      await supabase.from('game_rooms').update({ status: 'finished' }).eq('id', newRoom.id);
      throw new Error('Unable to create bot');
    }

    setOpponent(toPlayerState(botData));
    countdownShownRef.current = true;
    setShowCountdown(true);
  }, [user, insertMyPlayer, subscribeToRoom]);

  // ── Update progress ──
  const updateProgress = useCallback(async (data: Partial<PlayerState>) => {
    const playerId = myPlayerIdRef.current;
    if (!playerId) return;

    const updateData: PlayerUpdate = {};
    const keys: (keyof PlayerState)[] = [
      'score', 'regions_completed', 'current_region', 'current_question',
      'total_correct', 'region_results', 'is_finished', 'finished_at',
    ];
    for (const key of keys) {
      if (data[key] !== undefined) (updateData as Record<string, unknown>)[key] = key === 'region_results' ? (data[key] as unknown as Json) : data[key];
    }

    await supabase.from('game_players').update(updateData).eq('id', playerId);
    setMyPlayer(prev => prev ? { ...prev, ...data } : null);
  }, []);

  // ── Finish game ──
  const finishGame = useCallback(async () => {
    const playerId = myPlayerIdRef.current;
    if (!playerId) return;

    await supabase
      .from('game_players')
      .update({ is_finished: true, finished_at: new Date().toISOString() })
      .eq('id', playerId);

    const currentRoomId = roomIdRef.current;
    if (currentRoomId) {
      const { data: players } = await supabase
        .from('game_players')
        .select('is_finished')
        .eq('room_id', currentRoomId);

      if (players?.every(p => p.is_finished)) {
        await supabase
          .from('game_rooms')
          .update({ status: 'finished', finished_at: new Date().toISOString() })
          .eq('id', currentRoomId);
      }
    }
  }, []);

  const patchOpponent = useCallback((patch: Partial<PlayerState>) => {
    setOpponent(prev => (prev ? { ...prev, ...patch } : prev));
  }, []);

  return {
    patchOpponent,
    roomId,
    isSearching,
    isConnected,
    showCountdown,
    opponent,
    myPlayer,
    searchTimeLeft,
    inviteCode,
    startSearch,
    createInvite,
    joinByCode,
    cancelSearch,
    updateProgress,
    finishGame,
    createBotGame,
    onCountdownComplete,
  };
};
