// Domain vocabulary of the VAT register. Pure data: no React, no browser APIs, so the
// same model can serve the planned mobile app.

export type RegisterKind = 'sales' | 'purchases';
export type Operation = 'invoice' | 'correction';
export type Tag = 'review' | 'verified' | '';
export type VatRate = '23%' | '8%' | 'np';
export type DemoState = 'populated' | 'empty' | 'error';
export type ColumnKey = 'contractor' | 'date' | 'number' | 'ksef' | 'identifier' | 'gross';

/** Amounts are integer grosze, so sums never drift. */
export interface VatDocument {
  id: string;
  kind: RegisterKind;
  contractor: string;
  /** ISO date, `YYYY-MM-DD`. */
  date: string;
  number: string;
  ksef: string | null;
  identifier: string;
  operation: Operation;
  jpk: string;
  series: string;
  net: number;
  vat: number;
  rate: VatRate;
  tag: Tag;
  note: string;
}

export interface DocumentSeries {
  id: string;
  name: string;
  prefix: string;
  next: string;
}

/** What a session may change on a served document: its label, note and KSeF number. */
export type DocumentPatch = Partial<Pick<VatDocument, 'tag' | 'note' | 'ksef'>>;
