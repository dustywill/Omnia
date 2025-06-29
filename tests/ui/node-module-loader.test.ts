import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

it('falls back to Node require when window.require is absent', () => {
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {};
  const path = loadNodeModule<typeof import('path')>('path');
  expect(typeof path.join).toBe('function');
  (globalThis as any).window = originalWindow;
});

it('build output does not include module specifier import', () => {
  // Ensure the dist files are up to date
  execSync('npm run build', { stdio: 'ignore' });
  const js = readFileSync(
    join(__dirname, '../../dist/ui/node-module-loader.js'),
    'utf8',
  );
  expect(js.includes("import { createRequire } from 'module'")).toBe(false);
});

it('logs environment details when require is unavailable', async () => {
  jest.resetModules();
  const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {};
  const { loadNodeModule } = await import('../../src/ui/node-module-loader.js');
  loadNodeModule('path');
  (globalThis as any).window = originalWindow;
  const logs = logSpy.mock.calls.flat().join('\n');
  expect(logs).toContain('process.type');
  expect(logs).toContain('electron version');
  logSpy.mockRestore();
});
