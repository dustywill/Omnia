

type NodeRequire = (module: string) => unknown;

declare const require: NodeRequire | undefined;
declare const module: {
  createRequire?: (filename: string) => NodeRequire;
} | undefined;

// Previous attempt used `eval('require')` when `require` wasn't available in ES modules.
// That approach threw `ReferenceError: require is not defined` when running under ESM.
// Importing from 'module' also failed in the renderer due to missing builtin.
// Instead, fall back to `module.createRequire` which safely provides a CommonJS `require`.
const getMetaUrl = (): string | undefined => {
  try {
    // wrapped in Function to avoid syntax errors in CJS environments
    return new Function('return import.meta.url')();
  } catch {
    return undefined;
  }
};
//<<<<<<< g1vogr-codex/fix-react-default-export-error

// Lazily resolve a CommonJS `require` function. Earlier revisions executed a
// throwing IIFE at import time, which caused the Electron renderer to fail
// before it could fall back to `window.require`. By delaying the error until the
// function is called we keep that fallback intact.
let nodeRequire: NodeRequire;
if (typeof require === 'function') {
  console.log('[node-module-loader] using built-in require');
  nodeRequire = require;
} else if (
  typeof module !== 'undefined' &&
  typeof module.createRequire === 'function'
) {
  console.log('[node-module-loader] using module.createRequire fallback');
  nodeRequire = module.createRequire(getMetaUrl() ?? `${process.cwd()}/index.js`);
} else {
  console.log('[node-module-loader] no require available at load time');
  nodeRequire = () => {
    throw new Error('require is not available');
  };
}
//=======

//<<<<<<< gsbfat-codex/fix-react-default-export-error
//const nodeRequire: NodeRequire = typeof require === 'function'
//  ? require
//  : typeof module !== 'undefined' && typeof module.createRequire === 'function'
//  ? module.createRequire(getMetaUrl() ?? `${process.cwd()}/index.js`)
//  : (() => {
//      throw new Error('require is not available');
//    })();
//=======
// Previous attempt used `eval('require')` when `require` wasn't available in ES modules.
// That approach threw `ReferenceError: require is not defined` when running under ESM.
// Instead, fall back to `createRequire` which safely provides a CommonJS `require`.
//const getMetaUrl = (): string | undefined => {
 // try {
    // wrapped in Function to avoid syntax errors in CJS environments
  //  return new Function('return import.meta.url')();
//  } catch {
//    return undefined;
//  }
//};

//const nodeRequire: NodeRequire = typeof require === 'function'
//  ? require
//  : createRequire(getMetaUrl() ?? `${process.cwd()}/index.js`);
//>>>>>>> main
//>>>>>>> main

export const loadNodeModule = <T = unknown>(name: string): T => {
  // Electron exposes `window.require` in the renderer. If present we prefer it
  // over our fallback implementation above.
  if (typeof window !== 'undefined' && (window as any).require) {
    console.log(`[loadNodeModule] window.require used for ${name}`);
    return (window as any).require(name) as T;
  }
  console.log(`[loadNodeModule] nodeRequire used for ${name}`);
  return nodeRequire(name) as T;
};
