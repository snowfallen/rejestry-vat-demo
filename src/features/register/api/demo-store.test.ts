import { describe, expect, it } from 'vitest';
import { totals } from '../model/amounts';
import { filterDocuments } from '../model/query';
import { parseDemoState, readRegister } from './demo-store';
import { RegisterLoadError } from './types';

describe('demo register store', () => {
  it('serves the reference October in the populated state', () => {
    const { documents } = readRegister('populated');
    const october = filterDocuments(documents, 'sales', { mode: 'month', year: 2026, month: 10 });
    expect(october).toHaveLength(14);
    expect(totals(october)).toEqual({ net: 970000, vat: 232300, gross: 1202300 });
  });

  it('serves no documents when empty and fails with 503 on error', () => {
    expect(readRegister('empty').documents).toEqual([]);
    expect(() => readRegister('error')).toThrow(RegisterLoadError);
    try {
      readRegister('error');
    } catch (error) {
      expect((error as RegisterLoadError).status).toBe(503);
    }
  });

  it('reads the state from the address', () => {
    expect(parseDemoState(null)).toBe('populated');
    expect(parseDemoState('empty')).toBe('empty');
    expect(parseDemoState('nope')).toBeNull();
  });
});
