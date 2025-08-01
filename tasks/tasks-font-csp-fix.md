## Relevant Files

- `index.html` - Contains Content Security Policy and import map for app startup.
- `src/ui/components/CardGrid.css` - Imports Nunito Sans from Google Fonts.
- `src/ui/components/FileScanner.css` - Uses Nunito Sans font-family.
- `src/ui/components/JsonEditor.css` - Uses Nunito Sans font-family.
- `src/preload.js` - Exposes Electron APIs to renderer; may cause cloning errors.
- `tests/core/ipc-sanitize.test.ts` - Verifies arguments are sanitized before IPC.
- `src/index.ts` - Application startup logic.
- `tests/root/startup.test.ts` - Tests startup behavior.
- `tests/root/startup-clone.test.ts` - Ensures app starts without structured cloning errors.

### Notes

- This task list documents multiple approaches for resolving the CSP font block
  and the "object could not be cloned" startup error.
- Each approach can be tried separately; mark the relevant subtasks once a
  solution is implemented and tested.

## Tasks

- [x] 1.0 Allow Google Fonts via CSP
  - [x] 1.1 Update `style-src` in `index.html` to include `https://fonts.googleapis.com`.
  - [x] 1.2 Add `font-src` directive allowing `https://fonts.gstatic.com`.
  - [x] 1.3 Verify fonts load without CSP violations.
- [x] 4.0 Diagnose cloning error
  - [x] 4.1 Trace calls to Electron `ipcRenderer` or `contextBridge` for non-serializable objects.
  - [x] 4.2 Refactor any API calls to pass plain JSON-serializable data only.
  - [x] 4.3 Add logging around `start()` to capture the failing object.
- [x] 5.0 Add tests
  - [x] 5.1 Write a test ensuring the application starts without the cloning error.
  - [x] 5.2 Write a test verifying the fonts load successfully under the chosen approach.
- [ ] 2.0 Self-host Nunito Sans
  - [ ] 2.1 Download Nunito Sans fonts into the project (e.g., `src/assets/fonts`).
  - [ ] 2.2 Reference the local font files in CSS using `@font-face`.
  - [ ] 2.3 Remove external font imports and adjust CSP accordingly.
- [ ] 3.0 Inline or embed fonts
  - [ ] 3.1 Convert Nunito Sans fonts to Base64 and embed via `@font-face`.
  - [ ] 3.2 Ensure the embedded fonts respect the existing CSP.
