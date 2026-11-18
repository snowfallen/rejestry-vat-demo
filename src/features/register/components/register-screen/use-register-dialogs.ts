'use client';
import { useState } from 'react';
import type { AreaTab } from '@/features/workspace';

export type Panel = 'series' | 'columns' | 'tags' | 'areas' | 'profile';

/** Which dialog is open: one panel at a time, plus the phone's document sheet. */
export function useRegisterDialogs() {
  const [panel, setPanel] = useState<Panel | null>(null);
  const [areaFocus, setAreaFocus] = useState<AreaTab | undefined>();
  const [sheetId, setSheetId] = useState<string | null>(null);
  return {
    panel,
    open: (next: Panel) => setPanel(next),
    close: () => setPanel(null),
    /** The map of areas, optionally on one area's tab. */
    areaFocus,
    openMap: (tab?: AreaTab) => {
      setAreaFocus(tab);
      setPanel('areas');
    },
    sheetId,
    openSheet: setSheetId,
    closeSheet: () => setSheetId(null),
  };
}

export type RegisterDialogsState = ReturnType<typeof useRegisterDialogs>;
