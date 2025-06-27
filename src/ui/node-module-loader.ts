type NodeRequire = (module: string) => unknown;

declare const require: NodeRequire | undefined;

const nodeRequire: NodeRequire =
  typeof require === 'function' ? require : (eval('require') as NodeRequire);

export const loadNodeModule = <T = unknown>(name: string): T => {
  if (typeof window !== 'undefined' && (window as any).require) {
    return (window as any).require(name) as T;
  }
  return nodeRequire(name) as T;
};
