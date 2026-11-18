import { useEffect } from 'react';
import { ArrowRight, CalendarClock, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { AnimatedMoney } from '@/components/ui/animated-money';
import { IconButton } from '@/components/ui/button';
import { useSwipeStep } from '@/hooks/use-swipe-step';
import { cx } from '@/lib/cx';
import { formatDate } from '@/lib/format';
import { periodCopy, stateCopy } from '../../copy';
import {
  deadlineCountdown,
  demoToday,
  demoYears,
  filingDeadline,
  monthNames,
  periodBounds,
  periodLabel,
  periodWithin,
  periodOpen,
  stepPeriod,
  type Period,
} from '../../model/period';
import { SettlementChange, type SettlementMove } from '../settlement-change';
import type { AxisState } from './axis';
import p from './period-summary.module.css';
import st from './summary-states.module.css';

interface PeriodSummaryProps {
  period: Period;
  settlement: { kind: 'payable' | 'surplus'; amount: number };
  change: SettlementMove | null;
  state: AxisState;
  /** Nothing in the period, in either register. */
  empty: boolean;
  /** Sales of the deadline's month still without a KSeF number. */
  missingKsef: number;
  onMissingKsef: () => void;
  onRetry: () => void;
  onChange: (period: Period) => void;
}

/** The period in words: ‹ name ›, dates, the JPK deadline and what the period comes to. */
export function PeriodSummary({
  period,
  settlement,
  change,
  state,
  empty,
  missingKsef,
  onMissingKsef,
  onRetry,
  onChange,
}: PeriodSummaryProps) {
  const { from, to } = periodBounds(period);
  const label = periodLabel(period);
  const dates = `${formatDate(from)} – ${formatDate(to)}`;
  // A range of loose dates is its own label: long, and the dates line would repeat it.
  const datesOnly = label === dates;
  const deadline = filingDeadline(period);
  const countdown = deadline && deadlineCountdown(deadline.date, demoToday);
  const previous = stepPeriod(period, -1);
  const next = stepPeriod(period, 1);
  const payable = settlement.kind === 'payable';
  const canGo = (delta: -1 | 1) => {
    const target = delta === 1 ? next : previous;
    return periodWithin(target, demoYears) && periodOpen(target);
  };
  // On touch screens a sideways swipe over the summary steps the period, like the arrows.
  const swipe = useSwipeStep<HTMLDivElement>({
    canStep: canGo,
    onStep: (delta) => onChange(delta === 1 ? next : previous),
  });
  // ← and → step the period when nothing else has the keyboard (the page itself has
  // focus): fields, tabs and the axis keep their own arrows.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
      if (event.target !== document.body || document.querySelector('dialog[open]')) return;
      const delta = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
      if (!delta || !canGo(delta)) return;
      event.preventDefault();
      onChange(delta === 1 ? next : previous);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });
  return (
    <div className={p.summary} {...swipe}>
      <div className={p.nav}>
        <IconButton
          label={periodCopy.previous}
          title={`${periodCopy.previous} (←)`}
          aria-keyshortcuts="ArrowLeft"
          variant="plain"
          size="sm"
          disabled={!canGo(-1)}
          onClick={() => onChange(previous)}
        >
          <ChevronLeft size={18} />
        </IconButton>
        <p className={p.title} data-long={datesOnly ? '' : undefined} aria-live="polite">
          {label}
        </p>
        <IconButton
          label={periodCopy.next}
          title={`${periodCopy.next} (→)`}
          aria-keyshortcuts="ArrowRight"
          variant="plain"
          size="sm"
          disabled={!canGo(1)}
          onClick={() => onChange(next)}
        >
          <ChevronRight size={18} />
        </IconButton>
      </div>
      <p className={p.meta}>
        {!datesOnly && <span className={p.dates}>{dates}</span>}
        {deadline && (
          <span className={p.deadline} data-deadline="">
            <CalendarClock size={13} aria-hidden="true" />
            {period.mode === 'quarter'
              ? periodCopy.deadlineFor(
                  deadline.form,
                  monthNames[deadline.month - 1].toLowerCase(),
                  formatDate(deadline.date),
                )
              : periodCopy.deadline(deadline.form, formatDate(deadline.date))}
            {countdown && <span className={p.countdown}>· {countdown}</span>}
          </span>
        )}
        {/* What still holds that return back: since February 2026 every invoice in it
            needs a KSeF number. One press lists exactly those invoices. */}
        {deadline && state === 'ready' && missingKsef > 0 && (
          <button
            type="button"
            className={p.missing}
            title={periodCopy.missingKsefTitle}
            onClick={onMissingKsef}
          >
            <span className={p.missingDot} aria-hidden="true" />
            {periodCopy.missingKsef(missingKsef)}
            <ArrowRight size={13} aria-hidden="true" />
          </button>
        )}
      </p>
      {state === 'error' ? (
        // Phones (the hero) say the failure here, with their own retry. On desktop the
        // register's error panel right below says it once; here the amount is just
        // unavailable, like the tabs' «—».
        <>
          <div className={st.failure} data-register-state="">
            <p className={st.failureText}>{stateCopy.failed}</p>
            <button type="button" className={st.retry} onClick={onRetry}>
              <RefreshCw size={16} aria-hidden="true" />
              {stateCopy.retry}
            </button>
          </div>
          <p className={cx(p.settlement, st.failureQuiet)}>
            <span className={p.settlementLabel}>
              <span className={p.swatch} aria-hidden="true" />
              {periodCopy.due} · {periodCopy.estimate}
            </span>
            <strong className={p.settlementAmount}>—</strong>
          </p>
        </>
      ) : (
        <p className={p.settlement}>
          <span className={p.settlementLabel}>
            <span className={p.swatch} aria-hidden="true" />
            {payable ? periodCopy.due : periodCopy.surplus} · {periodCopy.estimate}
          </span>
          <strong className={p.settlementAmount}>
            {state === 'loading' ? (
              <span className={st.amountSkeleton}>
                <span className="sr-only">{stateCopy.loading}</span>
              </span>
            ) : (
              <AnimatedMoney value={settlement.amount} />
            )}
          </strong>
          {empty && state === 'ready' ? (
            <span className={st.emptyNote}>{stateCopy.emptyPeriod}</span>
          ) : (
            change &&
            state === 'ready' && <SettlementChange change={change} className={p.settlementChange} />
          )}
        </p>
      )}
    </div>
  );
}
