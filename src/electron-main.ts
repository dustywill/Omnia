import path from "path";
import fs from "fs/promises";
import type { Dirent } from "fs";
import type {
  BrowserWindow as ElectronBrowserWindow,
  App,
  IpcMain,
} from "electron";
import type { Logger } from "./core/logger.js";
import { createLogger } from "./core/logger.js";

let electron:
  | { BrowserWindow: typeof ElectronBrowserWindow; app: App; ipcMain: IpcMain }
  | undefined;

const getElectron = async () => {
  if (!electron) {
    electron = await import("electron");
  }
  return electron;
};

// Set up all the IPC handlers that your renderer process will need
const setupIpcHandlers = (ipcMain?: IpcMain, logger?: Logger) => {
  if (!ipcMain) {
    logger?.warn("ipcMain not available, skipping IPC handler setup");
    return;
  }
  // File system operations
  ipcMain.handle(
    "fs-read-file",
    async (_event: any, filePath: string, options?: any) => {
      try {
        logger?.info(`Reading file: ${filePath}`);
        return await fs.readFile(filePath, options);
      } catch (error) {
        logger?.error(`Error reading file ${filePath}: ${error}`);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "fs-write-file",
    async (_event: any, filePath: string, data: string) => {
      try {
        logger?.info(`Writing file: ${filePath}`);
        return await fs.writeFile(filePath, data);
      } catch (error) {
        logger?.error(`Error writing file ${filePath}: ${error}`);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "fs-mkdir",
    async (_event: any, dirPath: string, options?: any) => {
      try {
        logger?.info(`Creating directory: ${dirPath}`);
        return await fs.mkdir(dirPath, options);
      } catch (error) {
        logger?.error(`Error creating directory ${dirPath}: ${error}`);
        throw error;
      }
    },
  );

  ipcMain.handle(
    "fs-readdir",
    async (_event: any, dirPath: string, options?: any) => {
      try {
        logger?.info(`Reading directory: ${dirPath}`);
        const entries = await fs.readdir(dirPath, options);
        if (options?.withFileTypes) {
          return (entries as unknown as Dirent[]).map((d) => ({
            name: d.name,
            isDirectory: d.isDirectory(),
          }));
        }
        return entries;
      } catch (error) {
        logger?.error(`Error reading directory ${dirPath}: ${error}`);
        throw error;
      }
    },
  );

  // Path operations
  ipcMain.handle("path-join", async (_event: any, paths: string[]) => {
    return path.join(...paths);
  });

  // Other utilities
  ipcMain.handle("get-cwd", async () => {
    return process.cwd();
  });

  // Your existing load-sample-data handler
  ipcMain.handle(
    "load-sample-data",
    async (_event: any, { id, url }: { id: string; url: string }) => {
      try {
        logger?.info(`Loading sample data for ${id}: ${url}`);
        // Implement your actual data loading logic here
        // For now, return mock data
        return [
          { id: 1, name: "Sample Item 1", value: "Test Value 1" },
          { id: 2, name: "Sample Item 2", value: "Test Value 2" },
        ];
      } catch (error) {
        logger?.error(`Error loading sample data: ${error}`);
        throw error;
      }
    },
  );
};

export const createWindow = async (
  Window?: typeof ElectronBrowserWindow,
  logger?: Logger,
): Promise<ElectronBrowserWindow> => {
  const { BrowserWindow, ipcMain } = await getElectron();
  const Win = Window ?? BrowserWindow;

  logger?.info("Creating browser window");

  // Set up all IPC handlers
  setupIpcHandlers(ipcMain, logger);

  const win = new Win({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false, // Disable node integration for security
      contextIsolation: true, // Enable context isolation
      // enableRemoteModule is deprecated in newer Electron versions
      preload: path.join(process.cwd(), "dist", "preload.js"), // Add preload script
    },
  });

  const indexPath = path.join(process.cwd(), "index.html");
  logger?.info(`Loading file: ${indexPath}`);
  await win.loadFile(indexPath);

  // Open DevTools in development
  if (process.env.NODE_ENV === "development") {
    win.webContents.openDevTools();
  }

  return win;
};

export const startElectron = (
  Window?: typeof ElectronBrowserWindow,
  logger?: Logger,
): void => {
  const start = async () => {
    const { app } = await getElectron();
    logger?.info("Electron app ready");
    await createWindow(Window, logger);

    app.on("activate", async () => {
      const { BrowserWindow } = await getElectron();
      const Win = Window ?? BrowserWindow;
      if (Win.getAllWindows().length === 0) {
        await createWindow(Window, logger);
      }
    });
  };

  getElectron().then(({ app }) => {
    logger?.info("Starting Electron");
    app.whenReady().then(start);

    app.on("window-all-closed", () => {
      logger?.info("Window all closed");
      if (process.platform !== "darwin") {
        app.quit();
      }
    });
  });
};

if (process.env.NODE_ENV !== "test") {
  const logPath = path.join(process.cwd(), "app.log");
  const logger = createLogger("electron-main", logPath);
  startElectron(undefined, logger);
}
