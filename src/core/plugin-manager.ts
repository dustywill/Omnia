import { loadNodeModule } from '../ui/node-module-loader.js';
import { type AppConfig, readConfig, writeConfig } from './config.js';
import type { EventBus } from './event-bus.js';

export type PluginManifest = {
  id: string;
  main: string;
  configDefaults?: Record<string, unknown>;
};

export type LoadedPlugin = {
  manifest: PluginManifest;
  module: {
    init?: (options: { config: unknown; bus: EventBus<Record<string, unknown>> }) => Promise<void> | void;
    stop?: () => Promise<void> | void;
  };
};

export type PluginManagerOptions = {
  pluginsPath: string;
  configPath: string;
  bus: EventBus<Record<string, unknown>>;
};

export const createPluginManager = (opts: PluginManagerOptions) => {
  const loaded: Record<string, LoadedPlugin> = {};
  let config: AppConfig = {};

  const readManifest = async (file: string): Promise<PluginManifest> => {
    const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
    const JSON5 = await loadNodeModule<typeof import('json5')>('json5');
    const text = await fs.readFile(file, 'utf8');
    return JSON5.parse(text) as PluginManifest;
  };

  const loadPlugins = async () => {
    try {
      config = await readConfig(opts.configPath);
    } catch {
      config = {};
    }

    const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
    const path = await loadNodeModule<typeof import('path')>('path');
    const entries = await fs.readdir(opts.pluginsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(opts.pluginsPath, entry.name, 'plugin.json5');
      try {
        const manifest = await readManifest(manifestPath);
        if (!config.plugins) config.plugins = {} as unknown as AppConfig['plugins'];
        if (!(config.plugins as any)[manifest.id]) {
          (config.plugins as any)[manifest.id] = manifest.configDefaults ?? {};
        }
        const modPath = path.join(opts.pluginsPath, entry.name, manifest.main);
        const { pathToFileURL } = await loadNodeModule<typeof import('url')>('url');
        const mod = (await import(pathToFileURL(modPath).href)) as LoadedPlugin['module'];
        loaded[manifest.id] = { manifest, module: mod };
      } catch {
        // skip invalid plugins
      }
    }
    await writeConfig(opts.configPath, config);
    config = await readConfig(opts.configPath);
  };

  const initPlugins = async () => {
    for (const p of Object.values(loaded)) {
      await p.module.init?.({ config: (config.plugins as any)[p.manifest.id], bus: opts.bus });
    }
  };

  const stopPlugins = async () => {
    for (const p of Object.values(loaded)) {
      await p.module.stop?.();
    }
  };

  const getPluginConfig = (id: string): unknown => {
    return (config.plugins as any)?.[id];
  };

  const updatePluginConfig = async (id: string, cfg: unknown) => {
    if (!config.plugins) config.plugins = {} as any;
    (config.plugins as any)[id] = cfg;
    await writeConfig(opts.configPath, config);
  };

  return { loadPlugins, initPlugins, stopPlugins, getPluginConfig, updatePluginConfig };
};
