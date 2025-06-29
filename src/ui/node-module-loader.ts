import { createRequire } from 'module';

type NodeRequire = (module: string) => unknown;

declare const require: NodeRequire | undefined;

// Previous attempt used `eval('require')` when `require` wasn't available in ES modules.
// That approach threw `ReferenceError: require is not defined` when running under ESM.
// Instead, fall back to `createRequire` which safely provides a CommonJS `require`.
const getMetaUrl = (): string | undefined => {
  try {
    // wrapped in Function to avoid syntax errors in CJS environments
    return new Function('return import.meta.url')();
  } catch {
    return undefined;
  }
};

const nodeRequire: NodeRequire = typeof require === 'function'
  ? require
  : createRequire(getMetaUrl() ?? `${process.cwd()}/index.js`);

export const loadNodeModule = <T = unknown>(name: string): T => {
  if (typeof window !== 'undefined' && (window as any).require) {
    console.log(`[loadNodeModule] window.require used for ${name}`);
    return (window as any).require(name) as T;
  }
  console.log(`[loadNodeModule] nodeRequire used for ${name}`);
  return nodeRequire(name) as T;
};
