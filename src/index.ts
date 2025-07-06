import { loadNodeModule } from "./ui/node-module-loader.js";
import { initMainAppRenderer } from "./ui/main-app-renderer.js";

export type StartOptions = {
  init?: typeof initMainAppRenderer;
};

export const start = async (opts?: StartOptions): Promise<void> => {
  try {
  // Initialize client-side logging early if we're in a browser/Electron renderer environment
  if (typeof window !== "undefined" && typeof document !== "undefined") {
    console.log('[start] Initializing client-side console logging...');
    // Import and initialize the client logger - it automatically sets up console capture
    await import("./ui/client-logger.js");
    console.log('[start] Client-side console logging initialized');
  }
  
  console.log('[start] Loading path module...');
  const path = await loadNodeModule<typeof import("path")>("path");
  console.log('[start] Modules loaded successfully');
  
  // Only setup JSDOM in Node.js environment (not Electron renderer)
  if (typeof document === "undefined" && typeof window === "undefined") {
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
    if (!(globalThis as any).window.requestAnimationFrame) {
      (globalThis as any).window.requestAnimationFrame = (cb: any) => setTimeout(cb, 0);
      (globalThis as any).window.cancelAnimationFrame = (id: any) =>
        clearTimeout(id as unknown as NodeJS.Timeout);
    }
  }

  const container = document.getElementById("app") || document.createElement("div");
  if (!container.id) {
    container.id = "app";
    document.body.appendChild(container);
  }

  console.log('[start] Getting current working directory...');
  const cwd =
    typeof process !== "undefined"
      ? process.cwd()
      : typeof window !== "undefined" && (window as any).electronAPI?.getCwd
      ? await (window as any).electronAPI.getCwd()
      : "/";
  console.log('[start] Current working directory:', cwd);
  
  console.log('[start] Building plugins source path...');
  const sourcePluginsPath = path.join(cwd, "plugins");
  console.log('[start] Source plugins path:', sourcePluginsPath);
  
  console.log('[start] Building plugins dist path...');
  const distPluginsPath = path.join(cwd, "dist", "plugins");
  console.log('[start] Dist plugins path:', distPluginsPath);
  
  console.log('[start] Building config path...');
  const configPath = path.join(cwd, "config");
  console.log('[start] Config path:', configPath);
  
  console.log('[start] Initializing main application renderer...');
  const renderer = opts?.init ?? initMainAppRenderer;
  await renderer({ 
    container, 
    pluginsPath: sourcePluginsPath, // Use source path for manifest discovery
    configPath 
  });
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
