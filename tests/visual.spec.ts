import { mkdir } from 'node:fs/promises';
import { test, expect } from '@playwright/test';
import { setDemoState } from './demo-state';
import { closeDocument, openDocument } from './documents';
import { openRegister } from './hydrated';

test('capture the required viewports and progressively disclosed states', async ({
  page,
}, info) => {
  const directory = 'test-results/screens';
  await mkdir(directory, { recursive: true });
  await openRegister(page);
  await expect(page.getByRole('heading', { name: 'Dokumenty 14' })).toBeVisible();
  const prefix = info.project.name;
  await page.screenshot({
    path: `${directory}/${prefix}.png`,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  await page.screenshot({ path: `${directory}/${prefix}-filters.png`, animations: 'disabled' });
  await page.getByRole('button', { name: 'Zarządzaj seriami', exact: true }).click();
  await page.screenshot({ path: `${directory}/${prefix}-series.png`, animations: 'disabled' });
  await page.keyboard.press('Escape');
  await openDocument(page, 'FV/1/10/2026/DEMO');
  await page
    .getByRole('figure', { name: 'Dokument FV/1/10/2026/DEMO' })
    .filter({ visible: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${directory}/${prefix}-expanded.png`,
    animations: 'disabled',
  });
  await page
    .getByPlaceholder('Dodaj notatkę do dokumentu')
    .filter({ visible: true })
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${directory}/${prefix}-detail-fields.png`,
    animations: 'disabled',
  });
  await closeDocument(page, 'FV/1/10/2026/DEMO');
  const summary = page.getByRole('button', { name: 'Rozwiń podsumowanie okresu' });
  if (await summary.isVisible()) await summary.click();
  await page.getByRole('button', { name: 'Kwoty według stawek VAT' }).click();
  await page.screenshot({
    path: `${directory}/${prefix}-rates.png`,
    animations: 'disabled',
  });
  await page.screenshot({ path: `${directory}/${prefix}-viewport.png` });
  await setDemoState(page, 'error');
  await expect(page.locator('#vat-rates')).not.toBeVisible();
  if (await summary.isVisible()) await expect(summary).toHaveAttribute('aria-expanded', 'false');
  await expect(
    page.getByText('Nie udało się wczytać rejestru').filter({ visible: true }).first(),
  ).toBeVisible();
  await page
    .getByText('Nie udało się wczytać rejestru')
    .filter({ visible: true })
    .first()
    .scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${directory}/${prefix}-error.png`,
    animations: 'disabled',
  });
  await setDemoState(page, 'empty');
  await expect(page.getByRole('heading', { name: /^Brak dokumentów (w|we|za) / })).toBeVisible();
  await page.getByRole('heading', { name: /^Brak dokumentów (w|we|za) / }).scrollIntoViewIfNeeded();
  await page.screenshot({
    path: `${directory}/${prefix}-empty.png`,
    animations: 'disabled',
  });
});

test('continuous width matrix stays within the viewport', { tag: '@desktop' }, async ({ page }) => {
  await openRegister(page);
  for (const width of [1600, 1440, 1280, 1024, 900, 768, 761, 760, 600, 430, 390, 375, 360, 320]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
      `Page overflows at ${width}px`,
    ).toBeLessThanOrEqual(width);
    const toggle = await page
      .getByRole('button', { name: /^(Rozwiń|Otwórz) dokument FV\/1\/10\/2026\/DEMO$/ })
      .boundingBox();
    expect(toggle, `Document control is unavailable at ${width}px`).toBeTruthy();
    expect(
      toggle!.x + toggle!.width,
      `Document control is clipped at ${width}px`,
    ).toBeLessThanOrEqual(width);
  }
  for (const width of [1178, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.screenshot({
      path: `test-results/screens/tablet-${width}.png`,
      animations: 'disabled',
    });
  }
});

test(
  'phone starts with usable tools and a visible first document',
  { tag: '@phone' },
  async ({ page }) => {
    await openRegister(page);
    const viewport = page.viewportSize()!;
    // The first screen is the period's hero: the VAT to pay, then the registers start.
    await expect(page.getByText('VAT do zapłaty · szacunek')).toBeInViewport();
    // On the taller SE the registers already start below it.
    if (viewport.height >= 600)
      await expect(page.getByRole('tab', { name: 'Rejestr VAT sprzedaży' })).toBeInViewport();
    // One swipe brings the search up under the header and the first document whole,
    // above the tab bar.
    await page.evaluate(() => {
      const search = document.getElementById('search')!.getBoundingClientRect().top;
      const header = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--header-h'),
      );
      window.scrollBy(0, search - header - 12);
    });
    const first = page.getByText('Demo Alfa 01', { exact: true }).filter({ visible: true });
    await expect(first).toBeInViewport({ ratio: 1 });
    const card = page.getByRole('button', { name: 'Otwórz dokument FV/1/10/2026/DEMO' });
    const tabBar = await page.locator('nav[data-bottom-bar]').boundingBox();
    const cardBox = await card.boundingBox();
    expect(cardBox!.y + cardBox!.height).toBeLessThanOrEqual(tabBar!.y);
    const totals = await page.getByRole('region', { name: 'Podsumowanie rejestru' }).boundingBox();
    const search = await page.getByRole('searchbox').boundingBox();
    expect(totals!.y + totals!.height).toBeLessThanOrEqual(search!.y);
    expect(search!.y + search!.height).toBeLessThan((await first.boundingBox())!.y);
    // A document opens as a bottom sheet with every field of the row and more.
    await openDocument(page, 'FV/1/10/2026/DEMO');
    const sheet = page.getByRole('dialog', { name: 'Demo Alfa 01' });
    await expect(sheet).toBeInViewport();
    for (const text of ['Rodzaj operacji', 'Identyfikator', 'DEMO-S-1', 'Brutto', 'Wystawiony'])
      await expect(sheet).toContainText(text);
  },
);

test('the period card stays compact on wide desktops', { tag: '@desktop' }, async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openRegister(page);
  const card = await page.getByRole('region', { name: 'Okres rozliczeniowy' }).boundingBox();
  // October also says what holds its return back («4 faktury bez numeru KSeF»), one
  // short line under the deadline.
  expect(card!.height).toBeLessThanOrEqual(220);
});

test('the filter panel stays inside the viewport', { tag: '@desktop' }, async ({ page }) => {
  for (const [width, height] of [
    [1440, 900],
    [1024, 768],
  ]) {
    await page.setViewportSize({ width, height });
    await openRegister(page);
    await page.getByRole('button', { name: 'Filtry', exact: true }).click();
    const panel = page.getByRole('dialog', { name: 'Filtry' });
    await expect(panel).toBeVisible();
    const box = (await panel.boundingBox())!;
    // It opens under its button, the page moving up to make room.
    const trigger = (await page
      .getByRole('button', { name: 'Filtry', exact: true })
      .boundingBox())!;
    expect(box.y, `below the button at ${width}`).toBeGreaterThan(trigger.y);
    expect(box.y, `top at ${width}`).toBeGreaterThanOrEqual(0);
    expect(box.y + box.height, `bottom at ${width}`).toBeLessThanOrEqual(height);
    expect(box.x + box.width, `right at ${width}`).toBeLessThanOrEqual(width);
    await expect(panel.getByRole('button', { name: /^Pokaż \d+ dokument/ })).toBeInViewport();
    await page.keyboard.press('Escape');
  }
});
