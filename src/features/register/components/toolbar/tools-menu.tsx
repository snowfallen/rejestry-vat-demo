'use client';
import { useRef, useState } from 'react';
import { ArrowDownToLine, Columns3, MoreHorizontal, Printer, Tag as TagIcon } from 'lucide-react';
import { IconButton, iconSummaryClass } from '@/components/ui/button';
import { Dialog } from '@/components/ui/dialog';
import { phoneQuery, useMediaQuery } from '@/hooks/use-media-query';
import { useAnchoredPlacement } from '@/hooks/use-anchored-placement';
import { closeDetails, useDetailsDismiss } from '@/hooks/use-dismiss';
import { cx } from '@/lib/cx';
import { toolbarCopy } from '../../copy';

export type ToolAction = 'export' | 'print' | 'tags' | 'columns';

const tools = [
  { action: 'export', icon: ArrowDownToLine, label: toolbarCopy.export, phoneOnly: true },
  { action: 'print', icon: Printer, label: toolbarCopy.print },
  { action: 'tags', icon: TagIcon, label: toolbarCopy.tags },
  { action: 'columns', icon: Columns3, label: toolbarCopy.columns },
] as const;

/** Rarer register tools behind "⋯". On phones export moves in here too. */
export function ToolsMenu({
  onAction,
  canExport,
}: {
  onAction: (action: ToolAction) => void;
  canExport: boolean;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const summary = useRef<HTMLElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [sheet, setSheet] = useState(false);
  const phone = useMediaQuery(phoneQuery);
  useDetailsDismiss(ref);
  const place = useAnchoredPlacement(summary, open, { width: 236, minHeight: 200, gap: 7 });

  // Phones: the same tools as a native bottom sheet, like every other panel there.
  if (phone) {
    return (
      <>
        <IconButton
          ref={trigger}
          label={toolbarCopy.more}
          title={toolbarCopy.more}
          aria-haspopup="dialog"
          className={cx('shrink-0', sheet && 'border-accent-line bg-accent-soft text-accent')}
          onClick={() => setSheet(true)}
        >
          <MoreHorizontal size={20} />
        </IconButton>
        {sheet && (
          <Dialog
            variant="sheet"
            title={toolbarCopy.more}
            onClose={() => setSheet(false)}
            returnFocusRef={trigger}
          >
            <div className="-mx-2 grid">
              {tools.map(({ action, icon: Icon, label }) => (
                <button
                  key={action}
                  type="button"
                  disabled={action === 'export' && !canExport}
                  className="flex min-h-[52px] w-full items-center gap-3 rounded-xl border-0 bg-transparent px-3 text-left text-[15px] text-ink hover:enabled:bg-accent-soft disabled:opacity-50 [&>svg]:text-muted"
                  onClick={() => {
                    setSheet(false);
                    onAction(action);
                  }}
                >
                  <Icon size={19} />
                  {label}
                </button>
              ))}
            </div>
          </Dialog>
        )}
      </>
    );
  }
  return (
    <details
      ref={ref}
      onToggle={(event) => setOpen(event.currentTarget.open)}
      className={cx(
        'relative shrink-0',
        '[&[open]>summary]:border-accent-line [&[open]>summary]:bg-accent-soft',
        '[&[open]>summary]:text-accent',
      )}
    >
      <summary
        ref={summary}
        role="button"
        aria-label={toolbarCopy.more}
        title={toolbarCopy.more}
        className={iconSummaryClass}
      >
        <MoreHorizontal size={20} />
      </summary>
      <div
        aria-label={toolbarCopy.moreMenu}
        // Hidden for the frame between the native toggle and the measured placement.
        style={open ? place : { visibility: 'hidden' }}
        className={cx(
          'fixed z-popover w-[236px] animate-[panelIn_160ms_ease-out] overflow-y-auto rounded-[14px]',
          'bg-surface p-1.5 shadow-2',
          'max-[350px]:w-[222px]',
        )}
      >
        {tools.map(({ action, icon: Icon, label, ...rest }) => (
          <button
            key={action}
            type="button"
            disabled={action === 'export' && !canExport}
            className={`flex w-full items-center gap-2.5 rounded-md border-0 bg-transparent px-2.5 py-3 text-left text-[13px] text-ink hover:enabled:bg-accent-soft [&>svg]:text-muted ${'phoneOnly' in rest ? 'desk:hidden' : ''}`}
            onClick={() => {
              closeDetails(ref.current);
              onAction(action);
            }}
          >
            <Icon size={17} />
            {label}
          </button>
        ))}
      </div>
    </details>
  );
}
