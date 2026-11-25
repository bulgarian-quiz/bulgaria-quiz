/**
 * Scroll reveals for the standard site.
 *
 * Elements matching REVEAL_SELECTORS get a `.reveal` class and animate in the
 * first time they scroll into view; siblings that arrive together are
 * staggered. Content is fully visible without JS: the hidden starting state
 * only applies once `html.motion-ready` is set here. One observer serves the
 * whole SPA, and a MutationObserver picks up elements added by route changes.
 */

// Cards and hub tiles are scroll-scrubbed in CSS where the browser supports
// scroll-driven animation; there they skip the one-shot reveal.
const SCROLL_DRIVEN =
  typeof CSS !== 'undefined' && CSS.supports('animation-timeline: view()') &&
  typeof window !== 'undefined' && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const REVEAL_SELECTORS = [
  '.collection-heading',
  '.journey-hub__band',
  '.atlas-plate',
  'main .glass-card',
  ...(SCROLL_DRIVEN ? [] : ['.collection-item', '.journey-hub__header', '.journey-tile']),
].join(',');

const STAGGER_MS = 70;
const MAX_STAGGER_STEPS = 6;
const REVEAL_DURATION_MS = 1500; // longest reveal transition below (image settle)

export function initReveal(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const root = document.documentElement;
  root.classList.add('motion-ready');

  const observer = new IntersectionObserver(
    (entries) => {
      let step = 0;
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const el = entry.target as HTMLElement;
        const delay = Math.min(step, MAX_STAGGER_STEPS) * STAGGER_MS;
        el.style.setProperty('--reveal-delay', `${delay}ms`);
        el.classList.add('is-in');
        observer.unobserve(el);
        // Once settled, hand the element back to its own hover/press transitions.
        window.setTimeout(() => {
          el.classList.remove('reveal', 'is-in');
          el.style.removeProperty('--reveal-delay');
        }, delay + REVEAL_DURATION_MS);
        step += 1;
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );

  const scan = (scope: ParentNode) => {
    scope.querySelectorAll<HTMLElement>(REVEAL_SELECTORS).forEach((el) => {
      if (el.dataset.revealArmed) return;
      el.dataset.revealArmed = 'true';
      el.classList.add('reveal');
      observer.observe(el);
    });
  };

  scan(document);
  new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          if (node.matches(REVEAL_SELECTORS)) scan(node.parentElement ?? document);
          else scan(node);
        }
      });
    }
  }).observe(document.body, { childList: true, subtree: true });
}
