import fs from 'fs/promises';
import fsSync from 'fs';
import JSON5 from 'json5';
import { z } from 'zod';
import type { EventBus } from './event-bus.js';

const isErrnoException = (value: unknown): value is NodeJS.ErrnoException => {
  return typeof value === 'object' && value !== null && 'code' in value;
};

export const AppConfigSchema = z.record(z.unknown());

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const readConfig = async (path: string): Promise<AppConfig> => {
  const text = await fs.readFile(path, 'utf8');
  const data = JSON5.parse(text);
  return AppConfigSchema.parse(data);
};

export const writeConfig = async (
  path: string,
  config: AppConfig,
): Promise<void> => {
  const text = JSON5.stringify(config, null, 2);
  await fs.writeFile(path, text, 'utf8');
};

export const loadConfig = async (
  path: string,
  defaults: AppConfig,
): Promise<AppConfig> => {
  try {
    const existing = await readConfig(path);
    const merged = { ...defaults, ...existing };
    if (JSON.stringify(merged) !== JSON.stringify(existing)) {
      await writeConfig(path, merged);
    }
    return merged;
  } catch (err) {
    if (isErrnoException(err) && err.code === 'ENOENT') {
      await writeConfig(path, defaults);
      return defaults;
    }
    throw err;
  }
};

export const watchConfig = (
  path: string,
  bus: EventBus<{ configChanged: AppConfig }>,
): (() => void) => {
  const onChange = async () => {
    try {
      const config = await readConfig(path);
      bus.publish('configChanged', config);
    } catch {
      // ignore errors
    }
  };
  fsSync.watchFile(path, { persistent: false, interval: 100 }, onChange);
  return () => fsSync.unwatchFile(path, onChange);
};
