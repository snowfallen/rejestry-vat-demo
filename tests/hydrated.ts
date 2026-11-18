import type { Page } from '@playwright/test';

/**
 * Waits until React has hydrated the search field: text typed into a controlled input
 * before hydration is replaced by the state's empty value.
 */
export async function hydrated(page: Page) {
  await page.waitForFunction(() => {
    const field = document.getElementById('search');
    return !field || Object.keys(field).some((key) => key.startsWith('__react'));
  });
}

/** Opens the page and waits for hydration. */
export async function openRegister(page: Page, path = '/') {
  await page.goto(path);
  await hydrated(page);
}
