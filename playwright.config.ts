import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /ui-screens\.spec\.ts/,
  timeout: 60_000,
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    headless: true,
    trace: 'on-first-retry',
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  projects: [{ name: 'Electron App' }],
});
