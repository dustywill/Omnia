import { loadNodeModule } from './node-module-loader.js';
// Attempt #3: previous runs failed to load plugin modules with an unclear
// error. We now log the resolved module path before importing so we can see
// exactly what Electron tries to load.
import React from 'react';
import { createRoot, type Root } from 'react-dom/client';

export type LoadPluginUiOptions = {
  container: HTMLElement;
  pluginsPath: string;
  props?: Record<string, unknown>;
};

export const loadPluginUI = async (
  id: string,
  options: LoadPluginUiOptions,
): Promise<Root> => {
  const path = await loadNodeModule<typeof import('path')>('path');
  const fs = await loadNodeModule<typeof import('fs')>('fs');
  
  const jsPath = path.join(options.pluginsPath, id, 'index.js');
  const tsxPath = path.join(options.pluginsPath, id, 'index.tsx');
  const modulePath = fs.existsSync(jsPath) ? jsPath : tsxPath;
  console.log(`[loadPluginUI] importing ${modulePath}`);
  const mod = await import(modulePath);
  const Component = (mod.default ?? Object.values(mod).find((v) => typeof v === 'function')) as React.ComponentType | undefined;
  if (!Component) {
    throw new Error(`No component export found for plugin ${id}`);
  }
  const root = createRoot(options.container);
  root.render(React.createElement(Component, options.props ?? {}));
  return root;
};
