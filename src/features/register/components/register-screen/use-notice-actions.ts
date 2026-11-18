'use client';
import { useRef } from 'react';
import { prefersReducedMotion } from '@/hooks/use-media-query';
import type { NoticeAction } from '@/features/workspace';
import type { RegisterDispatch } from '../../state/use-register';

// What a notice points at lights up once, so the click always shows its answer.
function flash(element: HTMLElement | null) {
  if (!element) return;
  delete element.dataset.noticed;
  void element.offsetWidth;
  element.dataset.noticed = '';
  setTimeout(() => delete element.dataset.noticed, 1000);
}

const reveal = (element: Element | null | undefined, block: ScrollLogicalPosition = 'start') =>
  element?.scrollIntoView({ block, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });

/** Each notice in the bell leads to what it is about. */
export function useNoticeActions(dispatch: RegisterDispatch, openMap: () => void) {
  // The results, lit up when the KSeF notice brings them into view.
  const resultsRef = useRef<HTMLDivElement>(null);
  function onNotice(action: NoticeAction) {
    if (action === 'year') return openMap();
    if (action === 'jpk') {
      reveal(document.querySelector('[data-intro-part="period"]'), 'center');
      return flash(
        [...document.querySelectorAll<HTMLElement>('[data-deadline]')].find(
          (element) => element.getClientRects().length > 0,
        ) ?? null,
      );
    }
    if (action === 'context') {
      const context = document.querySelector<HTMLDetailsElement>('details[data-context]');
      if (!context) return;
      context.open = true;
      context.querySelector('summary')?.focus();
      return;
    }
    showPending();
  }

  // The unconfirmed documents in view, the list lit up once.
  function showPending() {
    dispatch({ type: 'criterion', key: 'ksef', value: 'pending' });
    requestAnimationFrame(() => {
      const list = resultsRef.current;
      reveal(document.getElementById('register-panel'));
      if (!list) return;
      list.dataset.flash = '';
      setTimeout(() => delete list.dataset.flash, 700);
    });
  }

  /**
   * The sales of a month still without a KSeF number, exactly those: that month, the
   * sales register, nothing else filtered away.
   */
  function onMissingKsef(year: number, month: number) {
    dispatch({ type: 'period', period: { mode: 'month', year, month } });
    dispatch({ type: 'kind', kind: 'sales' });
    dispatch({ type: 'clearCriteria' });
    showPending();
  }
  return { resultsRef, onNotice, onMissingKsef };
}
