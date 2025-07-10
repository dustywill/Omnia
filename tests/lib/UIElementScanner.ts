import { Locator, Page } from '@playwright/test';

export const findElements = async (page: Page): Promise<Locator[]> => {
  const selectors = 'button, a, input, [role="button"], [data-testid]';
  return page.locator(selectors).all();
};
