import { loadNodeModule } from "./ui/node-module-loader.js";
import { initRenderer } from "./ui/renderer.js";

export type StartOptions = {
  init?: typeof initRenderer;
};

export const start = async (opts?: StartOptions): Promise<void> => {
  try {
  console.log('[start] Loading fs module...');
  const fs = await loadNodeModule<typeof import("fs/promises")>("fs/promises");
  console.log('[start] Loading path module...');
  const path = await loadNodeModule<typeof import("path")>("path");
  console.log('[start] Modules loaded successfully');
  
  if (typeof document === "undefined") {
    const { JSDOM } = await import("jsdom");
    const dom = new JSDOM("<!doctype html><html><body></body></html>");
    Object.assign(globalThis, {
      window: dom.window,
      document: dom.window.document,
      HTMLElement: dom.window.HTMLElement,
    });
    if (!globalThis.MutationObserver) {
      globalThis.MutationObserver = class {
        disconnect() {}
        observe() {}
        takeRecords() {
          return [];
        }
      } as unknown as typeof MutationObserver;
    }
    if (!window.requestAnimationFrame) {
      window.requestAnimationFrame = (cb) => setTimeout(cb, 0);
      window.cancelAnimationFrame = (id) =>
        clearTimeout(id as unknown as NodeJS.Timeout);
    }
  }

  const container = document.createElement("div");
  document.body.appendChild(container);

  console.log('[start] Getting current working directory...');
  const cwd =
    typeof process !== "undefined"
      ? process.cwd()
      : typeof window !== "undefined" && (window as any).electronAPI?.getCwd
      ? await (window as any).electronAPI.getCwd()
      : "/";
  console.log('[start] Current working directory:', cwd);
  
  console.log('[start] Building plugins source path...');
  const sourcePluginsPath = await path.join(cwd, "plugins");
  console.log('[start] Source plugins path:', sourcePluginsPath);
  
  console.log('[start] Building plugins dist path...');
  const distPluginsPath = await path.join(cwd, "dist", "plugins");
  console.log('[start] Dist plugins path:', distPluginsPath);
  
  console.log('[start] Reading source plugins directory for discovery...');
  const entries = await fs.readdir(sourcePluginsPath, { withFileTypes: true });
  console.log('[start] Found entries:', entries.length);
  const tree: never[] = [];
  const plugins = entries
    .filter((e) => e.isDirectory())
    .map((e) => {
      const id = e.name;
      const base = { id, title: id.replace(/-/g, " ") };
      if (id === "context-generator") {
        return { ...base, props: { tree } };
      }
      if (id === "as-built-documenter") {
        return { ...base, props: { templates: [] } };
      }
      return base;
    });
  
  console.log('[start] Found plugins:', plugins.map(p => p.id));
  console.log('[start] Initializing renderer...');
  const renderer = opts?.init ?? initRenderer;
  renderer({ container, pluginsPath: distPluginsPath, plugins });
  console.log('[start] Renderer initialized successfully');
  } catch (err) {
    console.error('[start] failed', { options: opts }, err);
    throw err;
  }
};

if (typeof process !== "undefined" && process.env.NODE_ENV !== "test") {
  start().catch((err) => {
    console.error(err);
  });
}
