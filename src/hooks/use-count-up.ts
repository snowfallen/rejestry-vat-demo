'use client';
import { useEffect, useRef, useState } from 'react';

// Counts from the previous value to the new one, so a change of period, register or
// filter is visible in the totals. The first value is shown as it is; reduced motion
// jumps straight to the result.
export function useCountUp(target: number, duration = 420) {
  const [value, setValue] = useState(target);
  const from = useRef(target);
  useEffect(() => {
    const start = from.current;
    if (start === target || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      from.current = target;
      setValue(target);
      return;
    }
    const began = performance.now();
    let frame = requestAnimationFrame(function step(now) {
      const progress = Math.min(1, (now - began) / duration);
      const current = Math.round(start + (target - start) * (1 - (1 - progress) ** 3));
      from.current = current;
      setValue(current);
      if (progress < 1) frame = requestAnimationFrame(step);
    });
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);
  return value;
}
