import {
  monthlySummary,
  rateTotals,
  settlement,
  settlementChange,
  totals,
  totalsByMonth,
} from '../model/amounts';
import { periodYear, spansMonths } from '../model/period';
import {
  activeFacetCount,
  facetCount,
  filterDocuments,
  ksefViews,
  nearestMonthWithDocuments,
  sortDocuments,
} from '../model/query';
import type { RegisterKind, VatDocument } from '../model/types';
import type { RegisterState } from './reducer';

/** The served documents with this session's labels and notes laid over them. */
export function availableDocuments({
  documents,
  edits,
}: Pick<RegisterState, 'documents' | 'edits'>): VatDocument[] {
  return documents.map((doc) => (edits[doc.id] ? { ...doc, ...edits[doc.id] } : doc));
}

/**
 * Sales of one month still without a KSeF number. Since February 2026 every invoice in
 * JPK_V7 needs one (or an OFF, BFK or DI marking), so this is what holds a return back.
 */
export function unconfirmedInMonth(available: VatDocument[], year: number, month: number) {
  return filterDocuments(available, 'sales', { mode: 'month', year, month }).filter(
    (doc) => !doc.ksef,
  ).length;
}

/**
 * The listed register: filtered and sorted, cut into pages. A folded month takes one
 * place in the list (its first document carries the heading), so the next months move
 * up into the page, while page ranges still count every document under it.
 */
type ListInput = Pick<
  RegisterState,
  'kind' | 'period' | 'criteria' | 'sort' | 'page' | 'pageSize' | 'collapsedMonths'
>;

export function selectList(input: ListInput, available: VatDocument[]) {
  const { kind, period, criteria, sort, page, pageSize, collapsedMonths } = input;
  const filtered = filterDocuments(available, kind, period, criteria);
  const sorted = sortDocuments(filtered, sort);
  const monthOf = (doc: VatDocument) => doc.date.slice(0, 7);
  const monthTotals = spansMonths(period) && sort.key === 'date' ? totalsByMonth(filtered) : null;
  const listed = monthTotals
    ? sorted.filter(
        (doc, index) =>
          !collapsedMonths.includes(monthOf(doc)) ||
          sorted[index - 1]?.date.slice(0, 7) !== monthOf(doc),
      )
    : sorted;
  const pageCount = Math.max(1, Math.ceil(listed.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = currentPage * pageSize;
  const covered = (end: number) =>
    listed
      .slice(0, end)
      .reduce(
        (sum, doc) =>
          sum +
          (collapsedMonths.includes(monthOf(doc))
            ? (monthTotals?.get(monthOf(doc))?.count ?? 1)
            : 1),
        0,
      );
  const nearest = filtered.length ? null : nearestMonthWithDocuments(available, kind, period);
  return {
    filtered,
    sorted,
    monthTotals,
    pageCount,
    currentPage,
    visible: listed.slice(pageStart, pageEnd),
    /** Phones grow one list instead of paging: every page up to the current one. */
    shown: listed.slice(0, pageEnd),
    /** The current page as document numbers, «11–20 z 36». */
    range: { first: covered(pageStart) + 1, last: covered(pageEnd) },
    /** Phones: documents listed so far, and how many one more press adds. */
    shownCount: covered(pageEnd),
    moreCount: Math.min(pageSize, Math.max(0, listed.length - pageEnd)),
    sum: totals(filtered),
    rates: rateTotals(filtered),
    nearest,
    nearestCount: nearest ? filterDocuments(available, kind, nearest).length : 0,
  };
}

/** Both registers' VAT for the period, the settlement and the year around it. */
export function selectFigures(
  { kind, period }: Pick<RegisterState, 'kind' | 'period'>,
  available: VatDocument[],
  filtered: VatDocument[],
) {
  const inPeriod = {
    sales: filterDocuments(available, 'sales', period),
    purchases: filterDocuments(available, 'purchases', period),
  };
  const figure = (register: RegisterKind) => {
    const shown = register === kind ? filtered : inPeriod[register];
    return {
      vat: totals(shown).vat,
      count: shown.length,
      periodCount: inPeriod[register].length,
      periodVat: totals(inPeriod[register]).vat,
    };
  };
  const figures = { sales: figure('sales'), purchases: figure('purchases') };
  const yearSummary = {
    sales: monthlySummary(available, 'sales', periodYear(period)),
    purchases: monthlySummary(available, 'purchases', periodYear(period)),
  };
  return {
    figures,
    settlement: settlement(figures.sales.periodVat, figures.purchases.periodVat),
    settlementChange:
      period.mode === 'month'
        ? settlementChange(yearSummary.sales, yearSummary.purchases, period.month)
        : null,
    yearSummary,
    unconfirmedByKind: {
      sales: inPeriod.sales.filter((doc) => !doc.ksef).length,
      purchases: inPeriod.purchases.filter((doc) => !doc.ksef).length,
    },
  };
}

/** How the search and filters stand: active facets and the KSeF view counts. */
export function selectCriteria(
  { kind, period, criteria }: Pick<RegisterState, 'kind' | 'period' | 'criteria'>,
  available: VatDocument[],
) {
  const facets = activeFacetCount(criteria);
  return {
    facetCount: facets,
    searching: Boolean(criteria.search || criteria.ksef || facets),
    ksefCounts: Object.fromEntries(
      ksefViews.map(({ value }) => [
        value,
        facetCount(available, kind, period, criteria, 'ksef', value),
      ]),
    ),
  };
}
