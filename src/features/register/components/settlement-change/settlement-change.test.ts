import { describe, expect, it } from 'vitest';
import { settlementChangeText } from './settlement-text';

describe('settlement change wording', () => {
  it('compares with the previous month in the locative', () => {
    expect(settlementChangeText({ percent: -29, previousMonth: 9 })).toBe(
      'o 29% mniej niż we wrześniu',
    );
    expect(settlementChangeText({ percent: 12, previousMonth: 2 })).toBe(
      'o 12% więcej niż w lutym',
    );
    expect(settlementChangeText({ percent: 0, previousMonth: 5 })).toBe('Tyle samo co w maju');
  });
});
