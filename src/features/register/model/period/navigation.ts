// Moving between periods: switching the mode, stepping and building ranges.

import {
  daysInMonth,
  isoDate,
  periodBounds,
  periodYear,
  type Period,
  type PeriodMode,
} from './period';

/**
 * Converts the period to another mode around an anchor month, so switching
 * Miesiąc → Rok → Miesiąc returns to the month the user was looking at.
 */
export function switchMode(period: Period, mode: PeriodMode, anchor: number): Period {
  const year = periodYear(period);
  switch (mode) {
    case 'month':
      return { mode, year, month: anchor };
    case 'quarter':
      return { mode, year, quarter: Math.ceil(anchor / 3) };
    case 'year':
      return { mode, year };
    case 'range':
      return { mode, ...periodBounds(period) };
  }
}

/** The month a period is "about", used as the anchor when the mode changes. */
export function anchorMonth(period: Period, previous: number): number {
  switch (period.mode) {
    case 'month':
      return period.month;
    case 'quarter': {
      const first = (period.quarter - 1) * 3 + 1;
      return previous >= first && previous < first + 3 ? previous : first;
    }
    case 'year':
      return previous;
    case 'range':
      return Number(periodBounds(period).from.slice(5, 7));
  }
}

/** Moves the period by whole years, keeping its mode. */
export function shiftYear(period: Period, delta: number): Period {
  if (period.mode !== 'range') return { ...period, year: period.year + delta };
  const move = (iso: string) => {
    const [year, month, day] = iso.split('-').map(Number);
    return isoDate(year + delta, month, Math.min(day, daysInMonth(year + delta, month)));
  };
  return { mode: 'range', from: move(period.from), to: move(period.to) };
}

/** The previous (−1) or next (+1) period of the same kind; a range moves by its length. */
export function stepPeriod(period: Period, delta: number): Period {
  switch (period.mode) {
    case 'month': {
      const index = period.year * 12 + period.month - 1 + delta;
      return { mode: 'month', year: Math.floor(index / 12), month: (index % 12) + 1 };
    }
    case 'quarter': {
      const index = period.year * 4 + period.quarter - 1 + delta;
      return { mode: 'quarter', year: Math.floor(index / 4), quarter: (index % 4) + 1 };
    }
    case 'year':
      return { mode: 'year', year: period.year + delta };
    case 'range': {
      const { from, to } = periodBounds(period);
      const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
      const [toYear, toMonth, toDay] = to.split('-').map(Number);
      // Whole months move by whole months, so October–November becomes December–January.
      if (fromDay === 1 && toDay === daysInMonth(toYear, toMonth)) {
        const months = (toYear - fromYear) * 12 + toMonth - fromMonth + 1;
        const first = fromYear * 12 + fromMonth - 1 + delta * months;
        const last = first + months - 1;
        const year = (index: number) => Math.floor(index / 12);
        const month = (index: number) => (index % 12) + 1;
        return {
          mode: 'range',
          from: isoDate(year(first), month(first), 1),
          to: isoDate(year(last), month(last), daysInMonth(year(last), month(last))),
        };
      }
      const day = 86_400_000;
      const start = Date.UTC(fromYear, fromMonth - 1, fromDay);
      const length = Date.UTC(toYear, toMonth - 1, toDay) - start + day;
      const iso = (time: number) => new Date(time).toISOString().slice(0, 10);
      return {
        mode: 'range',
        from: iso(start + delta * length),
        to: iso(start + delta * length + length - day),
      };
    }
  }
}

/** Whether every day of the period lies within the given years. */
export function periodWithin(period: Period, years: number[]): boolean {
  const { from, to } = periodBounds(period);
  return years.includes(Number(from.slice(0, 4))) && years.includes(Number(to.slice(0, 4)));
}

/** A range of whole months between two months of one year, in either order. */
export function monthRange(year: number, first: number, last: number): Period {
  const [start, end] = first <= last ? [first, last] : [last, first];
  return {
    mode: 'range',
    from: isoDate(year, start, 1),
    to: isoDate(year, end, daysInMonth(year, end)),
  };
}
