import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, LogOut, Users, Globe, Sun, Moon, LogIn, Search, Flame, LucideIcon } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import LogoutConfirmDialog from '@/components/LogoutConfirmDialog';

interface AppMenuProps {
  isOpen: boolean;
  onClose: () => void;
  mobileControls?: {
    isDark: boolean;
    onToggleTheme: () => void;
    onToggleLanguage: () => void;
    onLogin: () => void;
  };
}

interface MenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  color: string;
  disabled?: boolean;
  tooltip?: string;
}

const AppMenu: React.FC<AppMenuProps> = ({ isOpen, onClose, mobileControls }) => {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, signOut } = useAuth();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const t = {
    moreFeatures: language === 'bg' ? 'Още функции' : 'More Features',
    profile: language === 'bg' ? 'Профил' : 'Profile',
    logout: language === 'bg' ? 'Изход' : 'Logout',
    loginRequired: language === 'bg' ? 'Влезте, за да видите профила' : 'Login to view profile',
    about: language === 'bg' ? 'За нас' : 'About',
    search: language === 'bg' ? 'Търсене' : 'Search',
    language: language === 'bg' ? 'Език' : 'Language',
    theme: language === 'bg' ? 'Тема' : 'Theme',
    login: language === 'bg' ? 'Вход' : 'Login',
    streak: language === 'bg' ? 'Серия' : 'Streak',
  };

  const handleProfileClick = () => {
    if (user) {
      navigate('/profile');
      onClose();
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    await signOut();
    setShowLogoutConfirm(false);
    onClose();
  };

  const menuItems: MenuItem[] = [
    {
      icon: User,
      label: t.profile,
      onClick: handleProfileClick,
      disabled: !user,
      tooltip: !user ? t.loginRequired : undefined,
      color: 'bg-primary/20 text-primary',
    },
    ...(user ? [{
      icon: LogOut,
      label: t.logout,
      onClick: handleLogoutClick,
      disabled: false,
      tooltip: undefined,
      color: 'bg-destructive/20 text-destructive',
    }] : []),
  ];

  const mobileItems: MenuItem[] = mobileControls ? [
    { icon: Search, label: t.search, onClick: () => { navigate('/'); onClose(); setTimeout(() => document.querySelector<HTMLInputElement>('input[placeholder*="ърси"], input[placeholder*="earch"]')?.focus(), 0); }, color: 'bg-primary/20 text-primary' },
    { icon: Users, label: t.about, onClick: () => { navigate('/about'); onClose(); }, color: 'bg-success/20 text-success' },
    { icon: Globe, label: t.language, onClick: mobileControls.onToggleLanguage, color: 'bg-primary/20 text-primary' },
    { icon: mobileControls.isDark ? Sun : Moon, label: t.theme, onClick: mobileControls.onToggleTheme, color: 'bg-primary/20 text-primary' },
    { icon: Flame, label: t.streak, onClick: () => { navigate('/profile'); onClose(); }, color: 'bg-warning/20 text-warning' },
    ...(!user ? [{ icon: LogIn, label: t.login, onClick: mobileControls.onLogin, color: 'bg-primary/20 text-primary' }] : []),
  ] : [];

  const allItems = [...mobileItems, ...menuItems];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-sm glass-card border-white/20">
          <DialogHeader>
            <DialogTitle className="text-center text-xl">{t.moreFeatures}</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-3 gap-3 py-4">
            {allItems.map((item, index) => (
              <button
                key={index}
                onClick={item.onClick}
                disabled={item.disabled}
                title={item.tooltip}
                className={cn(
                  "flex flex-col items-center gap-2 p-4 rounded-2xl transition-interactive duration-200",
                  "hover:bg-white/10",
                  item.disabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center",
                  item.color
                )}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="text-xs text-foreground font-medium">{item.label}</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <LogoutConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogoutConfirm}
      />
    </>
  );
};

export default AppMenu;
