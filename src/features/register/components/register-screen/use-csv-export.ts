'use client';
import { useState } from 'react';
import type { Notify } from '@/components/ui/toast';
import { downloadText } from '@/lib/download';
import { toolbarCopy } from '../../copy';
import { csvFileName, exportCsv } from '../../model/csv';
import type { Period } from '../../model/period';
import type { RegisterKind, VatDocument } from '../../model/types';

/** CSV of every listed document, all pages; a toast says how it went. */
export function useCsvExport(
  documents: VatDocument[],
  kind: RegisterKind,
  period: Period,
  notify: Notify,
) {
  const [exporting, setExporting] = useState(false);
  function download() {
    setExporting(true);
    try {
      downloadText(exportCsv(documents), csvFileName(kind, period), 'text/csv;charset=utf-8;');
      notify(toolbarCopy.exported(documents.length));
    } catch {
      notify(toolbarCopy.exportFailed);
    } finally {
      setExporting(false);
    }
  }
  return { exporting, download };
}
