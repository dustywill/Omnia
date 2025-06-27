import path from 'path';
import type { BrowserWindow as ElectronBrowserWindow, App } from 'electron';
import type { Logger } from './core/logger.js';
import { createLogger } from './core/logger.js';

let electron: { BrowserWindow: typeof ElectronBrowserWindow; app: App } | undefined;

const getElectron = async () => {
  if (!electron) {
    electron = await import('electron');
  }
  return electron;
};

export const createWindow = async (
  Window?: typeof ElectronBrowserWindow,
  logger?: Logger,
): Promise<ElectronBrowserWindow> => {
  const Win = Window ?? (await getElectron()).BrowserWindow;
  logger?.info('Creating browser window');
  const win = new Win({
    webPreferences: { nodeIntegration: true },
  });
  const indexPath = path.join(process.cwd(), 'index.html');
  logger?.info(`Loading file: ${indexPath}`);
  win.loadFile(indexPath);
  return win;
};

export const startElectron = (
  Window?: typeof ElectronBrowserWindow,
  logger?: Logger,
): void => {
  const start = async () => {
    const { app } = await getElectron();
    logger?.info('Electron app ready');
    await createWindow(Window, logger);
    app.on('activate', async () => {
      const { BrowserWindow } = await getElectron();
      const Win = Window ?? BrowserWindow;
      if (Win.getAllWindows().length === 0) {
        await createWindow(Window, logger);
      }
    });
  };

  getElectron().then(({ app }) => {
    logger?.info('Starting Electron');
    app.whenReady().then(start);
    app.on('window-all-closed', () => {
      logger?.info('Window all closed');
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  });
};

if (process.env.NODE_ENV !== 'test') {
  const logPath = path.join(process.cwd(), 'app.log');
  const logger = createLogger('electron-main', logPath);
  startElectron(undefined, logger);

}

