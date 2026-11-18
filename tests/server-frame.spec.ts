import { test, expect } from '@playwright/test';
import { formatAmount } from '../src/lib/format';
import { monthVat } from './fixture-numbers';

// The server's frame is what a slow phone shows first: it must already be true.
test.use({ javaScriptEnabled: false });

test('the first frame states the VAT to pay before any script runs', async ({ page }) => {
  await page.goto('/');
  const due = monthVat('sales', 10) - monthVat('purchases', 10);
  await expect(page.getByText(`${formatAmount(due)} zł`, { exact: true }).first()).toBeVisible();
});

test('a state in the address is the first frame too', async ({ page }) => {
  await page.goto('/?state=error');
  await expect(
    page.getByText('Nie udało się wczytać rejestru').filter({ visible: true }).first(),
  ).toBeVisible();
});
