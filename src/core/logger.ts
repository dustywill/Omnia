import fs from 'fs/promises';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export interface Logger {
  info: (message: string) => Promise<void>;
  warn: (message: string) => Promise<void>;
  error: (message: string) => Promise<void>;
}

const writeEntry = async (
  logPath: string,
  plugin: string,
  level: LogLevel,
  message: string,
): Promise<void> => {
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] [${plugin}] [${level}] ${message}\n`;
  await fs.appendFile(logPath, entry, 'utf8');
  const consoleFn = level === 'INFO' ? console.log : level === 'WARN' ? console.warn : console.error;
  consoleFn(entry.trimEnd());
};

export const createLogger = (plugin: string, logPath: string): Logger => {
  return {
    info: (msg) => writeEntry(logPath, plugin, 'INFO', msg),
    warn: (msg) => writeEntry(logPath, plugin, 'WARN', msg),
    error: (msg) => writeEntry(logPath, plugin, 'ERROR', msg),
  };
};
