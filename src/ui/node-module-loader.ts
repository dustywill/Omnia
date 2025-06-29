

declare const require: NodeRequire | undefined;
declare const module: {
  createRequire?: (filename: string) => NodeRequire;
} | undefined;

// Importing from 'module' also failed in the renderer due to missing builtin.
// Instead, fall back to `module.createRequire` which safely provides a CommonJS `require`.
  : typeof module !== 'undefined' && typeof module.createRequire === 'function'
  ? module.createRequire(getMetaUrl() ?? `${process.cwd()}/index.js`)
  : (() => {
      throw new Error('require is not available');
    })();

export const loadNodeModule = <T = unknown>(name: string): T => {
  if (typeof window !== 'undefined' && (window as any).require) {
    return (window as any).require(name) as T;
  }
  return nodeRequire(name) as T;
};
