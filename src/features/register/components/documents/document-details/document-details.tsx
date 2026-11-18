'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Copy, LoaderCircle } from 'lucide-react';
import type { Notify } from '@/components/ui/toast';
import { copyIdentifier, copyText } from '@/lib/clipboard';
import { cssVars } from '@/lib/css-vars';
import { cx } from '@/lib/cx';
import { withViewTransition } from '@/lib/view-transition';
import { prefersReducedMotion } from '@/hooks/use-media-query';
import { formatDate, formatMoney, shortKsef } from '@/lib/format';
import { organization } from '@/features/workspace';
import { documentShareOfMonth } from '../../../model/amounts';
import { demoKsefNumber } from '../../../model/ksef';
import { contractorDocuments } from '../../../model/query';
import { monthNames } from '../../../model/period';
import { documentCopy, ksefCopy } from '../../../copy';
import { columnLabels, fieldLabels, operationLabels, tagLabels } from '../../../model/labels';
import type { DocumentPatch, Tag, VatDocument } from '../../../model/types';
import d from './document-details.module.css';
import a from './document-amounts.module.css';
import k from './ksef-steps.module.css';
import n from './document-notes.module.css';
import { KsefSeal } from './ksef-seal';
import { Step } from './ksef-step';

const tagOrder: Tag[] = ['review', 'verified', ''];
/** How long «Zapisano» stays beside the note after it is saved. */
const savedFor = 1600;
/** The simulated KSeF check: the wait, then time for the seal to draw before the list moves. */
const checkFor = 800;
const settleFor = 1400;

interface DocumentDetailsProps {
  doc: VatDocument;
  /** The register's documents, to weigh this one against its month. */
  documents: VatDocument[];
  /** `table`: under a row, which already shows the basics; `sheet`: on its own (phones). */
  layout: 'table' | 'sheet';
  open: boolean;
  onUpdate: (id: string, patch: DocumentPatch) => void;
  onNotify: Notify;
  /** Opens the contractor's documents of the year in the list. */
  onShowContractor?: (contractor: string, year: number) => void;
}

// An opened document reads like the document itself: a sheet with both parties, the
// amounts adding up line by line and a KSeF seal that settles once the sheet is open.
// Beside it, the document's way through KSeF and the user's own label and note.
export function DocumentDetails({
  doc,
  documents,
  layout,
  open,
  onUpdate,
  onNotify,
  onShowContractor,
}: DocumentDetailsProps) {
  const gross = doc.net + doc.vat;
  const inTable = layout === 'table';
  const correction = doc.operation === 'correction';
  const steps = doc.kind === 'sales' ? ksefCopy.steps : ksefCopy.purchaseSteps;
  // A number from the simulated check shows at once; the register takes it once the seal
  // has drawn, so a «Brak potwierdzenia» list does not whisk the document away mid-way.
  const [assigned, setAssigned] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const ksef = doc.ksef ?? assigned;
  const confirmed = Boolean(ksef);
  const checkTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const pending = useRef<string | null>(null);
  const ksefButton = useRef<HTMLButtonElement>(null);
  const update = useRef(onUpdate);
  useEffect(() => {
    update.current = onUpdate;
  });
  useEffect(
    () => () => {
      checkTimers.current.forEach(clearTimeout);
      // Closed mid-way: the number is kept all the same.
      if (pending.current) update.current(doc.id, { ksef: pending.current });
    },
    [doc.id],
  );
  function checkKsef() {
    const instant = prefersReducedMotion();
    const number = demoKsefNumber(doc);
    setChecking(true);
    const later = (ms: number, run: () => void) =>
      checkTimers.current.push(setTimeout(run, instant ? 0 : ms));
    later(checkFor, () => {
      setChecking(false);
      setAssigned(number);
      pending.current = number;
      onNotify(documentCopy.ksefAssigned(shortKsef(number)));
      later(settleFor, () => {
        pending.current = null;
        withViewTransition(() => onUpdate(doc.id, { ksef: number }));
      });
    });
  }
  // Focus stays on the step: from the check button to the number that replaced it.
  useEffect(() => {
    if (assigned && document.activeElement === document.body) ksefButton.current?.focus();
  }, [assigned]);
  const monthShare = documentShareOfMonth(doc, documents);
  const monthName = monthNames[Number(doc.date.slice(5, 7)) - 1].toLocaleLowerCase('pl');
  const shareText = documentCopy.share(
    monthShare.toLocaleString('pl-PL'),
    doc.kind === 'sales',
    monthName,
  );
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => void (savedTimer.current && clearTimeout(savedTimer.current)), []);
  // "Sp. z o.o." must not break across lines.
  const company = organization.replace(/ (?=z o\.o\.$)| (?=o\.o\.$)/g, '\u00a0');
  const [seller, buyer] =
    doc.kind === 'sales' ? [company, doc.contractor] : [doc.contractor, company];
  const year = Number(doc.date.slice(0, 4));
  const history = contractorDocuments(documents, doc.kind, year, doc.contractor).length;
  const contractorLink = onShowContractor && history > 1 && (
    <button
      type="button"
      className={d.history}
      onClick={() => onShowContractor(doc.contractor, year)}
      aria-label={documentCopy.contractorHistoryLabel(doc.contractor, year, history)}
    >
      {documentCopy.contractorHistory(history, doc.contractor, year, doc.kind === 'sales')}
      <ArrowRight size={13} aria-hidden="true" />
    </button>
  );

  return (
    <div
      className={cx(d.details, inTable ? d.inTable : d.onSheet, open && d.open)}
      data-open={open ? '' : undefined}
    >
      <h3 className="sr-only">{documentCopy.detailsTitle}</h3>

      <figure className={d.paper} aria-label={documentCopy.paper(doc.number)}>
        <header className={d.head}>
          <p className={d.kind}>{documentCopy.series(doc.series)}</p>
          <KsefSeal confirmed={confirmed} fresh={Boolean(assigned)} />
        </header>

        <dl className={d.parties}>
          <div>
            <dt>{fieldLabels.seller}</dt>
            <dd>{seller}</dd>
          </div>
          <div>
            <dt>{fieldLabels.buyer}</dt>
            <dd>{buyer}</dd>
          </div>
        </dl>
        {/* The contractor's other documents: a line of its own under both parties. */}
        {contractorLink && <p className={d.historyRow}>{contractorLink}</p>}

        <dl className={d.facts}>
          <div>
            <dt>{fieldLabels.operation}</dt>
            <dd>{operationLabels[doc.operation]}</dd>
          </div>
          <div>
            <dt>{fieldLabels.jpk}</dt>
            <dd>{doc.jpk || documentCopy.noJpk}</dd>
          </div>
          <div>
            <dt>{fieldLabels.issued}</dt>
            <dd>{formatDate(doc.date)}</dd>
          </div>
          <div>
            <dt>{columnLabels.identifier}</dt>
            <dd>
              <button
                className={d.copy}
                onClick={async () => onNotify(await copyIdentifier(doc.identifier))}
                title={documentCopy.copyIdentifier}
              >
                {doc.identifier}
                <Copy size={13} />
                <span className="sr-only">{documentCopy.copyIdentifier}</span>
              </button>
            </dd>
          </div>
        </dl>

        <section className={a.amounts} aria-label={documentCopy.amounts}>
          <dl>
            <div className={a.line} style={cssVars({ '--i': 0 })}>
              <dt>{fieldLabels.net}</dt>
              <dd>{formatMoney(doc.net)}</dd>
            </div>
            <div className={a.line} style={cssVars({ '--i': 1 })}>
              <dt>
                <span aria-hidden="true">+ </span>
                {fieldLabels.vat} <span className={a.rate}>{doc.rate}</span>
              </dt>
              <dd>{formatMoney(doc.vat)}</dd>
            </div>
            <div className={cx(a.line, a.total)} style={cssVars({ '--i': 2 })}>
              <dt>
                <span aria-hidden="true">= </span>
                {fieldLabels.gross}
              </dt>
              <dd>{formatMoney(gross)}</dd>
            </div>
          </dl>
          {correction ? (
            <p className={a.shareNote}>
              {documentCopy.correctionNote({
                nonTaxed: doc.rate === 'np',
                sales: doc.kind === 'sales',
                lower: doc.net < 0,
              })}
            </p>
          ) : (
            monthShare > 0 && (
              <>
                {/* How much of the month's VAT this one document carries. */}
                <div className={a.share} role="img" aria-label={shareText}>
                  <span className={a.shareVat} style={cssVars({ '--w': `${monthShare}%` })} />
                  <span className={a.shareNet} style={cssVars({ '--w': `${100 - monthShare}%` })} />
                </div>
                <p className={a.shareNote}>{shareText}</p>
              </>
            )
          )}
        </section>
      </figure>

      <div className={k.side}>
        <ol className={k.steps} aria-label={documentCopy.ksefWay}>
          <Step done index={0} label={steps.issued} detail={formatDate(doc.date)} />
          <Step done index={1} label={steps.sent} detail={formatDate(doc.date)} />
          <Step
            done={confirmed}
            index={2}
            label={steps.confirmed}
            detail={
              <span aria-live="polite">
                {ksef ? (
                  <button
                    ref={ksefButton}
                    className={cx(d.copy, assigned && d.fresh)}
                    onClick={async () =>
                      onNotify(await copyText(ksef, documentCopy.ksefNumberName))
                    }
                    title={`${documentCopy.copyKsef} ${ksef}`}
                  >
                    {shortKsef(ksef)}
                    <Copy size={12} />
                    <span className="sr-only">{documentCopy.copyKsef}</span>
                  </button>
                ) : doc.kind === 'sales' ? (
                  // Only our own sale can wait for KSeF; a purchase arrives with its number.
                  <button
                    type="button"
                    className={d.check}
                    title={documentCopy.checkKsefDemo}
                    aria-busy={checking}
                    disabled={checking}
                    onClick={checkKsef}
                  >
                    {checking && <LoaderCircle size={13} className="animate-spin" aria-hidden />}
                    {checking ? documentCopy.checkingKsef : documentCopy.checkKsef}
                  </button>
                ) : (
                  ksefCopy.pending
                )}
              </span>
            }
            mono={confirmed}
          />
        </ol>

        <section className={n.notes} aria-label={documentCopy.notes}>
          <div className={n.field}>
            <span id={`tag-${doc.id}-${layout}`}>{fieldLabels.tag}</span>
            <div role="radiogroup" aria-labelledby={`tag-${doc.id}-${layout}`} className={n.tags}>
              {tagOrder.map((tag) => (
                <button
                  key={tag || 'none'}
                  type="button"
                  role="radio"
                  aria-checked={doc.tag === tag}
                  className={cx(n.tagChip, doc.tag === tag && n.tagOn)}
                  onClick={() => {
                    const previous = doc.tag;
                    if (previous === tag) return;
                    onUpdate(doc.id, { tag });
                    onNotify(documentCopy.tag(tagLabels[tag]), () => {
                      onUpdate(doc.id, { tag: previous });
                      onNotify(documentCopy.tagRestored(tagLabels[previous]));
                    });
                  }}
                >
                  {tag && (
                    <span
                      aria-hidden="true"
                      className={cx(n.tagDot, tag === 'review' ? n.tagReview : n.tagVerified)}
                    />
                  )}
                  {tagLabels[tag]}
                </button>
              ))}
            </div>
          </div>
          <label>
            <span>
              {documentCopy.note} <span className={n.optional}>{documentCopy.noteOptional}</span>
              <span className={cx(n.saved, saved && n.savedOn)} aria-live="polite">
                {saved ? documentCopy.noteSaved : ''}
              </span>
            </span>
            <textarea
              placeholder={documentCopy.notePlaceholder}
              maxLength={300}
              rows={2}
              value={doc.note}
              onChange={(event) => onUpdate(doc.id, { note: event.target.value })}
              onBlur={() => {
                if (!doc.note) return;
                setSaved(true);
                if (savedTimer.current) clearTimeout(savedTimer.current);
                savedTimer.current = setTimeout(() => setSaved(false), savedFor);
              }}
            />
          </label>
        </section>
      </div>
    </div>
  );
}
