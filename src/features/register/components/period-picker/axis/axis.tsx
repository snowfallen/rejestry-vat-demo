'use client';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/hooks/use-media-query';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import { formatMoney, formatMoneyWhole } from '@/lib/format';
import type { MonthSummary } from '../../../model/amounts';
import {
  monthNames,
  monthRange,
  monthSpan,
  openMonths,
  periodYear,
  quarterNames,
  type Period,
} from '../../../model/period';
import type { RegisterKind } from '../../../model/types';
import { AxisMonth, type AxisState } from './axis-month';
import { axisScale, axisSplit, monthBars } from './axis-scale';
import { useAxisDrag, type DragKind, type Span } from './use-axis-drag';
import { useAxisKeyboard } from './use-axis-keyboard';
import a from './axis.module.css';
import l from './axis-lens.module.css';
import { axisCopy } from '../../../copy';

interface AxisProps {
  period: Period;
  /** VAT per month of the period's year, for both registers. */
  summaries: Record<RegisterKind, MonthSummary[]>;
  kind: RegisterKind;
  state: AxisState;
  /** In range mode, the month clicked as the start, waiting for the end. */
  rangeStart: number | null;
  onRangeStart: (month: number | null) => void;
  onChange: (period: Period) => void;
}

/** Axis heights (rise + fall) on desktop and in the phone's hero card. */
const deskHeight = 92;
const heroHeight = 60;

/** The months a drag or Shift + arrow settled on, as a period. */
function spanToPeriod(next: Span, how: DragKind, period: Period, year: number): Period {
  const first = next.start + 1;
  const last = next.start + next.span;
  if (how === 'move' && period.mode === 'month') return { mode: 'month', year, month: first };
  if (how === 'move' && period.mode === 'quarter')
    return { mode: 'quarter', year, quarter: next.start / 3 + 1 };
  if (next.span === 1 && period.mode === 'month') return { mode: 'month', year, month: first };
  return monthRange(year, first, last);
}

/**
 * The settlement axis: the year as twelve months on one line. Output VAT rises above it,
 * split into the part input VAT covers and the part left to pay; input VAT hangs below.
 * The lens over the months is the selected period: click, drag, stretch or use the keys.
 */
export function Axis({
  period,
  summaries,
  kind,
  state,
  rangeStart,
  onRangeStart,
  onChange,
}: AxisProps) {
  const strip = useRef<HTMLDivElement>(null);
  const year = periodYear(period);
  const committed = monthSpan(period, year);
  const movable = period.mode !== 'year' && committed !== null;
  // Months that have not begun cannot be chosen: a span is cut at the last open month.
  const open = openMonths(year);
  // Amber below the line marks input VAT beyond the output; the legend names it when
  // the year has such a month.
  const hasSurplus =
    state === 'ready' &&
    summaries.sales.some((output, i) => {
      const input = summaries.purchases[i];
      return input.vat > output.vat && (output.count > 0 || input.count > 0);
    });
  const commit = (next: Span, how: DragKind) => {
    if (next.start >= open) return;
    onRangeStart(null);
    const span = Math.min(next.span, open - next.start);
    onChange(spanToPeriod({ start: next.start, span }, how, period, year));
  };
  const { preview, onEdge, grabbed, handlers } = useAxisDrag({
    committed,
    movable,
    step: period.mode === 'quarter' ? 3 : 1,
    onCommit: commit,
  });
  const onKeyDown = useAxisKeyboard(committed, commit);
  const span = preview ?? committed;

  const { sales, purchases } = summaries;
  const summary = summaries[kind];
  const other = summaries[kind === 'sales' ? 'purchases' : 'sales'];
  const maxOutput = Math.max(0, ...sales.map((m) => m.vat));
  const maxInput = Math.max(0, ...purchases.map((m) => m.vat));
  const desk = axisSplit(maxOutput, maxInput, deskHeight);
  const hero = axisSplit(maxOutput, maxInput, heroHeight);
  const kDesk = axisScale(maxOutput, maxInput, desk.rise, desk.fall);
  const kHero = axisScale(maxOutput, maxInput, hero.rise, hero.fall);

  // On narrow screens the strip scrolls; keep the highlighted months in view.
  useEffect(() => {
    const element = strip.current;
    const target = element?.querySelector<HTMLElement>('[data-highlight]');
    if (!element || !target || element.scrollWidth <= element.clientWidth) return;
    element.scrollTo({
      left: target.offsetLeft - element.clientWidth / 2 + target.offsetWidth / 2,
      behavior: prefersReducedMotion() ? 'instant' : 'smooth',
    });
  }, [span?.start, span?.span, year]);

  const describe = (count: number, vat: number, otherVat: number) => {
    if (!count) return axisCopy.noDocuments;
    const [output, input] = kind === 'sales' ? [vat, otherVat] : [otherVat, vat];
    const rest =
      output >= input
        ? axisCopy.due(formatMoney(output - input))
        : axisCopy.surplus(formatMoney(input - output));
    return axisCopy.describe(count, formatMoney(output), formatMoney(input), rest);
  };

  // The lens carries the result of the months it covers: due, or a surplus in amber.
  const covered = span ? { from: span.start, to: span.start + span.span } : null;
  const sum = (months: MonthSummary[]) =>
    covered ? months.slice(covered.from, covered.to).reduce((total, m) => total + m.vat, 0) : 0;
  const lensResult = sum(sales) - sum(purchases);
  const lensHasDocuments = Boolean(
    covered &&
    [...sales, ...purchases].some(
      (m) => m.month > covered.from && m.month <= covered.to && m.count > 0,
    ),
  );

  const month = (i: number) => {
    const inside = Boolean(span && i >= span.start && i < span.start + span.span);
    return (
      <AxisMonth
        key={i}
        index={i}
        output={sales[i]}
        input={purchases[i]}
        bars={{
          desk: monthBars(sales[i].vat, purchases[i].vat, kDesk),
          hero: monthBars(sales[i].vat, purchases[i].vat, kHero),
        }}
        inside={inside}
        kind={kind}
        state={state}
      />
    );
  };

  function items() {
    switch (period.mode) {
      case 'month':
        return summary.map((m, i) => (
          <button
            key={m.month}
            type="button"
            role="radio"
            aria-checked={m.month === period.month}
            tabIndex={m.month === period.month ? 0 : -1}
            aria-label={`${monthNames[i]} ${year}: ${describe(m.count, m.vat, other[i].vat)}`}
            className={a.item}
            data-item=""
            disabled={i >= open}
            onClick={() => onChange({ mode: 'month', year, month: m.month })}
          >
            {month(i)}
          </button>
        ));
      case 'quarter':
        return quarterNames.map((name, q) => {
          const months = summary.slice(q * 3, q * 3 + 3);
          const count = months.reduce((sum, m) => sum + m.count, 0);
          const vat = months.reduce((sum, m) => sum + m.vat, 0);
          const otherVat = other.slice(q * 3, q * 3 + 3).reduce((sum, m) => sum + m.vat, 0);
          return (
            <button
              key={name}
              type="button"
              role="radio"
              aria-checked={period.quarter === q + 1}
              tabIndex={period.quarter === q + 1 ? 0 : -1}
              aria-label={axisCopy.quarter(name, year, describe(count, vat, otherVat))}
              className={cx(a.item, a.quarterItem)}
              data-item=""
              disabled={q * 3 >= open}
              onClick={() => onChange({ mode: 'quarter', year, quarter: q + 1 })}
            >
              {[0, 1, 2].map((offset) => month(q * 3 + offset))}
            </button>
          );
        });
      case 'year':
      case 'range': {
        const drillDown = period.mode === 'year';
        return summary.map((m, i) => (
          <button
            key={m.month}
            type="button"
            tabIndex={i === (span?.start ?? 0) ? 0 : -1}
            aria-pressed={
              drillDown ? undefined : Boolean(span && i >= span.start && i < span.start + span.span)
            }
            aria-label={
              drillDown
                ? axisCopy.showMonth(
                    monthNames[i].toLocaleLowerCase('pl'),
                    year,
                    describe(m.count, m.vat, other[i].vat),
                  )
                : `${monthNames[i]} ${year}: ${describe(m.count, m.vat, other[i].vat)}`
            }
            className={a.item}
            data-item=""
            disabled={i >= open}
            onClick={() => {
              if (drillDown) return onChange({ mode: 'month', year, month: m.month });
              if (rangeStart === null) {
                onRangeStart(m.month);
                onChange(monthRange(year, m.month, m.month));
              } else {
                onRangeStart(null);
                onChange(monthRange(year, rangeStart, m.month));
              }
            }}
          >
            {month(i)}
          </button>
        ));
      }
    }
  }

  return (
    <div
      ref={strip}
      className={cx(
        a.strip,
        state !== 'ready' && a.dimmed,
        preview && a.dragging,
        movable && a.grab,
        onEdge && a.resizing,
      )}
      data-axis=""
      data-mode={period.mode}
      data-dragging={preview || grabbed ? '' : undefined}
      style={cssVars({
        '--rise': `${desk.rise}px`,
        '--fall': `${desk.fall}px`,
        '--rise-h': `${hero.rise}px`,
        '--fall-h': `${hero.fall}px`,
      })}
    >
      <p className={l.legend} aria-hidden="true">
        <span>{axisCopy.output} ↑</span>
        <span>
          {axisCopy.input} ↓{hasSurplus && <em className={l.surplusKey}>{axisCopy.surplusKey}</em>}
        </span>
      </p>
      <div
        // A new year or a change of state draws the bars again.
        key={`${year}-${state}`}
        role={period.mode === 'month' || period.mode === 'quarter' ? 'radiogroup' : 'group'}
        aria-label={axisCopy.strip[period.mode]}
        aria-description={axisCopy.dragHint}
        className={a.months}
        onKeyDown={onKeyDown}
        {...handlers}
      >
        {span && (
          <span
            className={l.lens}
            data-highlight=""
            aria-hidden="true"
            style={cssVars({
              '--start': span.start,
              '--span': span.span,
              // Months at a quarter's edge keep extra space on that side; the lens leaves
              // it out so it sits evenly around the bars.
              '--in-start': span.start % 3 === 0 ? 1 : 0,
              '--in-end': (span.start + span.span) % 3 === 0 ? 1 : 0,
            })}
          >
            {/* At rest the period's amount lives once, in the summary beside the axis. While
                the lens is dragged or resized its sum rides along, then leaves again. */}
            {state === 'ready' && lensHasDocuments && preview && (
              <span className={cx(l.amount, lensResult < 0 && l.amountSurplus)}>
                {formatMoneyWhole(Math.abs(lensResult))}
              </span>
            )}
            {movable && (
              <>
                <span
                  className={cx(l.handle, l.handleStart)}
                  data-handle="start"
                  title={axisCopy.resize}
                />
                <span
                  className={cx(l.handle, l.handleEnd)}
                  data-handle="end"
                  title={axisCopy.resize}
                />
              </>
            )}
          </span>
        )}
        {state === 'error' && (
          // The axis breaks: a zigzag along the line where the months should be.
          <svg
            className={l.zigzag}
            viewBox="0 0 240 12"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            <path
              d={`M0 6 ${Array.from({ length: 24 }, (_, i) => `l5 ${i % 2 ? 5 : -5} l5 ${i % 2 ? -5 : 5}`).join(' ')}`}
            />
          </svg>
        )}
        {items()}
      </div>
      <p className={l.key} aria-hidden="true">
        <span>↑ {axisCopy.output}</span>
        <span>↓ {axisCopy.input}</span>
        {hasSurplus && <span className={l.surplusKey}>{axisCopy.surplusKey}</span>}
      </p>
    </div>
  );
}
