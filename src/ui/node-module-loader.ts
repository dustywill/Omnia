// For Electron renderer with context isolation, we need to use the exposed APIs
// instead of trying to access Node.js modules directly
import React from 'react';

// Module cache to prevent repeated loading
const moduleCache = new Map<string, any>();

// Safe environment detection for browser/renderer context
const isDevelopment = (): boolean => {
  try {
    return typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
  } catch {
    return false;
  }
};

// Enhanced environment detection
const isElectronRenderer = (): boolean => {
  return typeof window !== 'undefined' && typeof (window as any).electronAPI !== 'undefined';
};

const isNodeJS = (): boolean => {
  return typeof process !== 'undefined' && process.versions?.node !== undefined;
};


// Export cache for debugging purposes
export const getModuleCache = () => moduleCache;
export const clearModuleCache = () => moduleCache.clear();

// Mock the Node.js modules for browser environment
export const loadNodeModule = async <T = unknown>(name: string): Promise<T> => {
  // Check cache first
  if (moduleCache.has(name)) {
    if (isDevelopment()) {
      console.debug(`[loadNodeModule] Using cached module: ${name}`);
    }
    return moduleCache.get(name) as T;
  }

  // Reduced logging verbosity - use debug level for routine operations
  if (isDevelopment()) {
    console.debug(`[loadNodeModule] Attempting to load module: ${name}`);
  }

  // Check if we're in an Electron renderer with exposed APIs
  if (isElectronRenderer()) {
    if (isDevelopment()) {
      console.debug(`[loadNodeModule] Using Electron API for ${name}`);
    }

    // Return mock implementations that use IPC
    switch (name) {
      case "fs/promises":
        const fsPromisesModule = {
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
        moduleCache.set(name, fsPromisesModule);
        return fsPromisesModule;

      case "path":
        const pathModule = {
          join: (...paths: string[]) => {
            // Use synchronous path operations for Electron renderer
            // The electronAPI should provide a sync join method
            if ((window as any).electronAPI.joinSync) {
              return (window as any).electronAPI.joinSync(...paths);
            }
            // Fallback to basic path joining if electronAPI doesn't have joinSync
            return paths.join('/').replace(/\/+/g, '/');
          },
          basename: (path: string, ext?: string) => {
            const name = path.split(/[/\\]/).pop() || '';
            if (ext && name.endsWith(ext)) {
              return name.slice(0, -ext.length);
            }
            return name;
          },
          dirname: (path: string) => {
            const parts = path.split(/[/\\]/);
            parts.pop();
            return parts.join('/') || '/';
          },
          extname: (path: string) => {
            const parts = path.split('.');
            return parts.length > 1 ? '.' + parts.pop() : '';
          },
          resolve: (...paths: string[]) => {
            // Simple resolve - just join and normalize
            return paths.join('/').replace(/\/+/g, '/');
          },
          relative: (from: string, to: string) => {
            // Simple relative path calculation
            return to.replace(from, '').replace(/^[/\\]/, '');
          }
        } as T;
        moduleCache.set(name, pathModule);
        return pathModule;

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
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading CodeMirror...`);
        }
        // Return a simple textarea as fallback for now
        const codeMirrorComponent = React.forwardRef((props: any, ref) => {
          return React.createElement('textarea', {
            ...props,
            ref,
            style: { width: '100%', height: '200px', fontFamily: 'monospace' }
          });
        }) as any;
        moduleCache.set(name, codeMirrorComponent);
        return codeMirrorComponent;

      case "@codemirror/lang-markdown":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading markdown lang (mock)...`);
        }
        // Return empty function as fallback
        const markdownLang = (() => []) as T;
        moduleCache.set(name, markdownLang);
        return markdownLang;

      case "json5":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading JSON5 via Electron IPC...`);
        }
        let json5Module: any;
        try {
          if ((window as any).electronAPI && (window as any).electronAPI.json5Parse) {
            if (isDevelopment()) {
              console.debug(`[loadNodeModule] JSON5 loaded successfully via IPC`);
            }
            json5Module = {
              parse: (text: string) => (window as any).electronAPI.json5Parse(text),
              stringify: (value: any) => (window as any).electronAPI.json5Stringify(value)
            } as T;
          }
        } catch (err) {
          console.error(`[loadNodeModule] Failed to load json5 via Electron IPC:`, err);
        }
        
        if (!json5Module) {
          console.warn(`[loadNodeModule] JSON5 not available, using JSON fallback`);
          // Return a JSON5-compatible parser as fallback
          json5Module = {
            parse: (text: string) => {
              console.log(`[loadNodeModule] Parsing JSON5 fallback for text:`, text.substring(0, 200));
              try {
                // Enhanced JSON5 fallback - handle more JSON5 features
                let cleaned = text
                  .replace(/\/\/.*$/gm, '') // Remove single-line comments
                  .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
                  .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
                  .replace(/,(\s*\n\s*[}\]])/g, '$1') // Remove trailing commas with newlines
                  .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":') // Quote unquoted keys
                  .replace(/([{,]\s*\n\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'); // Quote unquoted keys with newlines
              
                console.log(`[loadNodeModule] Cleaned JSON5 text:`, cleaned.substring(0, 200));
                const result = JSON.parse(cleaned);
                console.log(`[loadNodeModule] Parsed JSON5 result:`, result);
                return result;
              } catch (error) {
                console.error(`[loadNodeModule] JSON5 fallback parse failed:`, error);
                console.error(`[loadNodeModule] Original text:`, text);
                throw error;
              }
            },
            stringify: JSON.stringify
          } as any;
        }
        
        moduleCache.set(name, json5Module);
        return json5Module;

      case "url":
        console.log(`[loadNodeModule] Loading URL module via Electron require...`);
        try {
          if (typeof window !== 'undefined' && (window as any).require) {
            const url = (window as any).require('url');
            console.log(`[loadNodeModule] URL module loaded successfully:`, url);
            return url as T;
          }
        } catch (err) {
          console.error(`[loadNodeModule] Failed to load url via Electron require:`, err);
        }
        // Fallback - provide basic pathToFileURL implementation
        console.warn(`[loadNodeModule] URL module not available, providing fallback pathToFileURL`);
        return {
          pathToFileURL: (path: string) => {
            // Simple fallback for pathToFileURL
            if (path.startsWith('file://')) {
              return { href: path };
            }
            // Convert Windows/Unix paths to file:// URLs
            const normalizedPath = path.replace(/\\/g, '/');
            const fileUrl = normalizedPath.startsWith('/') 
              ? `file://${normalizedPath}`
              : `file:///${normalizedPath}`;
            return { href: fileUrl };
          },
          fileURLToPath: (url: string | URL) => {
            const urlStr = typeof url === 'string' ? url : url.href;
            return urlStr.replace(/^file:\/\/\/?/, '').replace(/\//g, '\\');
          }
        } as T;

      case "zod":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading Zod via Electron IPC...`);
        }
        try {
          if ((window as any).electronAPI && (window as any).electronAPI.zodAvailable) {
            const available = await (window as any).electronAPI.zodAvailable();
            if (available) {
              if (isDevelopment()) {
                console.debug(`[loadNodeModule] Zod available in main process, creating IPC proxy`);
              }
              
              // Create a proxy that converts Zod calls to schema descriptors and uses IPC
              const createIPCZodProxy = (type: string, options: any = {}) => {
                const descriptor = { type, ...options };
                
                return {
                  type,
                  descriptor,
                  // Validation methods that use IPC
                  parse: async (data: any) => {
                    const result = await (window as any).electronAPI.zodParse(data, descriptor);
                    if (result.success) {
                      return result.data;
                    } else {
                      throw new Error(result.error);
                    }
                  },
                  safeParse: async (data: any) => {
                    return await (window as any).electronAPI.zodValidate(data, descriptor);
                  },
                  // Chaining methods that return new proxy objects
                  min: (n: number) => createIPCZodProxy(type, { ...options, min: n }),
                  max: (n: number) => createIPCZodProxy(type, { ...options, max: n }),
                  length: (n: number) => createIPCZodProxy(type, { ...options, length: n }),
                  optional: () => createIPCZodProxy(type, { ...options, optional: true }),
                  default: (val: any) => createIPCZodProxy(type, { ...options, default: val }),
                  describe: (description: string) => createIPCZodProxy(type, { ...options, description }),
                  email: () => createIPCZodProxy(type, { ...options, email: true }),
                  url: () => createIPCZodProxy(type, { ...options, url: true }),
                  uuid: () => createIPCZodProxy(type, { ...options, uuid: true }),
                  regex: (pattern: RegExp) => createIPCZodProxy(type, { ...options, regex: pattern.source }),
                  int: () => createIPCZodProxy(type, { ...options, int: true }),
                  positive: () => createIPCZodProxy(type, { ...options, positive: true }),
                  negative: () => createIPCZodProxy(type, { ...options, negative: true }),
                  nonempty: () => createIPCZodProxy(type, { ...options, nonempty: true }),
                  strict: () => createIPCZodProxy(type, { ...options, strict: true }),
                  passthrough: () => createIPCZodProxy(type, { ...options, passthrough: true }),
                };
              };

              const zodIPCProxy = {
                string: () => createIPCZodProxy('string'),
                number: () => createIPCZodProxy('number'),
                boolean: () => createIPCZodProxy('boolean'),
                object: (shape: any) => {
                  // Convert shape to descriptors
                  const shapeDescriptors: any = {};
                  for (const [key, value] of Object.entries(shape)) {
                    if (value && typeof value === 'object' && (value as any).descriptor) {
                      shapeDescriptors[key] = (value as any).descriptor;
                    } else {
                      // Fallback for non-proxy objects
                      shapeDescriptors[key] = { type: 'any' };
                    }
                  }
                  return createIPCZodProxy('object', { shape: shapeDescriptors });
                },
                array: (element: any) => {
                  const elementDescriptor = element && typeof element === 'object' && element.descriptor 
                    ? element.descriptor 
                    : { type: 'any' };
                  return createIPCZodProxy('array', { element: elementDescriptor });
                },
                enum: (values: any[]) => createIPCZodProxy('enum', { values }),
                literal: (value: any) => createIPCZodProxy('literal', { value }),
                union: (...schemas: any[]) => {
                  const schemaDescriptors = schemas.map(schema => 
                    schema && typeof schema === 'object' && schema.descriptor 
                      ? schema.descriptor 
                      : { type: 'any' }
                  );
                  return createIPCZodProxy('union', { schemas: schemaDescriptors });
                },
                record: (value: any) => {
                  const valueDescriptor = value && typeof value === 'object' && value.descriptor 
                    ? value.descriptor 
                    : { type: 'any' };
                  return createIPCZodProxy('record', { value: valueDescriptor });
                },
                any: () => createIPCZodProxy('any'),
                unknown: () => createIPCZodProxy('unknown'),
              };
              
              // Return object that supports both module.z and module.default access patterns
              const zodResult = {
                z: zodIPCProxy,
                default: zodIPCProxy,
                ...zodIPCProxy
              } as T;
              moduleCache.set(name, zodResult);
              return zodResult;
            }
          }
        } catch (err) {
          console.error(`[loadNodeModule] Failed to load zod via Electron IPC:`, err);
        }
        // Fallback - return empty object which will cause graceful degradation
        console.warn(`[loadNodeModule] Zod not available in Electron renderer, returning empty object`);
        return {} as T;

      default:
        console.warn(
          `[loadNodeModule] Module ${name} not implemented in Electron renderer`,
        );
        return {} as T;
    }
  }

  // Fallback for Node.js environment (main process or tests)
  if (isNodeJS()) {
    // Try CommonJS require first (for Jest/test environments)
    if (typeof require !== "undefined") {
      if (isDevelopment()) {
        console.debug(`[loadNodeModule] Using require for ${name}`);
      }
      try {
        const requiredModule = require(name) as T;
        moduleCache.set(name, requiredModule);
        return requiredModule;
      } catch (err) {
        console.warn(`[loadNodeModule] Failed to require ${name}:`, err);
      }
    }
    
    // Fall back to dynamic import for ESM environment
    if (isDevelopment()) {
      console.debug(`[loadNodeModule] Using dynamic import for ${name}`);
    }
    try {
      let loadedModule: any;
      // Use dynamic import for ESM environment
      if (name === 'path') {
        loadedModule = await import('path');
      } else if (name === 'fs') {
        loadedModule = await import('fs');
      } else if (name === 'fs/promises') {
        loadedModule = await import('fs/promises');
      } else if (name === 'zod') {
        loadedModule = await import('zod');
      } else if (name === 'json5') {
        const json5Module = await import('json5');
        // Handle both CommonJS and ESM exports
        loadedModule = json5Module.default || json5Module;
      } else if (name === 'url') {
        loadedModule = await import('url');
      } else {
        // Generic dynamic import for other modules
        loadedModule = await import(name);
      }
      
      // Cache the loaded module
      if (loadedModule) {
        moduleCache.set(name, loadedModule);
        return loadedModule as T;
      }
    } catch (err) {
      console.warn(`[loadNodeModule] Failed to import ${name}:`, err);
    }
  }

  // Last resort - throw an error
  throw new Error(`Module ${name} is not available in this environment`);
};