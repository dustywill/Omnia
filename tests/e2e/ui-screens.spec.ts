import { test, expect } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const OUTPUT_DIR = path.join(__dirname, '../output');

// Ensure the output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/** Utility to grab computed styles for the app container */
async function getAppStyles(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const el = document.querySelector('#app') as HTMLElement;
    if (!el) return {};
    const computed = window.getComputedStyle(el);
    return Array.from(computed).reduce<Record<string, string>>((acc, prop) => {
      acc[prop] = computed.getPropertyValue(prop);
      return acc;
    }, {});
  });
}

test.describe('UI Screenshots', () => {
  test('capture screenshots and styles for each navigation view', async ({ page }) => {
    const indexPath = path.join(__dirname, '../../index.html');
    await page.goto('file://' + indexPath);

    const navLabels = ['Dashboard', 'Plugins', 'Settings', 'Logs'];
    for (const label of navLabels) {
      if (label !== 'Dashboard') {
        await page.getByText(label, { exact: true }).click();
      }
      // Wait briefly for view transition
      await page.waitForTimeout(500);
      const base = label.toLowerCase();
      const screenshotPath = path.join(OUTPUT_DIR, `${base}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const styles = await getAppStyles(page);
      fs.writeFileSync(
        path.join(OUTPUT_DIR, `${base}.json`),
        JSON.stringify(styles, null, 2)
      );
    }

    // Simple assertion: ensure last view text is visible
    await expect(page.getByText('Logs')).toBeVisible();
  });
});
