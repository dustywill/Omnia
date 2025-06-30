import { jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

beforeEach(() => {
  jest.resetModules();
});

test('start resolves when path.join returns a Promise', async () => {
  const electronAPI = {
    readdir: async (dirPath: string, options?: any) => fs.readdir(dirPath, options),
    join: async (...parts: string[]) => path.join(...parts),
    getCwd: async () => process.cwd(),
  };
  (window as any).electronAPI = electronAPI;
  const { start } = await import('../../src/index.js');
  await expect(start()).resolves.not.toThrow();
  delete (window as any).electronAPI;
});
