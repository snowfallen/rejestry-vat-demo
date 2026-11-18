import { defaultColumns } from '../model/labels';
import { anchorMonth, defaultPeriod, type Period } from '../model/period';
import { defaultSort, emptyCriteria, type Criteria, type Sort } from '../model/query';
import type { RegisterSnapshot } from '../api/types';
import type {
  ColumnKey,
  DemoState,
  DocumentPatch,
  DocumentSeries,
  RegisterKind,
  VatDocument,
} from '../model/types';
import type { RegisterUrlState } from '../model/url';
import type { Action } from './actions';

/** At their default widths the shown columns fit a 761 px window: no sideways scroll. */
export const defaultWidths: Record<ColumnKey, number> = {
  contractor: 136,
  date: 108,
  number: 178,
  ksef: 166,
  identifier: 118,
  gross: 136,
};
export const columnWidthLimits = { min: 96, max: 400 };

export interface RegisterState {
  /** The register as the API served it. */
  documents: VatDocument[];
  /** Labels and notes set in this session, laid over the served documents; a reload keeps them. */
  edits: Record<string, DocumentPatch>;
  series: DocumentSeries[];
  kind: RegisterKind;
  period: Period;
  /** Month the user last looked at; keeps context when the period mode changes. */
  anchor: number;
  criteria: Criteria;
  sort: Sort;
  page: number;
  pageSize: number;
  expanded: string[];
  /** Month groups (`YYYY-MM`) folded to their heading in a longer period. */
  collapsedMonths: string[];
  columns: ColumnKey[];
  widths: Record<ColumnKey, number>;
  /** The data state on screen: an asked-for state, or `error` after a failed read. */
  demo: DemoState;
  /** The data state that was asked for; the address shows this, not a chance failure. */
  requested: DemoState;
  loading: boolean;
}

/**
 * The opening state: the register the server read, and whatever the address chose
 * (period, register, KSeF view, search, demo data state).
 */
export const initialState = ({
  snapshot,
  url: initial = {},
}: {
  snapshot: RegisterSnapshot;
  url?: RegisterUrlState;
}): RegisterState => ({
  documents: snapshot.documents,
  edits: {},
  series: snapshot.series,
  kind: initial.kind ?? 'sales',
  period: initial.period ?? defaultPeriod,
  anchor: initial.period ? anchorMonth(initial.period, 10) : 10,
  criteria: {
    ...emptyCriteria,
    ksef: initial.ksef ?? '',
    search: initial.search ?? '',
  },
  sort: defaultSort,
  page: 1,
  pageSize: 10,
  expanded: [],
  collapsedMonths: [],
  columns: defaultColumns,
  widths: defaultWidths,
  demo: initial.demo ?? 'populated',
  requested: initial.demo ?? 'populated',
  loading: false,
});

// Anything that changes which documents are listed starts again from page one,
// with every document and month group open as listed.
const freshList: Pick<RegisterState, 'page' | 'expanded' | 'collapsedMonths'> = {
  page: 1,
  expanded: [],
  collapsedMonths: [],
};

const toggled = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

export function reducer(state: RegisterState, action: Action): RegisterState {
  switch (action.type) {
    case 'kind':
      return {
        ...state,
        ...freshList,
        kind: action.kind,
        criteria: { ...state.criteria, series: '' },
      };
    case 'period':
      return {
        ...state,
        ...freshList,
        period: action.period,
        anchor: anchorMonth(action.period, state.anchor),
      };
    case 'criterion':
      return {
        ...state,
        ...freshList,
        criteria: { ...state.criteria, [action.key]: action.value },
      };
    case 'clearFacets':
      return {
        ...state,
        ...freshList,
        criteria: { ...emptyCriteria, search: state.criteria.search, ksef: state.criteria.ksef },
      };
    case 'clearCriteria':
      return { ...state, ...freshList, criteria: emptyCriteria };
    case 'sort':
      return {
        ...state,
        sort: {
          key: action.key,
          direction:
            state.sort.key === action.key && state.sort.direction === 'asc' ? 'desc' : 'asc',
        },
      };
    case 'page':
      return { ...state, page: action.page, expanded: [] };
    case 'pageSize':
      return { ...state, ...freshList, pageSize: action.size };
    case 'toggleRow':
      return {
        ...state,
        expanded: toggled(state.expanded, action.id),
      };
    case 'toggleMonth':
      return {
        ...state,
        collapsedMonths: toggled(state.collapsedMonths, action.month),
        // A folded month keeps none of its documents open.
        expanded: state.expanded.filter(
          (id) => state.documents.find((doc) => doc.id === id)?.date.slice(0, 7) !== action.month,
        ),
      };
    case 'collapseAll':
      return { ...state, expanded: [] };
    case 'restoreExpanded':
      return { ...state, expanded: action.ids };
    case 'updateDocument':
      return {
        ...state,
        edits: { ...state.edits, [action.id]: { ...state.edits[action.id], ...action.patch } },
      };
    case 'series':
      return { ...state, series: action.series };
    case 'toggleColumn':
      if (state.columns.includes(action.key))
        return state.columns.length === 1
          ? state
          : { ...state, columns: state.columns.filter((key) => key !== action.key) };
      return { ...state, columns: [...state.columns, action.key] };
    case 'moveColumn': {
      const columns = state.columns.filter((key) => key !== action.key);
      columns.splice(Math.max(0, Math.min(action.to, columns.length)), 0, action.key);
      return { ...state, columns };
    }
    case 'resetColumns':
      return { ...state, columns: defaultColumns, widths: defaultWidths };
    case 'resizeColumn': {
      const width = Math.round(
        Math.max(columnWidthLimits.min, Math.min(columnWidthLimits.max, action.width)),
      );
      return { ...state, widths: { ...state.widths, [action.key]: width } };
    }
    case 'loading':
      return { ...state, loading: true, requested: action.requested };
    case 'loaded':
      return {
        ...state,
        ...freshList,
        loading: false,
        demo: action.demo,
        documents: action.documents,
      };
    case 'failed':
      return { ...state, ...freshList, loading: false, demo: 'error', documents: [] };
    case 'showExample':
      return {
        ...state,
        ...freshList,
        period: defaultPeriod,
        anchor: 10,
        criteria: emptyCriteria,
      };
    case 'contractor': {
      // The contractor's history: the whole year, searched by their name.
      const period: Period = { mode: 'year', year: action.year };
      return {
        ...state,
        ...freshList,
        period,
        anchor: anchorMonth(period, state.anchor),
        criteria: { ...emptyCriteria, search: action.contractor },
      };
    }
    default:
      return action satisfies never;
  }
}
