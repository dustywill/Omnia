import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/ui/renderer.js', () => ({
  initRenderer: jest.fn(),
}));

it('calls initRenderer with discovered plugins', async () => {
  const { start } = await import('../../src/index.js');
  const mockInit = jest.fn();
  await start({ init: mockInit as any });
  expect(mockInit).toHaveBeenCalled();
});
