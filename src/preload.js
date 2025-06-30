const { contextBridge, ipcRenderer } = require("electron");

// Utility to log when an argument cannot be cloned/serialized
const logIfNotSerializable = (label, value) => {
  try {
    // structuredClone will throw if value cannot be cloned
    structuredClone(value);
  } catch (err) {
    console.warn(`[preload] ${label} is not serializable`, value);
  }
};

const safeInvoke = async (channel, ...args) => {
  args.forEach((arg, idx) =>
    logIfNotSerializable(`arg[${idx}] for ${channel}`, arg),
  );
  try {
    return await ipcRenderer.invoke(channel, ...args);
  } catch (err) {
    console.error(`[preload] ipcRenderer.invoke failed for ${channel}`, err);
    throw err;
  }
};

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const electronAPI = {
  loadSampleData: (data) => safeInvoke("load-sample-data", data),

  // File system operations - you'll need to implement these in main process
  readFile: (filePath, options) =>
    safeInvoke("fs-read-file", filePath, options),
  writeFile: (filePath, data) =>
    safeInvoke("fs-write-file", filePath, data),
  mkdir: (dirPath, options) => safeInvoke("fs-mkdir", dirPath, options),
  readdir: (dirPath, options) =>
    safeInvoke("fs-readdir", dirPath, options),

  // Path operations
  join: (...paths) => safeInvoke("path-join", paths),

  // Other utilities
  getCwd: () => safeInvoke("get-cwd"),
};
logIfNotSerializable("electronAPI", electronAPI);
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// For backward compatibility with your existing code
const exposedIpc = {
  invoke: (channel, data) => safeInvoke(channel, data),
};
logIfNotSerializable("ipcRenderer", exposedIpc);
contextBridge.exposeInMainWorld("ipcRenderer", exposedIpc);
