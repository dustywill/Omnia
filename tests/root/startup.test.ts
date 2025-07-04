import { jest } from '@jest/globals';

jest.unstable_mockModule('../../src/ui/main-app-renderer.js', () => ({
  initMainAppRenderer: jest.fn(),
}));

beforeEach(() => {
  jest.resetModules();
});

it('calls initMainAppRenderer with discovered plugins', async () => {
  const { start } = await import('../../src/index.js');
  const mockInit = jest.fn();
  await start({ init: mockInit as any });
  expect(mockInit).toHaveBeenCalled();
});

it('logs options when start fails', async () => {
  jest.unstable_mockModule('../../src/ui/main-app-renderer.js', () => ({
    initMainAppRenderer: () => {
      throw new Error('boom');
    },
  }));
  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  const { start } = await import('../../src/index.js');
  const failingInit = () => {
    throw new Error('boom');
  };
  await expect(start({ init: failingInit as any })).rejects.toThrow('boom');
  const call = consoleSpy.mock.calls.find((c) => c[0] === '[start] failed');
  expect(call).toBeDefined();
  expect(call?.[1]).toEqual(expect.objectContaining({ options: expect.anything() }));
  expect(call?.[2]).toBeInstanceOf(Error);
  consoleSpy.mockRestore();
});
