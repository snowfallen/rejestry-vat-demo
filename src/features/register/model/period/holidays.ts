// Polish public holidays, for moving a deadline to the next working day.

import { isoDate } from './period';

const pad = (value: number) => String(value).padStart(2, '0');

function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const fixedHolidays = [
  '01-01',
  '01-06',
  '05-01',
  '05-03',
  '08-15',
  '11-01',
  '11-11',
  '12-24',
  '12-25',
  '12-26',
];

export function isPublicHoliday(date: Date): boolean {
  const key = `${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
  if (fixedHolidays.includes(key)) return true;
  const easter = easterSunday(date.getUTCFullYear()).getTime();
  const day = 86_400_000;
  // Easter Sunday and Monday, Pentecost, Corpus Christi.
  return [0, 1, 49, 60].some((offset) => easter + offset * day === date.getTime());
}

/** The date itself, or the next day that is neither a weekend day nor a public holiday. */
export function nextWorkingDay(iso: string): string {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  while (date.getUTCDay() === 0 || date.getUTCDay() === 6 || isPublicHoliday(date))
    date.setUTCDate(date.getUTCDate() + 1);
  return isoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
}
