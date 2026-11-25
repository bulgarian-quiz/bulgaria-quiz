import { useSyncExternalStore } from "react";

/**
 * The visitor's cookie choice. The site itself only uses storage that it needs
 * to work (sign-in, settings); "accepted" also allows optional cookies such as
 * analytics, should the site ever add them — check hasOptionalCookieConsent()
 * before loading any.
 */
export type CookieChoice = "accepted" | "rejected";

// Versioned: bumping it asks everyone again (v2 replaced choices made while the banner was being tested).
const KEY = "cookie-consent-v2";
const OLD_KEYS = ["cookie-consent"];
const EVENT = "cookie-consent-change";

export const readCookieChoice = (): CookieChoice | null => {
  try {
    OLD_KEYS.forEach((key) => localStorage.removeItem(key));
    const value = localStorage.getItem(KEY);
    return value === "accepted" || value === "rejected" ? value : null;
  } catch {
    return null;
  }
};

export const saveCookieChoice = (choice: CookieChoice) => {
  try { localStorage.setItem(KEY, choice); } catch { /* storage blocked: the choice lasts for this visit */ }
  memory = choice;
  window.dispatchEvent(new Event(EVENT));
};

/** Shows the banner again (Settings → Cookies), so the visitor can change their mind. */
export const reopenCookieChoice = () => {
  try { localStorage.removeItem(KEY); } catch { /* nothing saved */ }
  memory = null;
  window.dispatchEvent(new Event(EVENT));
};

export const hasOptionalCookieConsent = () => (memory ?? readCookieChoice()) === "accepted";

let memory: CookieChoice | null = null;
const subscribe = (notify: () => void) => {
  window.addEventListener(EVENT, notify);
  return () => window.removeEventListener(EVENT, notify);
};
const snapshot = () => memory ?? readCookieChoice();

export const useCookieChoice = () => useSyncExternalStore(subscribe, snapshot, () => null);
