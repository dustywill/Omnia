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
  console.log(`[loadPluginUI] Starting to load plugin: ${id}`);
  console.log(`[loadPluginUI] Options:`, { pluginsPath: options.pluginsPath, props: options.props });
  
  // Set up global module resolution for plugins
  const originalImport = (globalThis as any).import;
  (globalThis as any).import = async (specifier: string) => {
    console.log(`[loadPluginUI] Intercepted import: ${specifier}`);
    
    // Handle external module imports
    if (specifier === '@uiw/react-codemirror') {
      return { default: await loadNodeModule('@uiw/react-codemirror') };
    }
    if (specifier === '@codemirror/lang-markdown') {
      return { markdown: await loadNodeModule('@codemirror/lang-markdown') };
    }
    if (specifier === 'json5') {
      return { default: await loadNodeModule('json5') };
    }
    if (specifier === '@radix-ui/react-slot') {
      return await loadNodeModule('@radix-ui/react-slot');
    }
    if (specifier === 'class-variance-authority') {
      return await loadNodeModule('class-variance-authority');
    }
    if (specifier === 'clsx') {
      return await loadNodeModule('clsx');
    }
    if (specifier === 'tailwind-merge') {
      return await loadNodeModule('tailwind-merge');
    }
    if (specifier === 'lucide-react') {
      return await loadNodeModule('lucide-react');
    }
    if (specifier === 'react') {
      return { useState: React.useState, useEffect: React.useEffect, default: React };
    }
    if (specifier === 'fs/promises') {
      return await loadNodeModule('fs/promises');
    }
    
    // Fallback to original import
    return originalImport ? originalImport(specifier) : import(specifier);
  };
  
  const path = await loadNodeModule<typeof import('path')>('path');
  console.log(`[loadPluginUI] Path module loaded for plugin: ${id}`);
  
  // In Electron renderer, we can't use fs.existsSync, so we'll try both paths
  const jsPath = await path.join(options.pluginsPath, id, 'index.js');
  const tsxPath = await path.join(options.pluginsPath, id, 'index.tsx');
  
  console.log(`[loadPluginUI] Plugin paths - JS: ${jsPath}, TSX: ${tsxPath}`);
  
  // Try to import the JS version first, then fallback to TSX
  let modulePath = jsPath;
  let mod;
  
  try {
    console.log(`[loadPluginUI] importing ${jsPath}`);
    mod = await import(jsPath);
    console.log(`[loadPluginUI] JS import successful for ${id}`);
  } catch (err) {
    console.log(`[loadPluginUI] JS import failed for ${id}, error:`, err);
    console.log(`[loadPluginUI] trying TSX fallback: ${tsxPath}`);
    modulePath = tsxPath;
    try {
      mod = await import(tsxPath);
      console.log(`[loadPluginUI] TSX import successful for ${id}`);
    } catch (tsxErr) {
      console.error(`[loadPluginUI] Both JS and TSX imports failed for ${id}:`, { jsError: err, tsxError: tsxErr });
      throw tsxErr;
    }
  }
  
  console.log(`[loadPluginUI] successfully imported ${modulePath}`);
  console.log(`[loadPluginUI] Module exports for ${id}:`, Object.keys(mod));
  
  const Component = (mod.default ?? Object.values(mod).find((v) => typeof v === 'function')) as React.ComponentType | undefined;
  if (!Component) {
    console.error(`[loadPluginUI] No component export found for plugin ${id}. Available exports:`, Object.keys(mod));
    throw new Error(`No component export found for plugin ${id}`);
  }
  
  console.log(`[loadPluginUI] Found component for ${id}, creating React root...`);
  const root = createRoot(options.container);
  console.log(`[loadPluginUI] Rendering component for ${id}...`);
  root.render(React.createElement(Component, options.props ?? {}));
  console.log(`[loadPluginUI] Successfully rendered plugin ${id}`);
  return root;
};
