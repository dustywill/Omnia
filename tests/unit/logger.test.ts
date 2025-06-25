import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import fs from 'fs/promises';
import path from 'path';

import {
  initializeLogger,
  getLogger,
  shutdownLogger,
} from '../../src/core/logger.js';

const logDir = path.join(__dirname, 'logs');
const logFile = path.join(logDir, 'test.log');

beforeEach(async () => {
  await fs.rm(logDir, { recursive: true, force: true });
});

afterEach(async () => {
  await shutdownLogger();
  await fs.rm(logDir, { recursive: true, force: true });
  jest.restoreAllMocks();
});

describe('logger', () => {
  it('creates directory and writes formatted entries', async () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    initializeLogger({ filePath: logFile, prettyPrint: false });
    const logger = getLogger();
    logger.info('hello');

    const dirExists = await fs.stat(logDir).then(() => true).catch(() => false);
    expect(dirExists).toBe(true);
    const fileContent = await fs.readFile(logFile, 'utf8');
    expect(fileContent).toContain('INFO');
    expect(fileContent).toContain('hello');
    expect(logSpy).toHaveBeenCalled();
  });

  it('returns the same logger instance', () => {
    initializeLogger({ filePath: logFile });
    const first = getLogger();
    const second = getLogger();
    expect(first).toBe(second);
  });
});
