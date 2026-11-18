import { describe, expect, it } from 'vitest';
import { axisScale, axisSplit, monthBars } from './axis-scale';

describe('VAT axis scale', () => {
  const k = 0.001;

  it('splits output VAT into the covered part and the part to pay', () => {
    const bars = monthBars(232300, 133810, k);
    expect(bars.due + bars.offset).toBe(Math.round(232300 * k));
    expect(bars.input).toBe(bars.offset);
    expect(bars.surplus).toBe(0);
  });

  it('shows a surplus below the line when input exceeds output', () => {
    const bars = monthBars(367053, 407935, k);
    expect(bars.due).toBe(0);
    expect(bars.surplus).toBeGreaterThan(0);
    expect(bars.input + bars.surplus).toBe(Math.round(367053 * k) + Math.round(40882 * k));
  });

  it('draws nothing for an empty month', () => {
    expect(monthBars(0, 0, k)).toEqual({ due: 0, offset: 0, input: 0, surplus: 0 });
  });

  it('fits the larger side and never divides by zero', () => {
    expect(axisScale(1000, 500, 100, 100)).toBe(0.1);
    expect(axisScale(0, 0, 74, 46)).toBe(46);
  });

  it('gives each side of the line its share of the height', () => {
    expect(axisSplit(300, 100, 120)).toEqual({ rise: 90, fall: 30 });
    expect(axisSplit(375215, 407935, 120).rise).toBe(57);
    expect(axisSplit(0, 0, 120)).toEqual({ rise: 60, fall: 60 });
    expect(axisSplit(100, 0, 120)).toEqual({ rise: 90, fall: 30 });
  });
});
