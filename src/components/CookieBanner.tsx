import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { saveCookieChoice, useCookieChoice, type CookieChoice } from "@/lib/cookieConsent";

/** Matches the .float-out animation in index.css. */
const EXIT_MS = 200;
import { useAfterFilm } from "@/hooks/useAfterFilm";
import { PRIVACY_POLICY_URL } from "@/lib/legal";

/**
 * Asks first-time visitors to accept or reject cookies, bottom right. On the
 * homepage it appears as soon as "Продължи пътешествието" is reached (watched,
 * scrolled to or skipped to), so it never sits on top of the film; on any other
 * page it shows straight away. It stays until a choice is made, which is remembered.
 */
export default function CookieBanner() {
  const choice = useCookieChoice();
  const { language } = useLanguage();
  const bg = language === "bg";
  const afterFilm = useAfterFilm();
  // Once shown, it stays until the visitor picks Accept or Reject.
  const open = choice === null && afterFilm;
  // The clicked choice is saved after the banner's short exit, so it leaves instead of vanishing.
  const [leaving, setLeaving] = useState<CookieChoice | null>(null);
  useEffect(() => {
    if (!leaving) return;
    const timer = window.setTimeout(() => { saveCookieChoice(leaving); setLeaving(null); }, EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [leaving]);

  // While it is open the chat's "Have a question?" hint steps aside (see index.css).
  useEffect(() => {
    const root = document.documentElement;
    if (open) root.dataset.cookieBanner = "open";
    else delete root.dataset.cookieBanner;
    return () => { delete root.dataset.cookieBanner; };
  }, [open]);

  if (!open) return null;

  // Rendered straight into <body>, above everything, so no page layer can cover it.
  return createPortal(
    <section
      role="dialog"
      aria-modal="false"
      aria-labelledby="cookie-title"
      aria-describedby="cookie-text"
      className={`cookie-banner ${leaving ? "float-out" : "float-in"} bottom-4 sm:bottom-6 left-3 right-[72px] sm:left-auto sm:right-[96px] sm:w-[360px] floating-glass rounded-2xl text-foreground p-4 sm:p-5`}
      style={{ position: "fixed", zIndex: 2147483000 }}
    >
      <h2 id="cookie-title" className="flex items-center gap-2 text-base font-semibold text-foreground">
        <Cookie className="h-5 w-5 text-primary" aria-hidden="true" />
        {bg ? "Бисквитки" : "Cookies"}
      </h2>
      <p id="cookie-text" className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {bg
          ? "Използваме необходимите бисквитки и локално хранилище, за да работят входът и настройките ти. Можеш да приемеш или да откажеш незадължителните бисквитки. "
          : "We use the cookies and local storage the site needs for sign-in and your settings. You can accept or reject optional cookies. "}
        <a href={PRIVACY_POLICY_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-blue-500 underline underline-offset-2 hover:text-blue-400">
          {bg ? "Политика за поверителност" : "Privacy Policy"}
        </a>
      </p>
      <div className="mt-4 flex gap-2">
        <Button type="button" variant="outline" className="flex-1" onClick={() => setLeaving("rejected")}>
          {bg ? "Откажи" : "Reject"}
        </Button>
        <Button type="button" className="flex-1 glass-button-primary" onClick={() => setLeaving("accepted")}>
          {bg ? "Приеми" : "Accept"}
        </Button>
      </div>
    </section>,
    document.body,
  );
}
