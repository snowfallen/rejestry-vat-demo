import { FileInput, FileMinus, FileOutput } from 'lucide-react';
import { cx } from '@/lib/cx';
import type { VatDocument } from '../../../model/types';
import g from './document-glyph.module.css';

/**
 * The document's sign at the start of a row: what it is (sale, purchase or correction)
 * and, in its corner, whether KSeF has confirmed it.
 */
export function DocumentGlyph({
  doc,
  size = 'md',
  className,
}: {
  doc: VatDocument;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const correction = doc.operation === 'correction';
  const Icon = correction ? FileMinus : doc.kind === 'sales' ? FileOutput : FileInput;
  return (
    <span
      aria-hidden="true"
      className={cx(
        g.glyph,
        size === 'sm' && g.small,
        className,
        correction ? g.glyphCorrection : doc.kind === 'sales' ? g.glyphSales : g.glyphPurchases,
      )}
    >
      <Icon size={size === 'sm' ? 16 : 19} strokeWidth={1.8} />
      {/* Only an unconfirmed document carries a mark: the exception, not the norm. */}
      {!doc.ksef && <span className={cx(g.badge, g.badgePending)} />}
    </span>
  );
}
