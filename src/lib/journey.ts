// Remembers that the visitor has reached the end of the homepage film (by
// watching, scrolling through or skipping it), so the toolbar's site title can
// take them straight back to "Продължи пътешествието" instead of replaying it.
const KEY = "journey-seen";

export const hasSeenJourney = () => {
  try { return localStorage.getItem(KEY) === "1"; } catch { return false; }
};

export const markJourneySeen = () => {
  try { localStorage.setItem(KEY, "1"); } catch { /* storage blocked: the title just replays the film */ }
};

/** Router state that asks the homepage to open at the journey hub. */
export const TO_HUB_STATE = { toHub: true } as const;
export const wantsHub = (state: unknown) => !!(state && typeof state === "object" && (state as { toHub?: boolean }).toHub);

/**
 * Leaving the 3D experience returns to the homepage's journey hub, not the film's start.
 * The 3D mode replaces the whole router, so the request is handed over here and read once
 * by the homepage when it mounts again.
 */
let hubRequested = false;
export const requestHub = () => { hubRequested = true; };
export const consumeHubRequest = () => {
  const requested = hubRequested;
  hubRequested = false;
  return requested;
};

/**
 * Whether the visitor has reached the journey hub during this visit (by watching,
 * scrolling through or skipping the film). The cookie banner waits for it on the homepage.
 */
let reachedThisVisit = false;
const REACHED_EVENT = "journey-reached";
export const announceJourneyReached = () => {
  if (reachedThisVisit) return;
  reachedThisVisit = true;
  window.dispatchEvent(new Event(REACHED_EVENT));
};
export const journeyReachedThisVisit = () => reachedThisVisit;
export const onJourneyReached = (listener: () => void) => {
  window.addEventListener(REACHED_EVENT, listener);
  return () => window.removeEventListener(REACHED_EVENT, listener);
};
