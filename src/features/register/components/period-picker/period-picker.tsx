'use client';
import { useState } from 'react';
import { Pencil } from 'lucide-react';
import { Collapsible } from '@/components/ui/collapsible';
import { formatDate } from '@/lib/format';
import { periodCopy } from '../../copy';
import type { MonthSummary } from '../../model/amounts';
import { monthNames, periodBounds, switchMode, type Period } from '../../model/period';
import type { RegisterKind } from '../../model/types';
import type { SettlementMove } from '../settlement-change';
import { Axis, type AxisState } from './axis';
import { ModeSwitch } from './mode-switch';
import { PeriodSummary } from './period-summary';
import { RangeDialog } from './range-dialog';
import p from './period-picker.module.css';

interface PeriodPickerProps {
  period: Period;
  /** Month the user last looked at, kept when the mode changes. */
  anchor: number;
  /** VAT per month of the period's year, for both registers. */
  summaries: Record<RegisterKind, MonthSummary[]>;
  kind: RegisterKind;
  state: AxisState;
  settlement: { kind: 'payable' | 'surplus'; amount: number };
  /** How the VAT to pay moved against the previous month. */
  change: SettlementMove | null;
  empty: boolean;
  /** Sales of the deadline's month still without a KSeF number. */
  missingKsef: number;
  onMissingKsef: () => void;
  onRetry: () => void;
  onChange: (period: Period) => void;
}

// The settlement period: what it comes to (summary), the year's VAT axis with the
// selected months under a lens, and the mode. On phones the card becomes the hero.
export function PeriodPicker({
  period,
  anchor,
  summaries,
  kind,
  state,
  settlement,
  change,
  empty,
  missingKsef,
  onMissingKsef,
  onRetry,
  onChange,
}: PeriodPickerProps) {
  const [rangeStart, setRangeStart] = useState<number | null>(null);
  const [editing, setEditing] = useState(false);
  const { from, to } = periodBounds(period);
  const copy = periodCopy.range;

  return (
    <section aria-labelledby="period-heading" className={p.card} data-intro-part="period">
      <h2 id="period-heading" className="sr-only">
        {periodCopy.heading}
      </h2>
      <PeriodSummary
        period={period}
        settlement={settlement}
        change={change}
        state={state}
        empty={empty}
        missingKsef={missingKsef}
        onMissingKsef={onMissingKsef}
        onRetry={onRetry}
        onChange={onChange}
      />
      <div className={p.controls}>
        <ModeSwitch
          mode={period.mode}
          onMode={(mode) => {
            setRangeStart(null);
            onChange(switchMode(period, mode, anchor));
          }}
          className={p.modes}
        />
      </div>
      <div className={p.axis} data-tour="axis">
        <Axis
          period={period}
          summaries={summaries}
          kind={kind}
          state={state}
          rangeStart={rangeStart}
          onRangeStart={setRangeStart}
          onChange={onChange}
        />
      </div>
      <div className={p.range}>
        <Collapsible id="period-range" open={period.mode === 'range'}>
          <div className={p.rangeRow}>
            <button
              type="button"
              className={p.rangePill}
              aria-label={`${copy.edit}: ${formatDate(from)} – ${formatDate(to)}`}
              onClick={() => setEditing(true)}
            >
              {formatDate(from)} – {formatDate(to)}
              <Pencil size={14} aria-hidden="true" />
            </button>
            <p className={p.rangeHint}>
              {rangeStart === null
                ? copy.hint
                : copy.start(monthNames[rangeStart - 1].toLocaleLowerCase('pl'))}
            </p>
          </div>
        </Collapsible>
      </div>
      {editing && (
        <RangeDialog
          from={from}
          to={to}
          onApply={(start, end) => {
            setRangeStart(null);
            onChange({ mode: 'range', from: start, to: end });
          }}
          onClose={() => setEditing(false)}
        />
      )}
    </section>
  );
}
