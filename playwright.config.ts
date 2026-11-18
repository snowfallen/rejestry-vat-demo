import { defineConfig, devices } from '@playwright/test';

const deployedUrl = process.env.PLAYWRIGHT_BASE_URL;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  // Shared CI runners are slower and noisier than a workstation; locally a test passes
  // the first time or fails.
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 3,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: deployedUrl ?? 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // Tests tagged @desktop or @phone run only where they apply, so nothing is skipped.
    {
      name: 'desktop-chromium',
      grepInvert: /@phone/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 1000 } },
    },
    {
      name: 'iphone-se-webkit',
      grepInvert: /@desktop/,
      use: {
        ...devices['iPhone SE'],
        browserName: 'webkit',
        viewport: { width: 375, height: 667 },
      },
    },
    {
      name: 'small-se-webkit',
      grepInvert: /@desktop/,
      use: {
        ...devices['iPhone SE'],
        browserName: 'webkit',
        viewport: { width: 320, height: 568 },
      },
    },
  ],
  webServer: deployedUrl
    ? undefined
    : {
        command: 'node scripts/start-production.mjs --port 3101',
        url: 'http://127.0.0.1:3101/healthz',
        reuseExistingServer: !process.env.CI,
        timeout: 30000,
      },
});
