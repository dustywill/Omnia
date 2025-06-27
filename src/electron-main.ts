import path from 'path';
import type { BrowserWindow as ElectronBrowserWindow, App } from 'electron';

let electron: { BrowserWindow: typeof ElectronBrowserWindow; app: App } | undefined;

const getElectron = async () => {
  if (!electron) {
    electron = await import('electron');
  }
  return electron;
};

export const createWindow = async (
  Window?: typeof ElectronBrowserWindow,
): Promise<ElectronBrowserWindow> => {
  const Win =
    Window ?? (await getElectron()).BrowserWindow;
  const win = new Win({
    webPreferences: { nodeIntegration: true },
  });
  const indexPath = path.join(process.cwd(), 'index.html');
  win.loadFile(indexPath);
  return win;
};

export const startElectron = (Window?: typeof ElectronBrowserWindow): void => {
  const start = async () => {
    const { app } = await getElectron();
    await createWindow(Window);
    app.on('activate', async () => {
      const { BrowserWindow } = await getElectron();
      const Win = Window ?? BrowserWindow;
      if (Win.getAllWindows().length === 0) {
        await createWindow(Window);
      }
    });
  };

  getElectron().then(({ app }) => {
    app.whenReady().then(start);
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });
  });
};

