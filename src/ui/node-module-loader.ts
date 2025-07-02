// For Electron renderer with context isolation, we need to use the exposed APIs
// instead of trying to access Node.js modules directly
import React from 'react';

// Mock the Node.js modules for browser environment
export const loadNodeModule = async <T = unknown>(name: string): Promise<T> => {
  console.log(`[loadNodeModule] Attempting to load module: ${name}`);

  // Check if we're in an Electron renderer with exposed APIs
  if (typeof window !== "undefined" && (window as any).electronAPI) {
    console.log(`[loadNodeModule] Using Electron API for ${name}`);

    // Return mock implementations that use IPC
    switch (name) {
      case "fs/promises":
        return {
          readFile: async (filePath: string, options?: any) => {
            return (window as any).electronAPI.readFile(filePath, options);
          },
          writeFile: async (filePath: string, data: string) => {
            return (window as any).electronAPI.writeFile(filePath, data);
          },
          mkdir: async (dirPath: string, options?: any) => {
            return (window as any).electronAPI.mkdir(dirPath, options);
          },
          readdir: async (dirPath: string, options?: any) => {
            const entries = await (window as any).electronAPI.readdir(
              dirPath,
              options,
            );
            if (options?.withFileTypes) {
              return entries.map(
                (e: { name: string; isDirectory: boolean }) => ({
                  name: e.name,
                  isDirectory: () => e.isDirectory,
                }),
              );
            }
            return entries;
          },
        } as T;

      case "path":
        return {
          join: async (...paths: string[]) => {
            return (window as any).electronAPI.join(...paths);
          },
        } as T;

      case "fs":
        return {
          readFileSync: (_filePath: string, _options?: any) => {
            // For Electron renderer, we'll need to use the async API via IPC
            throw new Error("Use fs/promises instead of fs in Electron renderer");
          },
          writeFileSync: (_filePath: string, _data: string) => {
            throw new Error("Use fs/promises instead of fs in Electron renderer");
          },
        } as T;

      case "@uiw/react-codemirror":
        console.log(`[loadNodeModule] Loading CodeMirror...`);
        // Return a simple textarea as fallback for now
        return React.forwardRef((props: any, ref) => {
          return React.createElement('textarea', {
            ...props,
            ref,
            style: { width: '100%', height: '200px', fontFamily: 'monospace' }
          });
        }) as any;

      case "@codemirror/lang-markdown":
        console.log(`[loadNodeModule] Loading markdown lang (mock)...`);
        // Return empty function as fallback
        return (() => []) as T;

      case "json5":
        console.log(`[loadNodeModule] Loading JSON5 (fallback to JSON)...`);
        // Use regular JSON as fallback
        return JSON as any;

      default:
        console.warn(
          `[loadNodeModule] Module ${name} not implemented in Electron renderer`,
        );
        return {} as T;
    }
  }

  // Fallback for Node.js environment (main process or tests)
  if (typeof process !== "undefined" && process.versions?.node) {
    // Try CommonJS require first (for Jest/test environments)
    if (typeof require !== "undefined") {
      console.log(`[loadNodeModule] Using require for ${name}`);
      try {
        return require(name) as T;
      } catch (err) {
        console.warn(`[loadNodeModule] Failed to require ${name}:`, err);
      }
    }
    
    // Fall back to dynamic import for ESM environment
    console.log(`[loadNodeModule] Using dynamic import for ${name}`);
    try {
      // Use dynamic import for ESM environment
      if (name === 'path') {
        const pathModule = await import('path');
        return pathModule as T;
      } else if (name === 'fs') {
        const fsModule = await import('fs');
        return fsModule as T;
      } else if (name === 'fs/promises') {
        const fsPromises = await import('fs/promises');
        return fsPromises as T;
      }
    } catch (err) {
      console.warn(`[loadNodeModule] Failed to import ${name}:`, err);
    }
  }

  // Last resort - throw an error
  throw new Error(`Module ${name} is not available in this environment`);
};