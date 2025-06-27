import { jest } from '@jest/globals';

const whenReady = jest.fn(async () => {});
const on = jest.fn();
const quit = jest.fn();
const BrowserWindow = jest.fn(() => ({ loadFile: jest.fn() }));
(BrowserWindow as any).getAllWindows = jest.fn(() => []);

jest.mock('electron', () => ({
  BrowserWindow,
  app: { whenReady, on, quit },
}));

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const createLogger = jest.fn(() => logger);
jest.mock('../../src/core/logger.js', () => ({ createLogger }));

describe('electron main', () => {
  it('loads index.html in BrowserWindow', async () => {
    const loadFile = jest.fn();
    const MockWindow = jest.fn(() => ({ loadFile }));
    const { createWindow } = await import('../../src/electron-main.js');
    await createWindow(MockWindow as any);
    expect(MockWindow).toHaveBeenCalledWith({ webPreferences: { nodeIntegration: true } });
    expect(loadFile).toHaveBeenCalledWith(expect.stringContaining('index.html'));
  });

  it('logs window lifecycle events', async () => {
    const loadFile = jest.fn();
    const MockWindow = jest.fn(() => ({ loadFile }));
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const { createWindow } = await import('../../src/electron-main.js');
    await createWindow(MockWindow as any, logger as any);
    expect(logger.info).toHaveBeenCalledWith('Creating browser window');
    expect(logger.info).toHaveBeenCalledWith(expect.stringContaining('index.html'));
  });

  it('starts Electron when imported outside test env', async () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';

    await import('../../src/electron-main.js');
    await Promise.resolve();
    await Promise.resolve();

    expect(createLogger).toHaveBeenCalled();
    expect(whenReady).toHaveBeenCalled();

    process.env.NODE_ENV = 'test';
  });
});
