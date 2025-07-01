import { jest } from '@jest/globals';

const exposeInMainWorld = jest.fn();
const invoke = jest.fn(async () => {});

jest.mock('electron', () => ({
  contextBridge: { exposeInMainWorld },
  ipcRenderer: { invoke },
}));

beforeEach(() => {
  jest.resetModules();
  exposeInMainWorld.mockClear();
  invoke.mockClear();
});

test('application starts without structured clone errors', async () => {
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  // @ts-ignore - preload is a JavaScript file
  await import('../../src/preload.js');
  const { start } = await import('../../src/index.js');

  await expect(start()).resolves.not.toThrow();

  for (const call of invoke.mock.calls) {
    const args = call.slice(1);
    for (const arg of args) {
      expect(() => structuredClone(arg)).not.toThrow();
    }
  }
  warn.mockRestore();
});
