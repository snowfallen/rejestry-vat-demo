'use client';
import { useRef, useState, type MouseEvent, type PointerEvent } from 'react';

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

/**
 * Pointer drag on the month strip (mouse and pen; touch keeps scrolling the strip).
 * Pressing inside the highlight moves it, keeping its length; pressing elsewhere draws
 * a range; grabbing an edge of the highlight resizes it.
 */
export function useAxisDrag({ committed, movable, step, onCommit }: AxisDragOptions) {
  const drag = useRef<Drag | null>(null);
  const [preview, setPreviewState] = useState<Span | null>(null);
  // The latest preview is read on pointer up, which can arrive before React renders.
  const latestPreview = useRef<Span | null>(null);
  const [onEdge, setOnEdge] = useState(false);
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
    if (event.pointerType === 'touch' || event.button !== 0) return;
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
      setPreview({ start: Math.min(current.origin, at), span: Math.abs(at - current.origin) + 1 });
      return;
    }
    const base = committed!;
    const delta = Math.round((at - current.origin) / step) * step;
    setPreview({
      start: Math.max(0, Math.min(12 - base.span, base.start + delta)),
      span: base.span,
    });
  }

  function onPointerUp(event: PointerEvent<HTMLElement>) {
    const current = drag.current;
    if (!current || current.pointer !== event.pointerId) return;
    drag.current = null;
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
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerLeave: () => setOnEdge(false),
      onPointerCancel: () => {
        drag.current = null;
        setPreview(null);
      },
      onClickCapture,
    },
  };
}
