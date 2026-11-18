// The register's place in the address: period, register, KSeF view, search and the demo
// data state, so a reload keeps them and a link can be shared. Defaults are left out.

import { defaultPeriod, demoYears, isoDate, periodOpen, periodWithin, type Period } from './period';
import { ksefViews } from './query';
import type { DemoState, RegisterKind } from './types';

export interface RegisterUrlState {
  kind?: RegisterKind;
  period?: Period;
  ksef?: string;
  search?: string;
  /** `?state=empty|error`: a demo data state other than the populated register. */
  demo?: Exclude<DemoState, 'populated'>;
}

type Params = Record<string, string | string[] | undefined>;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const isDate = (text: string) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(text);
  if (!match) return false;
  const [, year, month, day] = match.map(Number);
  return isoDate(year, month, day) === text && new Date(text).getUTCDate() === day;
};

/** "2026-10", "2026-Q4", "2026", "2026-03-01..2026-08-31" → a period, or nothing. */
export function parsePeriod(text: string): Period | undefined {
  let period: Period | undefined;
  let match: RegExpExecArray | null;
  if ((match = /^(\d{4})-(\d{2})$/.exec(text))) {
    const month = Number(match[2]);
    if (month >= 1 && month <= 12) period = { mode: 'month', year: Number(match[1]), month };
  } else if ((match = /^(\d{4})-Q([1-4])$/.exec(text))) {
    period = { mode: 'quarter', year: Number(match[1]), quarter: Number(match[2]) };
  } else if ((match = /^(\d{4})$/.exec(text))) {
    period = { mode: 'year', year: Number(match[1]) };
  } else if ((match = /^(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})$/.exec(text))) {
    const [, from, to] = match;
    if (isDate(from) && isDate(to) && from <= to) period = { mode: 'range', from, to };
  }
  // Only periods the demo can show: its years, and not months that have not begun.
  return period && periodWithin(period, demoYears) && periodOpen(period) ? period : undefined;
}

export function formatPeriod(period: Period): string {
  switch (period.mode) {
    case 'month':
      return `${period.year}-${String(period.month).padStart(2, '0')}`;
    case 'quarter':
      return `${period.year}-Q${period.quarter}`;
    case 'year':
      return String(period.year);
    case 'range':
      return `${period.from}..${period.to}`;
  }
}

/** Reads what the address says; anything unknown or unavailable is left out. */
export function readRegisterUrl(params: Params): RegisterUrlState {
  const state: RegisterUrlState = {};
  const period = first(params.period);
  const parsed = period ? parsePeriod(period) : undefined;
  if (parsed) state.period = parsed;
  if (first(params.register) === 'purchases') state.kind = 'purchases';
  const ksef = first(params.ksef);
  if (ksef && ksefViews.some((view) => view.value === ksef)) state.ksef = ksef;
  const search = first(params.q)?.trim();
  if (search) state.search = search.slice(0, 100);
  const demo = first(params.state);
  if (demo === 'empty' || demo === 'error') state.demo = demo;
  return state;
}

/** The query string for a state: "" for the defaults, else "?period=…&…". */
export function registerSearch({
  kind,
  period,
  ksef,
  search,
  demo = 'populated',
}: {
  kind: RegisterKind;
  period: Period;
  ksef: string;
  search: string;
  demo?: DemoState;
}): string {
  const params = new URLSearchParams();
  const text = formatPeriod(period);
  if (text !== formatPeriod(defaultPeriod)) params.set('period', text);
  if (kind === 'purchases') params.set('register', 'purchases');
  if (ksef) params.set('ksef', ksef);
  if (search.trim()) params.set('q', search.trim());
  if (demo !== 'populated') params.set('state', demo);
  const query = params.toString();
  return query ? `?${query}` : '';
}
