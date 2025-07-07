import { test } from '@playwright/test';
import path from 'path';
import { findElements } from '../lib/UIElementScanner.js';
import { captureSnapshot, compareSnapshots } from '../lib/SnapshotManager.js';

test.describe('Visual regression', () => {
  test('scan and capture element snapshots', async ({ page }, testInfo) => {
    const indexPath = path.join(testInfo.config.rootDir, 'index.html');
    await page.goto('file://' + indexPath);

    const elements = findElements(page);
    for (const locator of elements) {
      await captureSnapshot(locator, 'default', testInfo);
    }
  });

  test('compare against baseline', async ({ page }, testInfo) => {
    const indexPath = path.join(testInfo.config.rootDir, 'index.html');
    await page.goto('file://' + indexPath);

    const elements = findElements(page);
    for (const locator of elements) {
      await compareSnapshots(locator, 'default', testInfo);
    }
  });
});
