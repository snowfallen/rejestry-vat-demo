'use client';
import { useLayoutEffect, useState, type CSSProperties, type RefObject } from 'react';

interface PlacementOptions {
  /** Below this much room under the trigger, the popover opens upward if there is more room above. */
  minHeight?: number;
  gap?: number;
  /** `end`: right edges line up; `start`: left edges. */
  align?: 'start' | 'end';
  /** The popover's width, to keep it 16px from either side of the viewport. */
  width: number;
}

const margin = 16;

/**
 * A `position: fixed` placement for a popover next to its trigger that always stays in
 * the viewport: it flips upward when there is no room below and never grows taller than
 * the room it has (its own content scrolls). Follows the trigger on scroll and resize.
 */
export function useAnchoredPlacement(
  triggerRef: RefObject<HTMLElement | null>,
  open: boolean,
  { minHeight = 320, gap = 8, align = 'end', width }: PlacementOptions,
): CSSProperties {
  const [style, setStyle] = useState<CSSProperties>({});
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const trigger = triggerRef.current?.getBoundingClientRect();
      if (!trigger) return;
      const viewport = { width: innerWidth, height: innerHeight };
      const fitted = Math.min(width, viewport.width - margin * 2);
      const horizontal: CSSProperties =
        align === 'end'
          ? {
              right: Math.max(
                margin,
                Math.min(viewport.width - trigger.right, viewport.width - margin - fitted),
              ),
            }
          : { left: Math.max(margin, Math.min(trigger.left, viewport.width - margin - fitted)) };
      // A bar pinned to the bottom (the phone's areas) is not room for the popover.
      const bar = document.querySelector('[data-bottom-bar]')?.getBoundingClientRect();
      const floor = bar && bar.height > 0 && bar.top < viewport.height ? bar.top : viewport.height;
      const below = floor - trigger.bottom - gap;
      // Nor is the sticky page header at the top (`--header-h`).
      const ceiling =
        parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
      const above = trigger.top - gap - ceiling;
      const upward = below < minHeight && above > below;
      setStyle({
        position: 'fixed',
        ...horizontal,
        ...(upward
          ? { bottom: viewport.height - trigger.top + gap, top: 'auto' }
          : { top: trigger.bottom + gap, bottom: 'auto' }),
        maxHeight: Math.max(160, (upward ? above : below) - margin),
      });
    };
    place();
    addEventListener('resize', place);
    addEventListener('scroll', place, true);
    return () => {
      removeEventListener('resize', place);
      removeEventListener('scroll', place, true);
    };
  }, [open, triggerRef, minHeight, gap, align, width]);
  return style;
}
