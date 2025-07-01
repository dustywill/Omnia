import {
  readConfig,
  writeConfig,
  loadConfig,
  watchConfig,
} from '../../src/core/config.js';
import { createEventBus } from '../../src/core/event-bus.js';
import { parse as parseJson5 } from 'json5';
import fs from 'fs/promises';
import path from 'path';
import { expect, describe, it, beforeEach, afterEach } from '@jest/globals';

const tempConfigPath = path.join(__dirname, 'app-config.json5');

beforeEach(async () => {
  await fs.writeFile(tempConfigPath, '{foo:"bar"}', 'utf8');
});

afterEach(async () => {
  await fs.rm(tempConfigPath, { force: true });
});

describe('config manager', () => {
  it('reads configuration from file', async () => {
    const config = await readConfig(tempConfigPath);
    expect(config).toEqual({ foo: 'bar' });
  });

  it('writes configuration to file', async () => {
    await writeConfig(tempConfigPath, { foo: 'baz' });
    const text = await fs.readFile(tempConfigPath, 'utf8');
    expect(text).toContain('baz');
  });

  it('creates config from defaults when missing', async () => {
    await fs.rm(tempConfigPath, { force: true });
    const defaults = { alpha: 1 };
    const config = await loadConfig(tempConfigPath, defaults);
    const text = await fs.readFile(tempConfigPath, 'utf8');
    expect(parseJson5(text)).toEqual(defaults);
    expect(config).toEqual(defaults);
  });

  it('merges defaults with existing config', async () => {
    await fs.writeFile(tempConfigPath, '{beta:"b"}', 'utf8');
    const defaults = { beta: 'a', gamma: true };
    const config = await loadConfig(tempConfigPath, defaults);
    expect(config).toEqual({ beta: 'b', gamma: true });
  });

  it('emits event when config changes', async () => {
    const bus = createEventBus<{ configChanged: Record<string, unknown> }>();
    const handler = jest.fn();
    bus.subscribe('configChanged', handler);
    const stop = watchConfig(tempConfigPath, bus);
    await writeConfig(tempConfigPath, { foo: 'updated' });
    await new Promise((r) => setTimeout(r, 150));
    stop();
    expect(handler).toHaveBeenCalledWith({ foo: 'updated' });
  });
});
