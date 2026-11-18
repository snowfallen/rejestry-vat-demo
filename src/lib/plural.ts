// Polish plural forms: 1 faktura, 2–4 faktury, 5+ faktur (12–14 always use the last form).
export function plural(count: number, one: string, few: string, many: string): string {
  const units = count % 10;
  const tens = count % 100;
  if (count === 1) return `1 ${one}`;
  if (units >= 2 && units <= 4 && (tens < 12 || tens > 14)) return `${count} ${few}`;
  return `${count} ${many}`;
}
