const { contextBridge, ipcRenderer } = require("electron");

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld("electronAPI", {
  loadSampleData: (data) => ipcRenderer.invoke("load-sample-data", data),

  // File system operations - you'll need to implement these in main process
  readFile: (filePath, options) =>
    ipcRenderer.invoke("fs-read-file", filePath, options),
  writeFile: (filePath, data) =>
    ipcRenderer.invoke("fs-write-file", filePath, data),
  mkdir: (dirPath, options) => ipcRenderer.invoke("fs-mkdir", dirPath, options),
  readdir: (dirPath, options) =>
    ipcRenderer.invoke("fs-readdir", dirPath, options),

  // Path operations
  join: (...paths) => ipcRenderer.invoke("path-join", paths),

  // Other utilities
  getCwd: () => ipcRenderer.invoke("get-cwd"),
});

// For backward compatibility with your existing code
contextBridge.exposeInMainWorld("ipcRenderer", {
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
});
