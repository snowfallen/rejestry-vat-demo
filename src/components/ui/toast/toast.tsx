'use client';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CircleCheck, Undo2, X } from 'lucide-react';
import { cx } from '@/lib/cx';
import { uiCopy } from '../copy';

export type Notify = (message: string, undo?: () => void) => void;

interface Toast {
  id: number;
  message: string;
  undo?: () => void;
}

/**
 * A single transient message that clears itself after a few seconds. A message about
 * a change can carry its undo: the toast then offers «Cofnij» until it goes.
 */
export function useToast(duration = 4500) {
  const [toast, setToast] = useState<Toast | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), duration);
    return () => clearTimeout(timer);
  }, [toast, duration]);
  const notify = useCallback<Notify>(
    (message, undo) => setToast({ id: Date.now(), message, undo }),
    [],
  );
  const dismiss = useCallback(() => setToast(null), []);
  return { toast, duration, notify, dismiss };
}

export function ToastRegion({
  toast,
  duration,
  onDismiss,
}: {
  toast: Toast | null;
  duration: number;
  onDismiss: () => void;
}) {
  // A modal dialog makes the rest of the page inert, so while one is open the toast
  // lives inside it; otherwise «Cofnij» could not be pressed.
  const [host, setHost] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (!toast) return;
    const find = () => setHost(document.querySelector<HTMLElement>('dialog[open]'));
    find();
    const observer = new MutationObserver(find);
    observer.observe(document.body, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['open'],
    });
    return () => observer.disconnect();
  }, [toast]);

  const region = (
    <div
      role="status"
      aria-live="polite"
      className={cx(
        'pointer-events-none fixed inset-x-6 bottom-6 z-toast flex justify-center',
        'print:hidden',
        'phone:inset-x-3 phone:bottom-[calc(84px+env(safe-area-inset-bottom))]',
      )}
    >
      {toast && (
        <div
          key={toast.id}
          className={cx(
            'pointer-events-auto relative flex max-w-[520px] animate-[toastIn_180ms_ease-out]',
            'items-center gap-2.5 overflow-hidden rounded-[10px] bg-[var(--toast-bg)] py-2 pl-4 pr-2',
            'text-[13px] text-[var(--toast-ink)] shadow-[var(--shadow-toast)]',
          )}
        >
          <CircleCheck size={18} className="shrink-0 text-[var(--toast-icon)]" />
          <span className="py-1.5">{toast.message}</span>
          {toast.undo && (
            <button
              type="button"
              onClick={() => {
                onDismiss();
                // The undo may announce itself with a new toast.
                toast.undo?.();
              }}
              className={cx(
                'ml-1 inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-lg border-0 bg-transparent',
                'px-2.5 font-semibold text-[var(--toast-icon)]',
                'hover:bg-[color-mix(in_srgb,var(--toast-icon)_16%,transparent)]',
              )}
            >
              <Undo2 size={15} />
              Cofnij
            </button>
          )}
          <button
            type="button"
            onClick={onDismiss}
            aria-label={uiCopy.closeToast}
            className={cx(
              'grid size-9 shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0',
              'text-inherit',
              'hover:bg-[color-mix(in_srgb,var(--toast-icon)_16%,transparent)]',
            )}
          >
            <X size={15} />
          </button>
          {/* Time left to undo, running out along the lower edge. */}
          {toast.undo && (
            <span
              aria-hidden="true"
              className={cx(
                'absolute inset-x-0 bottom-0 h-0.5 origin-left animate-[toastTime_linear_forwards]',
                'bg-[var(--toast-icon)]',
                'motion-reduce:hidden',
              )}
              style={{ animationDuration: `${duration}ms` }}
            />
          )}
        </div>
      )}
    </div>
  );
  return host ? createPortal(region, host) : region;
}
