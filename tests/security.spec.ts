import { test, expect, type Page } from '@playwright/test';
import { setDemoState } from './demo-state';
import { openDocument } from './documents';
import { openRegister } from './hydrated';

// The policy is strict (scripts only with this request's nonce), so a page that quietly
// breaks under it is the failure to catch: every interaction below must run clean.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('rv-intro', '1');
    const seen: string[] = [];
    (window as unknown as { __csp: string[] }).__csp = seen;
    document.addEventListener('securitypolicyviolation', (event) =>
      seen.push(`${event.violatedDirective} ${event.blockedURI}`),
    );
  });
});

const violations = (page: Page) =>
  page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);

test('the page runs without a single policy violation', async ({ page, isMobile }) => {
  const refused: string[] = [];
  page.on('console', (message) => {
    const text = message.text();
    if (/Content Security Policy|Refused to/i.test(text)) refused.push(text);
  });
  await openRegister(page);
  // The theme script ran: the page has a theme before React.
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);

  if (isMobile) {
    await page.getByRole('button', { name: 'Konto Preview Reviewer' }).click();
    await page.getByRole('radio', { name: 'Ciemny' }).click();
    await page.keyboard.press('Escape');
  } else {
    await page.getByRole('button', { name: 'Włącz ciemny motyw' }).click();
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');

  await openDocument(page, 'FV/1/10/2026/DEMO');
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Filtry', exact: true }).filter({ visible: true }).click();
  await expect(page.getByRole('dialog', { name: 'Filtry', exact: true })).toBeVisible();
  await page.keyboard.press('Escape');

  // The CSV leaves through a blob: URL.
  const exportButton = page.getByRole('button', { name: 'Eksportuj CSV', exact: true });
  if (!(await exportButton.isVisible()))
    await page.getByRole('button', { name: 'Więcej działań' }).click();
  const download = page.waitForEvent('download');
  await exportButton.click();
  await download;

  await setDemoState(page, 'error');
  await page
    .getByRole('button', { name: 'Spróbuj ponownie' })
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'Dokumenty 14' })).toBeVisible();

  expect(await violations(page)).toEqual([]);

  await page.goto('/nie-ma-takiej-strony');
  await expect(page.getByRole('heading').first()).toBeVisible();
  expect(await violations(page)).toEqual([]);
  expect(refused).toEqual([]);
});

test(
  'pages carry a nonce policy and the security headers',
  { tag: '@desktop' },
  async ({ request }) => {
    const first = await request.get('/');
    const headers = first.headers();
    expect(headers['content-security-policy']).toMatch(
      /script-src 'self' 'nonce-[^']+' 'strict-dynamic'/,
    );
    expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
    expect(headers['x-content-type-options']).toBe('nosniff');
    expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
    expect(headers['strict-transport-security']).toContain('max-age=');
    expect(headers['cross-origin-opener-policy']).toBe('same-origin');
    // A fresh nonce on every request.
    const second = (await request.get('/')).headers()['content-security-policy'];
    expect(second).not.toBe(headers['content-security-policy']);
  },
);
