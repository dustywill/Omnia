import { describe, it, expect, jest } from '@jest/globals';
import { findElements } from './UIElementScanner.js';

class MockLocator {
  constructor(public name: string) {}
}

describe('findElements', () => {
  it('selects interactive elements using page.locator', () => {
    const allResult = [new MockLocator('a'), new MockLocator('b')];
    const mockLocator = { all: jest.fn(() => allResult) };
    const mockPage = { locator: jest.fn(() => mockLocator) } as any;

    const result = findElements(mockPage);

    expect(mockPage.locator).toHaveBeenCalledWith(
      'button, a, input, [role="button"], [data-testid]'
    );
    expect(mockLocator.all).toHaveBeenCalled();
    expect(result).toBe(allResult);
  });
});
