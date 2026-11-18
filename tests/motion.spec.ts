import { mkdir, writeFile } from 'node:fs/promises';
import { test, expect, type Locator } from '@playwright/test';
import { openRegister } from './hydrated';

/**
 * Presses `button` inside the page and samples the panel's height every frame until it
 * settles. Pressing in the same task as the first sample keeps a slow machine's
 * click latency out of the measurement.
 */
async function pressAndSample(button: Locator, panel: Locator) {
  const handle = await button.elementHandle();
  return panel.evaluate(async (element, trigger) => {
    const samples: { elapsed: number; height: number }[] = [];
    (trigger as HTMLElement).click();
    const start = performance.now();
    samples.push({ elapsed: 0, height: element.getBoundingClientRect().height });
    await new Promise<void>((resolve) => {
      function frame(now: number) {
        samples.push({ elapsed: now - start, height: element.getBoundingClientRect().height });
        // At least the 220 ms the motion lasts, then until the height settles (slow
        // machines draw few frames), at most 1.5 s.
        const [a, b] = samples.slice(-2);
        const settled = a && b && a.height === b.height;
        if ((now - start >= 270 && settled) || now - start >= 1500) resolve();
        else requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    });
    return samples;
  }, handle);
}

test(
  'disclosure animates in both directions and respects reduced motion',
  { tag: '@desktop' },
  async ({ page }, info) => {
    await openRegister(page);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    const toggle = page.getByRole('button', {
      name: 'Rozwiń dokument FV/1/10/2026/DEMO',
      exact: true,
    });
    const panel = page.locator(`#${await toggle.getAttribute('aria-controls')}`);
    await toggle.scrollIntoViewIfNeeded();
    const opening = await pressAndSample(toggle, panel);
    const fullHeight = opening.at(-1)!.height;
    expect(fullHeight).toBeGreaterThan(100);
    expect(opening.some(({ height }) => height > 0 && height < fullHeight - 1)).toBeTruthy();
    const collapse = page.getByRole('button', {
      name: 'Zwiń dokument FV/1/10/2026/DEMO',
      exact: true,
    });
    const closing = await pressAndSample(collapse, panel);
    expect(closing.some(({ height }) => height > 0 && height < fullHeight - 1)).toBeTruthy();
    expect(closing.at(-1)!.height).toBe(0);
    await expect(panel).toHaveAttribute('inert', '');

    await page.emulateMedia({ reducedMotion: 'reduce' });
    await toggle.click();
    const duration = await panel.evaluate((element) =>
      parseFloat(getComputedStyle(element).transitionDuration),
    );
    expect(duration).toBeLessThanOrEqual(0.001);
    await expect(panel).toHaveAttribute('aria-hidden', 'false');
    await expect(panel.getByText('Szczegóły dokumentu', { exact: true })).toBeVisible();
    await mkdir('test-results/screens', { recursive: true });
    await writeFile(
      `test-results/screens/motion-${info.project.name}.json`,
      JSON.stringify({ opening, closing, reducedMotionDurationSeconds: duration }, null, 2),
    );
  },
);

test('the entrance plays once per session and never blocks a click', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await openRegister(page);
  await expect(page.locator('html')).toHaveAttribute('data-intro', '');
  // Clickable while it plays.
  await expect.poll(() => page.evaluate(() => document.getAnimations().length)).toBeGreaterThan(0);
  const september = page
    .getByRole('region', { name: 'Okres rozliczeniowy' })
    .getByRole('radio', { name: /^Wrzesień 2026/ });
  await september.click();
  await expect(september).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('html')).not.toHaveAttribute('data-intro', '', { timeout: 3000 });
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-intro', '');
});
