import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Footer from '@/components/Footer';
import { announceJourneyReached, consumeHubRequest, markJourneySeen, wantsHub } from '@/lib/journey';
import Navbar from '@/components/Navbar';
import CinematicIntro from '@/components/CinematicIntro';
import SpaceGamesJourney from '@/components/SpaceGamesJourney';
import JourneyHub from '@/components/JourneyHub';
import { Button } from '@/components/ui/button';
import { Play, SkipForward, Square } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useSeo } from "@/seo/useSeo";

const Home: React.FC = () => {
  useSeo('/');
  const [introComplete, setIntroComplete] = useState(false);
  const [spaceComplete, setSpaceComplete] = useState(false);
  const [watching, setWatching] = useState(false);
  const frameRef = useRef<number>();
  const { language } = useLanguage();
  const stopFilm = useCallback(() => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
    frameRef.current = undefined;
    setWatching(false);
  }, []);
  const skipIntro = useCallback(() => {
    stopFilm();
    const hub = document.querySelector<HTMLElement>('.journey-hub');
    if (!hub) return;
    window.scrollTo({ top: window.scrollY + hub.getBoundingClientRect().top, behavior: 'instant' });
    setIntroComplete(true);
    setSpaceComplete(true);
  }, [stopFilm]);
  const watchFilm = useCallback(() => {
    stopFilm();
    const history = document.querySelector<HTMLElement>('.history-intro');
    const space = document.querySelector<HTMLElement>('.space-games');
    const hub = document.querySelector<HTMLElement>('.journey-hub');
    if (!history || !space || !hub) return;
    window.scrollTo({ top: 0, behavior: 'instant' });
    setWatching(true);
    const startedAt = performance.now();
    const animate = (now: number) => {
      const seconds = Math.min(40, (now - startedAt) / 1000);
      const spaceTop = window.scrollY + space.getBoundingClientRect().top;
      const hubTop = window.scrollY + hub.getBoundingClientRect().top;
      const historyTravel = history.offsetHeight - window.innerHeight;
      // A quiet title opening, all 23 chapters, then Earth and the closing message.
      const top = seconds < 2 ? 0
        : seconds < 30 ? ((seconds - 2) / 28) * historyTravel
        : seconds < 32 ? historyTravel + ((seconds - 30) / 2) * (spaceTop - historyTravel)
        : spaceTop + ((seconds - 32) / 8) * (hubTop - spaceTop);
      window.scrollTo({ top, behavior: 'instant' });
      if (seconds < 40) frameRef.current = requestAnimationFrame(animate);
      else skipIntro();
    };
    frameRef.current = requestAnimationFrame(animate);
  }, [skipIntro, stopFilm]);
  useEffect(() => {
    if (!watching) return;
    const onKey = (event: KeyboardEvent) => {
      if (['Escape', 'ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) stopFilm();
    };
    window.addEventListener('wheel', stopFilm, { passive: true });
    window.addEventListener('touchstart', stopFilm, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('wheel', stopFilm);
      window.removeEventListener('touchstart', stopFilm);
      window.removeEventListener('keydown', onKey);
    };
  }, [watching, stopFilm]);
  useEffect(() => () => {
    if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current);
  }, []);
  const handleIntroProgress = useCallback((progress: number) => {
    const next = progress > 0.985;
    setIntroComplete(current => current === next ? current : next);
  }, []);
  const handleSpaceProgress = useCallback((progress: number) => {
    const next = progress > 0.89;
    setSpaceComplete(current => current === next ? current : next);
  }, []);
  const showNavigation = introComplete && spaceComplete;
  // Reaching the hub (by watching, scrolling or skipping) counts as having seen the film.
  useEffect(() => { if (showNavigation) { markJourneySeen(); announceJourneyReached(); } }, [showNavigation]);

  // The toolbar's site title asks for the hub; jump there once the page has laid out.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    if (!wantsHub(location.state) && !consumeHubRequest()) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        skipIntro();
        // Clear the request so a reload starts the page normally.
        navigate(location.pathname, { replace: true, state: null });
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.state, location.pathname, navigate, skipIntro]);

  return (
    <div className="min-h-screen bg-background">
      <h1 className="sr-only">
        {language === 'bg'
          ? 'Опознай България – образователни игри за историята и географията на България'
          : 'Get to Know Bulgaria – educational games about the history and geography of Bulgaria'}
      </h1>
      {!showNavigation && (
        <div className="intro-controls">
          <Button variant="outline" onClick={skipIntro}><SkipForward />{language === 'bg' ? 'Пропусни' : 'Skip'}</Button>
          <Button variant="outline" onClick={watching ? stopFilm : watchFilm}>
            {watching ? <Square /> : <Play />}
            {watching ? (language === 'bg' ? 'Спри филма' : 'Stop film') : (language === 'bg' ? 'Гледай като кратък филм' : 'Watch as a short film')}
          </Button>
        </div>
      )}
      <div
          className="fixed inset-x-0 top-0 z-[70] transition-opacity duration-700"
          style={{ opacity: showNavigation ? 1 : 0, pointerEvents: showNavigation ? 'auto' : 'none' }}
      >
        <Navbar alwaysVisible />
      </div>

      <CinematicIntro onProgress={handleIntroProgress} />
      <SpaceGamesJourney onProgress={handleSpaceProgress} />
      <JourneyHub />
      <Footer />
    </div>
  );
};

export default Home;