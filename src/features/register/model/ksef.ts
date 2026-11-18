import { demoNip, ksefNumber } from './fixtures';
import type { VatDocument } from './types';

/**
 * The number «KSeF» gives a waiting sale in the demo. The prototype does not talk to
 * KSeF: the number is made here, the same one for the same document every time, in the
 * format of the fixtures (our NIP, the issue date, 12 hex, 2 hex).
 */
export function demoKsefNumber(doc: Pick<VatDocument, 'id' | 'date'>): string {
  const seed = [...doc.id].reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 7);
  return ksefNumber(doc.date, seed % 100_000, demoNip);
}
