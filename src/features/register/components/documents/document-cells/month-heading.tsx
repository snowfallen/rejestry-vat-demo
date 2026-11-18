import { ChevronDown } from 'lucide-react';
import { cx } from '@/lib/cx';
import { formatMoney } from '@/lib/format';
import type { Totals } from '../../../model/amounts';
import { monthNames } from '../../../model/period';
import { documentCount } from '../../../copy';

/**
 * A month's heading inside a longer period: name, document count and its VAT. The
 * whole heading folds the month's documents away and brings them back.
 */
export function MonthHeading({
  month,
  totals,
  open,
  onToggle,
}: {
  month: string;
  totals: Totals & { count: number };
  open: boolean;
  onToggle: () => void;
}) {
  const [year, index] = month.split('-').map(Number);
  return (
    <button
      type="button"
      data-month={month}
      aria-expanded={open}
      onClick={onToggle}
      className={cx(
        'group flex w-full cursor-pointer flex-wrap items-baseline justify-between gap-x-4',
        'gap-y-0.5 border-0 bg-transparent p-0 text-left font-[inherit] text-ink',
        'text-[length:inherit]',
      )}
    >
      <span className="inline-flex items-center gap-1.5 font-semibold">
        <ChevronDown
          size={15}
          aria-hidden="true"
          className={cx(
            'shrink-0 self-center text-muted transition-transform duration-200 ease-out',
            'group-hover:text-accent',
            'motion-reduce:transition-none',
            !open && '-rotate-90',
          )}
        />
        {monthNames[index - 1]} {year}
      </span>
      <span className="text-[12px] font-normal tabular-nums text-muted">
        {documentCount(totals.count)} · VAT {formatMoney(totals.vat)} · brutto{' '}
        {formatMoney(totals.gross)}
      </span>
    </button>
  );
}
