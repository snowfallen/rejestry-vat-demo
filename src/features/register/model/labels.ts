import type { ColumnKey, Operation, RegisterKind, Tag } from './types';

export const registers: Record<
  RegisterKind,
  { title: string; vatLabel: string; vatKind: string; genitive: string; slug: string }
> = {
  sales: {
    title: 'Rejestr VAT sprzedaży',
    vatLabel: 'VAT należny',
    vatKind: 'należny',
    genitive: 'sprzedaży',
    slug: 'sprzedaz',
  },
  purchases: {
    title: 'Rejestr VAT zakupów',
    vatLabel: 'VAT naliczony',
    vatKind: 'naliczony',
    genitive: 'zakupów',
    slug: 'zakupy',
  },
};

export const columnLabels: Record<ColumnKey, string> = {
  contractor: 'Kontrahent',
  date: 'Data',
  number: 'Numer dokumentu',
  ksef: 'Numer KSeF',
  identifier: 'Identyfikator',
  gross: 'Brutto',
};

/** Every column the table can show, in its default order. */
export const columnKeys = [
  'contractor',
  'date',
  'number',
  'ksef',
  'identifier',
  'gross',
] as const satisfies readonly ColumnKey[];

/** The five columns of the original register, plus the gross amount. */
export const defaultColumns: ColumnKey[] = [...columnKeys];

export const tagLabels: Record<Tag, string> = {
  '': 'Bez etykiety',
  review: 'Do sprawdzenia',
  verified: 'Zweryfikowane',
};

export const operationLabels: Record<Operation, string> = {
  invoice: 'Faktura',
  correction: 'Korekta',
};

/** Names of a document's fields wherever they are labelled: totals, the paper, print. */
export const fieldLabels = {
  net: 'Netto',
  vat: 'VAT',
  gross: 'Brutto',
  rate: 'Stawka',
  count: 'Dok.',
  countFull: 'Dokumenty',
  ordinal: 'Lp.',
  total: 'Razem',
  seller: 'Sprzedawca',
  buyer: 'Nabywca',
  operation: 'Rodzaj operacji',
  jpk: 'Kod JPK V7',
  jpkShort: 'Kod JPK',
  issued: 'Data wystawienia',
  tag: 'Etykieta',
  series: 'Seria',
  rateVat: 'Stawka VAT',
  note: 'Notatka',
} as const;

/** Names of the filter groups and their options. */
export const facetLabels = {
  ksef: { label: 'Status KSeF', short: 'KSeF' },
  operation: { label: 'Rodzaj operacji', short: 'Operacja' },
  jpk: { label: 'Kod JPK V7', short: 'JPK V7', none: 'Bez oznaczenia' },
  series: { label: 'Seria dokumentów', short: 'Seria' },
  tag: { label: 'Etykieta', short: 'Etykieta' },
} as const;
