'use client';
import { ArrowDown, ArrowUp } from 'lucide-react';
import { Button, IconButton } from '@/components/ui/button';
import { Dialog, DialogActions } from '@/components/ui/dialog';
import { cx } from '@/lib/cx';
import { columnKeys, columnLabels } from '../../../model/labels';
import type { ColumnKey } from '../../../model/types';
import { dialogsCopy } from '../../../copy';

/**
 * Table columns in one list: a checkbox shows or hides each, arrows order the shown ones.
 * The last visible column cannot be hidden.
 */
export function ColumnsDialog({
  columns,
  onToggle,
  onMove,
  onReset,
  onClose,
}: {
  columns: ColumnKey[];
  onToggle: (key: ColumnKey) => void;
  onMove: (key: ColumnKey, to: number) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  const rows = [...columns, ...columnKeys.filter((key) => !columns.includes(key))];
  return (
    <Dialog
      title={dialogsCopy.columns.title}
      description={dialogsCopy.columns.description}
      onClose={onClose}
    >
      {/* One list: shown columns in table order, hidden ones after them. */}
      <ol className="m-0 list-none p-0">
        {rows.map((key) => {
          const shown = columns.indexOf(key);
          const visible = shown >= 0;
          return (
            <li
              key={key}
              className="flex min-h-[44px] items-center gap-2 border-0 border-b border-solid border-line"
            >
              <label
                className={cx(
                  'flex flex-1 items-center gap-2.5 text-[13px]',
                  !visible && 'text-muted',
                )}
              >
                <input
                  type="checkbox"
                  className="size-[18px] min-h-0"
                  checked={visible}
                  disabled={visible && columns.length === 1}
                  onChange={() => onToggle(key)}
                />
                {columnLabels[key]}
              </label>
              {visible && (
                <>
                  <IconButton
                    label={dialogsCopy.columns.left(columnLabels[key])}
                    variant="plain"
                    size="sm"
                    disabled={shown === 0}
                    onClick={() => onMove(key, shown - 1)}
                  >
                    <ArrowUp size={16} />
                  </IconButton>
                  <IconButton
                    label={dialogsCopy.columns.right(columnLabels[key])}
                    variant="plain"
                    size="sm"
                    disabled={shown === columns.length - 1}
                    onClick={() => onMove(key, shown + 1)}
                  >
                    <ArrowDown size={16} />
                  </IconButton>
                </>
              )}
            </li>
          );
        })}
      </ol>
      <p className="m-0 mt-4 text-[12px] leading-relaxed text-muted">
        {dialogsCopy.columns.phoneNote}
      </p>
      <DialogActions>
        <Button variant="text" size="none" onClick={onReset}>
          {dialogsCopy.columns.reset}
        </Button>
        <Button variant="primary" onClick={onClose}>
          {dialogsCopy.columns.done}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
