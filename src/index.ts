import { loadNodeModule } from './ui/node-module-loader.js';
const fs = loadNodeModule<typeof import('fs/promises')>('fs/promises');
const path = loadNodeModule<typeof import('path')>('path');
import { initRenderer } from './ui/renderer.js';

export type StartOptions = {
  init?: typeof initRenderer;
};

export const start = async (opts?: StartOptions): Promise<void> => {
  if (typeof document === 'undefined') {
    const { JSDOM } = await import('jsdom');
    const dom = new JSDOM('<!doctype html><html><body></body></html>');
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      HTMLElement: dom.window.HTMLElement,
    });
    if (!globalThis.MutationObserver) {
      globalThis.MutationObserver = class {
        disconnect() {}
        observe() {}
        takeRecords() { return []; }
      } as unknown as typeof MutationObserver;
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
      window.cancelAnimationFrame = (id) => clearTimeout(id as unknown as NodeJS.Timeout);
    }
  }

  const container = document.createElement('div');
  document.body.appendChild(container);
  const pluginsPath = path.join(process.cwd(), 'plugins');
  const entries = await fs.readdir(pluginsPath, { withFileTypes: true });
  const tree: never[] = [];
  const plugins = entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const id = e.name;
      const base = { id, title: id.replace(/-/g, ' ') };
      if (id === 'context-generator') {
        return { ...base, props: { tree } };
      }
      if (id === 'as-built-documenter') {
        return { ...base, props: { templates: [] } };
      }
      return base;
    });
  const renderer = opts?.init ?? initRenderer;
  renderer({ container, pluginsPath, plugins });
};

if (process.env.NODE_ENV !== 'test') {
  start().catch((err) => {
    console.error(err);
  });
}
