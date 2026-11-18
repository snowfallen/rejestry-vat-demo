'use client';
import type { RefObject } from 'react';
import type { Notify } from '@/components/ui/toast';
import { AreasDialog, ProfileDialog } from '@/features/workspace';
import type { Register } from '../../state/use-register';
import { ColumnsDialog, SeriesDialog, TagsDialog } from '../dialogs';
import { DocumentSheet } from '../documents';
import type { RegisterDialogsState } from './use-register-dialogs';
import { dialogsCopy } from '../../copy';

/** The screen's dialogs and the phone's document sheet; at most one panel is open. */
export function RegisterDialogs({
  register,
  dialogs,
  filterTriggerRef,
  onNotify,
  onTour,
  onShowContractor,
}: {
  register: Register;
  dialogs: RegisterDialogsState;
  filterTriggerRef: RefObject<HTMLButtonElement | null>;
  onNotify: Notify;
  onTour: () => void;
  onShowContractor: (contractor: string, year: number) => void;
}) {
  const { state, dispatch } = register;
  const { panel, close, sheetId } = dialogs;
  const sheetDoc = sheetId ? register.available.find((doc) => doc.id === sheetId) : undefined;
  const sheetIndex = sheetId ? register.sorted.findIndex((doc) => doc.id === sheetId) : -1;

  return (
    <>
      {panel === 'series' && (
        <SeriesDialog
          series={state.series}
          returnFocusRef={filterTriggerRef}
          onClose={close}
          onSave={(series) => {
            dispatch({ type: 'series', series });
            close();
            onNotify(dialogsCopy.series.saved);
          }}
        />
      )}
      {panel === 'columns' && (
        <ColumnsDialog
          columns={state.columns}
          onToggle={(key) => dispatch({ type: 'toggleColumn', key })}
          onMove={(key, to) => dispatch({ type: 'moveColumn', key, to })}
          onReset={() => {
            dispatch({ type: 'resetColumns' });
            onNotify(dialogsCopy.columns.restored);
          }}
          onClose={close}
        />
      )}
      {panel === 'tags' && (
        <TagsDialog
          onClose={close}
          onPick={(value) => {
            dispatch({ type: 'criterion', key: 'tag', value });
            close();
          }}
        />
      )}
      {panel === 'areas' && <AreasDialog focus={dialogs.areaFocus} onClose={close} />}
      {panel === 'profile' && (
        <ProfileDialog
          onClose={close}
          onTour={() => {
            close();
            onTour();
          }}
        />
      )}
      {sheetDoc && (
        <DocumentSheet
          doc={sheetDoc}
          onClose={dialogs.closeSheet}
          origin={() =>
            document.querySelector(`[data-doc="${sheetDoc.id}"]`)?.getBoundingClientRect()
          }
          onUpdate={(id, patch) => dispatch({ type: 'updateDocument', id, patch })}
          onNotify={onNotify}
          onShowContractor={onShowContractor}
          documents={register.available}
          position={{ index: sheetIndex, total: register.sorted.length }}
          onStep={(delta) => {
            const next = register.sorted[sheetIndex + delta];
            if (next) dialogs.openSheet(next.id);
          }}
        />
      )}
    </>
  );
}
