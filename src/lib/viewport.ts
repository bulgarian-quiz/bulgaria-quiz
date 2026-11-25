/**
 * The viewport height without iOS's address-bar changes (the layout viewport).
 * iOS Safari shows and hides its address bar while you scroll, which fires
 * resize and changes window.innerHeight; scroll-driven sections measure against
 * this instead so their scroll distance does not jump.
 */
export const stableViewportHeight = (): number =>
  document.documentElement.clientHeight || window.innerHeight;

/** Phones and tablets (touch-first or small screens) get lighter media. */
export const prefersLightMedia = (): boolean =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 1024);
