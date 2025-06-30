// For Electron renderer with context isolation, we need to use the exposed APIs
// instead of trying to access Node.js modules directly

// Mock the Node.js modules for browser environment
export const loadNodeModule = <T = unknown>(name: string): T => {
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
            return (window as any).electronAPI.readdir(dirPath, options);
          },
        } as T;

      case "path":
        return {
          join: (...paths: string[]) => {
            return (window as any).electronAPI.join(...paths);
          },
        } as T;

      default:
        console.warn(
          `[loadNodeModule] Module ${name} not implemented in Electron renderer`,
        );
        return {} as T;
    }
  }

  // Fallback for Node.js environment (main process or tests)
  if (typeof require !== "undefined") {
    console.log(`[loadNodeModule] Using require for ${name}`);
    return require(name) as T;
  }

  // Last resort - throw an error
  throw new Error(`Module ${name} is not available in this environment`);
};
