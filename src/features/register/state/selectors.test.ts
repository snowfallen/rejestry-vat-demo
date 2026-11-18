import { describe, expect, it } from 'vitest';
import { readRegister } from '../api/demo-store';
import { initialState, reducer } from './reducer';
import {
  availableDocuments,
  selectCriteria,
  selectFigures,
  selectList,
  unconfirmedInMonth,
} from './selectors';

const october = initialState({ snapshot: readRegister('populated') });
const available = availableDocuments(october);

describe('register selectors', () => {
  it('lists October sales a page at a time with their totals', () => {
    const list = selectList(october, available);
    expect(list.filtered).toHaveLength(14);
    expect(list.visible).toHaveLength(10);
    expect(list.range).toEqual({ first: 1, last: 10 });
    expect(list.sum).toEqual({ net: 970000, vat: 232300, gross: 1202300 });
  });

  it('serves no documents after an empty or failed load', () => {
    const empty = reducer(october, { type: 'loaded', demo: 'empty', documents: [] });
    expect(availableDocuments(empty)).toEqual([]);
    expect(availableDocuments(reducer(october, { type: 'failed' }))).toEqual([]);
  });

  it('lays this session’s labels over the served documents', () => {
    const id = october.documents[0].id;
    const labelled = reducer(october, { type: 'updateDocument', id, patch: { note: 'Sprawdzić' } });
    expect(availableDocuments(labelled)[0].note).toBe('Sprawdzić');
    expect(labelled.documents[0].note).toBe('');
  });

  it('settles October: output minus input VAT', () => {
    const { filtered } = selectList(october, available);
    const { settlement } = selectFigures(october, available, filtered);
    expect(settlement).toMatchObject({ kind: 'payable', amount: 98490 });
  });

  it('a folded month counts all of its documents in the page range', () => {
    const quarter = reducer(october, {
      type: 'period',
      period: { mode: 'quarter', year: 2026, quarter: 4 },
    });
    const folded = reducer(quarter, { type: 'toggleMonth', month: '2026-10' });
    const list = selectList(folded, available);
    expect(list.visible[0].date.startsWith('2026-10')).toBe(true);
    expect(list.visible[1].date.startsWith('2026-11')).toBe(true);
    expect(list.range).toEqual({ first: 1, last: 20 });
    expect(list.pageCount).toBe(1);
  });

  it('counts the KSeF views of the listed register', () => {
    const { ksefCounts, searching } = selectCriteria(october, available);
    expect(ksefCounts['']).toBe(14);
    expect(ksefCounts.pending + ksefCounts.confirmed).toBe(14);
    expect(searching).toBe(false);
  });

  it('counts the sales of one month still without a KSeF number', () => {
    expect(unconfirmedInMonth(available, 2026, 10)).toBe(4);
    expect(unconfirmedInMonth(available, 2026, 9)).toBe(2);
    expect(unconfirmedInMonth(available, 2026, 7)).toBe(0);
    // A number given in this session counts at once.
    const id = available.find((doc) => doc.number === 'FV/11/10/2026/DEMO')!.id;
    const checked = reducer(october, { type: 'updateDocument', id, patch: { ksef: 'x' } });
    expect(unconfirmedInMonth(availableDocuments(checked), 2026, 10)).toBe(3);
  });
});
