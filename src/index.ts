import { loadNodeModule } from "./ui/node-module-loader.js";
const fs = loadNodeModule<typeof import("fs/promises")>("fs/promises");
const path = loadNodeModule<typeof import("path")>("path");
import { initRenderer } from "./ui/renderer.js";

export type StartOptions = {
  init?: typeof initRenderer;
};

export const start = async (opts?: StartOptions): Promise<void> => {
  try {

  const container = document.createElement("div");
  document.body.appendChild(container);

  const cwd = typeof process !== "undefined" ? process.cwd() : "/";
  const pluginsPath = path.join(cwd, "plugins");
  const entries = await fs.readdir(pluginsPath, { withFileTypes: true });
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
  const renderer = opts?.init ?? initRenderer;
  renderer({ container, pluginsPath, plugins });
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
