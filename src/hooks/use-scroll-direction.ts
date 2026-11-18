'use client';
import { useEffect, useState, type RefObject } from 'react';

/** Which way the page last scrolled, ignoring jitter under `threshold` pixels. */
export function useScrollDirection(threshold = 8): 'up' | 'down' {
  const [direction, setDirection] = useState<'up' | 'down'>('up');
  useEffect(() => {
    let last = scrollY;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const delta = scrollY - last;
        if (Math.abs(delta) < threshold) return;
        setDirection(delta > 0 ? 'down' : 'up');
        last = scrollY;
      });
    };
    addEventListener('scroll', onScroll, { passive: true });
    return () => {
      removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [threshold]);
  return direction;
}

/**
 * How many of `marks` (pixels) the element's top has scrolled above the `line` (pixels
 * from the viewport top), e.g. how far a sticky block has travelled since it stuck.
 */
export function useScrollDepth(ref: RefObject<HTMLElement | null>, line: number, marks: number[]) {
  const [passed, setPassed] = useState(0);
  const key = marks.join(',');
  useEffect(() => {
    let frame = 0;
    const steps = key.split(',').map(Number);
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const top = ref.current?.getBoundingClientRect().top;
        if (top === undefined) return;
        setPassed(steps.filter((mark) => line - top > mark).length);
      });
    };
    measure();
    addEventListener('scroll', measure, { passive: true });
    addEventListener('resize', measure);
    return () => {
      removeEventListener('scroll', measure);
      removeEventListener('resize', measure);
      cancelAnimationFrame(frame);
    };
  }, [ref, line, key]);
  return passed;
}
