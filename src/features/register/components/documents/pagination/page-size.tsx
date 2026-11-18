'use client';
import { useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useAnchoredPlacement } from '@/hooks/use-anchored-placement';
import { closeDetails, useDetailsDismiss } from '@/hooks/use-dismiss';
import { cx } from '@/lib/cx';
import { pagingCopy } from '../../../copy';

interface PageSizeProps {
  value: number;
  onChange: (size: number) => void;
  /** "10 na stronie", or "10 naraz" where the list grows instead of paging. */
  format?: (size: number) => string;
}

const sizes = [10, 20, 50];

/** How many documents a page (or one «show more» press) holds: a small menu. */
export function PageSize({ value, onChange, format = (n) => `${n} na stronie` }: PageSizeProps) {
  const ref = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const [open, setOpen] = useState(false);
  useDetailsDismiss(ref);
  const place = useAnchoredPlacement(summary, open, { width: 180, minHeight: 160 });
  return (
    <details ref={ref} className="relative" onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary
        ref={summary}
        role="button"
        aria-haspopup="menu"
        aria-label={`Dokumenty na stronie: ${format(value)}`}
        className={cx(
          'inline-flex min-h-[34px] list-none items-center gap-1.5 rounded-[9px] border border-solid',
          'border-line px-2.5 text-[12px] font-[550] text-ink',
          'hover:border-[var(--control-hover)]',
          'phone:min-h-[44px] phone:text-[14px]',
          '[&::-webkit-details-marker]:hidden',
        )}
      >
        {format(value)}
        <ChevronDown size={14} aria-hidden="true" className="text-muted" />
      </summary>
      <div
        role="menu"
        aria-label={pagingCopy.pageSize}
        style={open ? place : { visibility: 'hidden' }}
        className="fixed z-popover w-[180px] overflow-y-auto rounded-[14px] bg-surface p-1.5 shadow-2"
      >
        {sizes.map((size) => (
          <button
            key={size}
            type="button"
            role="menuitemradio"
            aria-checked={size === value}
            className={cx(
              'flex w-full items-center justify-between gap-2 rounded-md border-0 bg-transparent px-2.5',
              'py-2.5 text-left text-[13px] text-ink',
              'hover:bg-accent-soft',
            )}
            onClick={() => {
              closeDetails(ref.current);
              onChange(size);
            }}
          >
            {size}
            {size === value && <Check size={15} className="text-accent" aria-hidden="true" />}
          </button>
        ))}
      </div>
    </details>
  );
}
