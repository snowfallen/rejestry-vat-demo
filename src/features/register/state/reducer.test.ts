import { describe, expect, it } from 'vitest';
import type { Action } from './actions';
import { readRegister } from '../api/demo-store';
import { initialState, reducer, type RegisterState } from './reducer';

const start = () => initialState({ snapshot: readRegister('populated') });
const run = (actions: Action[], from: RegisterState = start()) => actions.reduce(reducer, from);

describe('register reducer', () => {
  it('a new period starts from page one and keeps the criteria', () => {
    const state = run([
      { type: 'criterion', key: 'jpk', value: 'GTU_12' },
      { type: 'page', page: 2 },
      { type: 'period', period: { mode: 'quarter', year: 2026, quarter: 4 } },
    ]);
    expect(state.page).toBe(1);
    expect(state.criteria.jpk).toBe('GTU_12');
  });

  it('switching the register keeps the period', () => {
    const quarter = { mode: 'quarter', year: 2026, quarter: 3 } as const;
    const state = run([
      { type: 'period', period: quarter },
      { type: 'kind', kind: 'purchases' },
    ]);
    expect(state.kind).toBe('purchases');
    expect(state.period).toEqual(quarter);
  });

  it('retrying after an error keeps the period, register and filters', () => {
    const before = run([
      { type: 'kind', kind: 'purchases' },
      { type: 'period', period: { mode: 'year', year: 2026 } },
      { type: 'criterion', key: 'operation', value: 'invoice' },
      { type: 'failed' },
    ]);
    expect(before.documents).toEqual([]);
    const { documents } = readRegister('populated');
    const after = run(
      [
        { type: 'loading', requested: 'populated' },
        { type: 'loaded', demo: 'populated', documents },
      ],
      before,
    );
    expect(after.demo).toBe('populated');
    expect(after.kind).toBe(before.kind);
    expect(after.period).toEqual(before.period);
    expect(after.criteria).toEqual(before.criteria);
  });

  it('sorting the same column again reverses the direction', () => {
    const once = run([{ type: 'sort', key: 'gross' }]);
    const twice = reducer(once, { type: 'sort', key: 'gross' });
    expect(once.sort).toEqual({ key: 'gross', direction: 'asc' });
    expect(twice.sort).toEqual({ key: 'gross', direction: 'desc' });
  });

  it('setting and clearing a criterion touches only that criterion', () => {
    const base = run([{ type: 'criterion', key: 'search', value: 'Alfa' }]);
    const set = reducer(base, { type: 'criterion', key: 'tag', value: 'review' });
    expect(set.criteria).toEqual({ ...base.criteria, tag: 'review' });
    expect(reducer(set, { type: 'criterion', key: 'tag', value: '' }).criteria).toEqual(
      base.criteria,
    );
  });
});

describe('month groups', () => {
  const state = start();
  const october = state.documents.find((doc) => doc.date.startsWith('2026-10'))!;
  const september = state.documents.find((doc) => doc.date.startsWith('2026-09'))!;

  it('folds a month and opens it again', () => {
    const folded = reducer(state, { type: 'toggleMonth', month: '2026-10' });
    expect(folded.collapsedMonths).toEqual(['2026-10']);
    expect(reducer(folded, { type: 'toggleMonth', month: '2026-10' }).collapsedMonths).toEqual([]);
  });

  it('closes the folded month’s open documents only', () => {
    const open = run([
      { type: 'toggleRow', id: october.id },
      { type: 'toggleRow', id: september.id },
    ]);
    expect(reducer(open, { type: 'toggleMonth', month: '2026-10' }).expanded).toEqual([
      september.id,
    ]);
  });

  it('opens every month again when the period changes', () => {
    const next = run([
      { type: 'toggleMonth', month: '2026-10' },
      { type: 'period', period: { mode: 'year', year: 2026 } },
    ]);
    expect(next.collapsedMonths).toEqual([]);
  });
});

describe('served documents and session edits', () => {
  it('keeps a label set before a reload', () => {
    const { documents } = readRegister('populated');
    const id = documents[0].id;
    const labelled = run([
      { type: 'updateDocument', id, patch: { tag: 'review' } },
      { type: 'loading', requested: 'populated' },
      { type: 'loaded', demo: 'populated', documents },
    ]);
    expect(labelled.edits[id]).toEqual({ tag: 'review' });
    expect(labelled.documents).toBe(documents);
  });

  it('a failed load leaves no documents and marks the error', () => {
    const failed = run([{ type: 'loading', requested: 'populated' }, { type: 'failed' }]);
    expect(failed).toMatchObject({ loading: false, demo: 'error', documents: [] });
    // A failure is not a choice: the address keeps what was asked for.
    expect(failed.requested).toBe('populated');
  });
});

it('a contractor’s history opens the year searched by their name', () => {
  const state = run([
    { type: 'criterion', key: 'jpk', value: 'GTU_12' },
    { type: 'contractor', contractor: 'Demo Alfa 01', year: 2026 },
  ]);
  expect(state.period).toEqual({ mode: 'year', year: 2026 });
  expect(state.criteria).toMatchObject({ search: 'Demo Alfa 01', jpk: '' });
  expect(state.page).toBe(1);
});
