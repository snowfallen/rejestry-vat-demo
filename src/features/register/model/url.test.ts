import { describe, expect, it } from 'vitest';
import { defaultPeriod } from './period';
import { formatPeriod, parsePeriod, readRegisterUrl, registerSearch } from './url';

const base = { kind: 'sales' as const, period: defaultPeriod, ksef: '', search: '' };

describe('register address', () => {
  it('writes nothing for the defaults', () => {
    expect(registerSearch(base)).toBe('');
  });

  it('round-trips every period mode, the register, the KSeF view and the search', () => {
    for (const text of ['2026-09', '2026-Q3', '2025', '2026-03-01..2026-08-31']) {
      const period = parsePeriod(text);
      expect(period).toBeDefined();
      expect(formatPeriod(period!)).toBe(text);
    }
    const search = registerSearch({
      kind: 'purchases',
      period: { mode: 'quarter', year: 2026, quarter: 3 },
      ksef: 'pending',
      search: 'Alfa',
    });
    expect(search).toBe('?period=2026-Q3&register=purchases&ksef=pending&q=Alfa');
    expect(readRegisterUrl(Object.fromEntries(new URLSearchParams(search)))).toEqual({
      kind: 'purchases',
      period: { mode: 'quarter', year: 2026, quarter: 3 },
      ksef: 'pending',
      search: 'Alfa',
    });
  });

  it('leaves out what the demo cannot show', () => {
    expect(
      readRegisterUrl({ period: '2026-13', register: 'x', ksef: 'maybe', q: '  ', state: 'boom' }),
    ).toEqual({});
    // December 2026 has not begun on the demo's day; 2030 is outside its years.
    expect(parsePeriod('2026-12')).toBeUndefined();
    expect(parsePeriod('2030')).toBeUndefined();
    expect(parsePeriod('2026-02-30..2026-03-10')).toBeUndefined();
    expect(parsePeriod('2026-05-01..2026-04-01')).toBeUndefined();
  });

  it('keeps an asked-for demo state, and nothing for the populated register', () => {
    expect(registerSearch({ ...base, demo: 'populated' })).toBe('');
    expect(registerSearch({ ...base, demo: 'error' })).toBe('?state=error');
    expect(readRegisterUrl({ state: 'empty' })).toEqual({ demo: 'empty' });
    expect(readRegisterUrl({ state: 'populated' })).toEqual({});
  });
});
