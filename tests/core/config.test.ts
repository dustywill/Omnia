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
    const stop = await watchConfig(tempConfigPath, bus);
    
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

  it('throws error when reading malformed config file', async () => {
    await fs.writeFile(tempConfigPath, 'this is not json5', 'utf8'); // Malformed JSON5
    await expect(readConfig(tempConfigPath)).rejects.toThrow();
  });

  it('emits event when config file is deleted and recreated', async () => {
    const bus = createEventBus<{ configChanged: Record<string, unknown> }>();
    const handler = jest.fn();
    bus.subscribe('configChanged', handler);
    const stop = await watchConfig(tempConfigPath, bus);

    // Delete the file
    await fs.rm(tempConfigPath, { force: true });
    // Recreate with new content
    await fs.writeFile(tempConfigPath, '{recreated: true}', 'utf8');

    // Wait for file watcher to trigger with retries
    let attempts = 0;
    while (handler.mock.calls.length === 0 && attempts < 10) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }

    stop();
    expect(handler).toHaveBeenCalledWith({ recreated: true });
  });

  it('emits event for rapid successive changes (debounced)', async () => {
    const bus = createEventBus<{ configChanged: Record<string, unknown} >();
    const handler = jest.fn();
    bus.subscribe('configChanged', handler);
    const stop = await watchConfig(tempConfigPath, bus);

    await writeConfig(tempConfigPath, { value: 1 });
    await writeConfig(tempConfigPath, { value: 2 });
    await writeConfig(tempConfigPath, { value: 3 });

    // Wait for file watcher to trigger with retries
    let attempts = 0;
    while (handler.mock.calls.length === 0 && attempts < 10) {
      await new Promise((r) => setTimeout(r, 200));
      attempts++;
    }

    stop();
    // Expect at least one call, and the last call should have the final value
    expect(handler).toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith({ value: 3 });
  });

  it('throws error when readConfig encounters permission issues', async () => {
    const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
    mockError.code = 'EACCES';
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(mockError);

    await expect(readConfig(tempConfigPath)).rejects.toThrow('Permission denied');
  });

  it('throws error when writeConfig encounters permission issues', async () => {
    const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
    mockError.code = 'EACCES';
    jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(mockError);

    await expect(writeConfig(tempConfigPath, { foo: 'bar' })).rejects.toThrow('Permission denied');
  });

  it('throws unexpected error when loadConfig encounters readConfig error', async () => {
    const mockError = new Error('Unexpected error');
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(mockError);

    await expect(loadConfig(tempConfigPath, { foo: 'default' })).rejects.toThrow('Unexpected error');
  });

  it('handles watchConfig becoming unreadable during watching', async () => {
    const bus = createEventBus<{ configChanged: Record<string, unknown} >();
    const handler = jest.fn();
    bus.subscribe('configChanged', handler);

    const stop = await watchConfig(tempConfigPath, bus);

    // Simulate file becoming unreadable
    const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
    mockError.code = 'EACCES';
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(mockError);

    // Trigger a change (this will cause watchConfig to try and read the file)
    await fs.writeFile(tempConfigPath, '{foo:"new"}', 'utf8');

    // Give some time for the watcher to react
    await new Promise((r) => setTimeout(r, 500));

    stop();
    // Expect no handler call as the read should have failed silently
    expect(handler).not.toHaveBeenCalled();
  });
});

  it('throws error when readConfig encounters permission issues', async () => {
    const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
    mockError.code = 'EACCES';
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(mockError);

    await expect(readConfig(tempConfigPath)).rejects.toThrow('Permission denied');
  });

  it('throws error when writeConfig encounters permission issues', async () => {
    const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
    mockError.code = 'EACCES';
    jest.spyOn(fs, 'writeFile').mockRejectedValueOnce(mockError);

    await expect(writeConfig(tempConfigPath, { foo: 'bar' })).rejects.toThrow('Permission denied');
  });

  it('throws unexpected error when loadConfig encounters readConfig error', async () => {
    const mockError = new Error('Unexpected error');
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(mockError);

    await expect(loadConfig(tempConfigPath, { foo: 'default' })).rejects.toThrow('Unexpected error');
  });

  it('handles watchConfig becoming unreadable during watching', async () => {
    const bus = createEventBus<{ configChanged: Record<string, unknown} >();
    const handler = jest.fn();
    bus.subscribe('configChanged', handler);

    const stop = await watchConfig(tempConfigPath, bus);

    // Simulate file becoming unreadable
    const mockError = new Error('Permission denied') as NodeJS.ErrnoException;
    mockError.code = 'EACCES';
    jest.spyOn(fs, 'readFile').mockRejectedValueOnce(mockError);

    // Trigger a change (this will cause watchConfig to try and read the file)
    await fs.writeFile(tempConfigPath, '{foo:"new"}', 'utf8');

    // Give some time for the watcher to react
    await new Promise((r) => setTimeout(r, 500));

    stop();
    // Expect no handler call as the read should have failed silently
    expect(handler).not.toHaveBeenCalled();
  });
});
