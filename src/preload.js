const { contextBridge, ipcRenderer } = require("electron");

// Utility to attempt structured cloning and fall back to JSON serialization
const sanitizeForIpc = (label, value) => {
  try {
    // structuredClone will throw if value cannot be cloned
    structuredClone(value);
    return value;
  } catch (_err) {
    console.warn(`[preload] ${label} is not serializable`, value);
    try {
      return JSON.parse(JSON.stringify(value));
    } catch {
      return null;
    }
  }
};

const safeInvoke = async (channel, ...args) => {
  const sanitized = args.map((arg, idx) =>
    sanitizeForIpc(`arg[${idx}] for ${channel}`, arg),
  );
  try {
    return await ipcRenderer.invoke(channel, ...sanitized);
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
  stat: (filePath) => safeInvoke("fs-stat", filePath),

  // Path operations
  join: (...paths) => safeInvoke("path-join", paths),

  // Other utilities
  getCwd: () => safeInvoke("get-cwd"),

  // JSON5 operations
  json5Parse: (text) => safeInvoke("json5-parse", text),
  json5Stringify: (value) => safeInvoke("json5-stringify", value),
  
  // Zod operations
  zodAvailable: () => safeInvoke("zod-available"),
  zodValidate: (data, schemaDescriptor) => safeInvoke("zod-validate", data, schemaDescriptor),
  zodParse: (data, schemaDescriptor) => safeInvoke("zod-parse", data, schemaDescriptor),
  
  // Logging operations
  logMessage: (level, component, message) => safeInvoke("log-message", level, component, message),
  readLogFile: () => safeInvoke("read-log-file"),
};

// Don't sanitize the API objects themselves - just expose them directly
contextBridge.exposeInMainWorld("electronAPI", electronAPI);

// For backward compatibility with your existing code
const exposedIpc = {
  invoke: (channel, data) => safeInvoke(channel, data),
};

contextBridge.exposeInMainWorld("ipcRenderer", exposedIpc);
