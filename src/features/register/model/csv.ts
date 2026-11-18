import { ksefCopy } from '../copy';
import { columnLabels, fieldLabels, operationLabels, registers, tagLabels } from './labels';
import { periodSlug, type Period } from './period';
import type { RegisterKind, VatDocument } from './types';

const headers = [
  columnLabels.contractor,
  columnLabels.date,
  columnLabels.number,
  columnLabels.ksef,
  columnLabels.identifier,
  fieldLabels.operation,
  fieldLabels.jpk,
  fieldLabels.series,
  fieldLabels.net,
  fieldLabels.vat,
  fieldLabels.gross,
  fieldLabels.rateVat,
  fieldLabels.tag,
  fieldLabels.note,
];

function cell(value: string): string {
  // Neutralise spreadsheet formulas in text fields before CSV quoting.
  const plainNegativeNumber = /^-\d+(?:[.,]\d+)?$/.test(value);
  const safe = /^[=+\-@\t\r]/.test(value) && !plainNegativeNumber ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

const amount = (grosze: number) => (grosze / 100).toFixed(2).replace('.', ',');

/** Semicolon-separated CSV with a BOM, as Polish Excel expects. */
export function exportCsv(documents: VatDocument[]): string {
  const rows = documents.map((doc) => [
    doc.contractor,
    doc.date,
    doc.number,
    doc.ksef ?? ksefCopy.pending,
    doc.identifier,
    operationLabels[doc.operation],
    doc.jpk,
    doc.series,
    amount(doc.net),
    amount(doc.vat),
    amount(doc.net + doc.vat),
    doc.rate,
    tagLabels[doc.tag],
    doc.note,
  ]);
  return '\uFEFF' + [headers, ...rows].map((row) => row.map(cell).join(';')).join('\r\n');
}

export function csvFileName(kind: RegisterKind, period: Period): string {
  return `rejestr-vat-${registers[kind].slug}-${periodSlug(period)}.csv`;
}
