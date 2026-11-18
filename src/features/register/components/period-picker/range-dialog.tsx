'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { cx } from '@/lib/cx';
import { periodCopy } from '../../copy';
import { demoToday, demoYears, openMonths, periodBounds } from '../../model/period';

interface RangeDialogProps {
  from: string;
  to: string;
  onApply: (from: string, to: string) => void;
  onClose: () => void;
}

// A range can reach the end of the current month, never into months that have not begun.
const todayYear = Number(demoToday.slice(0, 4));
const bounds = {
  min: `${demoYears[0]}-01-01`,
  max: periodBounds({ mode: 'month', year: todayYear, month: openMonths(todayYear) }).to,
};
const field = cx(
  'min-h-[44px] rounded-[9px] border border-solid border-line-control bg-surface px-3',
  'text-[14px] tabular-nums',
  'phone:text-[16px]',
);

/** Exact dates for the range, for when months on the axis are not precise enough. */
export function RangeDialog({ from, to, onApply, onClose }: RangeDialogProps) {
  const [start, setStart] = useState(from);
  const [end, setEnd] = useState(to);
  const copy = periodCopy.range;
  return (
    <Dialog title={copy.title} onClose={onClose}>
      <div className="grid grid-cols-2 gap-3">
        {(
          [
            [copy.from, start, setStart],
            [copy.to, end, setEnd],
          ] as const
        ).map(([label, value, set]) => (
          <label key={label} className="flex flex-col gap-1.5 text-[12px] font-medium text-muted">
            {label}
            <input
              type="date"
              value={value}
              min={bounds.min}
              max={bounds.max}
              className={field}
              onChange={(event) => set(event.target.value)}
            />
          </label>
        ))}
      </div>
      <div className="mt-6 flex justify-end gap-2.5">
        <Button onClick={onClose}>{copy.cancel}</Button>
        <Button
          variant="primary"
          disabled={!start || !end}
          onClick={() => {
            onApply(start, end);
            onClose();
          }}
        >
          {copy.apply}
        </Button>
      </div>
    </Dialog>
  );
}
