import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

import { createLogger } from '../../src/core/logger.js';

const logFile = path.join(__dirname, 'test.log');

beforeEach(async () => {
  await fs.writeFile(logFile, '', 'utf8');
});

afterEach(async () => {
  await fs.rm(logFile, { force: true });
  jest.restoreAllMocks();
});

describe('logger', () => {
  it('writes formatted entries to console and file', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const logger = createLogger('testPlugin', logFile);
    await logger.info('hello');

    const fileContent = await fs.readFile(logFile, 'utf8');
    expect(fileContent).toContain('testPlugin');
    expect(fileContent).toContain('INFO');
    expect(fileContent).toContain('hello');
    expect(logSpy).toHaveBeenCalled();
  });
});
