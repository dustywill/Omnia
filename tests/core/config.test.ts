import {
  readConfig,
  writeConfig,
  loadConfig,
  watchConfig,
} from '../../src/core/config.js';
import { createEventBus } from '../../src/core/event-bus.js';
import JSON5 from 'json5';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { jest, expect, describe, it, beforeEach, afterEach } from '@jest/globals';

// Use static path for test
const tempConfigPath = path.join(process.cwd(), 'tests', 'temp-config.json5');

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
    expect(JSON5.parse(text)).toEqual(defaults);
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
    
    // Wait for file watcher to trigger with retries
    let attempts = 0;
    while (handler.mock.calls.length === 0 && attempts < 10) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }
    
    stop();
    expect(handler).toHaveBeenCalledWith({ foo: 'updated' });
  });
});
