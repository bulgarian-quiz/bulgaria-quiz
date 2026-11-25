export const isDesktopPresentation = () => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return !/Mobi/i.test(navigator.userAgent);
};