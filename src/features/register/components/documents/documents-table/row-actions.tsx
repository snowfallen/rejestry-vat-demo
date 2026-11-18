'use client';
import { useCallback, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Tag as TagIcon } from 'lucide-react';
import { IconButton } from '@/components/ui/button';
import type { Notify } from '@/components/ui/toast';
import { useAnchoredPlacement } from '@/hooks/use-anchored-placement';
import { useDismiss } from '@/hooks/use-dismiss';
import { copyText } from '@/lib/clipboard';
import { cx } from '@/lib/cx';
import { fieldLabels, tagLabels } from '../../../model/labels';
import type { DocumentPatch, Tag, VatDocument } from '../../../model/types';
import t from './documents-table.module.css';
import { documentCopy } from '../../../copy';

interface RowActionsProps {
  doc: VatDocument;
  onUpdate: (id: string, patch: DocumentPatch) => void;
  onNotify: Notify;
}

const tags: Tag[] = ['review', 'verified', ''];

/** The two things done to a row most often, shown on hover or focus: copy its number, label it. */
export function RowActions({ doc, onUpdate, onNotify }: RowActionsProps) {
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(open, close, [trigger, menu], trigger);
  const place = useAnchoredPlacement(trigger, open, { width: 200, minHeight: 150, gap: 6 });
  return (
    <span className={t.actions}>
      <IconButton
        label={documentCopy.copyNumber(doc.number)}
        variant="plain"
        size="sm"
        onClick={async () => onNotify(await copyText(doc.number, documentCopy.numberName))}
      >
        <Copy size={15} />
      </IconButton>
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={documentCopy.tagOf(doc.number)}
        title={fieldLabels.tag}
        className={cx(t.tagTrigger, open && t.tagOpen)}
        onClick={() => setOpen(!open)}
      >
        <TagIcon size={15} />
      </button>
      {/* In a portal: the sticky cell is its own layer and would put the rows below on top. */}
      {open &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label={documentCopy.tagOf(doc.number)}
            style={place}
            className="z-popover w-[200px] animate-[panelIn_160ms_ease-out] rounded-[14px] bg-surface p-1.5 shadow-2"
          >
            {tags.map((tag) => (
              <button
                key={tag || 'none'}
                type="button"
                role="menuitemradio"
                aria-checked={doc.tag === tag}
                className={cx(
                  'flex w-full items-center justify-between gap-2 rounded-md border-0 bg-transparent px-2.5',
                  'py-2 text-left text-[13px] text-ink',
                  'hover:bg-accent-soft',
                )}
                onClick={() => {
                  close();
                  trigger.current?.focus();
                  const previous = doc.tag;
                  if (previous === tag) return;
                  onUpdate(doc.id, { tag });
                  onNotify(documentCopy.tagSet(tagLabels[tag]), () =>
                    onUpdate(doc.id, { tag: previous }),
                  );
                }}
              >
                {tagLabels[tag]}
                {doc.tag === tag && <Check size={14} className="text-accent" aria-hidden="true" />}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </span>
  );
}
