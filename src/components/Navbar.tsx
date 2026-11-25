import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Puzzle, Users, Globe, Sun, Moon, Layers, LogIn, LogOut, Search, Settings, X, Cookie } from 'lucide-react';
import { cn } from '@/lib/utils';
import { hasSeenJourney, TO_HUB_STATE } from '@/lib/journey';
import { reopenCookieChoice, useCookieChoice } from '@/lib/cookieConsent';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import AuthModal from '@/components/AuthModal';
import StreakBadge from '@/components/StreakBadge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface SearchResult {
  title: string;
  path: string;
  description: string;
}

interface NavbarProps {
  alwaysVisible?: boolean;
}

const Navbar: React.FC<NavbarProps> = ({ alwaysVisible = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const cookieChoice = useCookieChoice();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();

  // All searchable pages
  const allPages: SearchResult[] = [
    { title: language === 'bg' ? 'Начало' : 'Home', path: '/', description: language === 'bg' ? 'Началната страница' : 'The home page' },
    { title: language === 'bg' ? 'Игри' : 'Games', path: '/games', description: language === 'bg' ? 'Интерактивни игри за България' : 'Interactive games about Bulgaria' },
    { title: language === 'bg' ? 'Куиз за България' : 'Bulgaria Quiz', path: '/game', description: language === 'bg' ? 'Географски куиз с въпроси за областите' : 'Geography quiz with questions about regions' },
    { title: language === 'bg' ? 'Подреди областите' : 'Arrange Regions', path: '/drag-drop-game', description: language === 'bg' ? 'Постави областите на правилното място' : 'Place regions in correct location' },
    { title: language === 'bg' ? 'Познай мястото' : 'Guess the Place', path: '/photo-quiz', description: language === 'bg' ? 'Познай местата от България по снимка' : 'Name places in Bulgaria from a photo' },
    { title: language === 'bg' ? 'Флашкарти' : 'Flashcards', path: '/flashcards', description: language === 'bg' ? 'Образователни флашкарти' : 'Educational flashcards' },
    { title: language === 'bg' ? 'История флашкарти' : 'History Flashcards', path: '/flashcards/history', description: language === 'bg' ? 'Исторически факти за България' : 'Historical facts about Bulgaria' },
    { title: language === 'bg' ? 'География флашкарти' : 'Geography Flashcards', path: '/flashcards/geography', description: language === 'bg' ? 'Географски факти за България' : 'Geography facts about Bulgaria' },
    { title: language === 'bg' ? 'Общи флашкарти' : 'General Flashcards', path: '/flashcards/general', description: language === 'bg' ? 'Общи интересни факти' : 'General interesting facts' },
    { title: language === 'bg' ? 'За нас' : 'About Us', path: '/about', description: language === 'bg' ? 'Информация за екипа' : 'Information about the team' },
    { title: language === 'bg' ? 'Профил' : 'Profile', path: '/profile', description: language === 'bg' ? 'Вашият профил и статистики' : 'Your profile and statistics' },
  ];

  useEffect(() => {
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const filtered = allPages.filter(
        page => 
          page.title.toLowerCase().includes(query) || 
          page.description.toLowerCase().includes(query)
      );
      setSearchResults(filtered);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, language]);

  useEffect(() => {
    if (alwaysVisible) {
      setIsVisible(true);
      return;
    }

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [alwaysVisible]);

  const navItems = [
    { to: '/games', label: t.games, icon: Puzzle },
    { to: '/flashcards', label: t.flashcards, icon: Layers },
    { to: '/about', label: t.about, icon: Users },
  ];

  const handleSearchSelect = (path: string) => {
    navigate(path);
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleSearchClose = () => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <>
      <nav
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-surface duration-300 ease-out',
          // The fade-in must not linger (`forwards` would keep it attached): a lingering opacity
          // animation stops the toolbar's backdrop blur from seeing the page behind it.
          'glass-navbar [animation:fade-in_0.3s_var(--ease-out)_backwards]',
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        )}
      >
        <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <Link 
              to="/" 
              onClick={(event) => {
                // After the film has been seen once, the title returns to the journey hub, not the film's start.
                if (!hasSeenJourney() || event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                navigate('/', { state: TO_HUB_STATE });
              }}
              className="hidden md:block text-base font-bold text-foreground hover:text-primary transition-colors whitespace-nowrap"
            >
              {t.siteTitle}
            </Link>

            {/* Nav Links */}
            <div className="flex w-full items-center justify-between gap-0.5 md:w-auto md:justify-start md:gap-0.5 lg:gap-1">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.to;
                
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    aria-label={item.label}
                    aria-current={isActive ? 'page' : undefined}
                    className={cn(
                      'nav-hit flex items-center justify-center gap-1.5 p-2 md:px-2 lg:px-3 md:py-1.5 rounded-xl font-medium transition-interactive duration-200 text-xs',
                      isActive 
                        ? 'glass-button-primary text-primary-foreground' 
                        : 'glass-button text-muted-foreground hover:text-foreground'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="hidden lg:inline">{item.label}</span>
                  </Link>
                );
              })}

              {/* Streak Badge */}
              <div className="block"><StreakBadge /></div>

              {/* Search */}
              <div className="relative block">
                {showSearch ? (
                  <div className="flex items-center gap-1">
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={language === 'bg' ? 'Търси...' : 'Search...'}
                      aria-label={language === 'bg' ? 'Търсене' : 'Search'}
                      className="glass-input px-2 py-1 text-xs rounded-lg w-20 sm:w-28 lg:w-36"
                      autoFocus
                    />
                    <Button type="button" variant="ghost" size="icon"
                      onClick={handleSearchClose}
                      className="nav-hit h-9 w-9 rounded-xl glass-button"
                      aria-label={language === 'bg' ? 'Затвори търсенето' : 'Close search'}
                    >
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <Button type="button" variant="ghost" size="icon"
                    onClick={() => setShowSearch(true)}
                    className="nav-hit h-9 w-9 rounded-xl glass-button text-muted-foreground hover:text-foreground"
                    aria-label={language === 'bg' ? 'Търсене' : 'Search'}
                  >
                    <Search className="w-5 h-5" />
                  </Button>
                )}

                {/* Search Results Dropdown */}
                {showSearch && searchResults.length > 0 && (
                  <div className="absolute top-full mt-2 right-0 w-64 glass-card rounded-xl p-2 shadow-2xl z-50">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        onClick={() => handleSearchSelect(result.path)}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <p className="text-sm font-medium text-foreground">{result.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{result.description}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="ghost" size="icon" className="nav-hit h-10 w-10 rounded-xl glass-button text-muted-foreground hover:text-foreground" aria-label={language === 'bg' ? 'Настройки' : 'Settings'}>
                    <Settings className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-2xl glass-card border-border/50 p-2">
                  <DropdownMenuLabel>{language === 'bg' ? 'Настройки' : 'Settings'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5" onSelect={() => setLanguage(language === 'bg' ? 'en' : 'bg')}>
                    <Globe className="w-5 h-5" /><span>{language === 'bg' ? 'Език' : 'Language'}</span><span className="ml-auto text-xs font-bold text-primary">{language.toUpperCase()}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5" onSelect={toggleTheme}>
                    {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}<span>{language === 'bg' ? 'Тема' : 'Theme'}</span><span className="ml-auto text-xs text-muted-foreground">{theme === 'dark' ? (language === 'bg' ? 'Тъмна' : 'Dark') : (language === 'bg' ? 'Светла' : 'Light')}</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-3 rounded-xl px-3 py-2.5" onSelect={reopenCookieChoice}>
                    <Cookie className="w-5 h-5" /><span>{language === 'bg' ? 'Бисквитки' : 'Cookies'}</span><span className="ml-auto text-xs text-muted-foreground">{cookieChoice === 'accepted' ? (language === 'bg' ? 'Приети' : 'Accepted') : cookieChoice === 'rejected' ? (language === 'bg' ? 'Отказани' : 'Rejected') : '—'}</span>
                  </DropdownMenuItem>
                  {user && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="gap-3 rounded-xl px-3 py-2.5 text-destructive focus:text-destructive"
                        onSelect={() => { void signOut(); }}
                      >
                        <LogOut className="w-5 h-5" /><span>{language === 'bg' ? 'Изход' : 'Log out'}</span>
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Auth Button */}
              {user ? (
                <button
                  onClick={() => navigate('/profile')}
                  aria-label={profile?.display_name || (language === 'bg' ? 'Профил' : 'Profile')}
                  className={cn(
                    'nav-hit flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg font-medium transition-interactive duration-200 text-xs',
                    'glass-button text-muted-foreground hover:text-foreground'
                  )}
                  title={profile?.display_name || 'User'}
                >
                  <div className="w-5 h-5 rounded-full bg-primary/30 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img 
                        src={profile.avatar_url} 
                        alt="" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] font-bold text-primary">
                        {(profile?.display_name || 'U')[0].toUpperCase()}
                      </span>
                    )}
                  </div>
                </button>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  aria-label={language === 'bg' ? 'Вход' : 'Login'}
                  className={cn(
                    'nav-hit flex items-center justify-center gap-1 px-1.5 py-1 rounded-lg font-medium transition-interactive duration-200 text-xs',
                    'glass-button-primary'
                  )}
                >
                  <LogIn className="w-5 h-5" />
                  <span className="hidden lg:inline text-[10px]">
                    {language === 'bg' ? 'Вход' : 'Login'}
                  </span>
                </button>
              )}

            </div>
          </div>
        </div>
      </nav>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  );
};

export default Navbar;
