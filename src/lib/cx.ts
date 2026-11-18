/** Joins class names, skipping falsy entries: cx('a', on && 'b'). */
export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}
