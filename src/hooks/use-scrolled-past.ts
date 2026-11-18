'use client';
import { useEffect, useState } from 'react';

/**
 * Whether the element with this id has scrolled up under the sticky page header
 * (`--header-h`). By id, so the element can come from a server component.
 */
export function useScrolledPast(id: string) {
  const [past, setPast] = useState(false);
  useEffect(() => {
    const element = document.getElementById(id);
    if (!element) return;
    // Hidden means gone under the sticky page header, whose height is a token.
    const offset =
      parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
    const observer = new IntersectionObserver(
      ([entry]) =>
        setPast(
          !entry.isIntersecting && entry.boundingClientRect.top < (entry.rootBounds?.top ?? 0),
        ),
      { rootMargin: `-${offset}px 0px 0px 0px` },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [id]);
  return past;
}
