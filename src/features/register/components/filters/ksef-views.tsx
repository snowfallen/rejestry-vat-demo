'use client';
import { useRef, type KeyboardEvent } from 'react';
import { cx } from '@/lib/cx';
import { ksefViews } from '../../model/query';
import { toolbarCopy } from '../../copy';

/**
 * Quick views of the list by KSeF status, with live counts. Unconfirmed documents
 * are what an accountant chases before filing, so this sits in sight above the list
 * instead of inside the filters. Arrow keys move the selection (roving tab index).
 */
interface KsefViewsProps {
  /** Inside the toolbar row: tighter pills. */
  compact?: boolean;
  value: string;
  counts: Record<string, number>;
  /** While the register loads, the counts from the last load are hidden. */
  loading?: boolean;
  onChange: (value: string) => void;
}

export function KsefViews({
  compact = false,
  value,
  counts,
  loading = false,
  onChange,
}: KsefViewsProps) {
  const buttons = useRef<(HTMLButtonElement | null)[]>([]);
  const index = Math.max(
    0,
    ksefViews.findIndex((view) => view.value === value),
  );

  // Nothing to tell apart in an empty period, an error or while loading.
  if (!counts[''] && !value) return null;

  function onKeyDown(event: KeyboardEvent) {
    const step = { ArrowLeft: -1, ArrowRight: 1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + ksefViews.length) % ksefViews.length;
    onChange(ksefViews[next].value);
    buttons.current[next]?.focus();
  }

  // Phones scroll the three views sideways, like filter pills in native apps.
  return (
    <>
      <div
        role="radiogroup"
        aria-label={toolbarCopy.ksefStatus}
        aria-busy={loading || undefined}
        onKeyDown={onKeyDown}
        className={cx(
          'flex items-center gap-1',
          !compact && 'flex-wrap',
          'phone:-mx-[var(--inset)] phone:flex-nowrap phone:overflow-x-auto phone:px-[var(--inset)]',
          'phone:[scrollbar-width:none]',
          'phone:[mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]',
        )}
      >
        {ksefViews.map((view, i) => {
          const selected = i === index;
          const count = counts[view.value] ?? 0;
          return (
            <button
              key={view.value}
              ref={(element) => {
                buttons.current[i] = element;
              }}
              type="button"
              role="radio"
              aria-checked={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(view.value)}
              className={cx(
                'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border',
                'border-solid text-[13px] font-[550] transition-colors duration-200',
                compact ? 'min-h-[34px] px-2.5' : 'min-h-8 px-3 phone:min-h-9',
                selected
                  ? 'border-accent-line bg-accent-soft text-accent'
                  : 'border-transparent bg-transparent text-muted hover:bg-track hover:text-ink',
              )}
            >
              {view.value === 'pending' && (
                <span aria-hidden="true" className="size-1.5 rounded-full bg-[var(--pending)]" />
              )}
              {view.label}
              <span
                className={cx(
                  'tabular-nums',
                  loading && 'invisible',
                  selected
                    ? 'text-accent'
                    : view.value === 'pending' && count > 0
                      ? 'font-semibold text-warning'
                      : 'font-normal text-muted',
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>
    </>
  );
}
