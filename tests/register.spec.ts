import { readFile } from 'node:fs/promises';
import { test, expect, type Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { setDemoState } from './demo-state';
import { documentCopy, ksefCopy } from '../src/features/register/copy';
import { formatAmount, formatMoneyWhole } from '../src/lib/format';
import { plural } from '../src/lib/plural';
import { closeDocument, openDocument } from './documents';
import { monthDocuments, monthVat, unconfirmedIn } from './fixture-numbers';
import { openRegister } from './hydrated';
import { createDocuments } from '../src/features/register/model/fixtures';
import { contractorDocuments } from '../src/features/register/model/query';

test.beforeEach(async ({ page }) => {
  // The once-per-session entrance has its own test (motion.spec); here pointer
  // geometry must not move under the mouse.
  await page.addInitScript(() => sessionStorage.setItem('rv-intro', '1'));
  await openRegister(page);
});

async function openSummary(page: Page) {
  const toggle = page.getByRole('button', { name: 'Rozwiń podsumowanie okresu' });
  if (await toggle.isVisible()) await toggle.click();
}

function facetOption(page: Page, group: string, option: RegExp) {
  return page
    .getByRole('dialog', { name: 'Filtry', exact: true })
    .getByRole('group', { name: group })
    .getByRole('button', { name: option });
}

async function exportAction(page: Page) {
  const action = page.getByRole('button', { name: 'Eksportuj CSV', exact: true });
  if (!(await action.isVisible())) {
    await page.getByRole('button', { name: 'Więcej działań' }).click();
  }
  return action;
}

test('every original register column and context status is visible by default', async ({
  page,
}) => {
  await expect(page.locator('summary').getByText('Wymaga potwierdzenia')).toBeVisible();
  await expect(page.getByText('DEMO', { exact: true })).toBeVisible();
  await expect(page.getByText('Onsaldo Preview Sp. z o.o.').filter({ visible: true })).toHaveCount(
    1,
  );
  const table = page.getByRole('table');
  if (await table.isVisible()) {
    for (const name of ['Kontrahent', 'Data', 'Numer dokumentu', 'Numer KSeF', 'Identyfikator'])
      await expect(table.getByRole('columnheader', { name })).toBeAttached();
  } else {
    // Phone rows keep the identifier for the sheet (and for a search that finds it).
    const card = page.locator('article').first();
    for (const text of ['Demo Alfa 01', 'FV/1/10/2026/DEMO', '01.10.2026', ksefCopy.confirmed])
      await expect(card).toContainText(text);
    await page.getByRole('searchbox', { name: 'Szukaj dokumentów' }).fill('DEMO-S-1');
    await expect(page.locator('article').first()).toContainText('DEMO-S-1');
  }
});

test('reference totals, search and no-result recovery', async ({ page }) => {
  const summary = page.getByRole('region', { name: 'Podsumowanie rejestru' });
  await expect(summary).toContainText('9700,00');
  await expect(summary).toContainText('2323,00');
  await expect(summary).toContainText('12 023,00');
  await page.getByRole('searchbox', { name: 'Szukaj dokumentów' }).fill('missing-company');
  await expect(page.getByRole('heading', { name: 'Nie znaleziono dokumentów' })).toBeVisible();
  await expect(await exportAction(page)).toBeDisabled();
  if (await page.getByRole('button', { name: 'Drukuj rejestr' }).isVisible())
    await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Wyczyść wyszukiwanie i filtry' }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 14' })).toBeVisible();
});

test('filters, purchase tab, period and VAT breakdown', async ({ page }) => {
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  await facetOption(page, 'Rodzaj operacji', /^Korekta/).click();
  await expect(facetOption(page, 'Rodzaj operacji', /^Korekta/)).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.getByRole('button', { name: 'Pokaż 1 dokument', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 1', exact: true })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Podsumowanie rejestru' })).toContainText(
    '-400,00',
  );
  await page.getByRole('button', { name: 'Usuń filtr Korekta', exact: true }).click();
  await openSummary(page);
  await page.getByRole('button', { name: 'Kwoty według stawek VAT' }).click();
  await expect(page.locator('#vat-rates')).toContainText('23%');
  await expect(page.locator('#vat-rates')).toContainText('np');
  // The breakdown is a sheet on phones; close it before moving on.
  await page.keyboard.press('Escape');
  await expect(page.locator('#vat-rates')).toBeHidden();
  await page.getByRole('tab', { name: 'Rejestr VAT zakupów' }).click();
  await expect(page.getByRole('tab', { name: 'Rejestr VAT zakupów' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  // December 2026 has not begun, so it cannot be chosen; 2025 is a genuinely empty year.
  await expect(page.getByRole('radio', { name: /^Grudzień 2026/ })).toBeDisabled();
  const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
  await period.getByRole('radio', { name: 'Rok' }).click();
  await period.getByRole('button', { name: 'Poprzedni okres' }).click();
  await period.getByRole('button', { name: /^Pokaż grudzień 2025/ }).click();
  await expect(page.getByRole('heading', { name: /^Brak dokumentów (w|we|za) / })).toBeVisible();
  // An empty month leads to the nearest month that has documents.
  await page.getByRole('button', { name: /^Przejdź do stycznia 2026 · \d+ dokument/ }).click();
  await expect(
    page.getByRole('heading', {
      name: `Dokumenty ${monthDocuments('purchases', 1).length}`,
      exact: true,
    }),
  ).toBeVisible();
});

test('pagination and full filtered CSV download', async ({ page, isMobile }) => {
  const last = page.getByText('Demo Alfa 14', { exact: true }).filter({ visible: true });
  if (isMobile) {
    // Phones grow the list: the next documents join the end and the first stay.
    await expect(page.getByText('10 z 14 dokumentów', { exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Pokaż kolejne 4' }).click();
    await expect(last).toBeVisible();
    await expect(
      page.getByText('Demo Alfa 01', { exact: true }).filter({ visible: true }),
    ).toBeAttached();
    await expect(page.getByRole('button', { name: /Pokaż kolejne/ })).toHaveCount(0);
    await page.getByRole('button', { name: /^Dokumenty na stronie/ }).click();
    await page.getByRole('menuitemradio', { name: '20', exact: true }).click();
    await expect(page.getByText('14 z 14 dokumentów', { exact: true })).toBeVisible();
  } else {
    await page.getByRole('button', { name: 'Następna strona' }).click();
    await expect(page.getByText('Strona 2 z 2', { exact: true })).toBeVisible();
    await expect(last).toBeVisible();
    await page.getByRole('button', { name: /^Dokumenty na stronie/ }).click();
    await page.getByRole('menuitemradio', { name: '20', exact: true }).click();
    await expect(page.getByText('Strona 1 z 1', { exact: true })).toBeVisible();
  }
  const downloadPromise = page.waitForEvent('download');
  await (await exportAction(page)).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('rejestr-vat-sprzedaz-2026-10.csv');
  const path = await download.path();
  expect(path).toBeTruthy();
  const csv = await readFile(path!, 'utf8');
  expect(csv.split('\r\n')).toHaveLength(15);
  expect(csv).toContain('DEMO-S-14');
});

test('row details, session labels and note', async ({ page }) => {
  await openDocument(page, 'FV/1/10/2026/DEMO');
  const label = page
    .getByRole('radiogroup', { name: 'Etykieta', exact: true })
    .filter({ visible: true });
  // A label change can be undone from its toast, also inside the phone sheet.
  await label.getByRole('radio', { name: 'Do sprawdzenia' }).click();
  await page.getByRole('button', { name: 'Cofnij' }).click();
  await expect(label.getByRole('radio', { name: 'Bez etykiety' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByText('Przywrócono etykietę: Bez etykiety')).toBeVisible();
  await label.getByRole('radio', { name: 'Do sprawdzenia' }).click();
  await page
    .getByPlaceholder('Dodaj notatkę do dokumentu')
    .filter({ visible: true })
    .fill('Sprawdzić numer dokumentu');
  await closeDocument(page, 'FV/1/10/2026/DEMO');
  await openDocument(page, 'FV/1/10/2026/DEMO');
  await expect(
    page.getByPlaceholder('Dodaj notatkę do dokumentu').filter({ visible: true }),
  ).toHaveValue('Sprawdzić numer dokumentu');
  await closeDocument(page, 'FV/1/10/2026/DEMO');
  await page.getByRole('button', { name: 'Więcej działań' }).click();
  await page.getByRole('button', { name: 'Etykiety dokumentów', exact: true }).click();
  await page.getByRole('button', { name: 'Do sprawdzenia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 1', exact: true })).toBeVisible();
});

test('series form validation, save, escape and focus restoration', async ({ page }) => {
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  await page.getByRole('button', { name: 'Zarządzaj seriami', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Serie dokumentów' });
  const name = dialog.getByLabel('Nazwa serii', { exact: true }).first();
  await name.fill('');
  await dialog.getByRole('button', { name: 'Zapisz ustawienia' }).click();
  await expect(dialog).toBeVisible();
  await name.fill('Sprzedaż krajowa');
  // The prefix rule is enforced by the browser: letters, digits and hyphens only.
  const prefix = dialog.getByLabel('Prefiks', { exact: true }).first();
  const valid = () => prefix.evaluate((input: HTMLInputElement) => input.validity.valid);
  const original = await prefix.inputValue();
  await prefix.fill('FV 2026');
  expect(await valid()).toBe(false);
  await prefix.fill('FV-2026');
  expect(await valid()).toBe(true);
  await prefix.fill(original);
  await dialog.getByRole('button', { name: 'Zapisz ustawienia' }).click();
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtry', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  await expect(
    page
      .getByRole('dialog', { name: 'Filtry', exact: true })
      .getByRole('group', { name: 'Seria dokumentów' }),
  ).toContainText('Sprzedaż krajowa');
  await page.getByRole('button', { name: 'Zarządzaj seriami', exact: true }).click();
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
});

test('required demo states and error retry preserve filters', async ({ page }) => {
  await page.getByRole('searchbox').fill('Alfa 01');
  await setDemoState(page, 'error');
  await expect(
    page.getByText('Nie udało się wczytać rejestru').filter({ visible: true }).first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Spróbuj ponownie' }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 1', exact: true })).toBeVisible();
  await expect(page.getByRole('searchbox')).toHaveValue('Alfa 01');
  await page.getByRole('button', { name: 'Wyczyść wyszukiwanie', exact: true }).click();
  await setDemoState(page, 'empty');
  await expect(page.getByRole('heading', { name: /^Brak dokumentów (w|we|za) / })).toBeVisible();
  await page.getByRole('button', { name: 'Pokaż przykładowy okres' }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 14' })).toBeVisible();
});

test('column preferences and keyboard tab navigation', async ({ page }) => {
  await page.getByRole('tab', { name: 'Rejestr VAT sprzedaży' }).press('ArrowRight');
  await expect(page.getByRole('tab', { name: 'Rejestr VAT zakupów' })).toBeFocused();
  await page.getByRole('button', { name: 'Więcej działań' }).click();
  await page.getByRole('button', { name: 'Ustawienia kolumn' }).click();
  const dialog = page.getByRole('dialog', { name: 'Ustawienia kolumn' });
  await dialog.getByRole('button', { name: 'Przesuń Data w lewo', exact: true }).click();
  await expect(dialog.locator('li').first()).toContainText('Data');
  await dialog.getByLabel('Identyfikator', { exact: true }).uncheck();
  // A hidden column stays in the one list, after the shown ones, without arrows.
  await expect(dialog.locator('li')).toHaveCount(6);
  await expect(dialog.locator('li').last()).toContainText('Identyfikator');
  await expect(dialog.getByRole('button', { name: 'Przesuń Identyfikator w lewo' })).toHaveCount(0);
  await dialog.getByLabel('Identyfikator', { exact: true }).check();
  await expect(dialog.locator('li').last()).toContainText('Identyfikator');
  await dialog.getByRole('button', { name: 'Przywróć domyślne' }).click();
  await expect(dialog.locator('li').first()).toContainText('Kontrahent');
  await expect(dialog.locator('li')).toHaveCount(6);
  await dialog.getByRole('button', { name: 'Gotowe' }).click();
});

test('accessible populated screen and expanded form have no serious violations', async ({
  page,
}) => {
  const initial = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(initial.violations).toEqual([]);
  await openDocument(page, 'FV/1/10/2026/DEMO');
  const expanded = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(expanded.violations).toEqual([]);
});

test('no viewport overflow and no runtime errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.reload();
  const widths = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(widths.page).toBeLessThanOrEqual(widths.viewport);
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  const expanded = await page.evaluate(() => ({
    page: document.documentElement.scrollWidth,
    viewport: innerWidth,
  }));
  expect(expanded.page).toBeLessThanOrEqual(expanded.viewport);
  expect(errors).toEqual([]);
});

test('print includes all filtered documents and no application chrome', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  await expect(page.locator('main')).not.toBeVisible();
  const print = page.locator('[class*="printContent"]');
  await expect(print).toContainText('Demo Alfa 14');
  await expect(print.locator('table').first().locator('tbody tr')).toHaveCount(14);
});

test('print layout has a heading, dated columns and totals per rate', async ({ page }) => {
  await page.emulateMedia({ media: 'print' });
  const print = page.locator('[class*="printContent"]');
  await expect(print.getByRole('heading', { name: 'Rejestr VAT sprzedaży' })).toBeVisible();
  await expect(print).toContainText('Okres: 01.10.2026 – 31.10.2026 · Onsaldo Preview Sp. z o.o.');
  await expect(print).toContainText('wydrukowano 17.11.2026');
  await expect(print.locator('thead').first()).toContainText('Numer KSeF');
  await expect(print.locator('tbody tr').first()).toContainText('01.10.2026');
  const summary = print.getByRole('region', { name: 'Podsumowanie według stawek' });
  await expect(summary.locator('tfoot')).toContainText(/Razem\s*14/);
  await expect(summary.locator('tfoot')).toContainText(formatAmount(monthVat('sales', 10)));
});

test('notifications, register tabs and totals describe the selected period', async ({ page }) => {
  await page.getByRole('button', { name: /^Powiadomienia/ }).click();
  const pendingSales = unconfirmedIn('sales', 10);
  const pendingPurchases = unconfirmedIn('purchases', 10);
  const pending = plural(pendingSales + pendingPurchases, 'dokument', 'dokumenty', 'dokumentów');
  await expect(page.getByText(`${ksefCopy.pending} KSeF: ${pending}`)).toBeVisible();
  // Purchases come from KSeF with their number, so only sales can wait for one.
  expect(pendingPurchases).toBe(0);
  await expect(page.getByText(`Październik 2026 · sprzedaż ${pendingSales}`)).toBeVisible();
  await page.keyboard.press('Escape');
  const sales = page.getByRole('tab', { name: 'Rejestr VAT sprzedaży' });
  await expect(page.locator('#tab-sales-figures')).toContainText('2323,00');
  await expect(page.locator('#tab-purchases-figures')).toContainText(
    formatAmount(monthVat('purchases', 10)),
  );
  await page.getByRole('searchbox', { name: 'Szukaj dokumentów' }).fill('Alfa 03');
  await expect(sales.locator('..')).toContainText('1 z 14');
  await expect(page.getByRole('region', { name: 'Podsumowanie rejestru' })).toContainText(
    '-400,00',
  );
});

test('month strip selects a period and shows the year of VAT', async ({ page }) => {
  const months = page.getByRole('radiogroup', { name: 'Miesiąc', exact: true });
  await expect(months.getByRole('radio')).toHaveCount(12);
  await months.getByRole('radio', { name: /^Wrzesień 2026: 13 dokumentów/ }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 13', exact: true })).toBeAttached();
  await months.getByRole('radio', { name: /^Wrzesień 2026/ }).press('ArrowRight');
  await expect(months.getByRole('radio', { name: /^Październik 2026/ })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Dokumenty 14', exact: true })).toBeAttached();
  await page.getByRole('button', { name: 'Poprzedni okres' }).click();
  await expect(months.getByRole('radio', { name: /^Wrzesień 2026/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('period modes: quarter, year, range and back to the month', async ({ page, isMobile }) => {
  const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
  await expect(period).toContainText('JPK_V7M do 25.11.2026');
  await period.getByRole('radio', { name: 'Kwartał' }).click();
  await expect(period).toContainText('IV kwartał 2026');
  await expect(period).toContainText('JPK_V7M za październik do 25.11.2026');
  await expect(page.getByRole('heading', { name: 'Dokumenty 20', exact: true })).toBeAttached();
  // Longer periods group documents under month headings.
  await expect(
    page.getByText('Październik 2026', { exact: true }).filter({ visible: true }),
  ).toBeVisible();
  await period.getByRole('radio', { name: 'Rok' }).click();
  await expect(period).toContainText('Rok 2026');
  await expect(
    isMobile
      ? page.getByText(/^10 z 1[34]\d dokumentów$/)
      : page.getByText('Strona 1 z 14', { exact: true }),
  ).toBeAttached();
  await period.getByRole('radio', { name: 'Zakres' }).click();
  await period.getByRole('button', { name: /^Sierpień 2026/ }).click();
  await period.getByRole('button', { name: /^Październik 2026/ }).click();
  await expect(period).toContainText('Sierpień – październik 2026');
  await expect(page.getByRole('heading', { name: 'Dokumenty 36', exact: true })).toBeAttached();
  // Exact dates live in a dialog behind the range pill.
  await period.getByRole('button', { name: /^Zmień zakres dat/ }).click();
  const range = page.getByRole('dialog', { name: 'Wybierz zakres' });
  await range.getByLabel('Do', { exact: true }).fill('2026-08-15');
  await range.getByRole('button', { name: 'Zastosuj' }).click();
  await expect(range).toBeHidden();
  await expect(period).toContainText('01.08.2026 – 15.08.2026');
  await period.getByRole('radio', { name: 'Miesiąc' }).click();
  await expect(period.getByRole('radio', { name: /^Sierpień 2026/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test(
  'dragging on the month strip moves the period or draws a range',
  { tag: '@desktop' },
  async ({ page }) => {
    const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
    const centre = async (name: RegExp) => {
      const box = (await period.getByRole('radio', { name }).boundingBox())!;
      return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
    };
    const drag = async (from: RegExp, to: RegExp) => {
      const [start, end] = [await centre(from), await centre(to)];
      await page.mouse.move(start.x, start.y);
      await page.mouse.down();
      await page.mouse.move(end.x, start.y, { steps: 8 });
      await page.mouse.up();
    };
    // Grabbing the highlight's edge stretches the period; its sum rides on the lens only
    // while the gesture lasts.
    const strip = (await period.getByRole('radiogroup', { name: 'Miesiąc' }).boundingBox())!;
    const column = strip.width / 12;
    const edge = { x: strip.x + 10 * column, y: strip.y + strip.height / 2 };
    const lens = period.locator('[data-highlight]');
    await page.mouse.move(edge.x - 1, edge.y);
    await page.mouse.down();
    await page.mouse.move(strip.x + 11.5 * column, edge.y, { steps: 8 });
    await expect(lens).toHaveText(/\d\s?zł/);
    await page.mouse.up();
    await expect(lens).toHaveText('');
    // December has not begun: the stretch stops at November.
    await expect(period).toContainText('Październik – listopad 2026');
    await period.getByRole('radio', { name: 'Miesiąc', exact: true }).click();
    await expect(period).toContainText('Październik 2026');
    // Pressing inside the highlight moves the selected month.
    await drag(/^Październik 2026/, /^Listopad 2026/);
    await expect(period).toContainText('Listopad 2026');
    // Pressing elsewhere draws a range of months.
    await drag(/^Marzec 2026/, /^Maj 2026/);
    await expect(period).toContainText('Marzec – maj 2026');
    await expect(period.getByRole('radio', { name: 'Zakres' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
    // Shift + arrow is the keyboard equivalent.
    await period.getByRole('button', { name: /^Marzec 2026/ }).focus();
    await page.keyboard.press('Shift+ArrowRight');
    await expect(period).toContainText('Marzec – czerwiec 2026');
  },
);

test('a finger drags the edge of a range on the phone', { tag: '@phone' }, async ({ page }) => {
  const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
  await period.getByRole('radio', { name: 'Zakres' }).click();
  const handle = period.locator('[data-handle="start"]');
  await expect(handle).toBeVisible();
  const strip = (await period
    .locator('[data-handle]')
    .first()
    .evaluate((el) => {
      const box = el.closest('[role]')!.getBoundingClientRect();
      return { x: box.x, y: box.y + box.height / 2, width: box.width };
    }))!;
  // Emulated touch: pointer events of type touch, as a finger on the handle sends them.
  await page.evaluate(({ x, y, width }) => {
    Element.prototype.setPointerCapture = () => {};
    const handle = document.querySelector('[data-handle="start"]')!;
    const strip = handle.closest('[role]')!;
    const column = width / 12;
    const fire = (target: Element, type: string, month: number) =>
      target.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerType: 'touch',
          pointerId: 7,
          button: 0,
          clientX: x + month * column,
          clientY: y,
        }),
      );
    fire(handle, 'pointerdown', 9);
    fire(strip, 'pointermove', 8.5);
    fire(strip, 'pointermove', 7.5);
    fire(strip, 'pointerup', 7.5);
  }, strip);
  await expect(period).toContainText('Sierpień – październik 2026');
});

test(
  'a held finger moves the highlighted period on the phone',
  { tag: '@phone' },
  async ({ page }) => {
    const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
    const fire = (type: string, month: number) =>
      page.evaluate(
        ({ type, month }) => {
          Element.prototype.setPointerCapture = () => {};
          const strip = document.querySelector('[data-highlight]')!.parentElement!;
          const box = strip.getBoundingClientRect();
          const target =
            type === 'pointerdown'
              ? (document.elementFromPoint(
                  box.x + (month + 0.5) * (box.width / 12),
                  box.y + box.height / 2,
                ) ?? strip)
              : strip;
          target.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              pointerType: 'touch',
              pointerId: 9,
              button: 0,
              clientX: box.x + (month + 0.5) * (box.width / 12),
              clientY: box.y + box.height / 2,
            }),
          );
        },
        { type, month },
      );
    await period.getByRole('radio', { name: /^Październik 2026/ }).scrollIntoViewIfNeeded();
    // Held still for a moment, the finger takes the highlight and carries it.
    await fire('pointerdown', 9);
    await page.waitForTimeout(450);
    await fire('pointermove', 8);
    await fire('pointermove', 7);
    await fire('pointerup', 7);
    await expect(period).toContainText('Sierpień 2026');
  },
);

test('KSeF status views count and narrow the list', async ({ page, isMobile }) => {
  const views = page.getByRole('radiogroup', { name: 'Status KSeF' });
  const october = monthDocuments('sales', 10);
  const pending = unconfirmedIn('sales', 10);
  await expect(
    views.getByRole('radio', { name: new RegExp(`${ksefCopy.pending}\\s*${pending}`) }),
  ).toBeVisible();
  await expect(
    views.getByRole('radio', {
      name: new RegExp(`${ksefCopy.confirmedMany}\\s*${october.length - pending}`),
    }),
  ).toBeVisible();
  const septemberConfirmed = monthDocuments('sales', 9).length - unconfirmedIn('sales', 9);
  await page
    .getByRole('region', { name: 'Okres rozliczeniowy' })
    .getByRole('radio', { name: /^Wrzesień 2026/ })
    .click();
  await views.getByRole('radio', { name: new RegExp(ksefCopy.confirmedMany) }).click();
  await expect(
    page.getByRole('heading', { name: `Dokumenty ${septemberConfirmed}`, exact: true }),
  ).toBeAttached();
  // Phones scroll the same views sideways; the table and its expansion are desktop's.
  if (isMobile) return;
  // The cell shows the number shortened; the full one is in its title.
  await expect(page.getByRole('table')).toContainText('1111111111-…-');
  await expect(
    page.getByRole('table').locator('[title^="1111111111-20260901"]').first(),
  ).toBeAttached();
  // Opening a confirmed document shows the KSeF seal and the completed steps.
  await page
    .getByRole('button', { name: 'Rozwiń dokument FV/1/09/2026/DEMO', exact: true })
    .click();
  await expect(
    page.getByRole('figure', { name: 'Dokument FV/1/09/2026/DEMO' }).filter({ visible: true }),
  ).toContainText('KSeFPotwierdzony');
  await expect(
    page.getByRole('list', { name: 'Obieg dokumentu w KSeF' }).filter({ visible: true }),
  ).toContainText(`${ksefCopy.steps.sent}01.09.2026`);
});

test('top of the page: areas, accounting year and theme', async ({ page, isMobile }) => {
  if (isMobile) {
    // Phones keep the areas in the tab bar; its last item opens the whole map.
    const bar = page.getByRole('navigation', { name: 'Obszary' });
    await expect(bar.getByRole('button', { name: 'Rejestry i VAT' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await bar.getByRole('button', { name: 'Obszary', exact: true }).click();
  } else {
    await expect(page.getByText('Witaj, Preview Reviewer!')).toBeVisible();
    // From 1100px the areas sit in the app bar instead of a line of their own.
    const areas = page.getByRole('banner').getByRole('navigation', { name: 'Obszary' });
    await expect(areas.getByRole('button', { name: 'Rejestry i VAT' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    // Another area opens its own honest screen; its map is one press away.
    await areas.getByRole('button', { name: 'Majątek' }).click();
    await page.getByRole('button', { name: 'Otwórz mapę obszarów' }).click();
  }
  const map = page.getByRole('dialog', { name: 'Obszary księgowe' });
  await expect(map.getByRole('heading', { name: 'Okres księgowy' })).toBeVisible();
  await expect(map).toContainText('2026');
  await expect(map).toContainText('Wymaga konfiguracji');
  await expect(map).toContainText('To jest mapa zakresu');
  for (const name of ['Rejestr VAT', 'KPiR', 'Ewidencja przychodów', 'Pełne księgi', 'Kontrole'])
    await expect(map.getByRole('button', { name: new RegExp(name) })).toBeVisible();
  const kpir = map.getByRole('button', { name: /KPiR/ });
  await kpir.click();
  await expect(kpir).toHaveAttribute('aria-expanded', 'true');
  await map.getByRole('button', { name: 'Zamknij okno' }).click();
  if (!isMobile) await page.getByRole('button', { name: 'Wróć do Rejestrów i VAT' }).click();

  if (isMobile) {
    await page.getByRole('button', { name: 'Konto Preview Reviewer' }).click();
    await page.getByRole('radio', { name: 'Ciemny' }).click();
  } else {
    await page.getByRole('button', { name: 'Włącz ciemny motyw' }).click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  // Scrolled down, the compact title takes the greeting's place instead of overlapping it.
  if (!isMobile) {
    await page.mouse.wheel(0, 900);
    const header = page.locator('header').first();
    // The greeting slides out of its clipped slot.
    const greeting = header.getByText('Witaj, Preview Reviewer!');
    // The compact title is the button that takes the page back up.
    const title = header.getByTitle('Wróć na górę strony');
    await expect(title).toBeVisible();
    await expect
      .poll(async () => {
        const [g, box] = await Promise.all([
          greeting.boundingBox(),
          greeting.locator('..').boundingBox(),
        ]);
        return g && box ? g.y + g.height <= box.y : true;
      })
      .toBe(true);
  }
});

test(
  'phone opens a document in a sheet that a drag puts away',
  { tag: '@phone' },
  async ({ page }) => {
    await page
      .getByRole('button', { name: 'Otwórz dokument FV/1/10/2026/DEMO', exact: true })
      .click();
    const sheet = page.getByRole('dialog', { name: 'Demo Alfa 01' });
    await expect(sheet).toContainText('Rodzaj operacji');
    await expect(sheet).toContainText(`${ksefCopy.seal}${ksefCopy.confirmed}`);
    await expect(sheet).toContainText('1476,00 zł');
    // The sheet grows out of the tapped row: it starts as a strip at the row's place.
    const start = await sheet.evaluate(
      (element) =>
        (element.getAnimations()[0]?.effect as KeyframeEffect | undefined)?.getKeyframes()[0] ??
        null,
    );
    expect(String(start?.clipPath)).toContain('inset');
    expect(String(start?.transform)).toMatch(/translateY\([1-9]/);
    // Once the sheet has risen, drag its grip down past the threshold.
    await sheet.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    const grip = (await sheet.getByRole('heading', { name: 'Demo Alfa 01' }).boundingBox())!;
    await page.mouse.move(grip.x + 20, grip.y + 5);
    await page.mouse.down();
    await page.mouse.move(grip.x + 20, grip.y + 260, { steps: 10 });
    await page.mouse.up();
    await expect(sheet).toBeHidden();
    // The close button folds the sheet back into its row before it goes.
    await page
      .getByRole('button', { name: 'Otwórz dokument FV/2/10/2026/DEMO', exact: true })
      .click();
    const second = page.getByRole('dialog', { name: 'Demo Alfa 02' });
    await second.evaluate((element) =>
      Promise.all(element.getAnimations().map((animation) => animation.finished)),
    );
    await second.getByRole('button', { name: 'Zamknij okno' }).click();
    await expect(second).toBeHidden();
  },
);

test(
  'table headings stay under the page header while a long list scrolls',
  { tag: '@desktop' },
  async ({ page }) => {
    await page
      .getByRole('region', { name: 'Okres rozliczeniowy' })
      .getByRole('radio', { name: 'Rok' })
      .click();
    await page.getByRole('button', { name: /^Dokumenty na stronie/ }).click();
    await page.getByRole('menuitemradio', { name: '50', exact: true }).click();
    await page.mouse.wheel(0, 2400);
    const head = page.getByRole('columnheader', { name: 'Kontrahent' });
    await expect.poll(async () => Math.round((await head.boundingBox())?.y ?? 0)).toBe(72);
  },
);

test('health endpoint is available without credentials', async ({ request }) => {
  const response = await request.get('/healthz');
  expect(response.status()).toBe(200);
  expect(await response.json()).toEqual({ status: 'ok' });
  expect(response.headers()['cache-control']).toBe('no-store');
});

test('concrete filter chips remove only their own criterion', async ({ page }) => {
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  await facetOption(page, 'Rodzaj operacji', /^Faktura/).click();
  await facetOption(page, 'Kod JPK V7', /^GTU_12/).click();
  await page.getByRole('button', { name: /^Pokaż \d+ dokument/ }).click();
  await page.getByRole('button', { name: 'Usuń filtr GTU_12', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Usuń filtr Faktura', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dokumenty 13', exact: true })).toBeVisible();
});

test('filter options show their result counts and toggle off on a second press', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  const correction = facetOption(page, 'Rodzaj operacji', /^Korekta/);
  await expect(correction).toContainText('1');
  await expect(facetOption(page, 'Rodzaj operacji', /^Faktura/)).toContainText('13');
  await expect(page.getByRole('group', { name: 'Rodzaj operacji' })).toContainText('Wszystkie');
  await correction.click();
  await expect(facetOption(page, 'Kod JPK V7', /^GTU_12/)).toBeDisabled();
  await expect(page.getByRole('heading', { name: 'Dokumenty 1', exact: true })).toBeVisible();
  await correction.click();
  await expect(correction).toHaveAttribute('aria-pressed', 'false');
  await expect(page.getByRole('heading', { name: 'Dokumenty 14', exact: true })).toBeVisible();
  await facetOption(page, 'Kod JPK V7', /^GTU_06/).click();
  await page.getByRole('button', { name: 'Wyczyść filtry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 14', exact: true })).toBeVisible();
});

test('mobile summary exposes every amount on demand', async ({ page }) => {
  await openSummary(page);
  const summary = page.getByRole('region', { name: 'Podsumowanie rejestru' });
  for (const amount of ['9700,00 zł', '2323,00 zł', '12 023,00 zł'])
    await expect(summary.getByText(amount, { exact: true }).first()).toBeVisible();
});

test('filter sheet and summary dismiss correctly without changing the selected context', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Filtry', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Filtry', exact: true });
  const size = await dialog.evaluate((element) => ({
    client: element.clientWidth,
    scroll: element.scrollWidth,
    width: element.getBoundingClientRect().width,
    left: element.getBoundingClientRect().left,
    right: element.getBoundingClientRect().right,
    viewport: innerWidth,
  }));
  expect(size.scroll).toBeLessThanOrEqual(size.client + 1);
  expect(size.width).toBeLessThanOrEqual(size.viewport);
  if (size.viewport <= 760) {
    expect(size.width).toBeCloseTo(size.viewport, 0);
    expect(size.left).toBeCloseTo(0, 0);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('button', { name: 'Filtry', exact: true })).toBeFocused();
  await openSummary(page);
  await page.getByRole('button', { name: 'Kwoty według stawek VAT' }).click();
  await expect(page.locator('#vat-rates')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#vat-rates')).not.toBeVisible();
  // Phones show the breakdown as a sheet, so a tap on the dim puts it away; desktop
  // keeps it in the sheet until it is collapsed.
  await openSummary(page);
  await page.getByRole('button', { name: 'Kwoty według stawek VAT' }).click();
  if (page.viewportSize()!.width <= 760) {
    await expect(page.locator('#vat-rates')).toBeVisible();
    await page.mouse.click(160, 40);
    await expect(page.locator('#vat-rates')).not.toBeVisible();
  } else await page.getByRole('button', { name: 'Zwiń stawki' }).click();
  await expect(page.locator('#vat-rates')).not.toBeVisible();
  await expect(page.getByRole('radio', { name: /^Październik 2026/ })).toHaveAttribute(
    'aria-checked',
    'true',
  );
});

test('demo states are reachable in two clicks and the state is in view', async ({ page }) => {
  await page.getByRole('button', { name: 'Stan danych demo' }).click();
  const dialog = page.getByRole('dialog', { name: 'Stan danych demo' });
  await expect(dialog.getByRole('radio')).toHaveCount(3);
  await expect(dialog.getByRole('radio', { name: /Z danymi/ })).toBeChecked();
  await dialog.getByRole('radio', { name: /Błąd wczytywania/ }).click();
  await expect(dialog).toBeHidden();
  await expect(
    page.locator('[data-register-state]').filter({ visible: true }).first(),
  ).toBeInViewport();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.getByRole('button', { name: 'Stan danych demo' }).click();
  await expect(dialog.getByRole('radio', { name: /Błąd wczytywania/ })).toBeChecked();
  await dialog.getByRole('radio', { name: /Z danymi/ }).click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 14', exact: true })).toBeAttached();
});

test('axis shows the due amount for the selected month', async ({ page, isMobile }) => {
  const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
  const october = period.getByRole('radio', { name: /^Październik 2026/ });
  await expect(october).toHaveAccessibleName(/do zapłaty 984,90\szł/);
  await expect(period).toContainText('984,90 zł');
  // At rest the lens says nothing: the summary beside it already does.
  if (isMobile) return;
  await expect(period.locator('[data-highlight]')).toHaveText('');
  // The return's own amount, in whole złoty as tax returns round, is one click away.
  await page.getByRole('button', { name: 'Kwoty według stawek VAT' }).click();
  const settlement = page.getByRole('group', { name: 'Kwoty według stawek VAT' });
  const due = monthVat('sales', 10) - monthVat('purchases', 10);
  await expect(settlement).toContainText(
    new RegExp(`Kwota do wpłaty w JPK \\(w pełnych złotych\\)\\s*${formatMoneyWhole(due)}`),
  );
  // A quarter has no return of its own: each month rounds separately.
  await period.getByRole('radio', { name: 'Kwartał' }).click();
  await expect(period.locator('[data-highlight]')).toHaveText('');
  await expect(settlement).not.toContainText('Kwota do wpłaty w JPK');
  await expect(period).not.toContainText('tys.');
});

test(
  'June shows a surplus and the tooltip lists należny, naliczony, do zapłaty',
  { tag: '@desktop' },
  async ({ page }) => {
    const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
    const june = period.getByRole('radio', { name: /^Czerwiec 2026/ });
    await expect(june).toHaveAccessibleName(/nadwyżka/);
    await june.hover();
    await expect(june).toContainText('nadwyżka');
    const october = period.getByRole('radio', { name: /^Październik 2026/ });
    await october.hover();
    for (const text of ['należny 2323,00 zł', 'naliczony 1338,10 zł', 'do zapłaty 984,90 zł'])
      await expect(october).toContainText(text);
    await june.click();
    await expect(period).toContainText('Nadwyżka VAT naliczonego');
  },
);

test('rates expand inside the sheet on desktop', { tag: '@desktop' }, async ({ page }) => {
  await page.getByRole('button', { name: 'Kwoty według stawek VAT' }).click();
  const rates = page.locator('#vat-rates');
  await expect(rates).toBeVisible();
  await expect(rates.getByRole('table')).toContainText('23%');
  await rates.scrollIntoViewIfNeeded();
  const box = (await rates.boundingBox())!;
  expect(box.y + box.height).toBeLessThanOrEqual(page.viewportSize()!.height);
  // In the flow of the sheet: the toolbar moves down below it.
  await expect
    .poll(async () => (await page.getByRole('searchbox').boundingBox())!.y)
    .toBeGreaterThan(box.y + box.height - 1);
  await page.getByRole('button', { name: 'Zwiń stawki' }).click();
  await expect(rates).toBeHidden();
});

for (const [name, value, message] of [
  ['error', 'error', 'Nie udało się wczytać rejestru'],
  ['empty', 'empty', 'Brak dokumentów'],
] as const)
  test(`${name} state is visible without scrolling`, async ({ page }) => {
    if (!test.info().project.name.includes('small'))
      await page.setViewportSize(
        test.info().project.name === 'desktop-chromium'
          ? { width: 1440, height: 900 }
          : { width: 375, height: 667 },
      );
    await setDemoState(page, value);
    // Once loaded, a chosen state scrolls its message into view; let that settle first.
    await expect(
      page.locator('[data-register-state]').filter({ visible: true }).first(),
    ).toBeVisible();
    await page.evaluate(
      () =>
        new Promise<void>((resolve) => {
          let last = -1;
          const check = () =>
            scrollY === last ? resolve() : ((last = scrollY), setTimeout(check, 120));
          check();
        }),
    );
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(page.getByText(message).filter({ visible: true }).first()).toBeInViewport();
  });

test('notifications lead to what they are about', async ({ page }) => {
  const notice = async (name: RegExp) => {
    await page.getByRole('button', { name: /^Powiadomienia/ }).click();
    // The notices live in the header's menu; the capsule below repeats some of their words.
    await page.getByRole('banner').getByRole('button', { name }).click();
  };
  await notice(/^Brak potwierdzenia KSeF/);
  await expect(
    page.getByRole('heading', { name: `Dokumenty ${unconfirmedIn('sales', 10)}`, exact: true }),
  ).toBeAttached();
  await notice(/^JPK_V7M/);
  await expect(page.getByRole('region', { name: 'Okres rozliczeniowy' })).toBeInViewport();
  await notice(/^Kontekst VAT wymaga potwierdzenia/);
  await expect(page.locator('details[data-context]')).toHaveAttribute('open', '');
  await page.keyboard.press('Escape');
  await notice(/^Okres księgowy 2026/);
  await expect(page.getByRole('dialog', { name: 'Obszary księgowe' })).toBeVisible();
});

test('typing gtu offers the JPK filter', async ({ page }) => {
  const search = page.getByRole('searchbox', { name: 'Szukaj dokumentów' });
  await search.fill('gtu');
  const options = page.getByRole('listbox', { name: 'Podpowiedzi filtrów' }).getByRole('option');
  await expect(options).toHaveCount(2);
  await expect(options.first()).toContainText('Kod JPK V7 · GTU_');
  await search.press('ArrowDown');
  await expect(options.nth(1)).toHaveAttribute('aria-selected', 'true');
  await search.press('Enter');
  await expect(search).toHaveValue('');
  await expect(page.getByRole('button', { name: /^Usuń filtr GTU_/ })).toBeVisible();
});

test('another area keeps the register as it was', async ({ page, isMobile }) => {
  await page.getByRole('searchbox', { name: 'Szukaj dokumentów' }).fill('Alfa 0');
  await page
    .getByRole('region', { name: 'Okres rozliczeniowy' })
    .getByRole('radio', { name: /^Wrzesień 2026/ })
    .click();
  const areas = isMobile
    ? page.getByRole('navigation', { name: 'Obszary' })
    : page.getByRole('banner').getByRole('navigation', { name: 'Obszary' });
  await areas.getByRole('button', { name: 'Majątek' }).click();
  await expect(page).toHaveURL(/#majatek$/);
  await expect(page.getByRole('heading', { name: 'Majątek', level: 1 })).toBeVisible();
  await expect(areas.getByRole('button', { name: 'Majątek' })).toHaveAttribute(
    'aria-current',
    'page',
  );
  await page.getByRole('button', { name: 'Wróć do Rejestrów i VAT' }).click();
  await expect(page.getByRole('heading', { name: 'Rejestry i VAT', level: 1 })).toBeVisible();
  await expect(page.getByRole('searchbox', { name: 'Szukaj dokumentów' })).toHaveValue('Alfa 0');
  await expect(
    page
      .getByRole('region', { name: 'Okres rozliczeniowy' })
      .getByRole('radio', { name: /^Wrzesień 2026/ }),
  ).toHaveAttribute('aria-checked', 'true');
});

test(
  'a sideways swipe turns to the next document in the sheet',
  { tag: '@phone' },
  async ({ page }) => {
    await page
      .getByRole('button', { name: 'Otwórz dokument FV/1/10/2026/DEMO', exact: true })
      .click();
    const sheet = page.getByRole('dialog', { name: 'Demo Alfa 01' });
    await expect(sheet).toContainText('1 z 14');
    const paper = sheet.getByTestId('document-paper');
    const box = (await paper.boundingBox())!;
    const y = box.y + 80;
    const pointer = { pointerId: 7, pointerType: 'touch', isPrimary: true, button: 0 };
    await paper.dispatchEvent('pointerdown', { ...pointer, clientX: box.x + 260, clientY: y });
    for (const x of [240, 200, 150, 100])
      await paper.dispatchEvent('pointermove', { ...pointer, clientX: box.x + x, clientY: y });
    await paper.dispatchEvent('pointerup', { ...pointer, clientX: box.x + 100, clientY: y });
    await expect(page.getByRole('dialog', { name: 'Demo Alfa 02' })).toContainText('2 z 14');
  },
);

test(
  'row actions copy the number and set a label with undo',
  { tag: '@desktop' },
  async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    const row = page.getByRole('row', { name: /^Demo Alfa 02/ });
    await row.hover();
    await page.getByRole('button', { name: 'Kopiuj numer FV/2/10/2026/DEMO' }).click();
    await expect(page.getByText('Skopiowano numer dokumentu.')).toBeVisible();
    await page.getByRole('button', { name: 'Etykieta dokumentu FV/2/10/2026/DEMO' }).click();
    await page.getByRole('menuitemradio', { name: 'Do sprawdzenia' }).click();
    await expect(page.getByText('Ustawiono etykietę: Do sprawdzenia')).toBeVisible();
    await expect(row.locator('[title="Do sprawdzenia"]')).toBeAttached();
    await page.getByRole('button', { name: 'Cofnij' }).click();
    await expect(row.locator('[title="Do sprawdzenia"]')).toHaveCount(0);
  },
);

test('month groups fold to their heading and open again', async ({ page }) => {
  const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
  await period.getByRole('radio', { name: 'Rok' }).click();
  const heading = page.locator('button[data-month]').filter({ visible: true }).first();
  const documents = page
    .getByRole('button', { name: /^(Rozwiń|Otwórz) dokument/ })
    .filter({ visible: true });
  await expect(heading).toHaveAttribute('aria-expanded', 'true');
  const before = await documents.count();
  const month = await heading.getAttribute('data-month');
  await heading.click();
  await expect(heading).toHaveAttribute('aria-expanded', 'false');
  // The next month moves up into the freed place.
  await expect(page.locator('button[data-month]').filter({ visible: true })).not.toHaveCount(1);
  await expect(page.locator(`button[data-month="${month}"]`).filter({ visible: true })).toHaveCount(
    1,
  );
  await heading.click();
  await expect(heading).toHaveAttribute('aria-expanded', 'true');
  await expect(documents).toHaveCount(before);
});

test('dark theme has no serious accessibility violations in any state', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const audit = async () => {
    // A tooltip fading under a resting pointer is not part of the screen being audited.
    await page.mouse.move(0, 0);
    return (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
      .violations;
  };
  expect(await audit()).toEqual([]);
  await openDocument(page, 'FV/1/10/2026/DEMO');
  expect(await audit()).toEqual([]);
  await closeDocument(page, 'FV/1/10/2026/DEMO');
  for (const [state, title] of [
    ['empty', /Brak dokumentów/],
    ['error', 'Nie udało się wczytać rejestru'],
  ] as const) {
    await setDemoState(page, state);
    await expect(page.getByText(title).filter({ visible: true }).first()).toBeVisible();
    expect(await audit()).toEqual([]);
  }
});

test('arrow keys step the month when the page has focus', { tag: '@desktop' }, async ({ page }) => {
  const title = page.locator('p[aria-live="polite"]', { hasText: /2026$/ }).first();
  await expect(title).toHaveText('Październik 2026');
  await page.locator('body').click({ position: { x: 4, y: 300 } });
  await page.keyboard.press('ArrowLeft');
  await expect(title).toHaveText('Wrzesień 2026');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('ArrowRight');
  await expect(title).toHaveText('Listopad 2026');
  // December has not begun: the key does nothing.
  await page.keyboard.press('ArrowRight');
  await expect(title).toHaveText('Listopad 2026');
  // In the search field the arrows stay the field's.
  await page.getByRole('searchbox').focus();
  await page.keyboard.press('ArrowLeft');
  await expect(title).toHaveText('Listopad 2026');
});

test('a sideways swipe on the period steps the month', { tag: '@phone' }, async ({ page }) => {
  const summary = page.locator('[aria-live="polite"]', { hasText: /2026$/ }).first();
  await expect(summary).toHaveText('Październik 2026');
  const box = (await summary.boundingBox())!;
  const y = box.y + box.height / 2;
  await summary.evaluate(
    (element, { y }) => {
      const target = element.parentElement!.parentElement!;
      const fire = (type: string, x: number) =>
        target.dispatchEvent(
          new PointerEvent(type, {
            bubbles: true,
            pointerId: 7,
            pointerType: 'touch',
            isPrimary: true,
            button: 0,
            clientX: x,
            clientY: y,
          }),
        );
      fire('pointerdown', 120);
      fire('pointermove', 180);
      fire('pointermove', 240);
      fire('pointerup', 240);
    },
    { y },
  );
  await expect(summary).toHaveText('Wrzesień 2026');
});

test('the compact title in the header takes the page back up', async ({ page }) => {
  await page.evaluate(() => scrollTo(0, 1600));
  const back = page.getByTitle('Wróć na górę strony');
  await expect(back).toBeVisible();
  await back.click();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeLessThan(5);
});

test('the guided tour opens on request, steps through and closes', async ({ page, isMobile }) => {
  // Nothing starts by itself.
  await expect(page.getByRole('dialog', { name: 'Przewodnik po ekranie' })).toHaveCount(0);
  if (isMobile) {
    await page.getByRole('button', { name: /^Konto Preview/ }).click();
    await page.getByRole('button', { name: /^Jak to działa/ }).click();
  } else {
    await page.getByRole('button', { name: /^Jak to działa/ }).click();
  }
  const tour = page.getByRole('dialog', { name: 'Przewodnik po ekranie' });
  await expect(tour).toContainText('1 z 5');
  // The page behind the tour is inert while it is open.
  expect(
    await page.evaluate(() => Boolean(document.querySelector('main')?.closest('[inert]'))),
  ).toBe(true);
  await expect(tour.getByRole('button', { name: 'Dalej' })).toBeFocused();
  const audit = await new AxeBuilder({ page })
    .include('[aria-label="Przewodnik po ekranie"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
    .analyze();
  expect(audit.violations).toEqual([]);
  await tour.getByRole('button', { name: 'Dalej' }).click();
  await expect(tour).toContainText('Dwa rejestry');
  await tour.getByRole('button', { name: 'Wstecz' }).click();
  await expect(tour).toContainText('Okres');
  for (let i = 0; i < 4; i++) await tour.getByRole('button', { name: 'Dalej' }).click();
  await expect(tour).toContainText('5 z 5');
  await tour.getByRole('button', { name: 'Gotowe' }).click();
  await expect(tour).toHaveCount(0);
  expect(
    await page.evaluate(() => Boolean(document.querySelector('main')?.closest('[inert]'))),
  ).toBe(false);
  if (!isMobile) {
    await page.getByRole('button', { name: /^Jak to działa/ }).click();
    await page.keyboard.press('Escape');
    await expect(tour).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Jak to działa/ })).toBeFocused();
  }
});

test(
  'a failed register keeps the header in place and tours only what is there',
  { tag: '@desktop' },
  async ({ page }) => {
    const nav = page.getByRole('banner').getByRole('button', { name: 'Rejestry i VAT' });
    const before = (await nav.boundingBox())?.x;
    await setDemoState(page, 'error');
    await expect(page.getByText('Wystąpił problem z pobraniem dokumentów.').first()).toBeVisible();
    expect((await nav.boundingBox())?.x).toBe(before);
    await page.getByRole('button', { name: /^Jak to działa/ }).click();
    const tour = page.getByRole('dialog', { name: 'Przewodnik po ekranie' });
    await expect(tour).toContainText('1 z 3');
  },
);

test('the address keeps the period, register and KSeF view across a reload', async ({ page }) => {
  await openRegister(page, '/?period=2026-Q3&register=purchases&ksef=confirmed');
  const period = page.getByRole('region', { name: 'Okres rozliczeniowy' });
  await expect(period).toContainText('III kwartał 2026');
  await expect(page.getByRole('tab', { name: 'Rejestr VAT zakupów' })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(
    page
      .getByRole('radiogroup', { name: 'Status KSeF' })
      .first()
      .getByRole('radio', {
        name: /^Potwierdzone/,
      }),
  ).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('button', { name: 'Następny okres' }).click();
  await expect(page).toHaveURL(/period=2026-Q4/);
  await page.reload();
  await expect(period).toContainText('IV kwartał 2026');
  await expect(page).toHaveURL(/register=purchases/);
});

test('phones sort the documents from the filter sheet', { tag: '@phone' }, async ({ page }) => {
  const october = monthDocuments('sales', 10);
  const byGross = [...october].sort((a, b) => a.net + a.vat - (b.net + b.vat));
  const firstCard = page
    .getByRole('button', { name: /^Otwórz dokument / })
    .filter({ visible: true })
    .first();
  await expect(firstCard).toHaveAccessibleName(documentCopy.open(october[0].number));

  const sortBy = async (column: string) => {
    await page
      .getByRole('button', { name: 'Filtry', exact: true })
      .filter({ visible: true })
      .click();
    const sheet = page.getByRole('dialog', { name: 'Filtry' });
    const option = sheet
      .getByRole('group', { name: /Sortuj według/ })
      .getByRole('button', { name: new RegExp(`^${column}`) });
    await option.click();
    await expect(option).toHaveAttribute('aria-pressed', 'true');
    await sheet.getByRole('button', { name: /^Pokaż / }).click();
    await expect(sheet).toBeHidden();
  };

  await sortBy('Brutto');
  await expect(firstCard).toHaveAccessibleName(documentCopy.open(byGross[0].number));
  await sortBy('Brutto');
  await expect(firstCard).toHaveAccessibleName(documentCopy.open(byGross.at(-1)!.number));
});

test(
  'a phone shows the KSeF status once: in its row of views',
  { tag: '@phone' },
  async ({ page }) => {
    await page
      .getByRole('radiogroup', { name: 'Status KSeF' })
      .filter({ visible: true })
      .getByRole('radio', { name: new RegExp(ksefCopy.pending) })
      .click();
    await expect(
      page
        .getByRole('button', { name: `Usuń filtr ${ksefCopy.pending}` })
        .filter({ visible: true }),
    ).toHaveCount(0);
    await page
      .getByRole('button', { name: 'Filtry', exact: true })
      .filter({ visible: true })
      .click();
    const sheet = page.getByRole('dialog', { name: 'Filtry' });
    await expect(sheet).toBeVisible();
    await expect(sheet).not.toContainText('Status KSeF');
  },
);

test(
  'a network failure shows the error state and retry recovers',
  { tag: '@desktop' },
  async ({ page }) => {
    // Whatever state is asked for, the request never arrives.
    await page.route('**/api/register**', (route) => route.abort());
    await setDemoState(page, 'empty');
    await expect(
      page.getByText('Nie udało się wczytać rejestru').filter({ visible: true }).first(),
    ).toBeVisible();
    // The address keeps what was asked for; a chance failure never sticks to a link.
    await expect(page).toHaveURL(/state=empty/);
    await page.unroute('**/api/register**');
    await page
      .getByRole('button', { name: 'Spróbuj ponownie' })
      .filter({ visible: true })
      .first()
      .click();
    await expect(page.getByRole('heading', { name: 'Dokumenty 14' })).toBeVisible();
    await expect(page).not.toHaveURL(/state=/);
  },
);

test('an opened document leads to all of its contractor’s documents of the year', async ({
  page,
}) => {
  const count = contractorDocuments(createDocuments(), 'sales', 2026, 'Demo Alfa 01').length;
  await openDocument(page, 'FV/1/10/2026/DEMO');
  await page
    .getByRole('button', {
      name: `Pokaż wszystkie dokumenty kontrahenta Demo Alfa 01 w 2026 (${count})`,
    })
    .filter({ visible: true })
    .click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('searchbox')).toHaveValue('Demo Alfa 01');
  await expect(
    page.getByRole('heading', { name: `Dokumenty ${count}`, exact: true }),
  ).toBeAttached();
  await expect(page).toHaveURL(/period=2026&.*q=Demo\+Alfa\+01/);
});

test(
  'Escape closes the opened document and returns to its chevron',
  { tag: '@desktop' },
  async ({ page }) => {
    await openDocument(page, 'FV/1/10/2026/DEMO');
    const note = page.getByPlaceholder('Dodaj notatkę do dokumentu').filter({ visible: true });
    await note.focus();
    await page.keyboard.press('Escape');
    const chevron = page.getByRole('button', {
      name: 'Rozwiń dokument FV/1/10/2026/DEMO',
      exact: true,
    });
    await expect(chevron).toHaveAttribute('aria-expanded', 'false');
    await expect(chevron).toBeFocused();
  },
);

test('a purchase is received through KSeF, so its steps say so', async ({ page }) => {
  await page.getByRole('tab', { name: 'Rejestr VAT zakupów' }).click();
  await openDocument(page, '153/10/2026');
  const steps = page.getByRole('list', { name: documentCopy.ksefWay }).filter({ visible: true });
  await expect(steps).toContainText(ksefCopy.purchaseSteps.issued);
  await expect(steps).toContainText(ksefCopy.purchaseSteps.sent);
  await expect(steps).toContainText(ksefCopy.purchaseSteps.confirmed);
  await expect(steps).not.toContainText(ksefCopy.steps.sent);
});

test('the address opens the empty and error states directly', async ({ page }) => {
  await openRegister(page, '/?state=empty');
  await expect(
    page.getByText('Brak dokumentów w październiku 2026').filter({ visible: true }).first(),
  ).toBeVisible();
  await openRegister(page, '/?state=error');
  await expect(
    page.getByText('Nie udało się wczytać rejestru').filter({ visible: true }).first(),
  ).toBeVisible();
  await page
    .getByRole('button', { name: 'Spróbuj ponownie' })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 14' })).toBeVisible();
  await expect(page).not.toHaveURL(/state=/);
});

test('the JPK deadline lists the invoices still without a KSeF number', async ({ page }) => {
  const missing = page
    .getByRole('button', { name: /faktury bez numeru KSeF/ })
    .filter({ visible: true });
  await expect(missing).toHaveText(/^4 faktury bez numeru KSeF/);
  // A quarter counts the month its shown deadline is for, not the whole quarter.
  await page.getByRole('radio', { name: 'Kwartał' }).filter({ visible: true }).first().click();
  await expect(missing).toHaveText(/^4 faktury/);
  await missing.click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 4', exact: true })).toBeVisible();
  await expect(page).toHaveURL(/ksef=pending/);
  await expect(page).not.toHaveURL(/period=/);
  // September: two; July: none, and nothing is said.
  await openRegister(page, '/?period=2026-09');
  await expect(missing).toHaveText(/^2 faktury/);
  await openRegister(page, '/?period=2026-07');
  await expect(missing).toHaveCount(0);
  await openRegister(page, '/?state=empty');
  await expect(missing).toHaveCount(0);
});

test('a waiting sale can be checked in KSeF, and every count follows', async ({ page }) => {
  const missing = page
    .getByRole('button', { name: /faktury bez numeru KSeF/ })
    .filter({ visible: true });
  await missing.click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 4', exact: true })).toBeVisible();
  await openDocument(page, 'FV/11/10/2026/DEMO');
  const check = page
    .getByRole('button', { name: 'Sprawdź status w KSeF' })
    .filter({ visible: true });
  // The demo says it only simulates KSeF.
  await expect(check).toHaveAttribute('title', /symulowany/);
  await check.click();
  const steps = page.getByRole('list', { name: documentCopy.ksefWay }).filter({ visible: true });
  await expect(steps).toContainText(/1111111111-…-[0-9A-F]{2}/);
  await expect(
    page.getByText(/KSeF nadał numer 1111111111-…-[0-9A-F]{2} \(dane demo\)/),
  ).toBeVisible();
  // Once the seal has drawn, the register takes the number: the waiting list is one shorter.
  await expect(page.getByRole('heading', { name: 'Dokumenty 3', exact: true })).toBeVisible();
  await expect(missing).toHaveText(/^3 faktury/);
  // The export carries the new number too.
  await page.keyboard.press('Escape');
  await page
    .getByRole('radio', { name: /^Wszystkie/ })
    .filter({ visible: true })
    .first()
    .click();
  const action = page.getByRole('button', { name: 'Eksportuj CSV', exact: true });
  if (!(await action.isVisible()))
    await page.getByRole('button', { name: 'Więcej działań' }).click();
  const download = page.waitForEvent('download');
  await action.click();
  const csv = await readFile(await (await download).path(), 'utf8');
  const line = csv.split('\n').find((row) => row.includes('FV/11/10/2026/DEMO'))!;
  expect(line).toMatch(/1111111111-20261011-[0-9A-F]{12}-[0-9A-F]{2}/);
});
