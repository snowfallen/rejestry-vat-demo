import { flushSync } from 'react-dom';

// Animates a state change with the View Transitions API: documents that stay glide
// to their new place, removed ones fade out, new ones fade in. Browsers without the
// API and users who prefer reduced motion get the same update instantly.
export function withViewTransition(update: () => void) {
  if (
    typeof document === 'undefined' ||
    !('startViewTransition' in document) ||
    matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    update();
    return;
  }
  document.startViewTransition(() => flushSync(update));
}
