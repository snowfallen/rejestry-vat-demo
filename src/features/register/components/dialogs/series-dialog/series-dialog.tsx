'use client';
import { useState, type RefObject } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { cx } from '@/lib/cx';
import type { DocumentSeries } from '../../../model/types';
import { dialogsCopy } from '../../../copy';

/** One series per line: code, name, prefix, next number; on phones the code heads a card and the name takes a line of its own. */
const row =
  'grid items-center gap-x-3 gap-y-2.5 grid-cols-[52px_minmax(0,1fr)_104px_116px] phone:grid-cols-2';
const field = 'flex min-w-0 flex-col gap-1.5 text-[12px] font-[550] text-muted';
/** Field names show on phones only; on wider screens the column heads carry them. */
const hint = 'sr-only phone:not-sr-only';
const input = 'w-full text-[13px] phone:text-[16px]';

/** Names and numbering of document series; edits stay in this demo session. */
export function SeriesDialog({
  series,
  onSave,
  onClose,
  returnFocusRef,
}: {
  series: DocumentSeries[];
  onSave: (series: DocumentSeries[]) => void;
  onClose: () => void;
  returnFocusRef: RefObject<HTMLElement | null>;
}) {
  const [draft, setDraft] = useState(() => series.map((item) => ({ ...item })));
  const edit = (index: number, patch: Partial<DocumentSeries>) =>
    setDraft((previous) => previous.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  return (
    <Dialog
      title={dialogsCopy.series.title}
      description={dialogsCopy.series.description}
      onClose={onClose}
      returnFocusRef={returnFocusRef}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSave(draft);
        }}
      >
        <div className="grid gap-2">
          {/* Column names for the eye; each field keeps its own label for assistive tech. */}
          <div
            aria-hidden="true"
            className={cx(row, 'phone:hidden', 'text-[12px] font-[550] text-muted')}
          >
            <span>{dialogsCopy.series.code}</span>
            <span>{dialogsCopy.series.name}</span>
            <span>{dialogsCopy.series.prefix}</span>
            <span>{dialogsCopy.series.nextNumber}</span>
          </div>
          {draft.map((item, i) => (
            <div
              key={item.id}
              role="group"
              aria-labelledby={`series-${item.id}`}
              className={cx(
                row,
                'phone:rounded-[10px] phone:border phone:border-solid phone:border-line phone:p-3',
              )}
            >
              <span
                id={`series-${item.id}`}
                className="self-center justify-self-start rounded-[6px] bg-accent-soft px-2 py-1 text-[12px] font-semibold text-accent phone:col-span-2"
              >
                {item.id}
              </span>
              <label className={cx(field, 'phone:col-span-2')}>
                <span className={hint}>{dialogsCopy.series.name}</span>
                <input
                  required
                  maxLength={60}
                  value={item.name}
                  className={input}
                  onChange={(event) => edit(i, { name: event.target.value })}
                />
              </label>
              <label className={field}>
                <span className={hint}>{dialogsCopy.series.prefix}</span>
                <input
                  required
                  // Browsers compile the pattern with the v flag, where a hyphen in a class
                  // has to be escaped.
                  pattern="[A-Za-z0-9\-]{1,12}"
                  title={dialogsCopy.series.prefixRule}
                  value={item.prefix}
                  className={input}
                  onChange={(event) => edit(i, { prefix: event.target.value })}
                />
              </label>
              <label className={field}>
                <span className={hint}>{dialogsCopy.series.nextNumber}</span>
                <input
                  required
                  type="number"
                  min={1}
                  max={999999}
                  step={1}
                  value={item.next}
                  className={cx(input, 'tabular-nums')}
                  onChange={(event) => edit(i, { next: event.target.value })}
                />
              </label>
            </div>
          ))}
        </div>
        <DialogActions>
          <Button onClick={onClose}>{dialogsCopy.series.cancel}</Button>
          <Button variant="primary" type="submit">
            <Check size={16} />
            {dialogsCopy.series.save}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
