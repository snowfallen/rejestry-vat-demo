import type { ComponentType } from 'react';
import { Archive, Landmark, ListChecks, ReceiptText } from 'lucide-react';
import type { AreaTab } from './areas';

/** One icon per area tab, shared by the desktop tabs and the phone tab bar. */
export const areaTabIcons: Record<AreaTab, ComponentType<{ size?: number; className?: string }>> = {
  vat: ReceiptText,
  postings: Landmark,
  assets: Archive,
  controls: ListChecks,
};
