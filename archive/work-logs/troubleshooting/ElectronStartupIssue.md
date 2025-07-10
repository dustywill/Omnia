# Electron Startup Issue

The following error occurs when launching the application:

```
[preload] electronAPI is not serializable
[preload] ipcRenderer is not serializable
[preload] arg[0] for fs-readdir is not serializable
ipcRenderer.invoke failed for fs-readdir Error: Error invoking remote method 'fs-readdir': TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of Buffer or URL. Received an instance of Object
```

## Possible Causes (Most Likely First)

1. **Non-string path argument** – `fs.readdir` is receiving an object instead of a string. This could happen if the caller passes a complex object (e.g., from `path.join` or a custom wrapper) instead of a string path.
2. **Unsanitized options object** – The options parameter for `readdir` may contain unserializable data, causing IPC serialization issues and ultimately failing the call.
3. **Improperly exposed preload APIs** – If the preload script exposes functions or objects that cannot be serialized, the warning messages may indicate deeper issues with how data is passed between the renderer and main process.
4. **Context isolation or IPC misconfiguration** – A mismatch in context isolation settings or IPC handler registration could result in incorrect arguments reaching the main process.
5. **Environment mismatch or incompatible Electron version** – Less likely, but differences between development and runtime environments (or incompatible Electron versions) could produce unexpected serialization behavior.

---

Before making code changes, confirm which argument is sent to `fs.readdir`. Logging the value just before invoking `electronAPI.readdir` can reveal whether a non-string object is being passed.

## Troubleshooting Attempts
- Updated renderer code to await `path.join` calls so a string is passed to `fs.readdir`. This should resolve "Non-string path argument" errors on startup.

