import type { RegisterKind, VatDocument, VatRate } from './types';

export interface Totals {
  net: number;
  vat: number;
  gross: number;
}

export function totals(documents: VatDocument[]): Totals {
  let net = 0;
  let vat = 0;
  for (const doc of documents) {
    net += doc.net;
    vat += doc.vat;
  }
  return { net, vat, gross: net + vat };
}

export interface RateTotals extends Totals {
  rate: VatRate;
  count: number;
}

const rateOrder: VatRate[] = ['23%', '8%', 'np'];

/** Amounts per VAT rate, only for rates present in the documents. */
export function rateTotals(documents: VatDocument[]): RateTotals[] {
  return rateOrder
    .map((rate) => {
      const matching = documents.filter((doc) => doc.rate === rate);
      return { rate, count: matching.length, ...totals(matching) };
    })
    .filter((row) => row.count > 0);
}

export interface MonthSummary {
  /** 1–12 */
  month: number;
  count: number;
  vat: number;
}

/** VAT and document count for each month of a year in one register. */
export function monthlySummary(
  documents: VatDocument[],
  kind: RegisterKind,
  year: number,
): MonthSummary[] {
  const summary = Array.from({ length: 12 }, (_, i) => ({ month: i + 1, count: 0, vat: 0 }));
  const prefix = `${year}-`;
  for (const doc of documents) {
    if (doc.kind !== kind || !doc.date.startsWith(prefix)) continue;
    const entry = summary[Number(doc.date.slice(5, 7)) - 1];
    entry.count += 1;
    entry.vat += doc.vat;
  }
  return summary;
}

/** Totals per calendar month (`YYYY-MM`), for month headings in a longer period. */
export function totalsByMonth(documents: VatDocument[]): Map<string, Totals & { count: number }> {
  const result = new Map<string, Totals & { count: number }>();
  for (const doc of documents) {
    const key = doc.date.slice(0, 7);
    const entry = result.get(key) ?? { net: 0, vat: 0, gross: 0, count: 0 };
    entry.net += doc.net;
    entry.vat += doc.vat;
    entry.gross += doc.net + doc.vat;
    entry.count += 1;
    result.set(key, entry);
  }
  return result;
}

/**
 * Output VAT minus input VAT for the period. Positive is payable to the tax office;
 * negative is a surplus of input VAT. Ignores a surplus carried over from earlier
 * periods, so it is an estimate, not the declaration amount.
 */
export function settlement(outputVat: number, inputVat: number) {
  const difference = outputVat - inputVat;
  return {
    kind: difference >= 0 ? ('payable' as const) : ('surplus' as const),
    amount: Math.abs(difference),
    difference,
  };
}

/**
 * How the month's VAT to pay moved against the month before, in percent. Nothing for
 * January (its previous month is in another year) or when the previous month had
 * nothing to pay, where a percentage would mean nothing.
 */
export function settlementChange(
  sales: MonthSummary[],
  purchases: MonthSummary[],
  month: number,
): { percent: number; previousMonth: number } | null {
  if (month < 2) return null;
  const due = (m: number) => sales[m - 1].vat - purchases[m - 1].vat;
  const previous = due(month - 1);
  if (previous <= 0 || !sales[month - 1].count) return null;
  return {
    percent: Math.round(((due(month) - previous) / previous) * 100),
    previousMonth: month - 1,
  };
}

/**
 * The document's share of its register's VAT for its month, in percent with one
 * decimal: "11,9% VAT należnego za październik". Zero when the month has no VAT.
 */
export function documentShareOfMonth(doc: VatDocument, documents: VatDocument[]): number {
  const month = doc.date.slice(0, 7);
  let total = 0;
  for (const other of documents)
    if (other.kind === doc.kind && other.date.startsWith(month)) total += other.vat;
  return total > 0 ? Math.round((doc.vat / total) * 1000) / 10 : 0;
}
