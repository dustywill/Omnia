import { jest } from '@jest/globals';

const exposeInMainWorld = jest.fn();
const invoke = jest.fn(async () => {});

jest.mock('electron', () => ({
  contextBridge: { exposeInMainWorld },
  ipcRenderer: { invoke },
}));

test('sanitizes non-serializable arguments before invoking', async () => {
  jest.resetModules();
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  // @ts-ignore
  await import('../../src/preload.js');
  const electronApi = (
    exposeInMainWorld.mock.calls.find((c) => c[0] === 'electronAPI')?.[1]
  ) as any;
  const data = { foo: 'bar', fn: () => {} } as any;
  await electronApi.writeFile('/tmp/test.txt', data);
  const call = invoke.mock.calls[0] as any[];
  const passed = call[2];
  expect(passed).toEqual({ foo: 'bar' });
  warn.mockRestore();
});
