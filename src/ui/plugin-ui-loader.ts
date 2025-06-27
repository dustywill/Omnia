import { loadNodeModule } from './node-module-loader.js';
const path = loadNodeModule<typeof import('path')>('path');
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
  const modulePath = path.join(options.pluginsPath, id, 'index.tsx');
  const mod = await import(modulePath);
  const Component = (mod.default ?? Object.values(mod).find((v) => typeof v === 'function')) as React.ComponentType | undefined;
  if (!Component) {
    throw new Error(`No component export found for plugin ${id}`);
  }
  const root = createRoot(options.container);
  root.render(React.createElement(Component, options.props ?? {}));
  return root;
};
