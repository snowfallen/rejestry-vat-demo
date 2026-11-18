'use client';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import type { Notify } from '@/components/ui/toast';
import { useSwipeStep } from '@/hooks/use-swipe-step';
import { formatDate } from '@/lib/format';
import { cx } from '@/lib/cx';
import type { DocumentPatch, VatDocument } from '../../../model/types';
import { DocumentDetails } from '../document-details';
import { documentCopy } from '../../../copy';

/**
 * A phone opens a document in a bottom sheet, the way a native app would: it grows out
 * of the tapped row (its title lands where the row was) and folds back into it on close;
 * its contents arrive in order, a drag down puts it away, and the footer steps through
 * the register without closing.
 */
export function DocumentSheet({
  doc,
  documents,
  onClose,
  onUpdate,
  onNotify,
  onShowContractor,
  origin,
  position,
  onStep,
}: {
  doc: VatDocument;
  /** The register's documents, to weigh this one against its month. */
  documents: VatDocument[];
  /** Where the document stands in the listed register. */
  position: { index: number; total: number };
  onStep: (delta: -1 | 1) => void;
  /** The list row the sheet grows out of. */
  origin: () => DOMRect | null | undefined;
  onClose: () => void;
  onUpdate: (id: string, patch: DocumentPatch) => void;
  onNotify: Notify;
  onShowContractor: (contractor: string, year: number) => void;
}) {
  // Start closed for one frame so the contents animate in after the sheet rises.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // A sideways swipe on the paper turns to the previous or next document: the paper
  // follows the finger, past 60px (or a flick) it leaves and the next one slides in
  // from the other side. The first and last documents resist and spring back.
  const paper = useRef<HTMLDivElement>(null);
  const entering = useRef<-1 | 1 | null>(null);
  const atStart = position.index === 0;
  const atEnd = position.index >= position.total - 1;
  const swipe = useSwipeStep<HTMLDivElement>({
    canStep: (delta) => (delta === 1 ? !atEnd : !atStart),
    onStep: (delta) => {
      entering.current = delta;
      onStep(delta);
    },
    follow: 1,
    resist: 0.3,
    threshold: 60,
    mouse: true,
    leave: true,
  });

  useEffect(() => {
    const direction = entering.current;
    entering.current = null;
    // The last paper left with its animation held; the new one starts clean.
    paper.current?.getAnimations().forEach((animation) => animation.cancel());
    if (!direction || !paper.current) return;
    paper.current.animate(
      [{ transform: `translateX(${direction * 100}%)` }, { transform: 'translateX(0)' }],
      { duration: 260, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
    );
  }, [doc.id]);

  return (
    <Dialog
      variant="sheet"
      title={doc.contractor}
      description={
        <span className="block text-center">{`${doc.number} · ${formatDate(doc.date)}`}</span>
      }
      onClose={onClose}
      origin={origin}
    >
      <div className="-mx-5 overflow-x-clip px-5">
        <div ref={paper} className="touch-pan-y" data-testid="document-paper" {...swipe}>
          <DocumentDetails
            key={doc.id}
            doc={doc}
            documents={documents}
            layout="sheet"
            open={open}
            onUpdate={onUpdate}
            onNotify={onNotify}
            onShowContractor={onShowContractor}
          />
        </div>
      </div>
      <nav
        aria-label={documentCopy.steps}
        className={cx(
          'sticky bottom-[calc(-20px-env(safe-area-inset-bottom))] -mx-5 mt-5 flex items-center',
          'justify-between gap-2 border-0 border-t border-solid border-line bg-surface px-5',
          'pb-[calc(12px+env(safe-area-inset-bottom))] pt-3',
        )}
      >
        <Button size="sm" disabled={position.index === 0} onClick={() => onStep(-1)}>
          <ChevronLeft size={16} />
          {documentCopy.previous}
        </Button>
        <span className="text-[13px] tabular-nums text-muted">
          {position.index + 1} z {position.total}
        </span>
        <Button size="sm" disabled={position.index >= position.total - 1} onClick={() => onStep(1)}>
          {documentCopy.next}
          <ChevronRight size={16} />
        </Button>
      </nav>
    </Dialog>
  );
}
