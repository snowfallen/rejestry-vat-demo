'use client';
import { useEffect, useEffectEvent, type RefObject } from 'react';

/**
 * Closes a non-modal popover on a pointer press or focus outside its elements, and on
 * Escape (returning focus to `returnFocus`). A modal dialog on top keeps it open.
 */
export function useDismiss(
  open: boolean,
  onClose: () => void,
  inside: RefObject<HTMLElement | null>[],
  returnFocus?: RefObject<HTMLElement | null>,
) {
  const outside = useEffectEvent((event: Event) => {
    const target = event.target as Node;
    if (!inside.some((ref) => ref.current?.contains(target))) onClose();
  });
  const escape = useEffectEvent((event: KeyboardEvent) => {
    if (event.key !== 'Escape' || document.querySelector('dialog[open]')) return;
    event.preventDefault();
    onClose();
    returnFocus?.current?.focus();
  });
  useEffect(() => {
    if (!open) return;
    const onOutside = (event: Event) => outside(event);
    const onKey = (event: KeyboardEvent) => escape(event);
    document.addEventListener('pointerdown', onOutside);
    document.addEventListener('focusin', onOutside);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onOutside);
      document.removeEventListener('focusin', onOutside);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);
}

/** The same for a `<details>` menu: outside press or Escape closes it. */
export function useDetailsDismiss(ref: RefObject<HTMLDetailsElement | null>) {
  useEffect(() => {
    const outside = (event: PointerEvent) => {
      if (ref.current?.open && !ref.current.contains(event.target as Node))
        ref.current.open = false;
    };
    const escape = (event: KeyboardEvent) => {
      const details = ref.current;
      if (event.key !== 'Escape' || !details?.open || !details.contains(document.activeElement))
        return;
      details.open = false;
      details.querySelector('summary')?.focus();
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
    };
  }, [ref]);
}

/** Closes a `<details>` menu and returns focus to its summary. */
export function closeDetails(details: HTMLDetailsElement | null) {
  if (!details) return;
  details.open = false;
  details.querySelector('summary')?.focus();
}
