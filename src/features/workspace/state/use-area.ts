'use client';
import { useCallback, useSyncExternalStore } from 'react';
import { withViewTransition } from '@/lib/view-transition';
import { areaTabs, type AreaTab } from '../model/areas';

/** Each area has its own address: #ksiegowania, #majatek, #kontrole; the register has none. */
export const areaHashes: Record<AreaTab, string> = {
  vat: '',
  postings: 'ksiegowania',
  assets: 'majatek',
  controls: 'kontrole',
};

function readArea(): AreaTab {
  const hash = location.hash.slice(1);
  return areaTabs.find(({ id }) => hash && areaHashes[id] === hash)?.id ?? 'vat';
}

function subscribe(notify: () => void) {
  addEventListener('hashchange', notify);
  addEventListener('popstate', notify);
  return () => {
    removeEventListener('hashchange', notify);
    removeEventListener('popstate', notify);
  };
}

/**
 * The open accounting area, kept in the address so Back works and a link opens it.
 * Moving between areas slides the content toward the tab's side.
 */
export function useArea() {
  const area = useSyncExternalStore(subscribe, readArea, (): AreaTab => 'vat');
  const goTo = useCallback((next: AreaTab) => {
    const from = areaTabs.findIndex((tab) => tab.id === readArea());
    const to = areaTabs.findIndex((tab) => tab.id === next);
    document.documentElement.dataset.areaDirection = to > from ? 'forward' : 'back';
    withViewTransition(() => {
      const hash = areaHashes[next];
      history.pushState(null, '', hash ? `#${hash}` : location.pathname + location.search);
      dispatchEvent(new PopStateEvent('popstate'));
    });
  }, []);
  return { area, goTo };
}
