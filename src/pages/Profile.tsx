import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Trophy, Clock, Gamepad2, Layers, Crown, ArrowLeft, Medal, Flame, Camera, Upload, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useSeo } from "@/seo/useSeo";
import { Input } from '@/components/ui/input';
import { shrinkImage, type ModerationResult } from '@/lib/moderation';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  display_name: string | null;
  avatar_url: string | null;
  has_1_month_crown: boolean;
  has_1_year_crown: boolean;
}

const Profile: React.FC = () => {
  useSeo('/profile');
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, profile, stats, loading, changeAvatar, changeDisplayName, refreshStats } = useAuth();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [savingName, setSavingName] = useState(false);

  const t = {
    profile: language === 'bg' ? 'Профил' : 'Profile',
    dashboard: language === 'bg' ? 'Табло' : 'Dashboard',
    leaderboard: language === 'bg' ? 'Класация' : 'Leaderboard',
    totalPoints: language === 'bg' ? 'Общо точки' : 'Total Points',
    quizPoints: language === 'bg' ? 'Точки от куиз' : 'Quiz Points',
    dragdropPoints: language === 'bg' ? 'Точки от подреждане' : 'Drag & Drop Points',
    flashcardPoints: language === 'bg' ? 'Точки от флашкарти' : 'Flashcard Points',
    gamesPlayed: language === 'bg' ? 'Изиграни игри' : 'Games Played',
    flashcardsViewed: language === 'bg' ? 'Разгледани флашкарти' : 'Flashcards Viewed',
    timeActive: language === 'bg' ? 'Време в сайта' : 'Time Active',
    currentStreak: language === 'bg' ? 'Текущ streak' : 'Current Streak',
    memberSince: language === 'bg' ? 'Член от' : 'Member Since',
    back: language === 'bg' ? 'Назад' : 'Back',
    notLoggedIn: language === 'bg' ? 'Моля, влезте в профила си' : 'Please log in to view your profile',
    rank: language === 'bg' ? 'Място' : 'Rank',
    player: language === 'bg' ? 'Играч' : 'Player',
    points: language === 'bg' ? 'Точки' : 'Points',
    you: language === 'bg' ? '(Вие)' : '(You)',
    days: language === 'bg' ? 'дни' : 'days',
    changePhoto: language === 'bg' ? 'Смени снимка' : 'Change Photo',
    photoUpdated: language === 'bg' ? 'Снимката е обновена!' : 'Photo updated!',
    photoError: language === 'bg' ? 'Грешка при качване' : 'Upload error',
    checking: language === 'bg' ? 'Проверяваме снимката…' : 'Checking the photo…',
    checkUnavailable: language === 'bg' ? 'Проверката на снимки не е достъпна в момента. Опитай по-късно.' : 'Photo checks are not available right now. Please try again later.',
    tooMany: language === 'bg' ? 'Опитай отново по-късно.' : 'Please try again later.',
    editName: language === 'bg' ? 'Смени името' : 'Change name',
    save: language === 'bg' ? 'Запази' : 'Save',
    cancel: language === 'bg' ? 'Отказ' : 'Cancel',
    nameUpdated: language === 'bg' ? 'Името е сменено!' : 'Name changed!',
    nameInvalid: language === 'bg' ? 'Името трябва да е между 2 и 30 знака.' : 'The name must be 2 to 30 characters.',
  };

  // What to tell the player after the server checked a name or photo. A
  // rejected one suspends the account, and the suspension screen explains it.
  const reportModeration = (result: ModerationResult, success: string) => {
    if (result.status === 'saved') toast.success(success);
    else if (result.status === 'unavailable') toast.error(t.checkUnavailable);
    else if (result.status === 'error') toast.error(t.tooMany);
  };

  const saveName = async () => {
    const name = nameDraft.replace(/\s+/g, ' ').trim();
    if (name.length < 2 || name.length > 30) {
      toast.error(t.nameInvalid);
      return;
    }
    if (name === profile?.display_name) {
      setEditingName(false);
      return;
    }
    setSavingName(true);
    const result = await changeDisplayName(name);
    setSavingName(false);
    if (result.status === 'saved') setEditingName(false);
    reportModeration(result, t.nameUpdated);
  };

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoadingLeaderboard(true);
      
      // Top 10 through a safe server lookup (other players' rows are private)
      const { data } = await supabase.rpc('get_leaderboard', { _limit: 10 });
      if (data) {
        setLeaderboard(data.map((e) => ({
          user_id: e.user_id,
          total_points: e.total_points,
          display_name: e.display_name || 'Anonymous',
          avatar_url: e.avatar_url || null,
          has_1_month_crown: e.has_1_month_crown || false,
          has_1_year_crown: e.has_1_year_crown || false,
        })));
      }

      setLoadingLeaderboard(false);
    };
    
    fetchLeaderboard();
    refreshStats();
  }, [refreshStats]);

  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (!file.type.startsWith('image/')) {
      toast.error(t.photoError);
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Max 10MB');
      return;
    }

    setUploadingAvatar(true);
    const checking = toast.loading(t.checking);
    try {
      // A small square copy is checked by the server before it is saved.
      const image = await shrinkImage(file);
      reportModeration(await changeAvatar(image), t.photoUpdated);
    } catch {
      toast.error(t.photoError);
    } finally {
      toast.dismiss(checking);
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="pt-24 pb-12 px-4 flex-1 flex items-center justify-center">
          <div className="glass-card rounded-3xl p-8 text-center">
            <p className="text-lg text-muted-foreground">{t.notLoggedIn}</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString(language === 'bg' ? 'bg-BG' : 'en-US');
  };

  const statCards = [
    { icon: Trophy, label: t.totalPoints, value: stats?.total_points || 0, color: 'bg-primary/20 text-primary' },
    { icon: Flame, label: t.currentStreak, value: `${stats?.current_streak || 0} ${t.days}`, color: 'bg-warning/20 text-warning' },
    { icon: Clock, label: t.timeActive, value: formatTime(stats?.total_time_seconds || 0), color: 'bg-info/20 text-info' },
    { icon: Gamepad2, label: t.gamesPlayed, value: stats?.games_played || 0, color: 'bg-accent text-accent-foreground' },
    { icon: Gamepad2, label: t.quizPoints, value: stats?.quiz_points || 0, color: 'bg-success/20 text-success' },
    { icon: Crown, label: t.dragdropPoints, value: stats?.dragdrop_points || 0, color: 'bg-destructive/20 text-destructive' },
    { icon: Layers, label: t.flashcardPoints, value: stats?.flashcard_points || 0, color: 'bg-muted text-muted-foreground' },
  ];

  const getRankIcon = (rank: number, entry: LeaderboardEntry) => {
    if (entry.has_1_year_crown) {
      return <Crown className="w-6 h-6 text-yellow-400" />;
    }
    if (entry.has_1_month_crown) {
      return <Crown className="w-5 h-5 text-yellow-500" />;
    }
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 text-center font-bold">{rank}</span>;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      
      <main className="pt-24 pb-12 px-4 flex-1 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="glass-button"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t.back}
            </Button>
            <h1 className="text-3xl font-bold text-foreground">{t.dashboard}</h1>
          </div>

          {/* Profile Header */}
          <div className="glass-card rounded-3xl p-6 mb-8 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
                  {profile?.avatar_url ? (
                    <img 
                      src={profile.avatar_url} 
                      alt="Avatar" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl font-bold text-primary">
                      {(profile?.display_name || 'U')[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingAvatar}
                  className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  {uploadingAvatar ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-5 h-5 text-white" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <div className="flex-1 min-w-0">
                {editingName ? (
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(event) => {
                      event.preventDefault();
                      saveName();
                    }}
                  >
                    <Input
                      value={nameDraft}
                      onChange={(event) => setNameDraft(event.target.value)}
                      maxLength={30}
                      autoFocus
                      aria-label={t.editName}
                      className="max-w-xs"
                      disabled={savingName}
                    />
                    <Button type="submit" size="icon" disabled={savingName} aria-label={t.save}>
                      {savingName ? (
                        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </Button>
                    <Button type="button" size="icon" variant="ghost" disabled={savingName} aria-label={t.cancel} onClick={() => setEditingName(false)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </form>
                ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-foreground">
                    {profile?.display_name || 'User'}
                  </h2>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    aria-label={t.editName}
                    title={t.editName}
                    onClick={() => {
                      setNameDraft(profile?.display_name || '');
                      setEditingName(true);
                    }}
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                  {stats?.has_1_year_crown && (
                    <Crown className="w-6 h-6 text-yellow-400" />
                  )}
                  {stats?.has_1_month_crown && !stats?.has_1_year_crown && (
                    <Crown className="w-5 h-5 text-yellow-500" />
                  )}
                </div>
                )}
                <p className="text-muted-foreground">
                  {t.memberSince}: {formatDate(profile?.created_at || null)}
                </p>
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Stats Grid */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground">{t.profile}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-3 sm:gap-4">
                {statCards.map((card, index) => (
                  <div
                    key={index}
                    className="glass-card rounded-2xl p-4 animate-scale-in"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    <div className={cn("w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mb-2 sm:mb-3", card.color)}>
                      <card.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{card.label}</p>
                    <p className="text-lg sm:text-2xl font-bold text-foreground">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Leaderboard */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-primary" />
                {t.leaderboard}
              </h2>
              <div className="glass-card rounded-2xl overflow-hidden">
                {loadingLeaderboard ? (
                  <div className="p-8 flex justify-center">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : (
                  <div className="divide-y divide-white/10">
                    {/* Header */}
                    <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-white/5 text-sm text-muted-foreground font-medium">
                      <div className="col-span-2">{t.rank}</div>
                      <div className="col-span-7">{t.player}</div>
                      <div className="col-span-3 text-right">{t.points}</div>
                    </div>
                    {/* Entries */}
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.user_id}
                        className={cn(
                          "grid grid-cols-12 gap-2 px-4 py-3 items-center transition-colors",
                          entry.user_id === user?.id && "bg-primary/10"
                        )}
                      >
                        <div className="col-span-2 flex items-center">
                          {getRankIcon(index + 1, entry)}
                        </div>
                        <div className="col-span-7 min-w-0 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {entry.avatar_url ? (
                              <img src={entry.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[8px] font-bold text-primary">
                                {(entry.display_name || 'A')[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="font-medium text-foreground truncate">
                            {entry.display_name}
                            {entry.user_id === user?.id && (
                              <span className="text-primary ml-1">{t.you}</span>
                            )}
                          </span>
                        </div>
                        <div className="col-span-3 text-right font-bold text-foreground break-all">
                          {entry.total_points.toLocaleString()}
                        </div>
                      </div>
                    ))}
                    {leaderboard.length === 0 && (
                      <div className="p-4 text-center text-muted-foreground">
                        No players yet
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;
