// Polish number and date formatting. Amounts arrive as integer grosze.

const money = new Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN' });
const amount = new Intl.NumberFormat('pl-PL', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 232300 → "2323,00 zł" */
export function formatMoney(grosze: number): string {
  return money.format(grosze / 100);
}

/** 232300 → "2323,00" (for compact secondary figures). */
export function formatAmount(grosze: number): string {
  return amount.format(grosze / 100);
}

/** "2026-10-01" → "01.10.2026" */
export function formatDate(iso: string): string {
  return iso.split('-').reverse().join('.');
}

const whole = new Intl.NumberFormat('pl-PL', {
  style: 'currency',
  currency: 'PLN',
  maximumFractionDigits: 0,
});

/**
 * Whole złoty, rounded the way tax returns round them: below 50 gr down, from 50 gr up
 * (Ordynacja podatkowa, art. 63). 98490 → "985 zł".
 */
export function formatMoneyWhole(grosze: number): string {
  return whole.format(grosze / 100);
}

/** "1111111111-20261001-1A2B3C4D5E6F-7A" → "1111111111-…-7A": the start and the check digits. */
export function shortKsef(number: string): string {
  return `${number.slice(0, 10)}-…-${number.slice(-2)}`;
}
