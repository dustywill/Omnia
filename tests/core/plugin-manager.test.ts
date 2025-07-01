import fs from 'fs/promises';
import path from 'path';
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { createPluginManager } from '../../src/core/plugin-manager.js';
import { createEventBus } from '../../src/core/event-bus.js';

const fixturesDir = path.join(__dirname, 'fixtures');
const pluginsDir = path.join(fixturesDir, 'plugins');
const configPath = path.join(fixturesDir, 'app-config.json5');

beforeEach(async () => {
  await fs.rm(fixturesDir, { recursive: true, force: true });
  await fs.mkdir(path.join(pluginsDir, 'simple'), { recursive: true });
  await fs.writeFile(
    path.join(pluginsDir, 'simple', 'plugin.json5'),
    '{id:"simple", main:"./index.js", configDefaults:{enabled:true}}',
    'utf8',
  );
  await fs.writeFile(
    path.join(pluginsDir, 'simple', 'index.js'),
    'export const init = async () => {}; export const stop = async () => {};',
    'utf8',
  );
  await fs.writeFile(configPath, '{}', 'utf8');
});

afterEach(async () => {
  await fs.rm(fixturesDir, { recursive: true, force: true });
});

describe('plugin manager', () => {
  it('loads manifests and initializes plugins', async () => {
    const bus = createEventBus<Record<string, unknown>>();
    const manager = createPluginManager({
      pluginsPath: pluginsDir,
      configPath,
      bus,
    });

    await manager.loadPlugins();
    await manager.initPlugins();

    expect(manager.getPluginConfig('simple')).toEqual({ enabled: true });
  });

  it('updates plugin configuration', async () => {
    const bus = createEventBus<Record<string, unknown>>();
    const manager = createPluginManager({ pluginsPath: pluginsDir, configPath, bus });
    await manager.loadPlugins();
    await manager.updatePluginConfig('simple', { enabled: false });
    expect(manager.getPluginConfig('simple')).toEqual({ enabled: false });
  });
});
