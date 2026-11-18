'use client';
import {
  useEffect,
  useEffectEvent,
  useId,
  useRef,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import { X } from 'lucide-react';
import { phoneQuery, useMediaQuery } from '@/hooks/use-media-query';
import { cx } from '@/lib/cx';
import { IconButton } from '@/components/ui/button';
import d from './dialog.module.css';
import { uiCopy } from '../copy';

interface DialogProps {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  /** `sheet` slides up from the bottom edge; `auto` (default) is a sheet on phones. */
  variant?: 'auto' | 'centered' | 'sheet';
  /** Where focus goes after closing; defaults to the element focused before opening. */
  returnFocusRef?: RefObject<HTMLElement | null>;
  /** For a sheet: the box it grows out of and folds back into, read when needed. */
  origin?: () => DOMRect | null | undefined;
}

const sheetEasing = 'cubic-bezier(0.32, 0.72, 0, 1)';
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
/** The origin box, if it is on screen to grow from. */
function visibleBox(read?: () => DOMRect | null | undefined) {
  if (reducedMotion()) return null;
  const box = read?.();
  return box && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight ? box : null;
}

/**
 * Keyframes that grow a sheet out of the origin box: it starts as a strip the size of
 * that box, at its place, and opens downward while it rises.
 */
function fromOrigin(dialog: HTMLDialogElement, origin: DOMRect): Keyframe[] {
  const box = dialog.getBoundingClientRect();
  const rise = Math.max(0, origin.top - box.top);
  const hidden = Math.max(0, box.height - origin.height);
  return [
    { transform: `translateY(${rise}px)`, clipPath: `inset(0 0 ${hidden}px 0 round 12px)` },
    { transform: 'translateY(0)', clipPath: 'inset(0 0 0 0 round 22px 22px 0 0)' },
  ];
}

// A native modal <dialog>: the browser traps focus, makes the page inert and handles
// Escape. Mounting opens it; unmounting closes it and returns focus.
export function Dialog({
  title,
  description,
  onClose,
  children,
  variant: requested = 'auto',
  returnFocusRef,
  origin,
}: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const phone = useMediaQuery(phoneQuery);
  const variant = requested === 'auto' ? (phone ? 'sheet' : 'centered') : requested;
  // Opens once per mount; the effect event reads the props of that first render.
  const open = useEffectEvent(() => {
    const dialog = ref.current;
    const trigger =
      returnFocusRef?.current ??
      (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    dialog?.showModal();
    const from = variant === 'sheet' ? visibleBox(origin) : null;
    if (dialog && from) {
      dialog.style.animation = 'none';
      dialog.getAnimations().forEach((animation) => animation.cancel());
      dialog.animate(fromOrigin(dialog, from), { duration: 460, easing: sheetEasing });
    }
    // Focus the dialog itself: keyboard users continue with Tab, touch users do not
    // get a focus ring on the close button.
    dialog?.focus();
    return () => {
      dialog?.close();
      trigger?.focus();
    };
  });
  useEffect(() => open(), []);

  // A sheet with an origin folds back into it before it goes; anything else closes at once.
  const closing = useRef(false);
  function dismiss() {
    const dialog = ref.current;
    const to = variant === 'sheet' ? visibleBox(origin) : null;
    if (!dialog || !to) return onClose();
    if (closing.current) return;
    closing.current = true;
    const fold = dialog.animate(fromOrigin(dialog, to).reverse(), {
      duration: 340,
      easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
      fill: 'forwards',
    });
    fold.finished.then(onClose, onClose);
  }

  // A sheet follows the finger when its top edge is dragged down; let go past the
  // threshold and it slides away, otherwise it springs back.
  const grip = useRef<{ start: number; offset: number; pointer: number } | null>(null);
  function onGripDown(event: PointerEvent<HTMLElement>) {
    if (variant !== 'sheet' || (event.target as HTMLElement).closest('button')) return;
    grip.current = { start: event.clientY, offset: 0, pointer: event.pointerId };
    event.currentTarget.setPointerCapture(event.pointerId);
    if (ref.current) ref.current.style.transition = 'none';
  }
  function onGripMove(event: PointerEvent<HTMLElement>) {
    const current = grip.current;
    if (!current || current.pointer !== event.pointerId || !ref.current) return;
    current.offset = Math.max(0, event.clientY - current.start);
    ref.current.style.transform = `translateY(${current.offset}px)`;
  }
  function onGripUp(event: PointerEvent<HTMLElement>) {
    const current = grip.current;
    const dialog = ref.current;
    if (!current || current.pointer !== event.pointerId || !dialog) return;
    grip.current = null;
    dialog.style.transition = 'transform 240ms cubic-bezier(0.2, 0.8, 0.2, 1)';
    if (current.offset > Math.min(140, dialog.offsetHeight / 4)) {
      dialog.style.transform = 'translateY(100%)';
      setTimeout(onClose, 200);
    } else {
      dialog.style.transform = '';
    }
  }

  return (
    <dialog
      ref={ref}
      className={cx(d.dialog, variant === 'sheet' && d.sheet)}
      aria-labelledby={titleId}
      tabIndex={-1}
      onCancel={(event) => {
        event.preventDefault();
        dismiss();
      }}
      onClick={(event) => {
        // A press on the backdrop lands on the <dialog> element outside its box.
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        const { clientX: x, clientY: y } = event;
        if (x < box.left || x > box.right || y < box.top || y > box.bottom) dismiss();
      }}
    >
      <header
        className={cx(
          'mb-3.5 flex items-center justify-between gap-4',
          // A sheet centres its title under the grip, the close button at the right.
          variant === 'sheet' && cx(d.grip, 'grid grid-cols-[44px_minmax(0,1fr)_44px] gap-x-1'),
        )}
        onPointerDown={onGripDown}
        onPointerMove={onGripMove}
        onPointerUp={onGripUp}
        onPointerCancel={onGripUp}
      >
        {variant === 'sheet' && <span className={d.handle} aria-hidden="true" />}
        <h2
          id={titleId}
          className={cx(
            'm-0 min-w-0 text-[20px] font-semibold tracking-[-0.02em]',
            variant === 'sheet' && 'col-start-2 text-center text-[18px] [text-wrap:balance]',
          )}
        >
          {title}
        </h2>
        <IconButton label={uiCopy.closeDialog} variant="plain" onClick={dismiss}>
          <X size={19} />
        </IconButton>
      </header>
      {description && (
        <p className="m-0 mb-5 max-w-[65ch] text-[13px] leading-relaxed text-muted">
          {description}
        </p>
      )}
      {children}
    </dialog>
  );
}

/** Footer row for dialog actions; a leading text button pushes the rest right. */
export function DialogActions({ children }: { children: ReactNode }) {
  return (
    <div
      className={cx(
        'mt-6 flex items-center justify-end gap-3 border-0 border-t border-solid border-line pt-5',
        '[&>:first-child:not(:last-child)]:mr-auto',
      )}
    >
      {children}
    </div>
  );
}
