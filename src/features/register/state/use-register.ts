'use client';
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';
import { fetchRegister } from '../api/register-client';
import { RegisterLoadError, type RegisterSnapshot } from '../api/types';
import type { DemoState } from '../model/types';
import type { RegisterUrlState } from '../model/url';
import { initialState, reducer } from './reducer';
import { availableDocuments, selectCriteria, selectFigures, selectList } from './selectors';

/** Keeps the skeleton from flashing on a fast network. */
const minimumLoading = 450;

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/**
 * The register screen's state and everything derived from it. The server's snapshot
 * opens it; reloads read `GET /api/register`. Components receive values and intent
 * callbacks; none of them filters or sums documents itself.
 */
export function useRegister(snapshot: RegisterSnapshot, url?: RegisterUrlState) {
  const [state, dispatch] = useReducer(reducer, { snapshot, url }, initialState);
  const request = useRef<AbortController | null>(null);
  // A reload in flight must not land in an unmounted screen.
  useEffect(() => () => request.current?.abort(), []);

  const { documents, edits, demo, kind, period, criteria, sort, page, pageSize, collapsedMonths } =
    state;
  const available = useMemo(() => availableDocuments({ documents, edits }), [documents, edits]);
  const list = useMemo(
    () => selectList({ kind, period, criteria, sort, page, pageSize, collapsedMonths }, available),
    [available, kind, period, criteria, sort, page, pageSize, collapsedMonths],
  );
  const figures = useMemo(
    () => selectFigures({ kind, period }, available, list.filtered),
    [available, kind, period, list.filtered],
  );
  const search = useMemo(
    () => selectCriteria({ kind, period, criteria }, available),
    [available, kind, period, criteria],
  );

  const reload = useCallback(async (target: DemoState = 'populated') => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    dispatch({ type: 'loading', requested: target });
    try {
      const [served] = await Promise.all([
        fetchRegister(target, controller.signal),
        wait(minimumLoading, controller.signal),
      ]);
      dispatch({ type: 'loaded', demo: target, documents: served.documents });
    } catch (error) {
      if (controller.signal.aborted) return;
      if (!(error instanceof RegisterLoadError)) throw error;
      dispatch({ type: 'failed' });
    }
  }, []);

  return {
    state,
    ...list,
    ...figures,
    ...search,
    broken: demo === 'error',
    available,
    dispatch,
    reload,
  };
}

export type Register = ReturnType<typeof useRegister>;
export type RegisterDispatch = Register['dispatch'];
