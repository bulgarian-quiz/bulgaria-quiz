import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { journeyReachedThisVisit, onJourneyReached } from "@/lib/journey";

/** Set once the film has been passed this visit, so what it reveals never disappears again. */
let passed = false;

/**
 * True once the homepage film is behind the visitor: "Продължи пътешествието" has
 * scrolled into view, or the film was skipped or ended. On every other page it is
 * true straight away. The cookie banner and the AI chat button both wait for it,
 * so they appear together, and once true it stays true for the rest of the visit.
 */
export function useAfterFilm(): boolean {
  const { pathname } = useLocation();
  const [reached, setReached] = useState(() => passed || journeyReachedThisVisit());
  useEffect(() => onJourneyReached(() => setReached(true)), []);

  // The moment the hub scrolls into view, however fast the visitor scrolls.
  useEffect(() => {
    if (reached || pathname !== "/") return;
    let observer: IntersectionObserver | null = null;
    let frame = 0;
    const attach = () => {
      const hub = document.getElementById("continue-journey");
      if (!hub) { frame = requestAnimationFrame(attach); return; }
      observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) setReached(true);
      });
      observer.observe(hub);
    };
    attach();
    return () => { cancelAnimationFrame(frame); observer?.disconnect(); };
  }, [reached, pathname]);

  const ready = passed || reached || pathname !== "/";
  if (ready) passed = true;
  return ready;
}
