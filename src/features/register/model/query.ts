import { ksefCopy } from '../copy';
import { facetLabels, operationLabels, tagLabels } from './labels';
import { periodBounds, type Period } from './period';
import type { ColumnKey, DocumentSeries, RegisterKind, VatDocument } from './types';

/** Narrowing criteria on top of the register and the period. Empty string = any. */
export interface Criteria {
  operation: string;
  jpk: string;
  series: string;
  tag: string;
  /** KSeF status: '' (any), 'pending' or 'confirmed'. */
  ksef: string;
  search: string;
}

export const emptyCriteria: Criteria = {
  operation: '',
  jpk: '',
  series: '',
  tag: '',
  ksef: '',
  search: '',
};

/** KSeF status views above the documents; the first is the whole list. */
export const ksefViews = [
  { value: '', label: ksefCopy.all },
  { value: 'pending', label: ksefCopy.pending },
  { value: 'confirmed', label: ksefCopy.confirmedMany },
] as const;

export type FacetKey = 'operation' | 'jpk' | 'series' | 'tag' | 'ksef';

export interface Facet {
  key: FacetKey;
  label: string;
  /** Prefix on an applied-filter chip, e.g. "Seria: FV". */
  short: string;
  options: { value: string; label: string; hint?: string }[];
}

/**
 * Filter groups of the register. Series options follow the selected register. The
 * KSeF status has its own views above the list on every width; only search suggestions
 * offer it as a facet.
 */
export function facetsFor(series: DocumentSeries[], kind: RegisterKind, withKsef = false): Facet[] {
  const ksef: Facet = {
    key: 'ksef',
    ...facetLabels.ksef,
    options: ksefViews
      .filter((view) => view.value)
      .map((view) => ({ value: view.value, label: view.label })),
  };
  return [
    ...(withKsef ? [ksef] : []),
    {
      key: 'operation',
      ...facetLabels.operation,
      options: [
        { value: 'invoice', label: operationLabels.invoice },
        { value: 'correction', label: operationLabels.correction },
      ],
    },
    {
      key: 'jpk',
      label: facetLabels.jpk.label,
      short: facetLabels.jpk.short,
      options: [
        { value: 'GTU_12', label: 'GTU_12' },
        { value: 'GTU_06', label: 'GTU_06' },
        { value: 'none', label: facetLabels.jpk.none },
      ],
    },
    {
      key: 'series',
      ...facetLabels.series,
      options: series
        .filter((item) => item.id === 'KOR' || item.id === (kind === 'sales' ? 'FV' : 'FZ'))
        .map((item) => ({ value: item.id, label: item.prefix, hint: item.name })),
    },
    {
      key: 'tag',
      ...facetLabels.tag,
      options: [
        { value: 'review', label: tagLabels.review },
        { value: 'verified', label: tagLabels.verified },
        { value: 'none', label: tagLabels[''] },
      ],
    },
  ];
}

export function activeFacetCount(criteria: Criteria): number {
  return [criteria.operation, criteria.jpk, criteria.series, criteria.tag].filter(Boolean).length;
}

/** Case- and diacritic-insensitive form used by search: "Łódź" → "lodz". */
export function normalize(value: string): string {
  return value
    .toLocaleLowerCase('pl')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ł/g, 'l')
    .trim();
}

const searchable = (doc: VatDocument) =>
  normalize([doc.contractor, doc.number, doc.identifier, doc.ksef ?? ''].join(' '));

export function filterDocuments(
  documents: VatDocument[],
  kind: RegisterKind,
  period: Period,
  criteria: Criteria = emptyCriteria,
): VatDocument[] {
  const query = normalize(criteria.search);
  const { from, to } = periodBounds(period);
  return documents.filter(
    (doc) =>
      doc.kind === kind &&
      doc.date >= from &&
      doc.date <= to &&
      (!criteria.operation || doc.operation === criteria.operation) &&
      (!criteria.jpk || (criteria.jpk === 'none' ? !doc.jpk : doc.jpk === criteria.jpk)) &&
      (!criteria.series || doc.series === criteria.series) &&
      (!criteria.tag || (criteria.tag === 'none' ? !doc.tag : doc.tag === criteria.tag)) &&
      (!criteria.ksef || (criteria.ksef === 'confirmed') === Boolean(doc.ksef)) &&
      (!query || searchable(doc).includes(query)),
  );
}

/** Documents a filter option would show, keeping every other active criterion. */
export function facetCount(
  documents: VatDocument[],
  kind: RegisterKind,
  period: Period,
  criteria: Criteria,
  key: FacetKey,
  value: string,
): number {
  return filterDocuments(documents, kind, period, { ...criteria, [key]: value }).length;
}

export type Sort = { key: ColumnKey; direction: 'asc' | 'desc' };
export const defaultSort: Sort = { key: 'date', direction: 'asc' };

export function columnValue(doc: VatDocument, key: ColumnKey): string | number {
  if (key === 'gross') return doc.net + doc.vat;
  return doc[key] ?? '';
}

export function sortDocuments(documents: VatDocument[], sort: Sort): VatDocument[] {
  const direction = sort.direction === 'asc' ? 1 : -1;
  return [...documents].sort((a, b) => {
    const left = columnValue(a, sort.key);
    const right = columnValue(b, sort.key);
    const order =
      typeof left === 'number' && typeof right === 'number'
        ? left - right
        : String(left).localeCompare(String(right), 'pl', { numeric: true });
    return order * direction;
  });
}

/**
 * The closest month of the same year that has documents in the register, preferring
 * earlier months; used to lead the user out of an empty period.
 */
export function nearestMonthWithDocuments(
  documents: VatDocument[],
  kind: RegisterKind,
  period: Period,
): Period | null {
  // Months counted from year 0, so the search crosses a year's end: an empty December
  // 2025 leads to January 2026.
  const index = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7)) - 1;
  const here = index(periodBounds(period).from);
  const months = new Set(
    documents.filter((doc) => doc.kind === kind).map((doc) => index(doc.date)),
  );
  for (let distance = 1; distance <= 24; distance++)
    for (const candidate of [here - distance, here + distance])
      if (months.has(candidate))
        return { mode: 'month', year: Math.floor(candidate / 12), month: (candidate % 12) + 1 };
  return null;
}

export interface FacetSuggestion {
  key: FacetKey;
  value: string;
  /** "Kod JPK V7" */
  facet: string;
  /** "GTU_12" */
  label: string;
  count: number;
}

/**
 * Filters the search text points at: up to three facet values whose name, or a word of
 * it, starts with the query (case and diacritics ignored), each with how many documents
 * it would show. "gtu" offers the JPK codes, "kor" the corrections.
 */
export function suggestFacets(
  query: string,
  documents: VatDocument[],
  facets: Facet[],
  kind: RegisterKind,
  period: Period,
  criteria: Criteria = emptyCriteria,
): FacetSuggestion[] {
  const needle = normalize(query);
  if (needle.length < 2) return [];
  const rest = { ...criteria, search: '' };
  const matches = (label: string) =>
    normalize(label)
      .split(/[\s_/]+/)
      .concat(normalize(label))
      .some((word) => word.startsWith(needle));
  return facets
    .flatMap((facet) =>
      facet.options
        .filter((option) => criteria[facet.key] !== option.value && matches(option.label))
        .map((option) => ({
          key: facet.key,
          value: option.value,
          facet: facet.label,
          label: option.label,
          count: facetCount(documents, kind, period, rest, facet.key, option.value),
        })),
    )
    .filter((suggestion) => suggestion.count > 0)
    .slice(0, 3);
}

/**
 * A contractor's documents in one register for a whole year: what the opened document
 * offers as «Dokumenty kontrahenta». The same search the list then runs, so the count
 * on the link and the list that follows always agree.
 */
export function contractorDocuments(
  documents: VatDocument[],
  kind: RegisterKind,
  year: number,
  contractor: string,
): VatDocument[] {
  return filterDocuments(
    documents,
    kind,
    { mode: 'year', year },
    {
      ...emptyCriteria,
      search: contractor,
    },
  );
}
