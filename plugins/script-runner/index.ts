import fs from 'fs/promises';
import path from 'path';
import { spawn } from 'child_process';

export type Script = {
  id: string;
  name: string;
  description: string;
  path: string;
};

const METADATA_REGEX = /^#\s*(ID|Name|Description):\s*(.+)$/i;

export const discoverScripts = async (dir: string): Promise<Script[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const scripts: Script[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.ps1')) continue;
    const filePath = path.join(dir, entry.name);
    const content = await fs.readFile(filePath, 'utf8');

    const lines = content.split(/\r?\n/);
    const meta: Partial<Script> = { path: filePath };
    for (const line of lines) {
      const match = line.match(METADATA_REGEX);
      if (!match) continue;
      const [, key, value] = match;
      switch (key.toLowerCase()) {
        case 'id':
          meta.id = value.trim();
          break;
        case 'name':
          meta.name = value.trim();
          break;
        case 'description':
          meta.description = value.trim();
          break;
      }
    }
    if (meta.id && meta.name && meta.description) {
      scripts.push(meta as Script);
    }
  }

  return scripts;
};

export const filterScripts = (scripts: Script[], query: string): Script[] => {
  const q = query.toLowerCase();
  return scripts.filter(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
};

export type ScriptStatus = 'running' | 'success' | 'error';

export const runScript = (
  script: Script,
  params: string[],
  onStatus: (status: ScriptStatus) => void,
): Promise<void> => {
  onStatus('running');
  return new Promise((resolve, reject) => {
    const child = spawn('pwsh', ['-File', script.path, ...params]);
    child.on('exit', (code) => {
      if (code === 0) {
        onStatus('success');
        resolve();
      } else {
        onStatus('error');
        reject(new Error(`exit code ${code}`));
      }
    });
    child.on('error', (err) => {
      onStatus('error');
      reject(err);
    });
  });
};

export type CustomizeOptions = {
  prompt: (current: string[]) => Promise<string[]> | string[];
  saveDefaults: (scriptId: string, params: string[]) => Promise<void> | void;
};

export const customizeScript = async (
  script: Script,
  currentParams: string[],
  options: CustomizeOptions,
): Promise<string[]> => {
  const params = await options.prompt(currentParams);
  await options.saveDefaults(script.id, params);
  return params;
};

export type EditConfigOptions = {
  prompt: (current: string[]) => Promise<string[]> | string[];
  updateConfig: (
    config: Record<string, string[]>,
  ) => Promise<void> | void;
};

export const editScriptConfig = async <
  T extends Record<string, string[]>,
  K extends keyof T & string,
>(
  scriptId: K,
  config: T,
  options: EditConfigOptions,
): Promise<T> => {
  const current = config[scriptId] ?? [];
  const params = await options.prompt(current);
  const updated = { ...config, [scriptId]: params } as T;
  await options.updateConfig(updated);
  return updated;
};

export type RemoveConfigOptions = {
  updateConfig: (
    config: Record<string, string[]>,
  ) => Promise<void> | void;
};

export const removeScriptConfig = async <T extends Record<string, string[]>, K extends keyof T & string>(
  scriptId: K,
  config: T,
  options: RemoveConfigOptions,
): Promise<T> => {
  const { [scriptId]: _removed, ...rest } = config;
  const updated = rest as unknown as T;
  await options.updateConfig(updated);
  return updated;
};
