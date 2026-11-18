// Something that opens downwards (a document under its row, a breakdown under its
// button) is brought into view as it opens, so nobody has to scroll after it.

const margin = 16;

/**
 * Scrolls just enough for `trigger` and the region opening under it to fit the screen.
 * The region may still be animating its height, so its full size is read from its
 * content. The trigger never goes under the sticky header (or a sticky table head):
 * when both cannot fit, the trigger is kept at the top and the rest follows below.
 */
export function revealOpening(trigger: HTMLElement, region: HTMLElement, stickyAbove = 0) {
  const header =
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
  const top = trigger.getBoundingClientRect().top;
  const content = (region.firstElementChild as HTMLElement | null) ?? region;
  const bottom = region.getBoundingClientRect().top + content.scrollHeight + margin;
  const overflow = bottom - innerHeight;
  const room = top - header - stickyAbove - margin;
  const by = Math.min(overflow, room);
  if (by <= 0) return;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return scrollBy({ top: by });
  glide(by);
}

/**
 * A smooth scroll driven frame by frame. The browser's own smooth scroll stops when the
 * page's height changes under it, which is exactly what an opening region does.
 */
function glide(by: number, duration = 320) {
  const from = scrollY;
  const start = performance.now();
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  // Any input from the person takes the scroll back.
  let stopped = false;
  const stop = () => (stopped = true);
  addEventListener('wheel', stop, { once: true, passive: true });
  addEventListener('touchstart', stop, { once: true, passive: true });
  function frame(now: number) {
    if (stopped) return;
    const t = Math.min(1, (now - start) / duration);
    scrollTo({ top: from + by * ease(t), behavior: 'instant' });
    if (t < 1) requestAnimationFrame(frame);
    else {
      removeEventListener('wheel', stop);
      removeEventListener('touchstart', stop);
    }
  }
  requestAnimationFrame(frame);
}

/** Runs `revealOpening` once React has rendered the opened region. */
export function afterOpening(
  find: () => [HTMLElement | null, HTMLElement | null],
  stickyAbove = 0,
) {
  requestAnimationFrame(() =>
    requestAnimationFrame(() => {
      const [trigger, region] = find();
      if (trigger && region) revealOpening(trigger, region, stickyAbove);
    }),
  );
}
