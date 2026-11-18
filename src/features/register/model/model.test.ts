import { describe, expect, it } from 'vitest';
import {
  documentShareOfMonth,
  monthlySummary,
  rateTotals,
  settlement,
  settlementChange,
  totals,
  totalsByMonth,
} from './amounts';
import { documentCopy } from '../copy';
import { csvFileName, exportCsv } from './csv';
import { demoKsefNumber } from './ksef';
import { createDocuments, defaultSeries, demoNip, supplierNip, supplierNumber } from './fixtures';
import type { RegisterKind } from './types';
import {
  anchorMonth,
  deadlineCountdown,
  demoToday,
  defaultPeriod,
  filingDeadline,
  monthRange,
  monthSpan,
  nextWorkingDay,
  periodBounds,
  periodLabel,
  periodPhrase,
  periodSlug,
  shiftYear,
  stepPeriod,
  switchMode,
  type Period,
} from './period';
import {
  emptyCriteria,
  facetCount,
  filterDocuments,
  facetsFor,
  nearestMonthWithDocuments,
  sortDocuments,
  suggestFacets,
  contractorDocuments,
} from './query';

const documents = createDocuments();
const october = defaultPeriod;
const sales = (period: Period = october, criteria = emptyCriteria) =>
  filterDocuments(documents, 'sales', period, criteria);

describe('register documents', () => {
  it('matches the reference totals for all fourteen October sales, including the correction', () => {
    expect(sales()).toHaveLength(14);
    expect(totals(sales())).toEqual({ net: 970000, vat: 232300, gross: 1202300 });
  });

  it('keeps amounts as integer grosze and every id unique', () => {
    for (const doc of documents) {
      expect(Number.isInteger(doc.net)).toBe(true);
      expect(Number.isInteger(doc.vat)).toBe(true);
    }
    expect(new Set(documents.map((doc) => doc.id)).size).toBe(documents.length);
  });

  it('does not mix purchase documents into sales', () => {
    const purchases = filterDocuments(documents, 'purchases', october);
    expect(purchases.every((doc) => doc.identifier.startsWith('DEMO-Z-'))).toBe(true);
  });

  it('combines search, operation, JPK and series criteria', () => {
    const result = sales(october, {
      ...emptyCriteria,
      search: 'alfa 01',
      operation: 'invoice',
      jpk: 'GTU_12',
      series: 'FV',
    });
    expect(result.map((doc) => doc.identifier)).toEqual(['DEMO-S-1']);
  });

  it('counts each filter option against the other active criteria', () => {
    const invoices = { ...emptyCriteria, operation: 'invoice' };
    const count = (
      criteria: typeof emptyCriteria,
      key: 'operation' | 'jpk' | 'series',
      value: string,
    ) => facetCount(documents, 'sales', october, criteria, key, value);
    expect(count(emptyCriteria, 'operation', 'correction')).toBe(1);
    expect(count(invoices, 'operation', '')).toBe(14);
    expect(count(invoices, 'jpk', 'GTU_12')).toBe(
      sales(october, { ...invoices, jpk: 'GTU_12' }).length,
    );
    expect(count(invoices, 'series', 'KOR')).toBe(0);
  });

  it('searches number and identifier case- and diacritic-insensitively', () => {
    expect(sales(october, { ...emptyCriteria, search: ' demo-s-14 ' })).toHaveLength(1);
    expect(sales(october, { ...emptyCriteria, search: 'kor/3/' })).toHaveLength(1);
    const custom = [{ ...documents[0], contractor: 'Łódź Żółć' }];
    expect(
      filterDocuments(custom, 'sales', october, { ...emptyCriteria, search: 'lodz zolc' }),
    ).toHaveLength(1);
  });

  it('separates a non-taxed correction from taxable sales', () => {
    const correction = sales(october, { ...emptyCriteria, operation: 'correction', jpk: 'none' });
    expect(totals(correction)).toEqual({ net: -40000, vat: 0, gross: -40000 });
  });

  it('filters session labels without modifying source records', () => {
    const tagged = documents.map((doc, i) => (i === 0 ? { ...doc, tag: 'review' as const } : doc));
    const byTag = (tag: string) =>
      filterDocuments(tagged, 'sales', october, { ...emptyCriteria, tag });
    expect(byTag('review')).toHaveLength(1);
    expect(byTag('none')).toHaveLength(13);
    expect(documents[0].tag).toBe('');
  });

  it('sorts amounts numerically, including negative corrections', () => {
    const sorted = sortDocuments(sales(), { key: 'gross', direction: 'asc' });
    expect(sorted[0].operation).toBe('correction');
    expect(sorted.at(-1)?.identifier).toBe('DEMO-S-14');
  });
});

describe('demo data', () => {
  const year = { mode: 'year', year: 2026 } as const;
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const ofMonth = (kind: RegisterKind, month: number) =>
    filterDocuments(documents, kind, { mode: 'month', year: 2026, month });

  it("purchases carry their suppliers' numbers and the internal series apart", () => {
    expect(supplierNumber(4, '2026-10-02', 153, false)).toBe('FS/2026/10/0153');
    expect(supplierNumber(1, '2026-10-02', 153, false)).toBe('153/10/2026');
    expect(supplierNumber(1, '2026-10-07', 12, true)).toBe('FK/2026/10/0012');
    const purchases = documents.filter((doc) => doc.kind === 'purchases');
    expect(purchases.some((doc) => doc.number.includes('DEMO'))).toBe(false);
    expect(new Set(purchases.map((doc) => doc.series))).toEqual(new Set(['FZ', 'KOR']));
    for (const month of months) {
      const numbers = ofMonth('purchases', month).map((doc) => doc.number);
      expect(new Set(numbers).size).toBe(numbers.length);
    }
  });

  it('October sales still match the reference', () => {
    expect(sales()).toHaveLength(14);
    expect(totals(sales())).toEqual({ net: 970000, vat: 232300, gross: 1202300 });
    expect(
      sales()
        .filter((doc) => !doc.ksef)
        .map((doc) => doc.number),
    ).toEqual([
      'FV/11/10/2026/DEMO',
      'FV/12/10/2026/DEMO',
      'FV/13/10/2026/DEMO',
      'FV/14/10/2026/DEMO',
    ]);
  });

  it('October purchases', () => {
    const purchases = ofMonth('purchases', 10);
    expect(purchases).toHaveLength(9);
    expect(totals(purchases).vat).toBe(133810);
    expect(settlement(232300, totals(purchases).vat).amount).toBe(98490);
  });

  it("every purchase has a KSeF number with its supplier's NIP", () => {
    const purchases = documents.filter((doc) => doc.kind === 'purchases');
    for (const doc of purchases) {
      expect(doc.ksef).toMatch(/^\d{10}-\d{8}-[0-9A-F]{12}-[0-9A-F]{2}$/);
      expect(doc.ksef!.startsWith(demoNip)).toBe(false);
    }
    for (const doc of documents.filter((doc) => doc.kind === 'sales' && doc.ksef))
      expect(doc.ksef!.startsWith(`${demoNip}-`)).toBe(true);
  });

  it('GTU markings appear on sales only', () => {
    expect(documents.filter((doc) => doc.kind === 'purchases' && doc.jpk)).toHaveLength(0);
    expect(documents.some((doc) => doc.kind === 'sales' && doc.jpk.startsWith('GTU_'))).toBe(true);
  });

  it('supplier tax numbers fail the NIP checksum, so none is a real company', () => {
    const weights = [6, 5, 7, 2, 3, 4, 5, 6, 7];
    const valid = (nip: string) =>
      weights.reduce((sum, weight, i) => sum + weight * Number(nip[i]), 0) % 11 === Number(nip[9]);
    expect(valid(demoNip)).toBe(true);
    for (let supplier = 1; supplier <= 14; supplier++) {
      expect(supplierNip(supplier)).toMatch(/^\d{10}$/);
      expect(valid(supplierNip(supplier))).toBe(false);
    }
  });

  it('unconfirmed documents are the newest of their month', () => {
    for (const kind of ['sales', 'purchases'] as const) {
      for (const month of months) {
        const docs = ofMonth(kind, month);
        const confirmed = docs.filter((doc) => doc.ksef).map((doc) => doc.date);
        const pending = docs.filter((doc) => !doc.ksef).map((doc) => doc.date);
        if (!confirmed.length || !pending.length) continue;
        expect(confirmed.sort().at(-1)! <= pending.sort()[0]).toBe(true);
      }
    }
  });

  it('input VAT is 35–65% of output VAT except June', () => {
    const output = monthlySummary(documents, 'sales', 2026);
    const input = monthlySummary(documents, 'purchases', 2026);
    for (const month of months) {
      if (month === 6 || !output[month - 1].count) continue;
      const share = input[month - 1].vat / output[month - 1].vat;
      expect(share, `month ${month}`).toBeGreaterThanOrEqual(0.35);
      expect(share, `month ${month}`).toBeLessThanOrEqual(0.65);
    }
  });

  it('June has a VAT surplus', () => {
    const output = totals(ofMonth('sales', 6)).vat;
    const input = totals(ofMonth('purchases', 6)).vat;
    expect(settlement(output, input).kind).toBe('surplus');
  });

  it('registers differ in size', () => {
    expect(filterDocuments(documents, 'purchases', year).length).toBeLessThan(
      filterDocuments(documents, 'sales', year).length,
    );
    for (const month of months) {
      const count = ofMonth('sales', month).length;
      if (count) expect(ofMonth('purchases', month).length).toBeLessThan(count);
    }
  });
});

describe('periods', () => {
  it('filters a month, a quarter, a year and a date range', () => {
    expect(sales({ mode: 'month', year: 2026, month: 12 })).toHaveLength(0);
    expect(sales({ mode: 'quarter', year: 2026, quarter: 4 })).toHaveLength(14 + 6);
    expect(sales({ mode: 'year', year: 2026 })).toHaveLength(
      14 + 11 + 12 + 12 + 15 + 13 + 16 + 10 + 9 + 13 + 6,
    );
    expect(sales({ mode: 'year', year: 2025 })).toHaveLength(0);
    expect(sales({ mode: 'range', from: '2026-10-05', to: '2026-10-09' })).toHaveLength(5);
  });

  it('treats a reversed range as the same range', () => {
    expect(periodBounds({ mode: 'range', from: '2026-11-15', to: '2026-10-01' })).toEqual({
      from: '2026-10-01',
      to: '2026-11-15',
    });
  });

  it('names periods the way an accountant reads them', () => {
    expect(periodLabel(october)).toBe('Październik 2026');
    expect(periodLabel({ mode: 'quarter', year: 2026, quarter: 3 })).toBe('III kwartał 2026');
    expect(periodLabel({ mode: 'year', year: 2026 })).toBe('Rok 2026');
    expect(periodLabel(monthRange(2026, 11, 10))).toBe('Październik – listopad 2026');
    expect(periodLabel({ mode: 'range', from: '2026-10-01', to: '2026-10-15' })).toBe(
      '01.10.2026 – 15.10.2026',
    );
    expect(periodPhrase(october)).toBe('październik 2026');
    expect(periodPhrase({ mode: 'range', from: '2026-10-01', to: '2026-10-15' })).toBe(
      'okres 01.10.2026 – 15.10.2026',
    );
  });

  it('gives each period a file-name form', () => {
    expect(periodSlug(october)).toBe('2026-10');
    expect(periodSlug({ mode: 'quarter', year: 2026, quarter: 4 })).toBe('2026-kw4');
    expect(csvFileName('purchases', { mode: 'year', year: 2026 })).toBe(
      'rejestr-vat-zakupy-2026.csv',
    );
  });

  it('highlights the covered months of the shown year', () => {
    expect(monthSpan(october, 2026)).toEqual({ start: 9, span: 1 });
    expect(monthSpan({ mode: 'quarter', year: 2026, quarter: 2 }, 2026)).toEqual({
      start: 3,
      span: 3,
    });
    expect(monthSpan({ mode: 'range', from: '2025-11-10', to: '2026-02-01' }, 2026)).toEqual({
      start: 0,
      span: 2,
    });
    expect(monthSpan(october, 2025)).toBeNull();
  });

  it('switches mode around the month the user was looking at', () => {
    expect(switchMode(october, 'quarter', 10)).toEqual({ mode: 'quarter', year: 2026, quarter: 4 });
    const year = switchMode(october, 'year', 10);
    expect(switchMode(year, 'month', anchorMonth(year, 10))).toEqual(october);
    expect(switchMode(october, 'range', 10)).toEqual({
      mode: 'range',
      from: '2026-10-01',
      to: '2026-10-31',
    });
    expect(shiftYear({ mode: 'range', from: '2024-02-29', to: '2024-03-10' }, 1)).toEqual({
      mode: 'range',
      from: '2025-02-28',
      to: '2025-03-10',
    });
  });

  it('steps to the previous or next period across year boundaries', () => {
    expect(stepPeriod({ mode: 'month', year: 2026, month: 1 }, -1)).toEqual({
      mode: 'month',
      year: 2025,
      month: 12,
    });
    expect(stepPeriod({ mode: 'quarter', year: 2026, quarter: 4 }, 1)).toEqual({
      mode: 'quarter',
      year: 2027,
      quarter: 1,
    });
    expect(stepPeriod(monthRange(2026, 10, 11), 1)).toEqual({
      mode: 'range',
      from: '2026-12-01',
      to: '2027-01-31',
    });
    expect(stepPeriod({ mode: 'range', from: '2026-10-01', to: '2026-10-15' }, 1)).toEqual({
      mode: 'range',
      from: '2026-10-16',
      to: '2026-10-30',
    });
  });

  it('moves filing deadlines past weekends and public holidays', () => {
    expect(nextWorkingDay('2026-11-25')).toBe('2026-11-25');
    // 25.12 is Christmas, 26.12 Saturday, 27.12 Sunday.
    expect(filingDeadline({ mode: 'month', year: 2026, month: 11 })).toEqual({
      form: 'JPK_V7M',
      year: 2026,
      month: 11,
      date: '2026-12-28',
    });
    // A past quarter shows its last monthly deadline: September's, Sunday 25.10 → 26.10.
    expect(filingDeadline({ mode: 'quarter', year: 2026, quarter: 3 })).toEqual({
      form: 'JPK_V7M',
      year: 2026,
      month: 9,
      date: '2026-10-26',
    });
    // The current quarter shows the nearest deadline still ahead: October's.
    expect(filingDeadline({ mode: 'quarter', year: 2026, quarter: 4 })).toEqual({
      form: 'JPK_V7M',
      year: 2026,
      month: 10,
      date: '2026-11-25',
    });
    expect(filingDeadline({ mode: 'month', year: 2026, month: 12 })?.date).toBe('2027-01-25');
    // Easter Monday 2027 is 29.03; the 25th of March 2027 is an ordinary Thursday.
    expect(nextWorkingDay('2027-03-29')).toBe('2027-03-30');
    expect(filingDeadline({ mode: 'year', year: 2026 })).toBeNull();
  });

  it('leads out of an empty month to the nearest month with documents', () => {
    expect(
      nearestMonthWithDocuments(documents, 'sales', { mode: 'month', year: 2026, month: 12 }),
    ).toEqual({
      mode: 'month',
      year: 2026,
      month: 11,
    });
    // The search crosses the year's end: an empty 2025 leads into January 2026.
    expect(
      nearestMonthWithDocuments(documents, 'sales', { mode: 'month', year: 2025, month: 12 }),
    ).toEqual({ mode: 'month', year: 2026, month: 1 });
    expect(
      nearestMonthWithDocuments([], 'sales', { mode: 'month', year: 2025, month: 4 }),
    ).toBeNull();
  });
});

describe('amounts', () => {
  it('summarises the demo year per month without changing October', () => {
    const year = monthlySummary(documents, 'sales', 2026);
    expect(year).toHaveLength(12);
    expect(year[9]).toEqual({ month: 10, count: 14, vat: 232300 });
    expect(year[11]).toEqual({ month: 12, count: 0, vat: 0 });
    expect(year.filter((month) => month.count > 0)).toHaveLength(11);
  });

  it('reconciles the VAT-rate breakdown and month totals with the register', () => {
    const quarter = sales({ mode: 'quarter', year: 2026, quarter: 4 });
    const rates = rateTotals(quarter);
    expect(rates.reduce((sum, row) => sum + row.vat, 0)).toBe(totals(quarter).vat);
    expect(rates.reduce((sum, row) => sum + row.net, 0)).toBe(totals(quarter).net);
    expect(rateTotals(sales()).map((row) => row.rate)).toEqual(['23%', 'np']);
    const months = totalsByMonth(quarter);
    expect([...months.keys()]).toEqual(['2026-10', '2026-11']);
    expect(months.get('2026-10')).toEqual({ net: 970000, vat: 232300, gross: 1202300, count: 14 });
  });

  it('reads the settlement as payable or as a surplus of input VAT', () => {
    expect(settlement(232300, 133810)).toEqual({
      kind: 'payable',
      amount: 98490,
      difference: 98490,
    });
    expect(settlement(1000, 1500)).toEqual({ kind: 'surplus', amount: 500, difference: -500 });
  });
});

describe('CSV export', () => {
  it('exports all filtered rows with Polish decimals and a BOM', () => {
    const csv = exportCsv(sales());
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv.split('\r\n')).toHaveLength(15);
    expect(csv).toContain('DEMO-S-14');
    expect(csv).toContain('"1200,00"');
  });

  it('escapes quotes, separators, newlines and formula injection', () => {
    const csv = exportCsv([
      { ...documents[0], contractor: '=SUM(1;2)', note: 'Test "quote";\nnext line' },
    ]);
    expect(csv).toContain('"\'=SUM(1;2)"');
    expect(csv).toContain('"Test ""quote"";\nnext line"');
  });
});

describe('deadline countdown', () => {
  it('says how soon a coming deadline falls', () => {
    expect(deadlineCountdown('2026-11-25', demoToday)).toBe('za 8 dni');
    expect(deadlineCountdown('2026-11-25', '2026-11-24')).toBe('jutro');
    expect(deadlineCountdown('2026-11-25', '2026-11-25')).toBe('dziś');
  });
  it('stays silent for past or distant deadlines', () => {
    expect(deadlineCountdown('2026-10-26', '2026-11-17')).toBeNull();
    expect(deadlineCountdown('2027-02-25', '2026-11-17')).toBeNull();
  });
});

describe('settlement change', () => {
  const month = (m: number, vat: number, count = 1) => ({ month: m, count, vat });
  const sales = [month(1, 1000), month(2, 3000), month(3, 1500)];
  const purchases = [month(1, 0), month(2, 1000), month(3, 500)];
  it('compares the VAT to pay with the month before', () => {
    expect(settlementChange(sales, purchases, 2)).toEqual({ percent: 100, previousMonth: 1 });
    expect(settlementChange(sales, purchases, 3)).toEqual({ percent: -50, previousMonth: 2 });
  });
  it('says nothing for January', () => {
    expect(settlementChange(sales, purchases, 1)).toBeNull();
  });
});

describe('search suggests filters', () => {
  const facets = facetsFor(defaultSeries, 'sales', true);
  const suggest = (query: string) =>
    suggestFacets(query, documents, facets, 'sales', october).map(
      (s) => `${s.facet} · ${s.label} (${s.count})`,
    );
  it('offers the JPK codes for "gtu"', () => {
    expect(suggest('gtu')).toHaveLength(2);
    expect(suggest('gtu')[0]).toMatch(/^Kod JPK V7 · GTU_/);
  });
  it('offers corrections and unconfirmed documents', () => {
    expect(suggest('kor')).toContain('Rodzaj operacji · Korekta (1)');
    expect(suggest('brak')).toContain('Status KSeF · Brak potwierdzenia (4)');
  });
  it('ignores case, diacritics and nothing-matching text', () => {
    expect(suggest('KOR')).toEqual(suggest('kor'));
    expect(suggest('zzz')).toEqual([]);
    expect(suggest('k')).toEqual([]);
  });
});

describe('document share of its month', () => {
  it("weighs a document's VAT against its register's month", () => {
    const first = sales().find((doc) => doc.number === 'FV/1/10/2026/DEMO')!;
    expect(documentShareOfMonth(first, documents)).toBe(11.9);
    const correction = sales().find((doc) => doc.operation === 'correction')!;
    expect(documentShareOfMonth(correction, documents)).toBe(0);
  });
});

describe('contractor documents', () => {
  it('finds a contractor’s documents of the year in one register', () => {
    const found = contractorDocuments(documents, 'sales', 2026, 'Demo Alfa 01');
    expect(found.length).toBeGreaterThan(1);
    expect(found.every((doc) => doc.contractor === 'Demo Alfa 01' && doc.kind === 'sales')).toBe(
      true,
    );
    expect(found.every((doc) => doc.date.startsWith('2026-'))).toBe(true);
  });
});

describe('correction note', () => {
  it('says what a correction changes', () => {
    expect(documentCopy.correctionNote({ nonTaxed: true, sales: true, lower: true })).toBe(
      'Korekta transakcji niepodlegającej opodatkowaniu (np): zmienia wartość sprzedaży, nie VAT.',
    );
    expect(documentCopy.correctionNote({ nonTaxed: true, sales: false, lower: true })).toContain(
      'wartość zakupu, nie VAT',
    );
    expect(documentCopy.correctionNote({ nonTaxed: false, sales: true, lower: true })).toBe(
      'Korekta zmniejsza podstawę opodatkowania i VAT.',
    );
    expect(documentCopy.correctionNote({ nonTaxed: false, sales: true, lower: false })).toBe(
      'Korekta zwiększa podstawę opodatkowania i VAT.',
    );
  });
});

describe('demo KSeF number', () => {
  it('is our NIP, the issue date and the KSeF format, the same every time', () => {
    const doc = { id: 'sales-11', date: '2026-10-11' };
    expect(demoKsefNumber(doc)).toMatch(/^1111111111-20261011-[0-9A-F]{12}-[0-9A-F]{2}$/);
    expect(demoKsefNumber(doc)).toBe(demoKsefNumber({ ...doc }));
    expect(demoKsefNumber({ id: 'sales-12', date: '2026-10-11' })).not.toBe(demoKsefNumber(doc));
  });
});
