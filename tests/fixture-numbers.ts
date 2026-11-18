import { totals } from '../src/features/register/model/amounts';
import { createDocuments } from '../src/features/register/model/fixtures';
import { filterDocuments } from '../src/features/register/model/query';
import type { RegisterKind } from '../src/features/register/model/types';

// Expected figures come from the same fixtures the page renders, not from copied numbers.
const documents = createDocuments();

export function monthDocuments(kind: RegisterKind, month: number, year = 2026) {
  return filterDocuments(documents, kind, { mode: 'month', year, month });
}

export function monthVat(kind: RegisterKind, month: number) {
  return totals(monthDocuments(kind, month)).vat;
}

export function unconfirmedIn(kind: RegisterKind, month: number) {
  return monthDocuments(kind, month).filter((doc) => !doc.ksef).length;
}
