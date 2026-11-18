'use client';
import { useEffect, useRef, useState, type MouseEvent, type PointerEvent } from 'react';

/** A run of months on the strip: 0-based start and length. */
export type Span = { start: number; span: number };
export type DragKind = 'move' | 'draw';

interface Drag {
  kind: DragKind;
  origin: number;
  /** Where the pointer went down; a drag starts only once the pointer itself moves. */
  x: number;
  moved: boolean;
  pointer: number;
}

interface AxisDragOptions {
  /** The highlighted months of the committed period, if any are in the shown year. */
  committed: Span | null;
  /** Whether the highlight can be moved and resized (not for a whole year). */
  movable: boolean;
  /** A quarter moves by whole quarters; anything else by single months. */
  step: number;
  onCommit: (next: Span, kind: DragKind) => void;
}

/** A light tick under the finger where the device can give one (not iOS Safari). */
function tick(ms: number) {
  try {
    navigator.vibrate?.(ms);
  } catch {
    // Vibration is a nicety; a blocked one changes nothing.
  }
}

/**
 * Pointer drag on the month strip. Mouse and pen: pressing inside the highlight moves
 * it, keeping its length; pressing elsewhere draws a range; grabbing an edge of the
 * highlight resizes it. Touch keeps scrolling the strip, except on a range's edge
 * handle, which a finger takes and drags.
 */
export function useAxisDrag({ committed, movable, step, onCommit }: AxisDragOptions) {
  const drag = useRef<Drag | null>(null);
  const [preview, setPreviewState] = useState<Span | null>(null);
  // The latest preview is read on pointer up, which can arrive before React renders.
  const latestPreview = useRef<Span | null>(null);
  const [onEdge, setOnEdge] = useState(false);
  // A finger holds an edge handle or the highlight: shown at once, before it moves.
  const [grabbed, setGrabbed] = useState(false);
  // A finger resting on the highlight: after a short hold it takes it; moving first
  // scrolls the strip as usual.
  const hold = useRef<{ timer: ReturnType<typeof setTimeout>; x: number; pointer: number } | null>(
    null,
  );
  const cancelHold = () => {
    if (hold.current) clearTimeout(hold.current.timer);
    hold.current = null;
  };
  // While a finger drags, the page must not scroll under it. Scrolling has not begun (the
  // finger was held still), so the first move can still be refused.
  useEffect(() => {
    if (!grabbed) return;
    const still = (event: TouchEvent) => event.preventDefault();
    document.addEventListener('touchmove', still, { passive: false });
    return () => document.removeEventListener('touchmove', still);
  }, [grabbed]);
  const suppressClick = useRef(false);
  const setPreview = (next: Span | null) => {
    latestPreview.current = next;
    setPreviewState(next);
  };

  function monthAt(event: PointerEvent<HTMLElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return Math.max(0, Math.min(11, Math.floor(((event.clientX - box.left) / box.width) * 12)));
  }

  // Which edge of the highlight the pointer is on, if any: grabbing an edge changes
  // the period's length, keeping the other edge where it is.
  function edgeAt(event: PointerEvent<HTMLElement>): 'start' | 'end' | null {
    if (!committed || !movable) return null;
    const box = event.currentTarget.getBoundingClientRect();
    const column = box.width / 12;
    const left = box.left + committed.start * column;
    const right = left + committed.span * column;
    if (Math.abs(event.clientX - left) <= 10) return 'start';
    if (Math.abs(event.clientX - right) <= 10) return 'end';
    return null;
  }

  function onPointerDown(event: PointerEvent<HTMLElement>) {
    if (event.button !== 0) return;
    const handle = (event.target as HTMLElement).closest<HTMLElement>('[data-handle]');
    if (event.pointerType === 'touch') {
      if (!committed || !movable) return;
      if (!handle) {
        const at = monthAt(event);
        if (at < committed.start || at >= committed.start + committed.span) return;
        const strip = event.currentTarget;
        const { clientX: x, pointerId: pointer } = event;
        hold.current = {
          x,
          pointer,
          timer: setTimeout(() => {
            hold.current = null;
            drag.current = { kind: 'move', origin: at, x, moved: true, pointer };
            try {
              strip.setPointerCapture(pointer);
            } catch {
              // The finger has already left; the drag simply ends with it.
            }
            setGrabbed(true);
            tick(10);
          }, 280),
        };
        return;
      }
      const start = handle.dataset.handle === 'start';
      drag.current = {
        kind: 'draw',
        origin: start ? committed.start + committed.span - 1 : committed.start,
        x: event.clientX,
        moved: true,
        pointer: event.pointerId,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      setGrabbed(true);
      tick(10);
      return;
    }
    const at = monthAt(event);
    const edge = edgeAt(event);
    const inside = committed && at >= committed.start && at < committed.start + committed.span;
    drag.current = edge
      ? {
          kind: 'draw',
          // Resizing is drawing from the edge that stays.
          origin: edge === 'start' ? committed!.start + committed!.span - 1 : committed!.start,
          x: event.clientX,
          moved: false,
          pointer: event.pointerId,
        }
      : {
          kind: inside && movable ? 'move' : 'draw',
          origin: at,
          x: event.clientX,
          moved: false,
          pointer: event.pointerId,
        };
  }

  function onPointerMove(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (hold.current && Math.abs(event.clientX - hold.current.x) > 8) cancelHold();
    if (!current) {
      if (event.pointerType !== 'touch') {
        const near = edgeAt(event) !== null;
        if (near !== onEdge) setOnEdge(near);
      }
      return;
    }
    if (current.pointer !== event.pointerId) return;
    const at = monthAt(event);
    // The strip may scroll under a still pointer; only real pointer travel counts.
    if (!current.moved && Math.abs(event.clientX - current.x) < 4) return;
    if (!current.moved) {
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
    }
    if (current.kind === 'draw') {
      const next = { start: Math.min(current.origin, at), span: Math.abs(at - current.origin) + 1 };
      const last = latestPreview.current;
      if (
        event.pointerType === 'touch' &&
        (!last || last.start !== next.start || last.span !== next.span)
      )
        tick(4);
      setPreview(next);
      return;
    }
    const base = committed!;
    const delta = Math.round((at - current.origin) / step) * step;
    const next = {
      start: Math.max(0, Math.min(12 - base.span, base.start + delta)),
      span: base.span,
    };
    if (event.pointerType === 'touch' && latestPreview.current?.start !== next.start) tick(4);
    setPreview(next);
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    cancelHold();
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null;
    // A held finger never also taps the month under it.
    if (event.pointerType === 'touch') suppressClick.current = true;
    setGrabbed(false);
    const next = latestPreview.current;
    const unchanged =
      next && committed && next.start === committed.start && next.span === committed.span;
    if (!current.moved || !next || unchanged) return setPreview(null);
    // The click that follows a drag must not select the month under the pointer.
    suppressClick.current = true;
    setPreview(null);
    onCommit(next, current.kind);
  }

  function onClickCapture(event: MouseEvent) {
    if (!suppressClick.current) return;
    suppressClick.current = false;
    event.stopPropagation();
    event.preventDefault();
  }

  return {
    preview,
    onEdge,
    grabbed,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: () => setOnEdge(false),
      onPointerCancel: () => {
        cancelHold();
        drag.current = null;
        setGrabbed(false);
        setPreview(null);
      },
      onClickCapture,
    },
  };
}
