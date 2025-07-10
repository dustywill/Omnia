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
          appendFile: async (filePath: string, data: string, _options?: any) => {
            // For Electron renderer, we need to read the file, append data, and write it back
            // Or we could add a specific IPC handler for appendFile
            try {
              let existingContent = '';
              try {
                existingContent = await (window as any).electronAPI.readFile(filePath, 'utf8');
              } catch {
                // File doesn't exist, that's okay
              }
              return (window as any).electronAPI.writeFile(filePath, existingContent + data);
            } catch (error) {
              console.error(`Failed to append to file ${filePath}:`, error);
              throw error;
            }
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
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading URL module via Electron require...`);
        }
        try {
          if (typeof window !== 'undefined' && (window as any).require) {
            const url = (window as any).require('url');
            if (isDevelopment()) {
              console.debug(`[loadNodeModule] URL module loaded successfully via require`);
            }
            moduleCache.set(name, url);
            return url as T;
          }
        } catch (err) {
          if (isDevelopment()) {
            console.debug(`[loadNodeModule] Failed to load url via Electron require:`, err);
          }
        }
        // Fallback - provide basic pathToFileURL implementation
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Using fallback pathToFileURL implementation`);
        }
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

      case "@radix-ui/react-slot":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading Radix UI React Slot...`);
        }
        // Create a compatible Slot component that behaves like the real one
        const SlotComponent = React.forwardRef<HTMLElement, { children?: React.ReactNode; asChild?: boolean; [key: string]: any }>(({ children, asChild, ...props }, ref) => {
          if (asChild && React.isValidElement(children)) {
            // When asChild is true, clone the child element with the props
            return React.cloneElement(children, { ...props, ref } as any);
          }
          // When asChild is false, render as a span
          return React.createElement('span', { ...props, ref }, children);
        });
        SlotComponent.displayName = 'Slot';
        
        const slotModule = { Slot: SlotComponent } as T;
        moduleCache.set(name, slotModule);
        return slotModule;

      case "class-variance-authority":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading Class Variance Authority...`);
        }
        // Create a compatible cva function
        const cva = (base: string, options: any = {}) => {
          const variants = options.variants || {};
          const defaultVariants = options.defaultVariants || {};
          
          return (props: any = {}) => {
            let classes = base;
            
            // Apply variant classes
            for (const [key, value] of Object.entries(props)) {
              if (variants[key] && variants[key][value as string]) {
                classes += ' ' + variants[key][value as string];
              }
            }
            
            // Apply default variant classes for missing props
            for (const [key, value] of Object.entries(defaultVariants)) {
              if (!(key in props) && variants[key] && variants[key][value as string]) {
                classes += ' ' + variants[key][value as string];
              }
            }
            
            return classes;
          };
        };
        
        const cvaModule = { cva } as T;
        moduleCache.set(name, cvaModule);
        return cvaModule;

      case "clsx":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading clsx...`);
        }
        // Create a compatible clsx function
        const clsx = (...args: any[]) => {
          return args
            .filter(Boolean)
            .map((arg) => {
              if (typeof arg === 'string') return arg;
              if (typeof arg === 'object' && arg !== null) {
                return Object.entries(arg)
                  .filter(([_, value]) => Boolean(value))
                  .map(([key]) => key)
                  .join(' ');
              }
              return '';
            })
            .join(' ')
            .trim();
        };
        
        const clsxModule = { clsx, default: clsx } as T;
        moduleCache.set(name, clsxModule);
        return clsxModule;

      case "tailwind-merge":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading tailwind-merge...`);
        }
        // Create a compatible twMerge function
        const twMerge = (...classes: any[]) => {
          // Simple implementation - just join and dedupe
          const classString = classes.filter(Boolean).join(' ');
          const classArray = classString.split(/\s+/).filter(Boolean);
          
          // Basic deduplication - remove duplicates (keep last occurrence)
          const uniqueClasses = [...new Set(classArray)];
          
          return uniqueClasses.join(' ');
        };
        
        const twMergeModule = { twMerge } as T;
        moduleCache.set(name, twMergeModule);
        return twMergeModule;

      case "lucide-react":
        if (isDevelopment()) {
          console.debug(`[loadNodeModule] Loading lucide-react...`);
        }
        // Create fallback icon components
        const createIconComponent = (name: string) => {
          return React.forwardRef<SVGSVGElement, { size?: number; [key: string]: any }>((props, ref) => {
            return React.createElement('svg', {
              ...props,
              ref,
              width: props.size || 24,
              height: props.size || 24,
              viewBox: '0 0 24 24',
              fill: 'none',
              stroke: 'currentColor',
              strokeWidth: 2,
              strokeLinecap: 'round',
              strokeLinejoin: 'round',
              'aria-label': name
            }, React.createElement('text', {
              x: 12,
              y: 16,
              textAnchor: 'middle',
              fontSize: 6,
              fill: 'currentColor'
            }, name.slice(0, 3)));
          });
        };
        
        const lucideModule = new Proxy({} as any, {
          get: (target, prop) => {
            if (typeof prop === 'string') {
              if (!target[prop]) {
                target[prop] = createIconComponent(prop);
              }
              return target[prop];
            }
            return undefined;
          }
        });
        
        moduleCache.set(name, lucideModule);
        return lucideModule;

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
              const createIPCZodProxy = (type: string, options: any = {}, shape?: any) => {
                const descriptor = { type, ...options };
                
                // Create appropriate _def based on type
                let _def: any = { typeName: `Zod${type.charAt(0).toUpperCase() + type.slice(1)}` };
                
                // Add type-specific _def properties for schema introspection
                if (type === 'enum' && options.values) {
                  _def.values = options.values;
                } else if (type === 'object' && options.shape) {
                  _def.shape = () => shape || {};
                } else if (type === 'array' && options.element) {
                  _def.type = options.element;
                } else if (type === 'union' && options.schemas) {
                  _def.options = options.schemas;
                }
                
                const proxy = {
                  type,
                  descriptor,
                  // Add Zod-compatible _def property for schema introspection
                  _def,
                  
                  // Validation methods - simplified for schema introspection compatibility
                  parse: (data: any) => {
                    // For now, return the data as-is for compatibility
                    // Real validation will be added later via async methods
                    return data;
                  },
                  safeParse: (data: any) => {
                    // For now, assume valid for compatibility
                    return { success: true, data };
                  },
                  // Chaining methods that return new proxy objects
                  min: (n: number) => createIPCZodProxy(type, { ...options, min: n }, shape),
                  max: (n: number) => createIPCZodProxy(type, { ...options, max: n }, shape),
                  length: (n: number) => createIPCZodProxy(type, { ...options, length: n }, shape),
                  optional: () => createIPCZodProxy(type, { ...options, optional: true }, shape),
                  default: (val: any) => createIPCZodProxy(type, { ...options, default: val }, shape),
                  describe: (description: string) => createIPCZodProxy(type, { ...options, description }, shape),
                  email: () => createIPCZodProxy(type, { ...options, email: true }, shape),
                  url: () => createIPCZodProxy(type, { ...options, url: true }, shape),
                  uuid: () => createIPCZodProxy(type, { ...options, uuid: true }, shape),
                  datetime: () => createIPCZodProxy(type, { ...options, datetime: true }, shape),
                  regex: (pattern: RegExp) => createIPCZodProxy(type, { ...options, regex: pattern.source }, shape),
                  int: () => createIPCZodProxy(type, { ...options, int: true }, shape),
                  positive: () => createIPCZodProxy(type, { ...options, positive: true }, shape),
                  negative: () => createIPCZodProxy(type, { ...options, negative: true }, shape),
                  nonempty: () => createIPCZodProxy(type, { ...options, nonempty: true }, shape),
                  strict: () => createIPCZodProxy(type, { ...options, strict: true }, shape),
                  passthrough: () => createIPCZodProxy(type, { ...options, passthrough: true }, shape),
                };
                
                // Add shape property for object types (needed for schema introspection)
                if (type === 'object' && shape) {
                  (proxy as any).shape = shape;
                }
                
                return proxy;
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
                  return createIPCZodProxy('object', { shape: shapeDescriptors }, shape);
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