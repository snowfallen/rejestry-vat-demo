'use client';
import type { KeyboardEvent } from 'react';
import type { DragKind, Span } from './use-axis-drag';

const moves: Record<string, number> = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };

/**
 * Arrow keys move along the strip. Radios (month, quarter) select as they move, the way
 * a native radio group does; plain buttons only move focus. Shift + arrow is the keyboard
 * twin of drawing on the strip: it grows or shrinks the period by a month at its end.
 */
export function useAxisKeyboard(
  committed: Span | null,
  onCommit: (next: Span, kind: DragKind) => void,
) {
  return function onKeyDown(event: KeyboardEvent<HTMLElement>) {
    const items = [
      ...event.currentTarget.querySelectorAll<HTMLButtonElement>('button:not(:disabled)'),
    ];
    const current = items.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    let target = current;
    if (event.shiftKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') && committed) {
      event.preventDefault();
      const end = committed.start + committed.span - 1 + moves[event.key];
      if (end < committed.start || end > 11) return;
      onCommit({ start: committed.start, span: end - committed.start + 1 }, 'draw');
      return;
    }
    if (event.key in moves) target = (current + moves[event.key] + items.length) % items.length;
    else if (event.key === 'Home') target = 0;
    else if (event.key === 'End') target = items.length - 1;
    else return;
    event.preventDefault();
    items.forEach((item, i) => (item.tabIndex = i === target ? 0 : -1));
    items[target].focus();
    if (items[target].getAttribute('role') === 'radio') items[target].click();
  };
}
