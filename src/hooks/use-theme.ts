'use client';
import { useSyncExternalStore } from 'react';
import { flushSync } from 'react-dom';
import { themeStorageKey as storageKey } from '@/lib/boot-scripts';
import { paintBrowserBar } from '@/lib/theme-colors';
import { prefersReducedMotion } from './use-media-query';

export type Theme = 'light' | 'dark';

const listeners = new Set<() => void>();
const read = (): Theme => (document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

function apply(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  paintBrowserBar(theme);
  try {
    localStorage.setItem(storageKey, theme);
  } catch {
    // Private mode or blocked storage: the theme still applies for this visit.
  }
  listeners.forEach((notify) => notify());
}

/** The current colour theme and a toggle that reveals the new theme from `origin`. */
export function useTheme() {
  const theme = useSyncExternalStore(
    (notify) => {
      listeners.add(notify);
      return () => listeners.delete(notify);
    },
    read,
    (): Theme => 'light',
  );

  function toggle(origin?: { x: number; y: number }) {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    if (!('startViewTransition' in document) || prefersReducedMotion() || !origin) {
      apply(next);
      return;
    }
    root.style.setProperty('--reveal-x', `${origin.x}px`);
    root.style.setProperty('--reveal-y', `${origin.y}px`);
    root.classList.add('theme-switch');
    const transition = document.startViewTransition(() => flushSync(() => apply(next)));
    transition.finished.finally(() => root.classList.remove('theme-switch'));
  }

  return { theme, toggle };
}
