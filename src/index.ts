import fs from 'fs/promises';
import path from 'path';
import { initRenderer } from './ui/renderer.js';

export type StartOptions = {
  init?: typeof initRenderer;
};

export const start = async (opts?: StartOptions): Promise<void> => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const pluginsPath = path.join(__dirname, '..', 'plugins');
  const entries = await fs.readdir(pluginsPath, { withFileTypes: true });
  const plugins = entries
    .filter((e) => e.isDirectory())
    .map((e) => ({ id: e.name, title: e.name.replace(/-/g, ' ') }));
  const renderer = opts?.init ?? initRenderer;
  renderer({ container, pluginsPath, plugins });
};

if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error(err);
  });
}
