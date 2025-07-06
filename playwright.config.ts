import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: /ui-screens\.spec\.ts/,
  timeout: 60_000,
  globalSetup: './tests/e2e/global-setup.ts',
  use: {
    headless: true,
  },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
});
