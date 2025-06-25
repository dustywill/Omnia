import fs from 'fs/promises';
import { parse as parseJson5 } from 'json5';
import path from 'path';
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
    const text = await fs.readFile(file, 'utf8');
    return parseJson5(text) as PluginManifest;
  };

  const loadPlugins = async () => {
    try {
      config = await readConfig(opts.configPath);
    } catch {
      config = {};
    }

    const entries = await fs.readdir(opts.pluginsPath, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const manifestPath = path.join(opts.pluginsPath, entry.name, 'plugin.json5');
      try {
        const manifest = await readManifest(manifestPath);
        const modPath = path.join(opts.pluginsPath, entry.name, manifest.main);
        const mod = (await import(modPath)) as LoadedPlugin['module'];
        loaded[manifest.id] = { manifest, module: mod };
        if (!config.plugins) config.plugins = {} as unknown as AppConfig['plugins'];
        if (!(config.plugins as any)[manifest.id]) {
          (config.plugins as any)[manifest.id] = manifest.configDefaults ?? {};
        }
      } catch {
        // skip invalid plugins
      }
    }
    await writeConfig(opts.configPath, config);
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
