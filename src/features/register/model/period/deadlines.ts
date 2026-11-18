// Deadlines. JPK_V7M is due on the 25th of the month after the month. A deadline on a
// Saturday or a public holiday moves to the next working day (Ordynacja podatkowa,
// art. 12 § 5).

import { nextWorkingDay } from './holidays';
import { isoDate, periodBounds, type Period } from './period';

/** Demo clock: the fixtures describe the register as of this day. */
export const demoToday = '2026-11-17';

/** The JPK_V7M deadline for one month's VAT. */
function monthDeadline(year: number, month: number): string {
  return month === 12
    ? nextWorkingDay(isoDate(year + 1, 1, 25))
    : nextWorkingDay(isoDate(year, month + 1, 25));
}

/**
 * The demo organisation settles VAT monthly (JPK_V7M), as the month view says. A month
 * shows its own deadline; a quarter shows the nearest of its three still ahead, or its
 * last one once all have passed. Years and ranges have no single deadline.
 */
export function filingDeadline(
  period: Period,
  today = demoToday,
): { form: 'JPK_V7M'; year: number; month: number; date: string } | null {
  if (period.mode !== 'month' && period.mode !== 'quarter') return null;
  const months =
    period.mode === 'month'
      ? [period.month]
      : [period.quarter * 3 - 2, period.quarter * 3 - 1, period.quarter * 3];
  const deadlines = months.map((month) => ({
    form: 'JPK_V7M' as const,
    year: period.year,
    month,
    date: monthDeadline(period.year, month),
  }));
  return deadlines.find((deadline) => deadline.date >= today) ?? deadlines[deadlines.length - 1];
}

/**
 * Whether the period has begun: a register cannot hold documents for a month that has
 * not started, so such periods are not offered at all.
 */
export function periodOpen(period: Period, today = demoToday): boolean {
  return periodBounds(period).from <= today;
}

/** How many months of `year` have begun by `today`: 12 for a past year, 0 for a future one. */
export function openMonths(year: number, today = demoToday): number {
  const [todayYear, todayMonth] = today.split('-').map(Number);
  return year < todayYear ? 12 : year > todayYear ? 0 : todayMonth;
}

/**
 * How soon a deadline falls, said the way people say it: "dziś", "jutro", "za 8 dni".
 * Nothing for a deadline that has passed or is more than two months away.
 */
export function deadlineCountdown(deadline: string, today: string): string | null {
  const days = Math.round((Date.parse(deadline) - Date.parse(today)) / 86_400_000);
  if (days < 0 || days > 60) return null;
  if (days === 0) return 'dziś';
  if (days === 1) return 'jutro';
  return `za ${days} dni`;
}
