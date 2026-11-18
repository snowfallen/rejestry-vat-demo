'use client';
import { ChevronRight, Tag as TagIcon } from 'lucide-react';
import { Dialog } from '@/components/ui/dialog';
import { ListOption } from '@/components/ui/list-option';
import { tagLabels } from '../../../model/labels';
import { dialogsCopy } from '../../../copy';

/** Labels are set on a document; here they filter the register. */
export function TagsDialog({
  onPick,
  onClose,
}: {
  onPick: (value: 'review' | 'verified' | 'none') => void;
  onClose: () => void;
}) {
  return (
    <Dialog
      title={dialogsCopy.tags.title}
      description={dialogsCopy.tags.description}
      onClose={onClose}
    >
      {(['review', 'verified', 'none'] as const).map((value) => (
        <ListOption
          key={value}
          icon={<TagIcon size={18} />}
          trailing={<ChevronRight size={16} />}
          onClick={() => onPick(value)}
        >
          {tagLabels[value === 'none' ? '' : value]}
        </ListOption>
      ))}
    </Dialog>
  );
}
