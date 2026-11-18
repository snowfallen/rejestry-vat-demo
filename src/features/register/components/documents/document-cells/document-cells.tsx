import { Check } from 'lucide-react';
import { cx } from '@/lib/cx';
import { formatAmount, formatDate, formatMoney, shortKsef } from '@/lib/format';
import { ksefCopy } from '../../../copy';
import { operationLabels, tagLabels } from '../../../model/labels';
import type { ColumnKey, VatDocument } from '../../../model/types';
import c from './document-cells.module.css';

/** Marks the part of `text` that matches the search, so the reason for a result shows. */
/** Whether the search text occurs in `text`, the way {@link Highlight} marks it. */
export function matches(text: string, query: string): boolean {
  const needle = query.trim().toLocaleLowerCase('pl');
  return Boolean(needle) && text.toLocaleLowerCase('pl').includes(needle);
}

export function Highlight({ text, query }: { text: string; query: string }) {
  const needle = query.trim().toLocaleLowerCase('pl');
  if (!needle) return <>{text}</>;
  const index = text.toLocaleLowerCase('pl').indexOf(needle);
  if (index < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, index)}
      <mark className={c.match}>{text.slice(index, index + needle.length)}</mark>
      {text.slice(index + needle.length)}
    </>
  );
}

export function Contractor({ doc, query }: { doc: VatDocument; query: string }) {
  return (
    <span className={c.contractor}>
      <Highlight text={doc.contractor} query={query} />
      {doc.operation === 'correction' && (
        <span className={c.correction}>{operationLabels.correction}</span>
      )}
      {doc.tag && (
        <span
          className={cx(c.tag, doc.tag === 'verified' && c.tagVerified)}
          title={tagLabels[doc.tag]}
        >
          <span className="sr-only">{tagLabels[doc.tag]}</span>
        </span>
      )}
    </span>
  );
}

// Status by exception: a confirmed document is the norm and stays quiet (its number and
// a small check); only the unconfirmed ones speak up, in amber.
export function KsefStatus({ doc }: { doc: VatDocument }) {
  return doc.ksef ? (
    <span className={c.ksef} title={doc.ksef}>
      <Check size={13} strokeWidth={2.6} className={c.confirmed} aria-hidden="true" />
      <span className="sr-only">{ksefCopy.confirmed}</span>
      <span className={c.ksefNumber}>{shortKsef(doc.ksef)}</span>
    </span>
  ) : (
    <span className={c.pending}>
      <span aria-hidden="true" />
      {ksefCopy.pending}
    </span>
  );
}

/** Gross amount with its net and VAT parts underneath. */
export function GrossAmount({ doc }: { doc: VatDocument }) {
  return (
    <span className={c.amount}>
      <span className={cx(c.gross, doc.net < 0 && c.negative)}>
        {formatMoney(doc.net + doc.vat)}
      </span>
      <span className={c.parts}>
        {formatAmount(doc.net)} + {formatAmount(doc.vat)} VAT
      </span>
    </span>
  );
}

/** Content of one table cell. */
export function DocumentCell({
  doc,
  column,
  query,
}: {
  doc: VatDocument;
  column: ColumnKey;
  query: string;
}) {
  switch (column) {
    case 'contractor':
      return (
        // No sign at the row's start: «Korekta» names the odd document out and the KSeF
        // column carries the status, so the eye goes straight to who and how much.
        <span className={c.lead}>
          <Contractor doc={doc} query={query} />
        </span>
      );
    case 'date':
      return (
        <time className={c.date} dateTime={doc.date}>
          {formatDate(doc.date)}
        </time>
      );
    case 'number':
      return (
        <span className={c.number}>
          <Highlight text={doc.number} query={query} />
        </span>
      );
    case 'ksef':
      return <KsefStatus doc={doc} />;
    case 'identifier':
      return (
        <span className={c.identifier}>
          <Highlight text={doc.identifier} query={query} />
        </span>
      );
    case 'gross':
      return <GrossAmount doc={doc} />;
  }
}
