import { readConfig, writeConfig } from '../../src/core/config.js';
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
});
