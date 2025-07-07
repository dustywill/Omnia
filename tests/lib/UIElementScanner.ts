import { Locator, Page } from '@playwright/test';

export const findElements = (page: Page): Locator[] => {
  const selectors = 'button, a, input, [role="button"], [data-testid]';
  return page.locator(selectors).all();
};
