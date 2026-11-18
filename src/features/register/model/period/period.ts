// Settlement periods. The demo organisation settles VAT per month (JPK_V7M); accountants
// also review a quarter, a whole year or an arbitrary date range.

import { monthNames, quarterNames } from './month-names';

export type Period =
  | { mode: 'month'; year: number; month: number }
  | { mode: 'quarter'; year: number; quarter: number }
  | { mode: 'year'; year: number }
  | { mode: 'range'; from: string; to: string };

export type PeriodMode = Period['mode'];

export const periodModes: { mode: PeriodMode; label: string }[] = [
  { mode: 'month', label: 'Miesiąc' },
  { mode: 'quarter', label: 'Kwartał' },
  { mode: 'year', label: 'Rok' },
  { mode: 'range', label: 'Zakres' },
];

/** Years the demo can show; 2026 holds the data, the neighbours are genuinely empty. */
export const demoYears = [2025, 2026, 2027];
export const defaultPeriod: Period = { mode: 'month', year: 2026, month: 10 };

const pad = (value: number) => String(value).padStart(2, '0');
export const isoDate = (year: number, month: number, day: number) =>
  `${year}-${pad(month)}-${pad(day)}`;
export const daysInMonth = (year: number, month: number) =>
  new Date(Date.UTC(year, month, 0)).getUTCDate();
const lower = (value: string) => value.toLocaleLowerCase('pl');
const dotted = (iso: string) => iso.split('-').reverse().join('.');

/** First and last day of the period, inclusive, as ISO dates. */
export function periodBounds(period: Period): { from: string; to: string } {
  switch (period.mode) {
    case 'month':
      return {
        from: isoDate(period.year, period.month, 1),
        to: isoDate(period.year, period.month, daysInMonth(period.year, period.month)),
      };
    case 'quarter': {
      const first = (period.quarter - 1) * 3 + 1;
      return {
        from: isoDate(period.year, first, 1),
        to: isoDate(period.year, first + 2, daysInMonth(period.year, first + 2)),
      };
    }
    case 'year':
      return { from: isoDate(period.year, 1, 1), to: isoDate(period.year, 12, 31) };
    case 'range':
      return period.from <= period.to
        ? { from: period.from, to: period.to }
        : { from: period.to, to: period.from };
  }
}

export function inPeriod(date: string, period: Period): boolean {
  const { from, to } = periodBounds(period);
  return date >= from && date <= to;
}

/** The year the month strip shows for this period. */
export function periodYear(period: Period): number {
  return period.mode === 'range' ? Number(periodBounds(period).from.slice(0, 4)) : period.year;
}

/** Months of `year` the period covers, 0-based, for the strip highlight. */
export function monthSpan(period: Period, year: number): { start: number; span: number } | null {
  const { from, to } = periodBounds(period);
  const index = (iso: string) => Number(iso.slice(0, 4)) * 12 + Number(iso.slice(5, 7)) - 1;
  const first = Math.max(index(from), year * 12);
  const last = Math.min(index(to), year * 12 + 11);
  return first > last ? null : { start: first - year * 12, span: last - first + 1 };
}

/** Whether the period spans more than one calendar month. */
export function spansMonths(period: Period): boolean {
  const { from, to } = periodBounds(period);
  return from.slice(0, 7) !== to.slice(0, 7);
}

/** "Październik 2026", "III kwartał 2026", "Rok 2026", "Październik – listopad 2026". */
export function periodLabel(period: Period): string {
  switch (period.mode) {
    case 'month':
      return `${monthNames[period.month - 1]} ${period.year}`;
    case 'quarter':
      return `${quarterNames[period.quarter - 1]} kwartał ${period.year}`;
    case 'year':
      return `Rok ${period.year}`;
    case 'range': {
      const { from, to } = periodBounds(period);
      const [fromYear, fromMonth, fromDay] = from.split('-').map(Number);
      const [toYear, toMonth, toDay] = to.split('-').map(Number);
      if (fromDay === 1 && toDay === daysInMonth(toYear, toMonth)) {
        const start = monthNames[fromMonth - 1];
        if (fromYear === toYear && fromMonth === toMonth) return `${start} ${fromYear}`;
        return fromYear === toYear
          ? `${start} – ${lower(monthNames[toMonth - 1])} ${toYear}`
          : `${start} ${fromYear} – ${lower(monthNames[toMonth - 1])} ${toYear}`;
      }
      return from === to ? dotted(from) : `${dotted(from)} – ${dotted(to)}`;
    }
  }
}

/** The period inside a sentence: "za październik 2026", "za okres 01.10 – 15.11.2026". */
export function periodPhrase(period: Period): string {
  const label = periodLabel(period);
  if (period.mode === 'range' && /^\d/.test(label)) return `okres ${label}`;
  return label.charAt(0).toLocaleLowerCase('pl') + label.slice(1);
}

/** File-name friendly form: 2026-10, 2026-kw3, 2026, 2026-10-01_2026-11-15. */
export function periodSlug(period: Period): string {
  switch (period.mode) {
    case 'month':
      return `${period.year}-${pad(period.month)}`;
    case 'quarter':
      return `${period.year}-kw${period.quarter}`;
    case 'year':
      return String(period.year);
    case 'range': {
      const { from, to } = periodBounds(period);
      return `${from}_${to}`;
    }
  }
}
