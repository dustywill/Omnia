import { jest } from "@jest/globals";

const whenReady = jest.fn(async () => {});
const on = jest.fn();
const quit = jest.fn();
const BrowserWindow = jest.fn(() => ({ loadFile: jest.fn() }));
(BrowserWindow as any).getAllWindows = jest.fn(() => []);

jest.mock("electron", () => ({
  BrowserWindow,
  app: { whenReady, on, quit },
}));

const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
const createLogger = jest.fn(() => logger);
jest.mock("../../src/core/logger.js", () => ({ createLogger }));

describe("electron main", () => {
  it("loads index.html in BrowserWindow", async () => {
    jest.resetModules();
    const loadFile = jest.fn();
    const MockWindow = jest.fn(() => ({ loadFile }));
    const { createWindow } = await import("../../src/electron-main.js");
    await createWindow(MockWindow as any);
    expect(MockWindow).toHaveBeenCalledWith({
      width: 1200,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: expect.any(String),
      },
    });
    expect(loadFile).toHaveBeenCalledWith(
      expect.stringContaining("index.html"),
    );
  });

  it("logs window lifecycle events", async () => {
    jest.resetModules();
    const loadFile = jest.fn();
    const MockWindow = jest.fn(() => ({ loadFile }));
    const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
    const { createWindow } = await import("../../src/electron-main.js");
    await createWindow(MockWindow as any, logger as any);
    expect(logger.info).toHaveBeenCalledWith("Creating browser window");
    expect(logger.info).toHaveBeenCalledWith(
      expect.stringContaining("index.html"),
    );
  });

  it("starts Electron when imported outside test env", async () => {
    const originalEnv = process.env.NODE_ENV;
    
    // Clear any previous calls to the mocks
    createLogger.mockClear();
    whenReady.mockClear();
    
    // Set environment to production BEFORE resetting modules
    process.env.NODE_ENV = "production";

    // Reset modules to ensure fresh import with new NODE_ENV
    jest.resetModules();
    
    // Re-setup the mocks after resetModules using the SAME mock functions
    jest.doMock("electron", () => ({
      BrowserWindow,
      app: { whenReady, on, quit },
    }));
    
    jest.doMock("../../src/core/logger.js", () => ({ createLogger }));
    
    // Also mock the CommonJS require version since getElectron tries require first
    const mockRequire = jest.fn().mockReturnValue({
      BrowserWindow,
      app: { whenReady, on, quit },
    });
    (global as any).require = jest.fn((moduleName: string) => {
      if (moduleName === 'electron') {
        return { BrowserWindow, app: { whenReady, on, quit } };
      }
      return mockRequire(moduleName);
    });

    // Import the module - this should trigger the top-level code that calls createLogger and startElectron
    const electronMainModule = await import("../../src/electron-main.js");
    
    // Give time for async operations to complete (getElectron is async)
    await new Promise(resolve => setTimeout(resolve, 300));

    expect(createLogger).toHaveBeenCalledWith("electron-main", expect.stringContaining("app.log"));
    expect(whenReady).toHaveBeenCalled();

    process.env.NODE_ENV = originalEnv;
  });
});
