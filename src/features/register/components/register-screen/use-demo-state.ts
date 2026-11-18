'use client';
import { useEffect, useEffectEvent, useRef } from 'react';
import type { Notify } from '@/components/ui/toast';
import { prefersReducedMotion } from '@/hooks/use-media-query';
import { documentCount, stateCopy } from '../../copy';
import type { DemoState } from '../../model/types';
import type { Register } from '../../state/use-register';

/**
 * The demo's states as a person meets them: the entrance plays once, a chosen state
 * scrolls into view once loaded, and a retry that works says what came back.
 */
export function useDemoState(register: Register, notify: Notify) {
  const { loading } = register.state;

  // The entrance plays once; later mounts (rows of a new period) must not replay it.
  useEffect(() => {
    const timer = setTimeout(() => delete document.documentElement.dataset.intro, 1200);
    return () => clearTimeout(timer);
  }, []);

  // After a demo state is chosen, bring its message into view once it has loaded.
  const revealState = useRef(false);
  useEffect(() => {
    if (loading || !revealState.current) return;
    revealState.current = false;
    const target = [...document.querySelectorAll<HTMLElement>('[data-register-state]')].find(
      (element) => element.getClientRects().length > 0,
    );
    if (!target) return;
    const box = target.getBoundingClientRect();
    if (box.top >= 0 && box.bottom <= window.innerHeight) return;
    target.scrollIntoView({
      block: 'center',
      behavior: prefersReducedMotion() ? 'auto' : 'smooth',
    });
  }, [loading]);

  const retrying = useRef(false);
  const reportRetry = useEffectEvent(() => {
    if (!retrying.current) return;
    retrying.current = false;
    if (register.broken) return;
    const count = register.figures[register.state.kind].periodCount;
    notify(stateCopy.loaded(documentCount(count)));
  });
  // The retry's outcome is known only once loading ends.
  useEffect(() => {
    if (!loading) reportRetry();
  }, [loading]);

  return {
    retry: () => {
      retrying.current = true;
      register.reload();
    },
    choose: (next: DemoState) => {
      revealState.current = next !== 'populated';
      register.reload(next);
    },
  };
}
