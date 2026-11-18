import type { DocumentSeries, VatDocument } from '../model/types';

/** What the register API serves: the organisation's documents and its numbering series. */
export interface RegisterSnapshot {
  documents: VatDocument[];
  series: DocumentSeries[];
}

/** The register could not be read: an HTTP status from the API, or 0 for a network failure. */
export class RegisterLoadError extends Error {
  constructor(readonly status: number) {
    super(`Register request failed (${status})`);
    this.name = 'RegisterLoadError';
  }
}
