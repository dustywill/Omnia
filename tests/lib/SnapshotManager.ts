import { Locator, expect, TestInfo } from '@playwright/test';
import fs from 'fs';
import path from 'path';

const SNAPSHOT_DIR = path.resolve('tests/snapshots');

export const captureSnapshot = async (
  locator: Locator,
  state: string,
  testInfo: TestInfo
) => {
  const elementId = await locator.evaluate((el) => el.id || el.outerHTML);
  const dir = path.join(SNAPSHOT_DIR, testInfo.title.replace(/\s+/g, '_'));
  fs.mkdirSync(dir, { recursive: true });
  const css = await locator.evaluate((el) => {
    const styles = window.getComputedStyle(el as HTMLElement);
    return JSON.stringify(
      Array.from(styles).reduce<Record<string, string>>((acc, prop) => {
        acc[prop] = styles.getPropertyValue(prop);
        return acc;
      }, {})
    );
  });
  fs.writeFileSync(path.join(dir, `${elementId}-${state}.json`), css);
  await locator.screenshot({ path: path.join(dir, `${elementId}-${state}.png`) });
};

export const compareSnapshots = async (
  locator: Locator,
  state: string,
  testInfo: TestInfo
) => {
  const elementId = await locator.evaluate((el) => el.id || el.outerHTML);
  const dir = path.join(SNAPSHOT_DIR, testInfo.title.replace(/\s+/g, '_'));
  await expect(locator).toHaveScreenshot(`${elementId}-${state}.png`);
  const baseline = JSON.parse(
    fs.readFileSync(path.join(dir, `${elementId}-${state}.json`), 'utf-8')
  );
  const current = await locator.evaluate((el) => {
    const styles = window.getComputedStyle(el as HTMLElement);
    return Array.from(styles).reduce<Record<string, string>>((acc, prop) => {
      acc[prop] = styles.getPropertyValue(prop);
      return acc;
    }, {});
  });
  expect(current).toEqual(baseline);
};
