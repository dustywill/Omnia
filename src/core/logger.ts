import pino, { Logger as PinoLogger } from 'pino';
import path from 'node:path';
import fs from 'node:fs';
import { Writable } from 'node:stream';

export interface LogConfig {
  level?: 'info' | 'debug' | 'warn' | 'error';
  prettyPrint?: boolean;
  filePath?: string;
}

let logger: PinoLogger | undefined;
let transportStream: Writable | undefined;

const ensureLogDirectory = (dir: string): Error | null => {
  if (fs.existsSync(dir)) return null;
  try {
    fs.mkdirSync(dir, { recursive: true });
    return null;
  } catch (err) {
    return err as Error;
  }
};

export const initializeLogger = (config: LogConfig = {}): void => {
  const defaults = {
    level: 'info' as const,
    prettyPrint: false,
    filePath: path.join(process.cwd(), 'logs', 'omnia.log'),
  };
  const merged = { ...defaults, ...config };

  const logDir = path.dirname(merged.filePath);
  const dirError = ensureLogDirectory(logDir);
  if (dirError) {
    console.error(`Failed to create log directory at ${logDir}:`, dirError);
    logger = pino({
      level: merged.level,
      ...(merged.prettyPrint ? { transport: { target: 'pino-pretty' } } : {}),
    });
    logger.error(`Failed to create log directory ${logDir}. Logging to console only.`);
    return;
  }

  transportStream = pino.transport({
    targets: [
      {
        level: merged.level,
        target: 'pino/file',
        options: { destination: merged.filePath, mkdir: true },
      },
      ...(merged.prettyPrint
        ? [
            {
              level: merged.level,
              target: 'pino-pretty',
              options: { colorize: true, sync: true },
            },
          ]
        : []),
    ],
  });

  logger = pino({ level: merged.level }, transportStream);
  logger.info({ logConfig: merged }, 'Logger initialized.');
};

export const getLogger = (): PinoLogger => {
  if (!logger) {
    console.warn('Logger accessed before explicit initialization. Initializing with defaults.');
    initializeLogger();
  }
  return logger as PinoLogger;
};

export const shutdownLogger = async (): Promise<void> => {
  if (logger && transportStream) {
    const stream = transportStream;
    console.log('[LoggerShutdown] Shutdown initiated. Flushing and destroying transport...');
    if (typeof (logger as unknown as { flush?: () => void }).flush === 'function') {
      (logger as unknown as { flush?: () => void }).flush!();
    }

    await new Promise<void>((resolve) => {
      let resolved = false;
      const timeoutDuration = 2000;
      const resolutionTimeout = setTimeout(() => {
        if (!resolved) {
          console.warn(
            `[LoggerShutdown] Timeout (${timeoutDuration}ms) reached waiting for transport 'close' event. Forcing resolve.`,
          );
          resolved = true;
          resolve();
        }
      }, timeoutDuration);

      stream.on('close', () => {
        if (!resolved) {
          clearTimeout(resolutionTimeout);
          console.log('[LoggerShutdown] Pino transport stream reported "close".');
          resolved = true;
          resolve();
        }
      });

      stream.on('error', (err) => {
        if (!resolved) {
          clearTimeout(resolutionTimeout);
          console.error('[LoggerShutdown] Error event on pino transport during shutdown:', err);
          resolved = true;
          resolve();
        }
      });

      if (typeof (stream as unknown as { destroy?: () => void }).destroy === 'function') {
        (stream as unknown as { destroy: () => void }).destroy();
        console.log('[LoggerShutdown] Pino transport .destroy() called.');
      } else if (typeof stream.end === 'function') {
        console.log('[LoggerShutdown] .destroy() not found, calling .end() as fallback.');
        stream.end(() => {
          console.log('[LoggerShutdown] Pino transport .end() (fallback) called back. Waiting for close/finish.');
        });
      } else {
        console.warn('[LoggerShutdown] Neither .destroy() nor .end() found on transport. Cannot gracefully close transport.');
        clearTimeout(resolutionTimeout);
        resolved = true;
        resolve();
      }
    });
    return;
  }
  console.log('[LoggerShutdown] No logger or pinoTransportInstance to shut down.');
};
