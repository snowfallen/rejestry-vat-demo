import type { Period } from '../model/period';
import type { Criteria } from '../model/query';
import type {
  ColumnKey,
  DemoState,
  DocumentPatch,
  DocumentSeries,
  RegisterKind,
  VatDocument,
} from '../model/types';

/** Everything the register screen can ask its state to do. */
export type Action =
  | { type: 'kind'; kind: RegisterKind }
  | { type: 'period'; period: Period }
  | { type: 'criterion'; key: keyof Criteria; value: string }
  | { type: 'clearFacets' }
  | { type: 'clearCriteria' }
  | { type: 'sort'; key: ColumnKey }
  | { type: 'page'; page: number }
  | { type: 'pageSize'; size: number }
  | { type: 'toggleRow'; id: string }
  | { type: 'collapseAll' }
  | { type: 'toggleMonth'; month: string }
  | { type: 'restoreExpanded'; ids: string[] }
  | { type: 'updateDocument'; id: string; patch: DocumentPatch }
  | { type: 'series'; series: DocumentSeries[] }
  | { type: 'toggleColumn'; key: ColumnKey }
  | { type: 'moveColumn'; key: ColumnKey; to: number }
  | { type: 'resetColumns' }
  | { type: 'resizeColumn'; key: ColumnKey; width: number }
  | { type: 'loading'; requested: DemoState }
  | { type: 'loaded'; demo: DemoState; documents: VatDocument[] }
  | { type: 'failed' }
  | { type: 'showExample' }
  | { type: 'contractor'; contractor: string; year: number };
