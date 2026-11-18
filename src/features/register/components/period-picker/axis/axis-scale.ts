// Heights on the VAT axis. Pure functions: no DOM, unit-tested.

export interface MonthBars {
  due: number;
  offset: number;
  input: number;
  surplus: number;
}

/**
 * Output VAT rises above the line, split into what input VAT covers (offset) and what is
 * left to pay (due). Input VAT hangs below on the same scale; beyond the output it is surplus.
 */
export function monthBars(output: number, input: number, k: number): MonthBars {
  const covered = Math.min(output, input);
  return {
    due: Math.round((output - covered) * k),
    offset: Math.round(covered * k),
    input: Math.round(covered * k),
    surplus: Math.round(Math.max(0, input - output) * k),
  };
}

/** Pixels per grosz: the largest month of each direction fits its side of the line. */
export const axisScale = (maxOutput: number, maxInput: number, rise: number, fall: number) =>
  Math.min(rise / Math.max(1, maxOutput), fall / Math.max(1, maxInput));

/**
 * Splits the axis height between output (above the line) and input (below) in proportion
 * to the year's largest month of each, so both sides use their full height on one scale.
 * Neither side gets less than a quarter.
 */
export function axisSplit(maxOutput: number, maxInput: number, total: number) {
  const sum = maxOutput + maxInput;
  const share = sum ? maxOutput / sum : 0.5;
  const rise = Math.round(total * Math.min(0.75, Math.max(0.25, share)));
  return { rise, fall: total - rise };
}
