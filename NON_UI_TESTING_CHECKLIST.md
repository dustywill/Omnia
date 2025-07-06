# Non-UI Testing Implementation Checklist

This checklist outlines the current status and future tasks for testing core, non-UI components of the Omnia application. It aims to ensure comprehensive test coverage, especially considering a Test-Driven Development (TDD) approach.

## Part 1: Core Modules Testing

### 1.1: `config.js` (Configuration Management)
- [X] Reads configuration from file.
- [X] Writes configuration to file.
- [X] Creates config from defaults when file is missing.
- [X] Merges defaults with existing config.
- [X] Emits event when config changes (via `watchConfig`).
- [ ] **Error Handling:**
  - [ ] Test `readConfig` with non-existent file (should create default).
  - [ ] Test `readConfig` with invalid file content (e.g., malformed JSON5).
  - [ ] Test `writeConfig` with permission issues.
- [ ] **Edge Cases for `watchConfig`:**
  - [ ] Test file deletion and recreation.
  - [ ] Test rapid, successive changes to the file.

### 1.2: `event-bus.js` (Event Bus)
- [X] Publishes events to subscribers.
- [X] Does not call unsubscribed handlers.
- [ ] **Multiple Subscribers:**
  - [ ] Test with multiple handlers subscribed to the same event.
  - [ ] Test with handlers subscribed to different events.
- [ ] **Edge Cases for Subscribe/Unsubscribe:**
  - [ ] Subscribing the same handler multiple times.
  - [ ] Unsubscribing a handler that was never subscribed.

### 1.3: `file-crawler.js` (File System Crawler)
- [X] Converts crawl output to `FileNode` list for a simple directory structure.
- [ ] **Recursive Structure Verification:**
  - [ ] Verify that `getFileTree` correctly represents hierarchical structures (e.g., children of directories).
- [ ] **Directory States:**
  - [ ] Test `getFileTree` on an empty directory.
  - [ ] Test `getFileTree` on a non-existent directory (expected behavior: error or empty list).
- [ ] **Error Handling:**
  - [ ] Test with permission issues for directories/files.
  - [ ] Test with invalid paths.

### 1.4: `ipc-sanitize.js` (IPC Sanitization)
- [X] Sanitizes non-serializable arguments (functions) before invoking IPC.
- [ ] **More Data Types:**
  - [ ] Test with other non-serializable data types (e.g., `Map`, `Set`, `Date`, `RegExp`, `undefined`, `Symbol`, DOM elements, Promises, class instances).
- [ ] **Nested Non-Serializable Data:**
  - [ ] Test with non-serializable data nested within objects or arrays.
- [ ] **Circular References:**
  - [ ] Test handling of circular references.
- [ ] **Different IPC Methods:**
  - [ ] Test sanitization across various IPC methods that handle data.
- [ ] **No Sanitization Needed:**
  - [ ] Test cases where all data is serializable to ensure no unintended alterations.
- [ ] **Error Handling:**
  - [ ] Test behavior if sanitization process encounters unexpected data or fails.

### 1.5: `ipc-trace.js` (IPC Tracing/Logging)
- [X] Logs warning for non-serializable arguments passed over IPC.
- [ ] **Different IPC Methods:**
  - [ ] Test logging across various IPC methods.
- [ ] **Multiple Non-Serializable Arguments:**
  - [ ] Test with multiple non-serializable arguments to confirm all are logged.
- [ ] **Serializable Arguments:**
  - [ ] Test with serializable arguments to ensure no warnings are logged.
- [ ] **Nested Non-Serializable Arguments:**
  - [ ] Test with non-serializable arguments nested within objects or arrays.
- [ ] **No Arguments:**
  - [ ] Test behavior when no arguments are provided.

### 1.6: `logger.js` (Logging Utility)
- [X] Writes formatted entries to console and file.
- [X] Includes plugin name, log level, and message.
- [ ] **Different Log Levels:**
  - [ ] Test `warn`, `error`, `debug` methods.
- [ ] **Log Content:**
  - [ ] Test with various types of log content (e.g., objects, arrays, numbers, multiple arguments).
- [ ] **File Management:**
  - [ ] Test log file rotation/size limits (if applicable).
  - [ ] Test error handling when log file cannot be written to (e.g., permissions, disk full).
- [ ] **Concurrency:**
  - [ ] Test logging from multiple sources concurrently to ensure log integrity.
- [ ] **Timestamp/Formatting:**
  - [ ] More specific assertions on the log entry format, including timestamps.

### 1.7: `plugin-manager.js` (Plugin Management)
- [X] Loads manifests and initializes plugins.
- [X] Updates plugin configuration.
- [ ] **Error Handling:**
  - [ ] Invalid plugin manifest (e.g., missing `id`, `main`).
  - [ ] Plugin `init` or `stop` methods throwing errors.
  - [ ] Non-existent `pluginsPath` or `configPath`.
- [ ] **Plugin Lifecycle:**
  - [ ] Test the `stop` method of plugins.
  - [ ] Test scenarios where plugins are enabled/disabled dynamically.
  - [ ] Test plugin dependencies (if applicable).
- [ ] **Event Bus Integration:**
  - [ ] More comprehensive testing of how the plugin manager interacts with the event bus (e.g., what events are published, when).
- [ ] **Multiple Plugins:**
  - [ ] Test with multiple plugins, including interactions and potential conflicts.
- [ ] **Plugin Types:**
  - [ ] Test specific behavior for different plugin types (e.g., simple, configured, hybrid).
- [ ] **Configuration Persistence:**
  - [ ] Ensure that updated plugin configurations are correctly persisted.

### 1.8: `settings-manager.js` (Settings Management)
- [X] Constructor and Initialization (paths).
- [X] App Configuration Management: Loading, creating default, schema validation, saving.
- [X] Plugin Registry Management: Loading, creating empty, registering, unregistering.
- [X] Plugin Configuration Management: Loading, creating default, saving with schema validation.
- [X] Permission System: Validation against manifest, handling missing permissions, checking specific permission.
- [X] Configuration Watching: Watching app/plugin config files, stopping watchers on destroy.
- [X] Error Handling: File system errors, invalid JSON, schema validation errors.
- [X] Integration Features: Migrating old config, backing up config.
- [ ] **Concurrency:**
  - [ ] Test concurrent read/write operations across different config types.
- [ ] **Edge Cases for Paths:**
  - [ ] Test with invalid or inaccessible `configDir`.
- [ ] **App Configuration Management (Advanced):**
  - [ ] Test partial updates to app config (merging vs. overwriting).
  - [ ] More complex schema validation scenarios.
- [ ] **Plugin Registry Management (Advanced):**
  - [ ] Updating existing plugin entries (e.g., `enabled` status, `configPath`).
  - [ ] Invalid registry content (malformed entries).
- [ ] **Plugin Configuration Management (Advanced):**
  - [ ] More extensive testing of how `loadPluginConfig` applies defaults for missing/incomplete plugin config files.
  - [ ] Testing with more complex plugin schemas (nested objects, arrays).
  - [ ] Behavior when a plugin's config file is deleted.
- [ ] **Permission System (Advanced):**
  - [ ] Test wildcard permissions (if supported).
  - [ ] Behavior when plugin permissions are revoked after loading.
- [ ] **Configuration Watching (Advanced):**
  - [ ] Explicitly test that file content changes trigger callbacks within `SettingsManager`.
  - [ ] Behavior when config file is deleted and then recreated.
- [ ] **Error Handling (Advanced):**
  - [ ] Test for specific error types (e.g., `ConfigReadError`, `ConfigWriteError`).
  - [ ] Test `SettingsManager` stability after an error.
- [ ] **`destroy()` Method (Advanced):**
  - [ ] Verify cleanup of all resources and internal states beyond just watchers.

## Part 2: Other Core Tests (from `tests/root`)

### 2.1: `electron-main.test.ts`
- [X] Loads `index.html` in `BrowserWindow` with correct properties.
- [X] Logs window lifecycle events (creation).
- [X] Starts Electron when imported outside test environment (`NODE_ENV`).
- [ ] **Window Lifecycle Events:**
  - [ ] Test `closed` event (window closing).
  - [ ] Test `ready-to-show` event.
  - [ ] Test `maximize`/`minimize` events.
  - [ ] Test `focus`/`blur` events.
- [ ] **Multiple Windows:**
  - [ ] Test creation and management of multiple `BrowserWindow` instances.
- [ ] **IPC Communication:**
  - [ ] Test handling of incoming IPC messages from the renderer process.
- [ ] **Electron Features:**
  - [ ] Test Menu/Tray/Dock functionality (if implemented).
- [ ] **Error Handling:**
  - [ ] Test behavior if `loadFile` fails.
  - [ ] Test behavior if `app.whenReady()` encounters issues.
- [ ] **Preload Script Integration:**
  - [ ] Test the functionality exposed by the preload script.
- [ ] **Application Lifecycle:**
  - [ ] Test `app.on('window-all-closed')` behavior.
  - [ ] Test `app.on('activate')` behavior (macOS specific).
  - [ ] Test `app.quit()` is called under appropriate circumstances.

### 2.2: `startup.test.ts`
- [X] Calls `initMainAppRenderer` with discovered plugins.
- [X] Logs options when `start` fails.
- [ ] **`start` function parameters:**
  - [ ] Test how various parameters passed to `start` are handled.
- [ ] **Successful startup behavior:**
  - [ ] Verify the expected outcomes of a successful startup (e.g., return values, state changes).
- [ ] **Different failure scenarios:**
  - [ ] Test other types of errors or edge cases that could cause `start` to fail.
- [ ] **Integration with other modules:**
  - [ ] Verify interactions with other core modules orchestrated by `start`.
- [ ] **Asynchronous operations:**
  - [ ] Ensure proper handling and testing of asynchronous operations within `start`.

### 2.3: `startup-async-path.test.ts`
- [X] `start` resolves when `path.join` returns a Promise (mocked asynchronous behavior).
- [ ] **Error handling for async `path.join`:**
  - [ ] Test behavior when the mocked `path.join` rejects.
- [ ] **Other async IPC methods:**
  - [ ] Test other IPC methods used in `start` that could be asynchronous.
- [ ] **Impact on other startup logic:**
  - [ ] Verify how this asynchronous behavior affects other parts of the startup process.

### 2.4: `startup-clone.test.ts`
- [X] `structuredClone` works with typical IPC data (objects, arrays, strings, numbers, booleans, null, nested objects, dates as ISO strings).
- [X] Conceptual `sanitizeForIpc` strips non-serializable properties (like functions) and attempts `JSON.parse(JSON.stringify(value))` as a fallback.
- [ ] **Comprehensive `structuredClone` edge cases:**
  - [ ] Test with `undefined` values (properties should be dropped).
  - [ ] Test with `Symbol` (not cloneable).
  - [ ] Test with `BigInt` (cloneable).
  - [ ] Test with `RegExp` (cloneable).
  - [ ] Test with `Map`, `Set` (cloneable).
  - [ ] Test with `Error` objects (cloneable, but properties might be lost).
  - [ ] Test with `Promise` (not cloneable).
  - [ ] Test with DOM elements (not cloneable).
  - [ ] Test with circular references (should throw `DataCloneError`).
- [ ] **`sanitizeForIpc` robustness:**
  - [ ] Test the `console.warn` call when non-serializable data is encountered.
  - [ ] Test the `JSON.parse(JSON.stringify(value))` fallback more thoroughly, especially for data that might cause `JSON.stringify` to fail (e.g., circular references, `BigInt` without custom `toJSON`).
  - [ ] Test the `null` return for un-stringifiable data.
  - [ ] Test with nested non-serializable data.
  - [ ] Test with `undefined` values (should be stripped by `JSON.stringify`).
- [ ] **Integration with actual IPC:**
  - [ ] Ensure the actual IPC sanitization (from `ipc-sanitize.test.ts`) is the primary focus for real-world testing, as this test is more for the underlying serialization mechanism.

## Part 3: Plugin-Specific Core Tests (from `tests/plugins`)

### 3.1: `as-built-documenter.test.tsx`
- [X] Lists Markdown templates in dropdown and allows clearing.
- [X] Loads a markdown file using the Load button.
- [X] Inserts an `{{#each}}` snippet using the toolbar.
- [X] Embeds a CodeMirror editor for editing templates.
- [X] Saves templates to `templates/as-built` folder.
- [X] Populates Data Source dropdown from configuration.
- [X] Loads sample data via IPC.
- [X] Displays sample data table and copies loops or field names.
- [X] Pages through sample data with Prev/Next buttons.
- [X] Saves configuration using Save Config button.
- [X] Adds data source via prompt and saves immediately.
- [ ] **Error Handling for File Operations:**
  - [ ] Test behavior if `fs.readFile` or `fs.writeFile` fails (e.g., permissions, file not found for reading, disk full for writing).
  - [ ] Test with invalid file formats for templates or configurations.
- [ ] **UI Interactions Edge Cases:**
  - [ ] Test with an empty template list.
  - [ ] Test with empty data sources.
  - [ ] Test behavior when "Load sample data" is clicked without a selected data source.
  - [ ] Test "Copy" buttons when no data is loaded.
  - [ ] Test the editor's behavior with very large content.
- [ ] **IPC Communication Errors:**
  - [ ] Test behavior if `invoke('load-sample-data')` rejects.
- [ ] **Data Source Management:**
  - [ ] Test removal/editing of data sources.
  - [ ] Test with invalid data source URLs.
- [ ] **CodeMirror Editor:**
  - [ ] More detailed tests for editor functionality (e.g., undo/redo, syntax highlighting, content changes).
- [ ] **Accessibility:**
  - [ ] More comprehensive accessibility checks beyond basic role/label assertions.
- [ ] **Performance:**
  - [ ] Test with a large number of templates or large data sets.

### 3.2: `context-generator.test.tsx`
- [X] Uses `FileScanner` to choose files.
- [X] Shows progress and character count when generating context.
- [X] Displays progress in output area with character count.
- [X] Copies context to clipboard and shows confirmation.
- [ ] **File Selection Edge Cases:**
  - [ ] Test with no files selected.
  - [ ] Test with a very large number of files.
  - [ ] Test with very large files (performance/memory).
  - [ ] Test with files that are not plain text (e.g., images, binary files) and how their content is handled (or ignored).
- [ ] **Context Generation Logic:**
  - [ ] Verify the exact content generated for various file types (e.g., Markdown, code files).
  - [ ] Test how different line endings are handled.
  - [ ] Test with empty files.
- [ ] **Error Handling:**
  - [ ] Test behavior if `fs.readFile` fails during context generation (e.g., file deleted, permissions).
  - [ ] Test behavior if clipboard `writeText` fails.
- [ ] **UI Feedback:**
  - [ ] Test loading/generating state feedback to the user.
  - [ ] Test clearing selected files and generated context.

### 3.3: `customer-links.test.tsx`
- [X] Scans configurable JSON or JSON5 file for customer sites.
- [X] Generates standalone HTML and renders it.
- [X] Saves generated HTML, CSS, and JS to output path.
- [X] Launches `JsonEditor` to modify `Customers.json` and update locations.
- [ ] **`scanCustomerSites` Edge Cases:**
  - [ ] Test with an empty JSON/JSON5 file.
  - [ ] Test with a malformed JSON/JSON5 file.
  - [ ] Test with a non-existent file.
  - [ ] Test with a file containing invalid site data (e.g., missing `id`, `name`, or `url`).
- [ ] **`generateCustomerLinksHtml` Edge Cases:**
  - [ ] Test with an empty list of sites.
  - [ ] Test with sites having special characters in name or URL.
- [ ] **`saveCustomerLinksFiles` Edge Cases:**
  - [ ] Test with invalid output directory path.
  - [ ] Test with permission issues for writing files.
- [ ] **`openCustomerLocationsEditor` Edge Cases:**
  - [ ] Test behavior if the initial `customersPath` is invalid or inaccessible.
  - [ ] Test `JsonEditor` interactions for various valid and invalid JSON inputs.
  - [ ] Test cancellation of the editor.
- [ ] **UI Component (`CustomerLinks`):**
  - [ ] Test rendering with an empty `sites` array.
  - [ ] Test click events on the generated links.
  - [ ] Test accessibility of the rendered links.

### 3.4: `script-runner.test.ts`
- [X] Discovers PowerShell scripts and filters them by query.
- [X] Runs scripts with default parameters and shows status (success case).
- [X] Opens Customize dialog to override parameters and save defaults.
- [X] Edits and removes script configurations.
- [X] Opens setup dialog when new scripts are discovered.
- [X] Clears output and copies it.
- [ ] **`discoverScripts` Edge Cases:**
  - [ ] Error handling for invalid script directories.
  - [ ] Handling of non-PowerShell files in the directory.
  - [ ] Scripts without metadata (ID, Name, Description).
  - [ ] Duplicate IDs.
- [ ] **`runScript` Edge Cases:**
  - [ ] Error handling for script execution (non-zero exit code).
  - [ ] Script output (stdout/stderr) capture and display.
  - [ ] Long-running scripts (cancellation/timeout).
  - [ ] Scripts with no parameters.
  - [ ] Different shell types (if supported, e.g., `bash`).
- [ ] **`customizeScript` Edge Cases:**
  - [ ] User cancels prompt.
  - [ ] Invalid input from prompt.
- [ ] **`editScriptConfig`, `removeScriptConfig` Edge Cases:**
  - [ ] Editing/removing non-existent scripts.
  - [ ] Error handling for `updateConfig`.
- [ ] **`setupNewScripts` Edge Cases:**
  - [ ] User cancels prompt for new scripts.
  - [ ] No new scripts discovered.
- [ ] **`createOutputManager` Edge Cases:**
  - [ ] Appending very large outputs (performance).
  - [ ] Error handling for clipboard copy.

## Part 4: Utility Tests (from `tests/lib`)

### 4.1: `utility.test.ts`
- [X] Throws when path is empty.
- [X] Converts relative paths to absolute.
- [X] Normalizes paths with `..` segments.
- [ ] **Edge Cases:**
  - [ ] Test with various valid absolute paths (e.g., root, network paths if applicable).
  - [ ] Test with paths containing special characters.
  - [ ] Test with very long paths.
  - [ ] Test with paths that are just `.` or `..`.
- [ ] **Platform Specifics:**
  - [ ] Consider platform-specific path separators (though `path.normalize` and `path.resolve` should handle this).

### 4.2: `schemas`
- [X] `plugin-manifest.test.ts`:
  - [X] Validates complete valid manifests.
  - [X] Validates minimal valid manifests.
  - [X] Validates various semver formats.
  - [X] Validates various plugin IDs.
  - [X] Validates various main file paths.
  - [X] Rejects manifest missing required fields.
  - [X] Rejects invalid semver formats.
  - [X] Rejects invalid plugin IDs.
  - [X] Rejects invalid main file paths.
  - [X] Rejects manifest with empty strings for required fields.
  - [X] Rejects manifest missing `ttCommanderVersion` in engine.
  - [X] Rejects manifest with extra properties.
  - [X] Provides correct TypeScript types.
  - [X] Validates partial manifests.
  - [X] Validates field formats in partial manifests.
  - [X] Provides `safeValidatePluginManifest` function.
  - [X] `validatePluginManifest` throws on invalid manifest.
  - [ ] **Edge Cases/Minor Improvements:**
    - [ ] Test `author` field validation (if any specific format is enforced).
    - [ ] Test `permissions` array with various valid/invalid permission strings.
    - [ ] Test `uiContributions` with more complex structures (if applicable).
    - [ ] Test `engine` with only `nodeVersion` (if `ttCommanderVersion` is optional in some contexts).
    - [ ] Test with very long valid strings for `name`, `description`, etc.
    - [ ] Test `safeValidatePluginManifest` with non-object inputs.

## Part 5: Test Environment Setup

### 5.1: `setup.ts`
- [X] Imports `@testing-library/jest-dom` for extended DOM matchers.
- [X] Provides CodeMirror DOM polyfills (`Range.prototype.getClientRects`, `Range.prototype.getBoundingClientRect`).
- [X] Mocks `navigator.clipboard.writeText`.
- [X] Provides `getTestPath` utility for path resolution.
- [ ] **Completeness of `navigator.clipboard` Mock:**
  - [ ] Mock `navigator.clipboard.readText()` and other clipboard APIs if used by components.
- [ ] **Robustness of CodeMirror Polyfills:**
  - [ ] Ensure polyfills accurately simulate real browser behavior if specific return values or side effects are expected.
- [ ] **Global Scope Pollution:**
  - [ ] Consider alternatives to global polyfills/mocks for better isolation if feasible.
- [ ] **Testability of Mocks:**
  - [ ] Verify that the mocks themselves behave as expected (e.g., `writeText` resolves its promise).