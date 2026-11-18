import type { Page } from '@playwright/test';

const names: Record<string, RegExp> = {
  populated: /Z danymi/,
  empty: /Brak danych/,
  error: /Błąd wczytywania/,
};

/**
 * Switches the demo between populated, empty and error through the capsule's
 * «DEMO» segment. Like a person, the helper first closes any open popover and scrolls up.
 */
export async function setDemoState(page: Page, value: string) {
  // Leave any field first: Escape in the search box would clear the search.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press('Escape');
  // A chosen state scrolls itself into view smoothly; let that scroll end, then go to
  // the top, so the menu opens under a button that stays put.
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        let last = -1;
        const check = () =>
          scrollY === last ? resolve() : ((last = scrollY), setTimeout(check, 120));
        check();
      }),
  );
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
  await page.waitForFunction(() => window.scrollY === 0);
  await page.getByRole('button', { name: 'Stan danych demo' }).click();
  // The menu is fixed under its button; a scroll-into-view before the click would move
  // the page and the menu with it, so the choice is dispatched where it stands.
  await page
    .getByRole('dialog', { name: 'Stan danych demo' })
    .getByRole('radio', { name: names[value] })
    .dispatchEvent('click');
}
