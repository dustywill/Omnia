## Relevant Files

- `package.json` – Contains Electron dependency and run scripts.​:codex-file-citation[codex-file-citation]{line_range_start=7 line_range_end=14 path=package.json git_url="https://github.com/dustywill/Omnia/blob/main/package.json#L7-L14"}​​:codex-file-citation[codex-file-citation]{line_range_start=13 line_range_end=25 path=package.json git_url="https://github.com/dustywill/Omnia/blob/main/package.json#L13-L25"}​
- `src/electron-main.ts` – Starts the Electron app and sets up IPC handlers.​:codex-file-citation[codex-file-citation]{line_range_start=1 line_range_end=20 path=src/electron-main.ts git_url="https://github.com/dustywill/Omnia/blob/main/src/electron-main.ts#L1-L20"}​
- `src/preload.js` – Exposes Electron APIs to the renderer process.​:codex-file-citation[codex-file-citation]{line_range_start=1 line_range_end=33 path=src/preload.js git_url="https://github.com/dustywill/Omnia/blob/main/src/preload.js#L1-L33"}​
- `src/index.ts` – Application startup logic that checks for `electronAPI`.​:codex-file-citation[codex-file-citation]{line_range_start=12 line_range_end=44 path=src/index.ts git_url="https://github.com/dustywill/Omnia/blob/main/src/index.ts#L12-L44"}​
- `src/ui/node-module-loader.ts` – Provides Node module access through Electron IPC.​:codex-file-citation[codex-file-citation]{line_range_start=8 line_range_end=35 path=src/ui/node-module-loader.ts git_url="https://github.com/dustywill/Omnia/blob/main/src/ui/node-module-loader.ts#L8-L35"}​
- `index.html` – Loads the application and references Electron APIs.​:codex-file-citation[codex-file-citation]{line_range_start=9 line_range_end=23 path=index.html git_url="https://github.com/dustywill/Omnia/blob/main/index.html#L9-L23"}​
- `tests/root/electron-main.test.ts` – Tests specific to Electron startup.​:codex-file-citation[codex-file-citation]{line_range_start=1 line_range_end=20 path=tests/root/electron-main.test.ts git_url="https://github.com/dustywill/Omnia/blob/main/tests/root/electron-main.test.ts#L1-L20"}​
- `tests/root/startup-clone.test.ts` – Relies on Electron mocks.​:codex-file-citation[codex-file-citation]{line_range_start=1 line_range_end=21 path=tests/root/startup-clone.test.ts git_url="https://github.com/dustywill/Omnia/blob/main/tests/root/startup-clone.test.ts#L1-L21"}​
- `tests/core/ipc-sanitize.test.ts` – Exercises the preload script’s sanitization logic.​:codex-file-citation[codex-file-citation]{line_range_start=1 line_range_end=25 path=tests/core/ipc-sanitize.test.ts git_url="https://github.com/dustywill/Omnia/blob/main/tests/core/ipc-sanitize.test.ts#L1-L25"}​
- `tests/core/ipc-trace.test.ts` – Verifies warnings for unserializable IPC arguments.​:codex-file-citation[codex-file-citation]{line_range_start=1 line_range_end=20 path=tests/core/ipc-trace.test.ts git_url="https://github.com/dustywill/Omnia/blob/main/tests/core/ipc-trace.test.ts#L1-L20"}​
- `plugins/as-built-documenter/index.tsx` – Uses `ipcRenderer.invoke` to load sample data.​:codex-file-citation[codex-file-citation]{line_range_start=120 line_range_end=145 path=plugins/as-built-documenter/index.tsx git_url="https://github.com/dustywill/Omnia/blob/main/plugins/as-built-documenter/index.tsx#L120-L145"}​
- `troubleshooting/ElectronStartupIssue.md` – Document describing Electron specific errors.

### Notes

- All Electron-specific code will be removed in favor of a standard browser environment.
- Replace IPC-based file access with a lightweight Node/Express server exposing HTTP endpoints.
- Update tests to reflect the browser-based implementation. Use `npx jest` to run tests.

## Tasks

- [ ] 1.0 Remove Electron from the project

  - [ ] 1.1 Delete `electron` scripts and dependency from `package.json`; remove the entries from `package-lock.json`.
  - [ ] 1.2 Remove `src/electron-main.ts` and `src/preload.js`.
  - [ ] 1.3 Delete tests that depend on Electron (`tests/root/electron-main.test.ts`, `tests/root/startup-clone.test.ts`).
  - [ ] 1.4 Remove `troubleshooting/ElectronStartupIssue.md` and any Electron references in documentation.

- [ ] 2.0 Replace IPC file access with a web API

  - [ ] 2.1 Implement a small Express server in `src/server.ts` exposing file system endpoints (read, write, readdir, etc.). The server should also serve `index.html` and compiled assets from `dist`.
  - [ ] 2.2 Modify `src/ui/node-module-loader.ts` to call these endpoints using `fetch`.
  - [ ] 2.3 Update plugins and core modules to use the new API instead of Electron IPC.
  - [ ] 2.4 Update the `start` script to launch the Express server and open the application.

- [ ] 3.0 Adjust application startup for the browser

  - [ ] 3.1 Simplify `src/index.ts` to remove Electron checks and jsdom fallback.
  - [ ] 3.2 Ensure `index.html` loads the compiled app without Electron checks and communicates with the Express server.

- [ ] 4.0 Update and expand tests

  - [ ] 4.1 Remove Electron mocks from existing tests and delete any tests that only exercise Electron behavior.
  - [ ] 4.2 Add tests for the new Express server routes.
  - [ ] 4.3 Update UI tests to verify browser-based behavior.

- [ ] 5.0 Update documentation
  - [ ] 5.1 Rewrite the `README.md` setup instructions for running the Express server and opening `index.html` in a browser.
  - [ ] 5.2 Document the available API endpoints and how plugins interact with them.
  - [ ] 5.3 Remove references to Electron, including `troubleshooting/ElectronStartupIssue.md`.
