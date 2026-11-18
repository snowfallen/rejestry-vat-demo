'use client';
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { phoneQuery, prefersReducedMotion, useMediaQuery } from '@/hooks/use-media-query';
import { cssVars } from '@/lib/css-vars';
import { tourCopy } from '../../copy';
import g from './guided-tour.module.css';

type StepKey = keyof typeof tourCopy.steps;

/** Each step and where it points; the first visible match is taken. On phones the
    period card is the tall hero, so the step points at its axis. */
const steps: { key: StepKey; target: string; phoneTarget?: string }[] = [
  { key: 'period', target: '[data-intro-part="period"]', phoneTarget: '[data-tour="axis"]' },
  { key: 'registers', target: '[data-tour="registers"]' },
  { key: 'tools', target: '[data-toolbar]' },
  { key: 'document', target: '[data-intro-row]' },
  { key: 'demo', target: '[data-tour="demo"]' },
];

/** Room around the highlighted part. */
const pad = 8;
const cardGap = 12;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

function findTarget(selector: string): HTMLElement | null {
  return (
    [...document.querySelectorAll<HTMLElement>(selector)].find(
      (element) => element.getBoundingClientRect().height > 0,
    ) ?? null
  );
}

function headerHeight() {
  return parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 0;
}

/**
 * Where the visible page starts above the target: under the page header, and under any
 * bar that sticks above it (on phones the register tabs and the search row).
 */
function ceilingFor(target: HTMLElement) {
  let ceiling = headerHeight();
  const bars = document.querySelectorAll<HTMLElement>('[data-tour="registers"], [data-toolbar]');
  for (const bar of bars) {
    const style = getComputedStyle(bar);
    const above = bar.compareDocumentPosition(target) & Node.DOCUMENT_POSITION_FOLLOWING;
    if (style.position !== 'sticky' || !above || bar.contains(target)) continue;
    ceiling = Math.max(ceiling, (parseFloat(style.top) || 0) + bar.offsetHeight);
  }
  return ceiling;
}

/**
 * A short guided tour, opened only on request. A highlight moves from part to part of
 * the screen while the rest dims; a card beside it says what the part does, with
 * «Dalej», «Wstecz» and «Pomiń». Escape closes it, ← and → step through it.
 */
export function GuidedTour({ onClose }: { onClose: () => void }) {
  const phone = useMediaQuery(phoneQuery);
  // Only the parts on screen when the tour opens: an empty register has no document
  // to show, a failed one neither search nor documents.
  const [tourSteps] = useState(() =>
    steps.filter(
      (item) => findTarget(item.target) || (item.phoneTarget && findTarget(item.phoneTarget)),
    ),
  );
  const [index, setIndex] = useState(0);
  const [box, setBox] = useState<Box | null>(null);
  const [cardAt, setCardAt] = useState<{ top: number; left: number } | null>(null);
  const root = useRef<HTMLDivElement>(null);
  const card = useRef<HTMLDivElement>(null);
  const primary = useRef<HTMLButtonElement>(null);
  const step = tourSteps[index] ?? steps[0];
  const selector = (phone && step.phoneTarget) || step.target;
  const last = index === tourSteps.length - 1;
  const text = tourCopy.steps[step.key];

  const measure = useCallback(() => {
    const target = findTarget(selector);
    if (!target) return setBox(null);
    const rect = target.getBoundingClientRect();
    const next = {
      top: rect.top - pad,
      left: Math.max(4, rect.left - pad),
      width: Math.min(innerWidth - 8, rect.width + pad * 2),
      height: rect.height + pad * 2,
    };
    setBox(next);
    // The card goes where there is more room, below or above the highlight; phones
    // keep it at the bottom when neither side fits it.
    const height = card.current?.offsetHeight ?? 200;
    const width = card.current?.offsetWidth ?? 360;
    // Lined up with the highlight's centre, kept 12px inside the viewport.
    const left = Math.min(
      Math.max(12, next.left + next.width / 2 - width / 2),
      innerWidth - width - 12,
    );
    // The phone's tab bar is idle during the tour, so the card may cover it.
    const floor = innerHeight;
    const below = floor - (next.top + next.height) - cardGap;
    const above = next.top - headerHeight() - cardGap;
    const top =
      below >= height
        ? next.top + next.height + cardGap
        : above >= height
          ? next.top - cardGap - height
          : Math.max(headerHeight() + cardGap, floor - height - cardGap);
    setCardAt({ top, left });
  }, [selector]);

  // Bring the step's part into view: centred when it fits, else its top under the header.
  useEffect(() => {
    const target = findTarget(selector);
    if (!target) return;
    const rect = target.getBoundingClientRect();
    const ceiling = ceilingFor(target);
    const room = innerHeight - ceiling;
    // Room for the card (about 240px) is kept beside the part when both fit.
    const top =
      rect.height + 240 < room
        ? scrollY + rect.top - ceiling - (room - rect.height - 240) / 2
        : scrollY + rect.top - ceiling - 16;
    scrollTo({ top: Math.max(0, top), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
    // Measured on the next frame, once the card has its height for this step.
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [selector, measure]);

  // Scrolls and resizes are measured once per frame.
  useEffect(() => {
    let frame = 0;
    const onChange = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };
    addEventListener('scroll', onChange, true);
    addEventListener('resize', onChange);
    return () => {
      cancelAnimationFrame(frame);
      removeEventListener('scroll', onChange, true);
      removeEventListener('resize', onChange);
    };
  }, [measure]);

  // Focus moves to the main button once the card is placed (a hidden card cannot take
  // focus) and again on every step.
  const placed = cardAt !== null;
  useEffect(() => {
    if (placed) primary.current?.focus({ preventScroll: true });
  }, [index, placed]);

  // Nothing on screen to show (should not happen): the tour simply does not open.
  useEffect(() => {
    if (!tourSteps.length) onClose();
  }, [tourSteps, onClose]);

  // The rest of the page is inert while the tour is open: neither a pointer nor a
  // screen reader leaves the card. Declared before the focus return, so the page is
  // live again by the time focus goes back to it.
  useEffect(() => {
    const others = [...document.body.children].filter(
      (element) => element !== root.current && !(element instanceof HTMLScriptElement),
    );
    others.forEach((element) => element.setAttribute('inert', ''));
    return () => others.forEach((element) => element.removeAttribute('inert'));
  }, []);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    return () => previous?.focus({ preventScroll: true });
  }, []);

  // Escape closes the tour wherever focus happens to be.
  useEffect(() => {
    function onEscape(event: globalThis.KeyboardEvent) {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      onClose();
    }
    document.addEventListener('keydown', onEscape);
    return () => document.removeEventListener('keydown', onEscape);
  }, [onClose]);

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight' && !last) {
      event.preventDefault();
      setIndex(index + 1);
    } else if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      setIndex(index - 1);
    } else if (event.key === 'Tab') {
      // Focus stays in the card while the tour is open.
      const buttons = [...(card.current?.querySelectorAll<HTMLElement>('button') ?? [])];
      const at = buttons.indexOf(document.activeElement as HTMLElement);
      const to = (at + (event.shiftKey ? -1 : 1) + buttons.length) % buttons.length;
      event.preventDefault();
      buttons[to]?.focus();
    }
  }

  return createPortal(
    <div ref={root} className={g.tour} onKeyDown={onKeyDown}>
      {/* Clicks around the highlight are held: the tour is a moment to look. */}
      <div className={g.blocker} aria-hidden="true" />
      {box && (
        <div
          className={g.spotlight}
          aria-hidden="true"
          style={cssVars({
            '--top': `${box.top}px`,
            '--left': `${box.left}px`,
            '--width': `${box.width}px`,
            '--height': `${box.height}px`,
          })}
        />
      )}
      <div
        ref={card}
        role="dialog"
        aria-modal="true"
        aria-label={tourCopy.label}
        aria-describedby="tour-text"
        className={g.card}
        style={
          cardAt === null
            ? { visibility: 'hidden' }
            : cssVars({ '--card-top': `${cardAt.top}px`, '--card-left': `${cardAt.left}px` })
        }
      >
        <div className={g.head}>
          <span className={g.count}>{tourCopy.step(index + 1, tourSteps.length)}</span>
          <button type="button" className={g.close} aria-label={tourCopy.skip} onClick={onClose}>
            <X size={16} aria-hidden="true" />
          </button>
        </div>
        <h2 className={g.title} aria-live="polite">
          {text.title}
        </h2>
        <p id="tour-text" className={g.text}>
          {phone ? text.phone : text.desk}
        </p>
        <div className={g.dots} aria-hidden="true">
          {tourSteps.map((item, i) => (
            <span key={item.key} data-on={i === index ? '' : undefined} />
          ))}
        </div>
        <div className={g.actions}>
          <button type="button" className={g.skip} onClick={onClose}>
            {tourCopy.skip}
          </button>
          {index > 0 && (
            <button type="button" className={g.back} onClick={() => setIndex(index - 1)}>
              {tourCopy.back}
            </button>
          )}
          <button
            ref={primary}
            type="button"
            className={g.next}
            onClick={() => (last ? onClose() : setIndex(index + 1))}
          >
            {last ? tourCopy.done : tourCopy.next}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
