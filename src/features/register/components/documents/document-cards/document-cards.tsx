'use client';
import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import { formatDate, formatMoney } from '@/lib/format';
import type { Totals } from '../../../model/amounts';
import type { VatDocument } from '../../../model/types';
import { documentCopy, ksefCopy } from '../../../copy';
import { Contractor, DocumentGlyph, Highlight, matches } from '../document-cells';
import { MonthHeading } from '../document-cells/month-heading';
import c from './document-cards.module.css';

interface DocumentCardsProps {
  documents: VatDocument[];
  /** The document whose sheet is open, if any. */
  active: string | null;
  /** Index from which the cards were just added by «show more»; they arrive in turn. */
  appendedFrom: number;
  query: string;
  monthTotals: Map<string, Totals & { count: number }> | null;
  collapsedMonths: string[];
  onToggleMonth: (month: string) => void;
  onOpen: (id: string) => void;
}

// Phone register, built like a native list: one compact row per document with every
// column that matters at a glance: contractor and gross, number and date, KSeF status
// (and the identifier when the search found it there). A tap opens the whole document in a bottom sheet.
export function DocumentCards({
  documents,
  active,
  appendedFrom,
  query,
  monthTotals,
  collapsedMonths,
  onToggleMonth,
  onOpen,
}: DocumentCardsProps) {
  const places = gridPlaces(documents, monthTotals !== null);
  return (
    <div className={c.list}>
      {documents.map((doc, index) => {
        const month = doc.date.slice(0, 7);
        const previousMonth = documents[index - 1]?.date.slice(0, 7);
        const heading = monthTotals && month !== previousMonth ? monthTotals.get(month) : null;
        const monthFolded = monthTotals !== null && collapsedMonths.includes(month);
        return (
          <Fragment key={doc.id}>
            {heading && (
              <h3 className={c.month} style={{ viewTransitionName: `month-card-${month}` }}>
                <MonthHeading
                  month={month}
                  totals={heading}
                  open={!monthFolded}
                  onToggle={() => onToggleMonth(month)}
                />
              </h3>
            )}
            {!monthFolded && (
              <article
                data-doc={doc.id}
                data-intro-row={index < 8 ? '' : undefined}
                data-pending={doc.ksef ? undefined : ''}
                data-end={places[index].end ? '' : undefined}
                data-lone={places[index].lone ? '' : undefined}
                data-final={places[index].final ? '' : undefined}
                className={cx(
                  c.card,
                  active === doc.id && c.active,
                  index >= appendedFrom && c.appended,
                )}
                style={cssVars({ '--i': Math.max(0, index - appendedFrom), '--row': index })}
              >
                <button
                  type="button"
                  className={c.open}
                  aria-haspopup="dialog"
                  aria-label={documentCopy.open(doc.number)}
                  onClick={() => onOpen(doc.id)}
                />
                <DocumentGlyph doc={doc} className={c.glyph} />
                <div className={c.line}>
                  <Contractor doc={doc} query={query} />
                  <strong className={cx(c.gross, doc.net < 0 && c.negative)}>
                    {formatMoney(doc.net + doc.vat)}
                  </strong>
                </div>
                <div className={c.line}>
                  <span className={c.sub}>
                    <Highlight text={doc.number} query={query} />
                    {/* The identifier lives in the sheet; the row shows it only when the
                        search found the document by it. */}
                    {matches(doc.identifier, query) && (
                      <>
                        {' · '}
                        <Highlight text={doc.identifier} query={query} />
                      </>
                    )}
                  </span>
                  <span className={cx(c.sub, c.date)}>{formatDate(doc.date)}</span>
                </div>
                {/* Confirmed is the normal case and shows on the document's sign; only a
                  missing confirmation earns its own line. */}
                {doc.ksef ? (
                  <span className="sr-only">
                    {ksefCopy.seal}: {ksefCopy.confirmed}
                  </span>
                ) : (
                  <div className={c.line}>
                    <span className={cx(c.status, c.pending)}>{ksefCopy.pending}</span>
                  </div>
                )}
                <ChevronRight size={16} className={c.chevron} aria-hidden="true" />
              </article>
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/**
 * Where each card sits when wider phones show two columns, counted within its month:
 * the right column, alone in the month's last row, or in the list's last row.
 */
function gridPlaces(documents: VatDocument[], grouped: boolean) {
  const places: { end: boolean; lone: boolean; final: boolean }[] = [];
  let start = 0;
  documents.forEach((doc, index) => {
    const next = documents[index + 1];
    if (next && (!grouped || next.date.slice(0, 7) === doc.date.slice(0, 7))) return;
    const count = index - start + 1;
    const lastRow = count - (count % 2 || 2);
    for (let at = 0; at < count; at++)
      places.push({
        end: at % 2 === 1,
        lone: count % 2 === 1 && at === count - 1,
        final: !next && at >= lastRow,
      });
    start = index + 1;
  });
  return places;
}
