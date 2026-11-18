'use client';
import { useRef, type PointerEvent } from 'react';
import { prefersReducedMotion } from './use-media-query';

interface SwipeStepOptions {
  /** Whether a step that way is possible; a blocked side resists and springs back. */
  canStep: (delta: -1 | 1) => boolean;
  /** Swipe left = 1 (next), swipe right = -1 (previous). */
  onStep: (delta: -1 | 1) => void;
  /** How far the element follows the finger (1 = all the way). */
  follow?: number;
  /** How far it follows on a blocked side. */
  resist?: number;
  /** Pixels past which a slow swipe steps; a flick steps sooner. */
  threshold?: number;
  /** Mouse drags count too (a sheet in a narrow desktop window). */
  mouse?: boolean;
  /** The element flies out before `onStep`, so the next one can slide in. */
  leave?: boolean;
}

const settle = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

/**
 * A sideways swipe that steps back or forward. The element follows the finger and
 * springs back; past the threshold, or on a flick, it steps. Vertical scrolling stays
 * the page's. Returns the handlers to spread on the element, which should have
 * `touch-action: pan-y`.
 */
export function useSwipeStep<T extends HTMLElement>({
  canStep,
  onStep,
  follow = 0.35,
  resist = 0.12,
  threshold = 50,
  mouse = false,
  leave = false,
}: SwipeStepOptions) {
  const swipe = useRef<{ x: number; y: number; t: number; id: number; axis?: 'x' | 'y' } | null>(
    null,
  );

  return {
    onPointerDown(event: PointerEvent<T>) {
      if ((event.pointerType === 'mouse' && !mouse) || event.button !== 0) return;
      swipe.current = {
        x: event.clientX,
        y: event.clientY,
        t: event.timeStamp,
        id: event.pointerId,
      };
    },
    onPointerMove(event: PointerEvent<T>) {
      const current = swipe.current;
      if (!current || current.id !== event.pointerId) return;
      const element = event.currentTarget;
      const dx = event.clientX - current.x;
      const dy = event.clientY - current.y;
      if (!current.axis) {
        if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
        current.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        if (current.axis === 'x') {
          try {
            element.setPointerCapture(event.pointerId);
          } catch {
            // Synthetic pointers cannot be captured; the swipe still works.
          }
        }
      }
      if (current.axis !== 'x') return;
      const delta: -1 | 1 = dx < 0 ? 1 : -1;
      element.style.transition = 'none';
      element.style.transform = `translateX(${dx * (canStep(delta) ? follow : resist)}px)`;
    },
    onPointerUp(event: PointerEvent<T>) {
      const current = swipe.current;
      swipe.current = null;
      if (!current || current.axis !== 'x') return;
      const element = event.currentTarget;
      const dx = event.clientX - current.x;
      const speed = Math.abs(dx) / Math.max(1, event.timeStamp - current.t);
      const delta: -1 | 1 = dx < 0 ? 1 : -1;
      const possible = canStep(delta);
      const at = dx * (possible ? follow : resist);
      const step = possible && (Math.abs(dx) > threshold || speed > 0.4);
      element.style.transition = '';
      element.style.transform = '';
      if (prefersReducedMotion()) {
        if (step) onStep(delta);
        return;
      }
      if (step && leave) {
        // The element stays out (fill forwards) until the step has rendered.
        element
          .animate(
            [{ transform: `translateX(${at}px)` }, { transform: `translateX(${-delta * 100}%)` }],
            { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' },
          )
          .finished.then(
            () => onStep(delta),
            // Cancelled (the sheet closed): no step.
            () => {},
          );
        return;
      }
      element.animate([{ transform: `translateX(${at}px)` }, { transform: 'none' }], {
        duration: leave ? 260 : 240,
        easing: settle,
      });
      if (step) onStep(delta);
    },
    onPointerCancel(event: PointerEvent<T>) {
      swipe.current = null;
      event.currentTarget.style.transition = '';
      event.currentTarget.style.transform = '';
    },
  };
}
