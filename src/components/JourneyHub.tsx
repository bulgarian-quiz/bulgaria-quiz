import type { CSSProperties } from 'react';
import { Fragment, useState } from 'react';
import { ArrowUpRight, CircleUserRound, LockKeyhole } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import AuthModal from '@/components/AuthModal';
import { Button } from '@/components/ui/button';
import history681 from '@/assets/history-681.jpg';
import history1878 from '@/assets/history-1878.jpg';
import history2026 from '@/assets/history-2026.jpg';

const JourneyHub = () => {
  const { language } = useLanguage();
  const { user, profile } = useAuth();
  const [showAuth, setShowAuth] = useState(false);
  const isBg = language === 'bg';

  return (
    <section id="continue-journey" className="journey-hub" aria-labelledby="journey-heading">
      <div className="journey-hub__inner">
        <header className="journey-hub__header">
          <h2 id="journey-heading">
            {/* Each word fills in as the heading scrolls into view. */}
            {/* The space sits between the words: inside an inline-block word it would be dropped. */}
            {(isBg ? 'Продължи пътешествието' : 'Continue the journey').split(' ').map((word, index) => (
              <Fragment key={word}>
                {index > 0 && ' '}
                <span className="scroll-word" style={{ '--w': index } as CSSProperties}>{word}</span>
              </Fragment>
            ))}
          </h2>
          <p>{isBg ? 'Избери накъде да продължиш.' : 'Choose where the story takes you next.'}</p>
        </header>

        <div className="journey-hub__grid">
          <Link className="journey-tile journey-tile--games journey-tile--image" to="/games">
            <img src={history2026} alt="" decoding="async" />
            <span className="journey-tile__shade" aria-hidden="true" />
            <span className="journey-tile__copy">
              <strong>{isBg ? 'Игри' : 'Games'}</strong>
              <small>{isBg ? 'Куиз и подреждане на 28-те области' : 'A quiz and a map of all 28 provinces'}</small>
            </span>
            <ArrowUpRight aria-hidden="true" />
          </Link>

          <div className="journey-tile journey-tile--portrait journey-tile--image" aria-hidden="true">
            <img src={history681} alt="" decoding="async" />
          </div>

          <Link className="journey-tile journey-tile--about" to="/about">
            <strong>{isBg ? 'За нас' : 'About us'}</strong>
            <ArrowUpRight aria-hidden="true" />
          </Link>

          <Link className="journey-tile journey-tile--flashcards" to="/flashcards">
            <span className="journey-tile__copy">
              <strong>{isBg ? 'Флашкарти' : 'Flashcards'}</strong>
              <small>{isBg ? 'История, география и общи знания' : 'History, geography and general knowledge'}</small>
            </span>
            <ArrowUpRight aria-hidden="true" />
          </Link>

          <div className="journey-tile journey-tile--landscape journey-tile--image" aria-hidden="true">
            <img src={history1878} alt="" decoding="async" />
          </div>

          {user ? (
            <Link className="journey-tile journey-tile--profile" to="/profile">
              <CircleUserRound aria-hidden="true" />
              <span>{isBg ? 'Твоето място' : 'Your space'}</span>
              <strong>{profile?.display_name || (isBg ? 'Профил' : 'Profile')}</strong>
              <ArrowUpRight aria-hidden="true" />
            </Link>
          ) : (
            <Button variant="ghost" className="journey-tile journey-tile--profile" type="button" onClick={() => setShowAuth(true)}>
              <LockKeyhole aria-hidden="true" />
              <span>{isBg ? 'Не си влязъл' : 'Not logged in'}</span>
              <strong>{isBg ? 'Влез в профила' : 'Sign in'}</strong>
              <ArrowUpRight aria-hidden="true" />
            </Button>
          )}

          <div className="journey-tile journey-tile--detail journey-tile--image" aria-hidden="true">
            <img src={history2026} alt="" decoding="async" />
          </div>
        </div>

        <div className="shevitsa journey-hub__band" aria-hidden="true" />
      </div>
      <AuthModal isOpen={showAuth} onClose={() => setShowAuth(false)} />
    </section>
  );
};

export default JourneyHub;