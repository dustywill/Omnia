import path from "path";
import fs from "fs/promises";
import type { Dirent } from "fs";
import type {
  BrowserWindow as ElectronBrowserWindow,
  App,
  IpcMain,
} from "electron";
import type { Logger } from "./core/logger.js";
import { createLogger, setupConsoleLogging } from "./core/logger.js";

let electron:
  | { BrowserWindow: typeof ElectronBrowserWindow; app: App; ipcMain: IpcMain }
  | undefined;

// Helper function to build Zod schemas from descriptors
export const buildZodSchemaFromDescriptor = (z: any, descriptor: any): any => {
  if (!descriptor || typeof descriptor !== 'object') {
    throw new Error('Invalid schema descriptor');
  }

  switch (descriptor.type) {
    case 'string':
      let stringSchema = z.string();
      if (descriptor.min !== undefined) stringSchema = stringSchema.min(descriptor.min);
      if (descriptor.max !== undefined) stringSchema = stringSchema.max(descriptor.max);
      if (descriptor.length !== undefined) stringSchema = stringSchema.length(descriptor.length);
      if (descriptor.regex !== undefined) stringSchema = stringSchema.regex(new RegExp(descriptor.regex));
      if (descriptor.email) stringSchema = stringSchema.email();
      if (descriptor.url) stringSchema = stringSchema.url();
      if (descriptor.uuid) stringSchema = stringSchema.uuid();
      if (descriptor.default !== undefined) stringSchema = stringSchema.default(descriptor.default);
      if (descriptor.optional) stringSchema = stringSchema.optional();
      return stringSchema;

    case 'number':
      let numberSchema = z.number();
      if (descriptor.min !== undefined) numberSchema = numberSchema.min(descriptor.min);
      if (descriptor.max !== undefined) numberSchema = numberSchema.max(descriptor.max);
      if (descriptor.int) numberSchema = numberSchema.int();
      if (descriptor.positive) numberSchema = numberSchema.positive();
      if (descriptor.negative) numberSchema = numberSchema.negative();
      if (descriptor.default !== undefined) numberSchema = numberSchema.default(descriptor.default);
      if (descriptor.optional) numberSchema = numberSchema.optional();
      return numberSchema;

    case 'boolean':
      let booleanSchema = z.boolean();
      if (descriptor.default !== undefined) booleanSchema = booleanSchema.default(descriptor.default);
      if (descriptor.optional) booleanSchema = booleanSchema.optional();
      return booleanSchema;

    case 'object':
      if (!descriptor.shape) {
        throw new Error('Object schema requires shape');
      }
      const shape: any = {};
      for (const [key, value] of Object.entries(descriptor.shape)) {
        shape[key] = buildZodSchemaFromDescriptor(z, value);
      }
      let objectSchema = z.object(shape);
      if (descriptor.strict) objectSchema = objectSchema.strict();
      if (descriptor.passthrough) objectSchema = objectSchema.passthrough();
      if (descriptor.default !== undefined) objectSchema = objectSchema.default(descriptor.default);
      if (descriptor.optional) objectSchema = objectSchema.optional();
      return objectSchema;

    case 'array':
      if (!descriptor.element) {
        throw new Error('Array schema requires element');
      }
      const elementSchema = buildZodSchemaFromDescriptor(z, descriptor.element);
      let arraySchema = z.array(elementSchema);
      if (descriptor.min !== undefined) arraySchema = arraySchema.min(descriptor.min);
      if (descriptor.max !== undefined) arraySchema = arraySchema.max(descriptor.max);
      if (descriptor.length !== undefined) arraySchema = arraySchema.length(descriptor.length);
      if (descriptor.nonempty) arraySchema = arraySchema.nonempty();
      if (descriptor.default !== undefined) arraySchema = arraySchema.default(descriptor.default);
      if (descriptor.optional) arraySchema = arraySchema.optional();
      return arraySchema;

    case 'enum':
      if (!descriptor.values || !Array.isArray(descriptor.values)) {
        throw new Error('Enum schema requires values array');
      }
      let enumSchema = z.enum(descriptor.values);
      if (descriptor.default !== undefined) enumSchema = enumSchema.default(descriptor.default);
      if (descriptor.optional) enumSchema = enumSchema.optional();
      return enumSchema;

    case 'literal':
      if (descriptor.value === undefined) {
        throw new Error('Literal schema requires value');
      }
      let literalSchema = z.literal(descriptor.value);
      if (descriptor.optional) literalSchema = literalSchema.optional();
      return literalSchema;

    case 'union':
      if (!descriptor.schemas || !Array.isArray(descriptor.schemas)) {
        throw new Error('Union schema requires schemas array');
      }
      const unionSchemas = descriptor.schemas.map((schema: any) => buildZodSchemaFromDescriptor(z, schema));
      // z.union requires at least 2 schemas, handle the case where we have less
      if (unionSchemas.length < 2) {
        throw new Error('Union schema requires at least 2 schemas');
      }
      let unionSchema = z.union([unionSchemas[0], unionSchemas[1], ...unionSchemas.slice(2)]);
      if (descriptor.optional) unionSchema = unionSchema.optional();
      return unionSchema;

    case 'record':
      if (!descriptor.value) {
        throw new Error('Record schema requires value');
      }
      const valueSchema = buildZodSchemaFromDescriptor(z, descriptor.value);
      let recordSchema = z.record(valueSchema);
      if (descriptor.default !== undefined) recordSchema = recordSchema.default(descriptor.default);
      if (descriptor.optional) recordSchema = recordSchema.optional();
      return recordSchema;

    case 'any':
      let anySchema = z.any();
      if (descriptor.optional) anySchema = anySchema.optional();
      return anySchema;

    case 'unknown':
      let unknownSchema = z.unknown();
      if (descriptor.optional) unknownSchema = unknownSchema.optional();
      return unknownSchema;

    default:
      throw new Error(`Unknown schema type: ${descriptor.type}`);
  }
};

const getElectron = async () => {
  if (!electron) {
    try {
      // Try CommonJS require first (for Jest/test environments)
      if (typeof require !== "undefined") {
        electron = require("electron");
      } else {
        // Fall back to dynamic import for ESM
        const electronModule = await import("electron");
        // Handle both CommonJS and ESM electron imports
        electron = electronModule.default || electronModule;
      }
    } catch (err) {
      console.warn(`Failed to load electron:`, err);
      if (process.env.NODE_ENV === "test") {
        return undefined;
      }
      throw err;
    }
  }
  return electron;
};

// Set up all the IPC handlers that your renderer process will need
const setupIpcHandlers = (ipcMain?: IpcMain, logger?: Logger) => {
  if (!ipcMain) {
    logger?.warn("ipcMain not available, skipping IPC handler setup");
    return;
  }
  // File system operations
  ipcMain.handle(
    "fs-read-file",
    async (_event: any, filePath: string, options?: any) => {
      try {
        logger?.info(`Reading file: ${filePath}`);
        return await fs.readFile(filePath, options);
      } catch (error) {
        logger?.error(`Error reading file ${filePath}: ${error}`);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "fs-write-file",
    async (_event: any, filePath: string, data: string) => {
      try {
        logger?.info(`Writing file: ${filePath}`);
        return await fs.writeFile(filePath, data);
      } catch (error) {
        logger?.error(`Error writing file ${filePath}: ${error}`);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "fs-mkdir",
    async (_event: any, dirPath: string, options?: any) => {
      try {
        logger?.info(`Creating directory: ${dirPath}`);
        return await fs.mkdir(dirPath, options);
      } catch (error) {
        logger?.error(`Error creating directory ${dirPath}: ${error}`);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "fs-readdir",
    async (_event: any, dirPath: string, options?: any) => {
      try {
        logger?.info(`Reading directory: ${dirPath}`);
        const entries = await fs.readdir(dirPath, options);
        if (options?.withFileTypes) {
          return (entries as unknown as Dirent[]).map((d) => ({
            name: d.name,
            isDirectory: d.isDirectory(),
            isFile: d.isFile(),
          }));
        }
        return entries;
      } catch (error) {
        logger?.error(`Error reading directory ${dirPath}: ${error}`);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "fs-stat",
    async (_event: any, filePath: string) => {
      try {
        logger?.info(`Getting stats for: ${filePath}`);
        const stats = await fs.stat(filePath);
        return {
          isFile: stats.isFile(),
          isDirectory: stats.isDirectory(),
          size: stats.size,
          mtime: stats.mtime,
          ctime: stats.ctime,
        };
      } catch (error) {
        logger?.error(`Error getting stats for ${filePath}: ${error}`);
        throw error;
      }
    },
  );

  // Path operations
  ipcMain.handle("path-join", async (_event: any, paths: string[]) => {
    return path.join(...paths);
  });

  // Other utilities
  ipcMain.handle("get-cwd", async () => {
    return process.cwd();
  });

  // JSON5 operations via IPC (functions can't be serialized)
  ipcMain.handle("json5-parse", async (_event: any, text: string) => {
    try {
      const json5Module = await import("json5");
      // Handle both CommonJS and ESM exports
      const json5 = json5Module.default || json5Module;
      return json5.parse(text);
    } catch (error) {
      logger?.error(`JSON5 parse error: ${error}`);
      throw error;
    }
  });

  ipcMain.handle("json5-stringify", async (_event: any, value: any) => {
    try {
      const json5Module = await import("json5");
      // Handle both CommonJS and ESM exports
      const json5 = json5Module.default || json5Module;
      return json5.stringify(value);
    } catch (error) {
      logger?.error(`JSON5 stringify error: ${error}`);
      throw error;
    }
  });

  // Zod operations via IPC - provide real Zod validation
  ipcMain.handle("zod-available", async () => {
    try {
      await import("zod");
      return true;
    } catch (error) {
      logger?.error(`Zod not available: ${error}`);
      return false;
    }
  });

  // Zod schema validation via IPC
  ipcMain.handle("zod-validate", async (_event: any, data: any, schemaDescriptor: any) => {
    try {
      const { z } = await import("zod");
      
      // Build the schema from the descriptor
      const schema = buildZodSchemaFromDescriptor(z, schemaDescriptor);
      
      // Validate the data
      const result = schema.safeParse(data);
      
      if (result.success) {
        return {
          success: true,
          data: result.data,
          error: null
        };
      } else {
        return {
          success: false,
          data: null,
          error: result.error.issues
        };
      }
    } catch (error) {
      logger?.error(`Zod validation error: ${error}`);
      return {
        success: false,
        data: null,
        error: [{ message: `Validation failed: ${error}` }]
      };
    }
  });

  // Zod schema parsing via IPC
  ipcMain.handle("zod-parse", async (_event: any, data: any, schemaDescriptor: any) => {
    try {
      const { z } = await import("zod");
      
      // Build the schema from the descriptor
      const schema = buildZodSchemaFromDescriptor(z, schemaDescriptor);
      
      // Parse the data (throws on validation failure)
      const result = schema.parse(data);
      
      return {
        success: true,
        data: result,
        error: null
      };
    } catch (error) {
      logger?.error(`Zod parse error: ${error}`);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  });

  // Renderer logging via IPC
  ipcMain.handle("log-message", async (_event: any, level: string, component: string, message: string) => {
    try {
      const logPath = path.join(process.cwd(), "logs", "app.log");
      const rendererLogger = createLogger(`client-${component}`, logPath);
      
      switch (level.toLowerCase()) {
        case 'info':
          await rendererLogger.info(message);
          break;
        case 'warn':
        case 'warning':
          await rendererLogger.warn(message);
          break;
        case 'error':
          await rendererLogger.error(message);
          break;
        case 'debug':
          await rendererLogger.debug(message);
          break;
        default:
          await rendererLogger.info(`[${level.toUpperCase()}] ${message}`);
      }
    } catch (error) {
      logger?.error(`Failed to log renderer message: ${error}`);
    }
  });

  // Read log file contents
  ipcMain.handle("read-log-file", async (_event: any) => {
    try {
      const logPath = path.join(process.cwd(), "logs", "app.log");
      const content = await fs.readFile(logPath, 'utf8');
      return content;
    } catch (error) {
      logger?.warn(`Log file not found or could not be read: ${error}`);
      return '';
    }
  });

  // Your existing load-sample-data handler
  ipcMain.handle(
    "load-sample-data",
    async (_event: any, { id, url }: { id: string; url: string }) => {
      try {
        logger?.info(`Loading sample data for ${id}: ${url}`);
        // Implement your actual data loading logic here
        // For now, return mock data
        return [
          { id: 1, name: "Sample Item 1", value: "Test Value 1" },
          { id: 2, name: "Sample Item 2", value: "Test Value 2" },
        ];
      } catch (error) {
        logger?.error(`Error loading sample data: ${error}`);
        throw error;
      }
    },
  );

  // Script execution handler
  ipcMain.handle("execute-script", async (_event: any, options: {
    scriptPath: string;
    parameters: string[];
    shell: string;
    cwd: string;
    timeout: number;
  }) => {
    try {
      const { spawn } = await import('child_process');
      
      logger?.info(`Executing script: ${options.scriptPath} with shell: ${options.shell}`);
      
      const { scriptPath, parameters, shell, cwd, timeout } = options;
      
      const args = shell === 'powershell' || shell === 'pwsh' 
        ? ['-File', scriptPath, ...parameters]
        : ['/c', scriptPath, ...parameters];
      
      const command = shell === 'cmd' ? 'cmd' : shell;
      
      return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';
        
        const child = spawn(command, args, {
          cwd,
          timeout
        });
        
        child.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        child.on('close', (code) => {
          logger?.info(`Script execution completed with code: ${code}`);
          resolve({
            success: code === 0,
            output,
            error: errorOutput || undefined,
            exitCode: code || 0
          });
        });
        
        child.on('error', (error) => {
          logger?.error(`Script execution error: ${error.message}`);
          resolve({
            success: false,
            output: '',
            error: error.message,
            exitCode: -1
          });
        });
      });
    } catch (error) {
      logger?.error(`Failed to execute script: ${error}`);
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1
      };
    }
  });

  // Script path validation handler
  ipcMain.handle("validate-script-path", async (_event: any, scriptPath: string, scriptsDirectory: string) => {
    try {
      const normalizedPath = path.normalize(scriptPath);
      const normalizedScriptsDir = path.normalize(scriptsDirectory);
      return normalizedPath.startsWith(normalizedScriptsDir);
    } catch (error) {
      logger?.error(`Failed to validate script path: ${error}`);
      return false;
    }
  });
};

export const createWindow = async (
  Window?: typeof ElectronBrowserWindow,
  logger?: Logger,
): Promise<ElectronBrowserWindow> => {
  const electronModule = await getElectron();
  if (!electronModule) {
    throw new Error('Electron module not available');
  }
  const { BrowserWindow, ipcMain } = electronModule;
  const Win = Window ?? BrowserWindow;

  logger?.info("Creating browser window");

  // Set up all IPC handlers
  setupIpcHandlers(ipcMain, logger);

  const win = new Win({
    width: 1200,
    height: 800,
    icon: path.join(process.cwd(), "dist", "assets", "omnia_logo.ico"), // Set window icon
    webPreferences: {
      nodeIntegration: false, // Disable node integration for security
      contextIsolation: true, // Enable context isolation
      // enableRemoteModule is deprecated in newer Electron versions
      preload: path.join(process.cwd(), "dist", "preload.js"), // Add preload script
    },
  });

  const indexPath = path.join(process.cwd(), "dist", "index.html");
  logger?.info(`Loading file: ${indexPath}`);
  await win.loadFile(indexPath);

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }

  return win;
};

export const startElectron = (
  Window?: typeof ElectronBrowserWindow,
  logger?: Logger,
): void => {
  const start = async () => {
    const electronModule = await getElectron();
    if (!electronModule) {
      throw new Error('Electron module not available');
    }
    const { app } = electronModule;
    logger?.info("Electron app ready");
    await createWindow(Window, logger);

    app.on("activate", async () => {
      const electronModule = await getElectron();
      if (!electronModule) {
        throw new Error('Electron module not available');
      }
      const { BrowserWindow } = electronModule;
      const Win = Window ?? BrowserWindow;
      if (Win.getAllWindows().length === 0) {
        await createWindow(Window, logger);
      }
    });
  };

  getElectron().then((electronModule) => {
    if (!electronModule) {
      throw new Error('Electron module not available');
    }
    const { app } = electronModule;
    logger?.info("Starting Electron");
    app.whenReady().then(start);

    app.on("window-all-closed", () => {
      logger?.info("Window all closed");
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
  }).catch((err) => {
    logger?.error(`Failed to start Electron: ${err}`);
  });
};

if (process.env.NODE_ENV !== "test") {
  const logPath = path.join(process.cwd(), "logs", "app.log");
  
  // Set up console logging to capture all console output to file
  setupConsoleLogging(logPath);
  
  const logger = createLogger("electron-main", logPath);
  logger.info("Starting Electron application with console logging enabled");
  
  startElectron(undefined, logger);
}
