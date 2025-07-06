/**
 * Client-side console logging interceptor
 * Captures all console.log, warn, error, debug calls and sends them to the main process
 */

declare global {
  interface Window {
    electronAPI?: {
      logMessage: (level: string, component: string, message: string) => Promise<void>;
    };
  }
}

export interface ClientLoggerOptions {
  component?: string;
  enableConsoleCapture?: boolean;
  enableErrorCapture?: boolean;
  enableUnhandledRejectionCapture?: boolean;
}

export class ClientLogger {
  private component: string;
  private originalConsole: {
    log: typeof console.log;
    warn: typeof console.warn;
    error: typeof console.error;
    debug: typeof console.debug;
  };

  constructor(options: ClientLoggerOptions = {}) {
    this.component = options.component || 'client';
    
    // Store original console methods
    this.originalConsole = {
      log: console.log.bind(console),
      warn: console.warn.bind(console),
      error: console.error.bind(console),
      debug: console.debug.bind(console)
    };

    if (options.enableConsoleCapture !== false) {
      this.setupConsoleCapture();
    }

    if (options.enableErrorCapture !== false) {
      this.setupErrorCapture();
    }

    if (options.enableUnhandledRejectionCapture !== false) {
      this.setupUnhandledRejectionCapture();
    }
  }

  private async sendLog(level: string, message: string): Promise<void> {
    try {
      if (window.electronAPI?.logMessage) {
        await window.electronAPI.logMessage(level, this.component, message);
      }
    } catch (error) {
      // Fallback to original console if IPC fails
      this.originalConsole.error('Failed to send log to main process:', error);
    }
  }

  private formatArgs(...args: any[]): string {
    return args.map(arg => {
      if (typeof arg === 'string') {
        return arg;
      } else if (arg instanceof Error) {
        return `${arg.message}\n${arg.stack}`;
      } else {
        try {
          return JSON.stringify(arg, null, 2);
        } catch {
          return String(arg);
        }
      }
    }).join(' ');
  }

  private setupConsoleCapture(): void {
    // Override console.log
    console.log = (...args: any[]) => {
      const message = this.formatArgs(...args);
      this.sendLog('info', `[CONSOLE] ${message}`);
      this.originalConsole.log(...args);
    };

    // Override console.warn
    console.warn = (...args: any[]) => {
      const message = this.formatArgs(...args);
      this.sendLog('warn', `[CONSOLE] ${message}`);
      this.originalConsole.warn(...args);
    };

    // Override console.error
    console.error = (...args: any[]) => {
      const message = this.formatArgs(...args);
      this.sendLog('error', `[CONSOLE] ${message}`);
      this.originalConsole.error(...args);
    };

    // Override console.debug
    console.debug = (...args: any[]) => {
      const message = this.formatArgs(...args);
      this.sendLog('debug', `[CONSOLE] ${message}`);
      this.originalConsole.debug(...args);
    };
  }

  private setupErrorCapture(): void {
    // Capture uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      const message = `Uncaught Error: ${event.error?.message || event.message}\n` +
                     `File: ${event.filename}:${event.lineno}:${event.colno}\n` +
                     `Stack: ${event.error?.stack || 'N/A'}`;
      this.sendLog('error', `[UNCAUGHT ERROR] ${message}`);
    });
  }

  private setupUnhandledRejectionCapture(): void {
    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason;
      let message = 'Unhandled Promise Rejection: ';
      
      if (reason instanceof Error) {
        message += `${reason.message}\nStack: ${reason.stack}`;
      } else {
        message += String(reason);
      }
      
      this.sendLog('error', `[UNHANDLED REJECTION] ${message}`);
    });
  }

  // Method to manually log messages
  public async log(level: 'info' | 'warn' | 'error' | 'debug', message: string): Promise<void> {
    await this.sendLog(level, message);
  }

  // Method to restore original console methods
  public restoreConsole(): void {
    console.log = this.originalConsole.log;
    console.warn = this.originalConsole.warn;
    console.error = this.originalConsole.error;
    console.debug = this.originalConsole.debug;
  }
}

// Create a default instance for immediate use
export const clientLogger = new ClientLogger({
  component: 'renderer',
  enableConsoleCapture: true,
  enableErrorCapture: true,
  enableUnhandledRejectionCapture: true
});

// Export a convenience function to create component-specific loggers
export const createClientLogger = (component: string, options?: Omit<ClientLoggerOptions, 'component'>) => {
  return new ClientLogger({
    ...options,
    component
  });
};