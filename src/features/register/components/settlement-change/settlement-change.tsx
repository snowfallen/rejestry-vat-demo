import { ArrowDownRight, ArrowUpRight, Equal } from 'lucide-react';
import { cx } from '@/lib/cx';
import { settlementChangeText, type SettlementMove } from './settlement-text';

export type { SettlementMove };

/** How the VAT to pay moved against the month before. */
export function SettlementChange({
  change,
  className,
}: {
  change: SettlementMove;
  className?: string;
}) {
  const Icon = change.percent > 0 ? ArrowUpRight : change.percent < 0 ? ArrowDownRight : Equal;
  return (
    <span className={cx('inline-flex items-center gap-1 tabular-nums', className)}>
      <Icon size={13} strokeWidth={2.4} aria-hidden="true" />
      {settlementChangeText(change)}
    </span>
  );
}
