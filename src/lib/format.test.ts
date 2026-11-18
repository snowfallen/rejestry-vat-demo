import { describe, expect, it } from 'vitest';
import { formatMoneyWhole } from './format';

const plain = (text: string) => text.replace(/\s/g, ' ');

describe('formatMoneyWhole', () => {
  it('rounds to whole złoty the way tax returns do', () => {
    expect(plain(formatMoneyWhole(98490))).toBe('985 zł');
    expect(plain(formatMoneyWhole(98449))).toBe('984 zł');
    expect(plain(formatMoneyWhole(98450))).toBe('985 zł');
    expect(plain(formatMoneyWhole(-98450))).toBe('-985 zł');
  });
});
