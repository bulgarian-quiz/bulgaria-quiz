import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';

// Covers the whole site (the 3D experience too) while the signed-in account is
// suspended for an inappropriate name or photo. It goes away by itself when
// the 24 hours are up; signing out also removes it, so a shared school
// computer is not locked for everyone else.
const BanScreen = () => {
  const { bannedUntil, signOut } = useAuth();
  const { language } = useLanguage();
  const isBg = language === 'bg';
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!bannedUntil) return;
    const timer = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(timer);
  }, [bannedUntil]);

  useEffect(() => {
    if (!bannedUntil) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [bannedUntil]);

  if (!bannedUntil) return null;
  const until = new Date(bannedUntil);
  const minutesLeft = Math.max(1, Math.floor((until.getTime() - now) / 60000));
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  const left = isBg
    ? `${hours > 0 ? `${hours} ч ` : ''}${minutes} мин`
    : `${hours > 0 ? `${hours} h ` : ''}${minutes} min`;
  const when = until.toLocaleString(isBg ? 'bg-BG' : 'en-GB', { weekday: 'long', hour: '2-digit', minute: '2-digit' });

  return createPortal(
    <div className="ban-screen" role="alertdialog" aria-modal="true" aria-labelledby="ban-title" aria-describedby="ban-text">
      <div className="ban-screen__card">
        <ShieldAlert className="ban-screen__icon" aria-hidden="true" />
        <h1 id="ban-title">{isBg ? 'Профилът ти е спрян за 24 часа' : 'Your account is suspended for 24 hours'}</h1>
        <p id="ban-text">
          {isBg
            ? 'Името или снимката, които избра, не са подходящи за сайта. Опознай България е място за всички, затова такова съдържание не се допуска.'
            : 'The name or photo you chose is not appropriate for this site. Опознай България is a place for everyone, so content like that is not allowed.'}
        </p>
        <p className="ban-screen__time">
          {isBg ? `Можеш да се върнеш в ${when} (остават ${left}).` : `You can come back on ${when} (${left} left).`}
        </p>
        <Button onClick={() => signOut()} variant="outline" autoFocus>
          {isBg ? 'Изход от профила' : 'Sign out'}
        </Button>
      </div>
    </div>,
    document.body,
  );
};

export default BanScreen;
