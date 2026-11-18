import type { Page } from '@playwright/test';

/**
 * Opens the page and waits until React has hydrated the search field: text typed into
 * a controlled input before hydration is replaced by the state's empty value.
 */
export async function openRegister(page: Page, path = '/') {
  await page.goto(path);
  await page.waitForFunction(() => {
    const field = document.getElementById('search');
    return !field || Object.keys(field).some((key) => key.startsWith('__react'));
  });
}
