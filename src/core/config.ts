import fs from 'fs/promises';
import { parse as parseJson5, stringify as stringifyJson5 } from 'json5';
import { z } from 'zod';

export const AppConfigSchema = z.record(z.unknown());

export type AppConfig = z.infer<typeof AppConfigSchema>;

export const readConfig = async (path: string): Promise<AppConfig> => {
  const text = await fs.readFile(path, 'utf8');
  const data = parseJson5(text);
  return AppConfigSchema.parse(data);
};

export const writeConfig = async (
  path: string,
  config: AppConfig,
): Promise<void> => {
  const text = stringifyJson5(config, null, 2);
  await fs.writeFile(path, text, 'utf8');
};
