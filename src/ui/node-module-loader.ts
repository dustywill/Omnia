// Provide minimal Node.js module shims for the browser by calling the Express
// server's API endpoints. In a Node.js environment we fall back to `require`.
export const loadNodeModule = <T = unknown>(name: string): T => {
  console.log(`[loadNodeModule] Attempting to load module: ${name}`);

  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    switch (name) {
      case 'fs/promises':
        return {
          readFile: async (filePath: string): Promise<string> => {
            const res = await fetch(`/api/read?path=${encodeURIComponent(filePath)}`);
            if (!res.ok) throw new Error(await res.text());
            return res.text();
          },
          writeFile: async (filePath: string, data: string): Promise<void> => {
            const res = await fetch(`/api/write?path=${encodeURIComponent(filePath)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ data }),
            });
            if (!res.ok) throw new Error(await res.text());
          },
          mkdir: async (dirPath: string, options?: any): Promise<void> => {
            const res = await fetch(`/api/mkdir?path=${encodeURIComponent(dirPath)}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ options }),
            });
            if (!res.ok) throw new Error(await res.text());
          },
          readdir: async (dirPath: string, options?: any): Promise<any> => {
            const params = new URLSearchParams({ path: dirPath });
            if (options?.withFileTypes) params.set('withFileTypes', 'true');
            const res = await fetch(`/api/readdir?${params.toString()}`);
            if (!res.ok) throw new Error(await res.text());
            const entries = await res.json();
            if (options?.withFileTypes) {
              return entries.map((e: { name: string; isDirectory: boolean }) => ({
                name: e.name,
                isDirectory: () => e.isDirectory,
              }));
            }
            return entries;
          },
        } as T;

      case 'path':
        return {
          join: (...paths: string[]) => paths.join('/').replace(/\\+/g, '/'),
        } as T;

      default:
        console.warn(`[loadNodeModule] Module ${name} not implemented in browser`);
        return {} as T;
    }
  }

  if (typeof require !== 'undefined') {
    console.log(`[loadNodeModule] Using require for ${name}`);
    return require(name) as T;
  }

  throw new Error(`Module ${name} is not available in this environment`);
};
