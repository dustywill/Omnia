import { jest } from '@jest/globals';

describe('electron main', () => {
  it('loads index.html in BrowserWindow', async () => {
    const loadFile = jest.fn();
    const MockWindow = jest.fn(() => ({ loadFile }));
    const { createWindow } = await import('../../src/electron-main.js');
    await createWindow(MockWindow as any);
    expect(MockWindow).toHaveBeenCalledWith({ webPreferences: { nodeIntegration: true } });
    expect(loadFile).toHaveBeenCalledWith(expect.stringContaining('index.html'));
  });
});
