import type { Page } from '@playwright/test';

// Desktop opens a document under its row; phones open it in a bottom sheet.
export async function openDocument(page: Page, number: string) {
  const inline = page.getByRole('button', { name: `Rozwiń dokument ${number}`, exact: true });
  if (await inline.isVisible()) await inline.click();
  else await page.getByRole('button', { name: `Otwórz dokument ${number}`, exact: true }).click();
}

export async function closeDocument(page: Page, number: string) {
  const sheet = page.getByRole('dialog').filter({ hasText: number });
  if (await sheet.isVisible()) await sheet.getByRole('button', { name: 'Zamknij okno' }).click();
  else await page.getByRole('button', { name: `Zwiń dokument ${number}`, exact: true }).click();
}
