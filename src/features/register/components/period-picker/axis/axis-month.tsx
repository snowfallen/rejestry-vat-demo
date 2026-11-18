import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import { formatMoney } from '@/lib/format';
import type { MonthSummary } from '../../../model/amounts';
import { monthShort, quarterNames } from '../../../model/period';
import type { RegisterKind } from '../../../model/types';
import type { MonthBars } from './axis-scale';
import a from './axis.module.css';
import t from './axis-tip.module.css';
import { axisCopy, stateCopy } from '../../../copy';

export type AxisState = 'ready' | 'loading' | 'error';

interface AxisMonthProps {
  /** 0-based month of the year. */
  index: number;
  output: MonthSummary;
  input: MonthSummary;
  /** Heights on the desktop strip and in the phone's hero card. */
  bars: { desk: MonthBars; hero: MonthBars };
  inside: boolean;
  /** The only selected month: its amount is written above the bars. */
  kind: RegisterKind;
  state: AxisState;
}

const px = (value: number) => `${value}px`;

/** One month on the axis: what is due on top, the covered part under it, input below. */
export function AxisMonth({ index, output, input, bars, inside, kind, state }: AxisMonthProps) {
  const { desk, hero } = bars;
  const empty = !output.count && !input.count;
  const difference = output.vat - input.vat;
  const failed = state === 'error';
  return (
    <span
      data-cell=""
      className={cx(
        a.cell,
        inside && a.inside,
        empty && !failed && a.emptyMonth,
        index % 3 === 0 && a.quarterStart,
        index % 3 === 2 && a.quarterEnd,
      )}
      style={cssVars({
        '--m': index,
        '--due': px(desk.due),
        '--offset': px(desk.offset),
        '--input': px(desk.input),
        '--surplus': px(desk.surplus),
        '--up': px(desk.due + desk.offset),
        '--due-h': px(hero.due),
        '--offset-h': px(hero.offset),
        '--input-h': px(hero.input),
        '--surplus-h': px(hero.surplus),
      })}
    >
      <span className={t.tip} aria-hidden="true">
        {state === 'loading' ? (
          stateCopy.loading
        ) : failed ? (
          stateCopy.failedShort
        ) : empty ? (
          stateCopy.noDocuments
        ) : (
          <>
            <span>
              {axisCopy.output} {formatMoney(output.vat)}
            </span>
            <span>
              {axisCopy.input} {formatMoney(input.vat)}
            </span>
            <span className={t.tipTotal}>
              {difference >= 0
                ? axisCopy.due(formatMoney(difference))
                : axisCopy.surplus(formatMoney(-difference))}
            </span>
          </>
        )}
      </span>
      <span className={a.rise}>
        {output.count > 0 && !failed && (
          <span className={cx(a.up, inside && kind !== 'sales' && a.other)}>
            <span className={a.due} />
            <span className={a.offset} />
          </span>
        )}
      </span>
      <span className={a.line} />
      <span className={a.fall}>
        {input.count > 0 && !failed && (
          <span className={cx(a.down, inside && kind !== 'purchases' && a.other)}>
            <span className={a.input} />
            <span className={a.surplus} />
          </span>
        )}
      </span>
      <span className={a.label}>{monthShort[index]}</span>
      <span className={a.quarter} aria-hidden="true">
        {index % 3 === 0 ? `${quarterNames[index / 3]} kw.` : ''}
      </span>
    </span>
  );
}
