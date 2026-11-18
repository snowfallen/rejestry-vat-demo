/**
 * Copies a value and says what happened, ready for a toast. Where the clipboard is not
 * available, the message carries the value so it can be copied by hand.
 */
export async function copyText(value: string, what: string): Promise<string> {
  try {
    await navigator.clipboard.writeText(value);
    return `Skopiowano ${what}.`;
  } catch {
    return `Do skopiowania (${what}): ${value}`;
  }
}

export const copyIdentifier = (identifier: string) =>
  copyText(identifier, 'identyfikator dokumentu');
