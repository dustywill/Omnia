import { loadNodeModule } from '../ui/node-module-loader.js';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface Logger {
  info: (message: string) => Promise<void>;
  warn: (message: string) => Promise<void>;
  error: (message: string) => Promise<void>;
  debug: (message: string) => Promise<void>;
}

const ensureLogDirectory = async (logPath: string): Promise<void> => {
  try {
    const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
    const path = await loadNodeModule<typeof import('path')>('path');
    const dir = path.dirname(logPath);
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    // Directory already exists or failed to create
  }
};

const writeEntry = async (
  logPath: string,
  plugin: string,
  level: LogLevel,
  message: string,
): Promise<void> => {
  try {
    await ensureLogDirectory(logPath);
    const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
    const timestamp = new Date().toISOString();
    const entry = `[${timestamp}] [${plugin}] [${level}] ${message}\n`;
    await fs.appendFile(logPath, entry, 'utf8');
    
    // Also output to console (but don't double-log if this is already from console redirection)
    if (!message.startsWith('[CONSOLE]')) {
      const consoleFn = 
        level === 'INFO' ? originalConsole.log : 
        level === 'WARN' ? originalConsole.warn : 
        level === 'ERROR' ? originalConsole.error : 
        originalConsole.debug;
      consoleFn(`[${plugin}] [${level}] ${message}`);
    }
  } catch (error) {
    // Fallback to console if file logging fails
    originalConsole.error(`Logger failed to write to ${logPath}:`, error);
    originalConsole.log(`[${plugin}] [${level}] ${message}`);
  }
};

export const createLogger = (plugin: string, logPath: string): Logger => {
  return {
    info: (msg) => writeEntry(logPath, plugin, 'INFO', msg),
    warn: (msg) => writeEntry(logPath, plugin, 'WARN', msg),
    error: (msg) => writeEntry(logPath, plugin, 'ERROR', msg),
    debug: (msg) => writeEntry(logPath, plugin, 'DEBUG', msg),
  };
};

// Store original console methods globally to prevent logging loops
const originalConsole = {
  log: console.log.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console)
};

// Console redirection for Electron main process
export const setupConsoleLogging = (logPath: string): void => {
  const logger = createLogger('CONSOLE', logPath);
  
  // Store original console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalDebug = console.debug;
  
  // Override console methods to also log to file
  console.log = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    logger.info(`[CONSOLE] ${message}`);
    originalLog(...args);
  };
  
  console.warn = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    logger.warn(`[CONSOLE] ${message}`);
    originalWarn(...args);
  };
  
  console.error = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    logger.error(`[CONSOLE] ${message}`);
    originalError(...args);
  };
  
  console.debug = (...args: any[]) => {
    const message = args.map(arg => 
      typeof arg === 'string' ? arg : JSON.stringify(arg)
    ).join(' ');
    logger.debug(`[CONSOLE] ${message}`);
    originalDebug(...args);
  };
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    logger.error(`[CONSOLE] Uncaught Exception: ${error.message}\n${error.stack}`);
    originalError('Uncaught Exception:', error);
  });
  
  // Handle unhandled promise rejections
  process.on('unhandledRejection', (reason, promise) => {
    logger.error(`[CONSOLE] Unhandled Rejection at: ${promise}, reason: ${reason}`);
    originalError('Unhandled Rejection at:', promise, 'reason:', reason);
  });
};
