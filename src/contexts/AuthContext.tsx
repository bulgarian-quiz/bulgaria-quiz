import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { recordActivity } from '@/lib/recordActivity';
import { toast } from 'sonner';
import { localDateKey } from '@/lib/utils';
import { ModerationResult, removeAvatar, saveAvatar, saveDisplayName } from '@/lib/moderation';

interface Profile {
  id: string;
  user_id: string;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface UserStats {
  id: string;
  user_id: string;
  total_points: number;
  quiz_points: number;
  dragdrop_points: number;
  flashcard_points: number;
  total_time_seconds: number;
  games_played: number;
  flashcards_viewed: number;
  last_active_at: string | null;
  current_streak: number;
  last_streak_date: string | null;
  has_1_month_crown: boolean;
  has_1_year_crown: boolean;
  completed_regions: string[];
  created_at: string;
  updated_at: string;
}

/** Proof that a new account agreed to the legal pages (both boxes are required to sign up). */
export interface SignUpConsent { acceptedAt: string }

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  stats: UserStats | null;
  loading: boolean;
  signUp: (email: string, password: string, displayName: string, consent?: SignUpConsent) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: Error | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: Error | null }>;
  /** Checked by the server first; an inappropriate name or photo suspends the account for 24 hours. */
  changeDisplayName: (name: string) => Promise<ModerationResult>;
  changeAvatar: (image: string | null) => Promise<ModerationResult>;
  /** When the account's suspension ends (ISO time), or null when it is not suspended. */
  bannedUntil: string | null;
  incrementFlashcardsViewed: () => Promise<void>;
  incrementGamesPlayed: () => Promise<void>;
  updateStreak: () => Promise<void>;
  markRegionCompleted: (regionId: string) => Promise<void>;
  isRegionCompleted: (regionId: string) => boolean;
  refreshStats: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bannedUntil, setBannedUntil] = useState<string | null>(null);
  const timeTrackingInterval = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTimeUpdate = useRef<number>(Date.now());

  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data as Profile);
    }
  }, []);

  const fetchBan = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from('user_bans')
      .select('banned_until')
      .eq('user_id', userId)
      .gt('banned_until', new Date().toISOString())
      .maybeSingle();
    setBannedUntil(data?.banned_until ?? null);
  }, []);

  const fetchStats = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!error && data) {
      setStats(data as UserStats);
    }
  }, []);

  const refreshStats = useCallback(async () => {
    if (user) {
      await fetchStats(user.id);
    }
  }, [user, fetchStats]);

  // Time tracking: report elapsed play time; the server caps it to the time
  // that really passed and awards the 3- and 20-minute bonuses.
  const updateTimeSpent = useCallback(async () => {
    if (!user || !stats) return;
    const now = Date.now();
    const elapsedSeconds = Math.floor((now - lastTimeUpdate.current) / 1000);
    lastTimeUpdate.current = now;
    if (elapsedSeconds > 0) await recordActivity('time', elapsedSeconds);
  }, [user, stats]);

  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Use setTimeout to avoid blocking the auth state change
          setTimeout(() => {
            fetchProfile(session.user.id);
            fetchStats(session.user.id);
            fetchBan(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setStats(null);
          setBannedUntil(null);
        }
        setLoading(false);
      }
    );

    // Then check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchStats(session.user.id);
        fetchBan(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchStats, fetchBan]);

  // The suspension lifts by itself when its time is up.
  useEffect(() => {
    if (!bannedUntil) return;
    const left = new Date(bannedUntil).getTime() - Date.now();
    if (left <= 0) {
      setBannedUntil(null);
      return;
    }
    const timer = setTimeout(() => setBannedUntil(null), Math.min(left + 1000, 2 ** 31 - 1));
    return () => clearTimeout(timer);
  }, [bannedUntil]);

  // Set up time tracking
  useEffect(() => {
    if (user && stats) {
      lastTimeUpdate.current = Date.now();
      timeTrackingInterval.current = setInterval(() => {
        updateTimeSpent();
      }, 60000); // Update every minute
    }
    
    return () => {
      if (timeTrackingInterval.current) {
        clearInterval(timeTrackingInterval.current);
      }
    };
  }, [user, stats, updateTimeSpent]);

  const signUp = async (email: string, password: string, displayName: string, consent?: SignUpConsent) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          display_name: displayName,
          // When the new user agreed to the Privacy Policy and the Terms & Conditions.
          ...(consent ? { privacy_policy_accepted_at: consent.acceptedAt, terms_accepted_at: consent.acceptedAt } : {}),
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    if (timeTrackingInterval.current) {
      clearInterval(timeTrackingInterval.current);
    }
    await updateTimeSpent(); // Save final time
    await supabase.auth.signOut();
    setProfile(null);
    setStats(null);
  };

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error: error as Error | null };
  };

  const updatePassword = async (newPassword: string) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    return { error: error as Error | null };
  };

  const applyModeration = async (result: ModerationResult): Promise<ModerationResult> => {
    if (result.status === 'banned') setBannedUntil(result.bannedUntil);
    if (result.status === 'rejected') setBannedUntil(result.bannedUntil ?? new Date(Date.now() + 24 * 3600 * 1000).toISOString());
    if (result.status === 'saved' && user) await fetchProfile(user.id);
    return result;
  };

  const changeDisplayName = async (name: string) =>
    user ? applyModeration(await saveDisplayName(name)) : ({ status: 'error' } as const);

  const changeAvatar = async (image: string | null) =>
    user ? applyModeration(await (image ? saveAvatar(image) : removeAvatar())) : ({ status: 'error' } as const);

  // Streaks, completed provinces and counters are recorded on the server
  // (record_activity), which also awards the points.
  const updateStreak = async () => {
    if (!user || !stats) return;
    if (stats.last_streak_date === localDateKey()) return;
    const result = await recordActivity('streak');
    await fetchStats(user.id);
    if (result && result.points > 0) {
      toast.success(`🔥 Streak: ${result.streak} day${result.streak > 1 ? 's' : ''}! +${result.points} points`);
    }
  };

  const markRegionCompleted = async (regionId: string) => {
    if (!user || !stats) return;
    if ((stats.completed_regions || []).includes(regionId)) return;
    await recordActivity('region_completed', 1, regionId);
    await fetchStats(user.id);
  };

  const isRegionCompleted = (regionId: string): boolean => {
    if (!stats) return false;
    return (stats.completed_regions || []).includes(regionId);
  };

  const incrementFlashcardsViewed = async () => {
    if (!user || !stats) return;
    await recordActivity('flashcard_viewed');
    // Update streak on activity
    await updateStreak();
    await fetchStats(user.id);
  };

  const incrementGamesPlayed = async () => {
    if (!user || !stats) return;
    await recordActivity('game_played');
    await fetchStats(user.id);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        stats,
        loading,
        signUp,
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        changeDisplayName,
        changeAvatar,
        bannedUntil,
        incrementFlashcardsViewed,
        incrementGamesPlayed,
        updateStreak,
        markRegionCompleted,
        isRegionCompleted,
        refreshStats,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
