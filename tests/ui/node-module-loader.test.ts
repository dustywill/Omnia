import { loadNodeModule } from '../../src/ui/node-module-loader.js';

it('falls back to Node require when window.require is absent', () => {
  const originalWindow = (globalThis as any).window;
  (globalThis as any).window = {};
  const path = loadNodeModule<typeof import('path')>('path');
  expect(typeof path.join).toBe('function');
  (globalThis as any).window = originalWindow;
});
