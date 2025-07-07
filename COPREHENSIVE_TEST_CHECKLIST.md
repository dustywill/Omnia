### **`src/core/`**

#### `config.ts`

- **Error Handling:**
  - Test `readConfig` with permission issues (e.g., file exists but unreadable).
  - Test `writeConfig` with permission issues (e.g., directory not writable, disk full).
  - Test `loadConfig` when `readConfig` throws an unexpected error (not `ENOENT`).
- **Edge Cases for `watchConfig`:**
  - Test `watchConfig` behavior when the file becomes unreadable during watching.

#### `crawler.mjs`

- **Core Functionality:**
  - **Symlinks/Junctions:** Test how `crawlDirectory` handles symbolic links or directory junctions (does it follow them, ignore them, or error?).
  - **Large Directories:** Test performance and memory usage with very large directory structures (many files, deep nesting).
  - **Special Characters:** Test with file/directory names containing special characters or unusual Unicode characters.
- **Error Handling:**
  - Test `crawlDirectory` when `fs.readdir` throws an error other than `EACCES` (e.g., `ENOTDIR` if a path unexpectedly points to a file).
  - Test `crawlDirectory` when `fs.stat` throws an error (e.g., file deleted between `readdir` and `stat`).

#### `enhanced-plugin-manager.ts`

- **Initialization and Plugin Discovery:**
  - Test `init` with various valid and invalid `pluginsPath` configurations.
  - Test discovery of different plugin types (simple, configured, hybrid).
  - Test scenarios with no plugins found.
- **Plugin Loading and Activation:**
  - Test successful loading and activation of plugins.
  - Test loading of plugins with missing or invalid manifests.
  - Test behavior when a plugin's `init` method throws an error.
  - Test loading of plugins with dependencies (if applicable).
- **Plugin Lifecycle (`start`, `stop`):**
  - Test the `start` and `stop` methods of plugins, ensuring resources are properly allocated/deallocated.
  - Test scenarios where `start` or `stop` methods throw errors.
- **Plugin Configuration Management:**
  - Test how plugin configurations are loaded, updated, and persisted.
  - Test with invalid plugin configurations (e.g., schema validation failures).
- **Event Bus Integration:**
  - Test how the enhanced plugin manager interacts with the event bus (e.g., publishing events on plugin load/unload, subscribing to plugin-related events).
- **Error Handling:**
  - Comprehensive error handling for all file system operations (reading manifests, plugin code).
  - Test behavior when plugin code contains runtime errors.
- **Concurrency:**
  - Test concurrent loading/unloading of multiple plugins.

#### `file-crawler.ts`

- **Conversion Logic:**
  - Test `toFileNode` with various `CrawlNode` structures, including deeply nested ones, and ensure correct `FileNode` conversion.
  - Test `toFileNode` with `CrawlNode` objects that might have unexpected or missing properties.
- **Edge Cases for `getFileTree`:**
  - Test `getFileTree` when `crawlDirectory` returns an empty root node (e.g., a directory with no children).
  - Test `getFileTree` when `crawlDirectory` returns a malformed `CrawlNode` structure.

#### `logger.ts`

- **Different Log Levels:**
  - Test `warn`, `error`, `debug`, `info` methods, ensuring correct output format and routing.
- **Log Content:**
  - Test with various types of log content (e.g., objects, arrays, numbers, multiple arguments, complex data structures).
  - Test with messages containing special characters or long strings.
- **File Management:**
  - Test log file rotation/size limits (if applicable).
  - Test error handling when log file cannot be written to (e.g., permissions, disk full).
- **Concurrency:**
  - Test logging from multiple sources concurrently to ensure log integrity and prevent race conditions.
- **Timestamp/Formatting:**
  - More specific assertions on the log entry format, including timestamps and log level prefixes.

#### `navigation-service.ts`

- **Route Registration and Resolution:**
  - Test registering various routes (with and without parameters).
  - Test resolving paths to registered routes.
  - Test handling of unregistered routes or ambiguous routes.
- **Navigation Actions:**
  - Test `navigate` function with different paths and parameters.
  - Test `goBack`, `goForward` functionality.
  - Test programmatic navigation (e.g., redirecting after an action).
- **History Management:**
  - Test how navigation history is maintained and manipulated.
  - Test edge cases like navigating to the same route multiple times.
- **Event Emission:**
  - Test that navigation events are correctly emitted (e.g., `routeChanged`, `beforeNavigation`).
- **Error Handling:**
  - Test behavior when navigation fails (e.g., invalid route, missing parameters).

#### `plugin-manager.ts`

- **Plugin Discovery:**
  - Test `loadPlugins` with various valid and invalid plugin directories.
  - Test discovery of plugins with malformed `plugin.json5` manifests.
  - Test scenarios with no plugins found.
- **Plugin Registration:**
  - Test successful registration of plugins.
  - Test handling of duplicate plugin IDs.
- **Plugin Access:**
  - Test `getPlugin` and `getPlugins` methods, ensuring correct retrieval of registered plugins.
  - Test retrieving non-existent plugins.
- **Plugin Lifecycle (Basic):**
  - Test the basic `init` and `stop` methods of plugins (if exposed by this manager).
- **Error Handling:**
  - Comprehensive error handling for file system operations (reading manifests).
  - Test behavior when plugin code cannot be loaded or executed.

#### `service-registry.ts`

- **Service Registration:**
  - Test `register` with different service types and instances.
  - Test registering a service with a duplicate ID.
- **Service Retrieval:**
  - Test `get` method for retrieving registered services.
  - Test retrieving non-existent services (should return `undefined` or throw an error).
- **Service Unregistration:**
  - Test `unregister` method for removing services.
  - Test unregistering a non-existent service.
- **Dependency Resolution (if applicable):**
  - If the registry handles service dependencies, test various dependency graphs, including circular dependencies.
- **Lifecycle Management:**
  - If services have lifecycle methods (e.g., `init`, `destroy`), test that these are called correctly upon registration/unregistration.

#### `settings-manager.ts`

- **Concurrency:**
  - Test concurrent read/write operations across different config types (app, plugin, registry).
- **Edge Cases for Paths:**
  - Test with invalid or inaccessible `configDir`.
- **App Configuration Management (Advanced):**
  - Test partial updates to app config (merging vs. overwriting).
  - More complex schema validation scenarios for app config.
- **Plugin Registry Management (Advanced):**
  - Updating existing plugin entries (e.g., `enabled` status, `configPath`).
  - Invalid registry content (malformed entries).
- **Plugin Configuration Management (Advanced):**
  - More extensive testing of how `loadPluginConfig` applies defaults for missing/incomplete plugin config files.
  - Testing with more complex plugin schemas (nested objects, arrays).
  - Behavior when a plugin's config file is deleted.
- **Permission System (Advanced):**
  - Test wildcard permissions (if supported).
  - Behavior when plugin permissions are revoked after loading.
- **Configuration Watching (Advanced):**
  - Explicitly test that file content changes trigger callbacks within `SettingsManager`.
  - Behavior when config file is deleted and then recreated.
- \*\*Error Handling (Advanced):
  - Test for specific error types (e.g., `ConfigReadError`, `ConfigWriteError`).
  - Test `SettingsManager` stability after an error.
- **`destroy()` Method (Advanced):**
  - Verify cleanup of all resources and internal states beyond just watchers.

#### `utility.ts`

- **Path Handling (if applicable):**
  - Test with various valid absolute paths (e.g., root, network paths if applicable).
  - Test with paths containing special characters.
  - Test with very long paths.
  - Test with paths that are just `.` or `..`.
  - Consider platform-specific path separators (though `path.normalize` and `path.resolve` should handle this).
- **Other Utility Functions:**
  - If there are other utility functions (e.g., string manipulation, data validation, array helpers), ensure they are thoroughly tested with edge cases and invalid inputs.

---

### **`src/hooks/`**

#### `usePluginConfig.ts`

- **Configuration Loading:**
  - Test loading configuration for existing and non-existent plugins.
  - Test with valid and invalid plugin IDs.
- **Configuration Updates:**
  - Test updating plugin configuration, ensuring changes are persisted and reflected.
  - Test with partial updates and invalid data.
- **Reactivity:**
  - Test that components using this hook re-render when the plugin configuration changes.
- **Error Handling:**
  - Test behavior when configuration loading or saving fails (e.g., permissions, malformed config).

#### `usePluginContext.ts`

- **Context Retrieval:**
  - Test retrieving context for existing and non-existent plugins.
  - Test with various types of context data.
- **Reactivity:**
  - Test that components using this hook re-render when the plugin context changes (if the context is dynamic).
- **Error Handling:**
  - Test behavior when a plugin's context is not available or malformed.

#### `useService.ts`

- **Service Retrieval:**
  - Test retrieving existing and non-existent services.
  - Test with different service types.
- **Reactivity:**
  - Test that components using this hook re-render when the service instance changes (if services are dynamic).
- **Error Handling:**
  - Test behavior when a requested service is not found in the registry.

#### `index.ts`

- No specific functionality to test beyond ensuring correct re-exports.

---

### **`src/lib/`**

#### `index.ts`

- No specific functionality to test beyond ensuring correct re-exports.

#### `schemas/`

#### `schemas/index.ts`

- No specific functionality to test beyond ensuring correct re-exports.

#### `schemas/app-config.ts`

- **Schema Validation:**
  - Test `AppConfigSchema` with various valid and invalid application configurations.
  - Test edge cases for each field in the schema (e.g., empty strings, null values, out-of-range numbers).
  - Test with extra properties not defined in the schema (should be stripped or cause validation failure depending on schema configuration).

#### `schemas/plugin-manifest.ts`

- **Schema Validation:**
  - Test `PluginManifestSchema` with various valid and invalid plugin manifests.
  - Test edge cases for each field (e.g., empty strings, invalid versions, malformed IDs).
  - Test `author` field validation (if any specific format is enforced).
  - Test `permissions` array with various valid/invalid permission strings.
  - Test `uiContributions` with more complex structures (if applicable).
  - Test `engine` with only `nodeVersion` (if `ttCommanderVersion` is optional in some contexts).
  - Test with very long valid strings for `name`, `description`, etc.
  - Test `safeValidatePluginManifest` with non-object inputs.

#### `schemas/plugins/script-runner.ts`

- **Schema Validation:**
  - Test `ScriptRunnerConfigSchema` with various valid and invalid Script Runner plugin configurations.
  - Test edge cases for each field (e.g., empty script paths, invalid parameters, missing required fields).
  - Test with different types of script definitions (e.g., PowerShell, Bash if supported).

---

### **`src/ui/`**

#### `client-logger.ts`

- **IPC Communication:**
  - Test that log messages are correctly sent to the main process via IPC.
  - Test with different log levels and message types.
- **Formatting:**
  - Test that log messages are formatted correctly before being sent.
- **Error Handling:**
  - Test behavior if IPC communication fails.

#### `compact.ts`

- **Compaction Logic:**
  - Test with objects and arrays containing `null`, `undefined`, empty strings, and other falsy values.
  - Test with nested objects and arrays.
  - Test with objects that should not be compacted.
- **Immutability:**
  - Ensure the function returns a new object/array and does not mutate the original.

#### `enhanced-renderer.tsx`

- **API Exposure:**
  - Test that the enhanced APIs are correctly exposed and functional.
  - Test with various data types and edge cases for each API.
- **IPC Communication:**
  - Test the underlying IPC communication for these enhanced APIs.
- **Error Handling:**
  - Test behavior when enhanced APIs encounter errors.

#### `json-editor-api.tsx`

- **API Methods:**
  - Test all exposed API methods (e.g., `openEditor`, `saveContent`).
  - Test with various JSON data inputs.
- **IPC Communication:**
  - Test the underlying IPC communication for these API calls.
- **Error Handling:**
  - Test behavior when API calls fail (e.g., invalid JSON, file system errors).

#### `main-app-renderer.tsx`

- **UI Rendering:**
  - Test that the main application UI (e.g., routes, views) renders correctly.
  - Test initial rendering and subsequent updates.
- **IPC Communication:**
  - Test sending and receiving IPC messages to/from the main process.
  - Test various IPC channels and data types.
- **Route Handling:**
  - Test that the application correctly navigates between different routes.
  - Test deep linking and URL parsing.
- **Error Handling:**
  - Test unhandled errors in the renderer process.
  - Test behavior when IPC communication fails.

#### `node-module-loader.ts`

- **Module Loading:**
  - Test loading various Node.js modules (e.g., `fs`, `path`, `os`).
  - Test loading modules that are not whitelisted or do not exist.
- **Security:**
  - Ensure that only safe and intended modules can be loaded.
  - Test attempts to load malicious or unauthorized modules.
- **Error Handling:**
  - Test behavior when module loading fails (e.g., module not found, permission issues).

#### `plugin-ui-loader.ts`

- **Plugin UI Discovery:**
  - Test discovery of plugin UI entry points.
  - Test with plugins that have no UI or invalid UI paths.
- **UI Loading and Rendering:**
  - Test successful loading and rendering of plugin UIs.
  - Test behavior when plugin UIs contain errors or fail to render.
- **Context Provision:**
  - Test that the correct context (e.g., plugin ID, config) is provided to plugin UIs.
- **Error Handling:**
  - Test behavior when plugin UI files cannot be loaded or parsed.

#### `renderer.tsx`

- **Root Rendering:**
  - Test that the main application component is correctly mounted and rendered.
- **Error Boundaries:**
  - If error boundaries are implemented, test their behavior when child components throw errors.

#### `components/`

#### `components/index.ts`

- No specific functionality to test beyond ensuring correct re-exports.

#### `components/AppHeader/AppHeader.tsx`

- **Rendering:**
  - Test rendering with different props (e.g., title, user info).
  - Test responsiveness across different screen sizes.
- **Interactions:**
  - Test click events on any interactive elements (e.g., menu button, user avatar).
- **Accessibility:**
  - Ensure proper ARIA attributes and keyboard navigation.

#### `components/AppNavigation/AppNavigation.tsx`

- **Rendering:**
  - Test rendering with various navigation items (e.g., active/inactive states, icons).
  - Test responsiveness and different navigation layouts (e.g., collapsed/expanded sidebar).
- **Navigation:**
  - Test click events on navigation links, ensuring correct route changes.
- **Accessibility:**
  - Ensure proper ARIA attributes and keyboard navigation.

#### `components/AppSettings/AppSettings.tsx`

- **Form Rendering:**
  - Test rendering of various setting types (e.g., text inputs, toggles, dropdowns).
  - Test with default values and pre-filled data.
- **Form Interactions:**
  - Test user input for different setting types.
  - Test form submission and validation.
  - Test cancellation of changes.
- **Integration with Settings Manager:**
  - Test that changes are correctly sent to the `SettingsManager` for persistence.
  - Test that settings are loaded correctly from the `SettingsManager`.
- **Error Handling:**
  - Test display of validation errors.
  - Test behavior when saving settings fails.

#### `components/Badge/Badge.tsx`

- **Rendering:**
  - Test rendering with different content (numbers, text).
  - Test different visual styles (e.g., color, size).
  - Test with empty or null content.

#### `components/Button/Button.tsx`

- **Rendering:**
  - Test rendering with different labels, icons, and visual styles (e.g., primary, secondary, disabled).
- **Interactions:**
  - Test click events.
  - Test disabled state (button should not be clickable).
- **Accessibility:**
  - Ensure proper ARIA attributes and keyboard focus.

#### `components/Card/Card.tsx`

- **Rendering:**
  - Test rendering with various content (text, images, other components).
  - Test different visual styles (e.g., with/without header, footer, shadow).
  - Test responsiveness.

#### `components/CardGrid.tsx`

- **Rendering:**
  - Test rendering with different numbers of child cards.
  - Test responsiveness and different grid configurations (e.g., number of columns).
  - Test with no child cards.

#### `components/DashboardPluginCard/DashboardPluginCard.tsx`

- **Rendering:**
  - Test rendering with various plugin data (name, description, status, icon).
  - Test different states (e.g., enabled, disabled, error).
- **Interactions:**
  - Test click events (e.g., to navigate to plugin detail).
- **Accessibility:**
  - Ensure proper ARIA attributes.

#### `components/FileScanner.tsx`

- **File/Directory Selection:**
  - Test selecting single and multiple files/directories.
  - Test with various file types and sizes.
  - Test canceling selection.
- **UI Feedback:**
  - Test display of selected files/directories.
  - Test progress indicators during scanning.
- **Integration with File System API:**
  - Test interaction with underlying file system APIs (e.g., `showOpenDialog`).
- **Error Handling:**
  - Test behavior when file system operations fail (e.g., permissions, non-existent paths).

#### `components/Grid/Grid.tsx`

- **Rendering:**
  - Test rendering with different column/row configurations.
  - Test responsiveness and breakpoint handling.
  - Test with nested grids.

#### `components/Input/Input.tsx`

- **Rendering:**
  - Test rendering with different types (text, number, password), labels, placeholders, and default values.
  - Test disabled and read-only states.
- **Interactions:**
  - Test user input and `onChange` events.
  - Test validation and error message display.
  - Test keyboard navigation.
- **Accessibility:**
  - Ensure proper ARIA attributes.

#### `components/JsonEditor/JsonEditor.tsx`

- **Rendering:**
  - Test rendering with various JSON data (empty, simple, complex, large).
  - Test syntax highlighting and formatting.
- **Editing:**
  - Test user input and `onChange` events.
  - Test JSON validation and error display.
  - Test undo/redo functionality.
- **Integration:**
  - Test integration with an external JSON editor library (e.g., CodeMirror, Ace Editor).
- **Error Handling:**
  - Test behavior with malformed JSON input.

#### `components/MercurialCommit.ts`

- **Mercurial Integration:**
  - Test interaction with Mercurial commands (if any).
  - Test parsing Mercurial output.
- **Commit Message Generation:**
  - Test generation of commit messages based on various inputs.
  - Test with different commit message formats.
- **Error Handling:**
  - Test behavior when Mercurial commands fail or return unexpected output.

#### `components/PluginCard/PluginCard.tsx`

- **Rendering:**
  - Test rendering with various plugin data (name, description, version, status, icon).
  - Test different states (e.g., enabled, disabled, installed, not installed).
- **Interactions:**
  - Test click events (e.g., to view plugin details, enable/disable).
- **Accessibility:**
  - Ensure proper ARIA attributes.

#### `components/PluginSettings/PluginSettings.tsx`

- **Form Rendering:**
  - Test rendering of various setting types based on plugin schema.
  - Test with default values and pre-filled data.
- **Form Interactions:**
  - Test user input for different setting types.
  - Test form submission and validation.
  - Test cancellation of changes.
- **Integration with Settings Manager:**
  - Test that changes are correctly sent to the `SettingsManager` for persistence.
  - Test that settings are loaded correctly from the `SettingsManager`.
- **Error Handling:**
  - Test display of validation errors.
  - Test behavior when saving settings fails.

#### `components/SchemaForm/SchemaForm.tsx`

- **Form Generation:**
  - Test rendering of forms for various JSON schemas (simple, complex, nested, arrays, enums).
  - Test different schema types (string, number, boolean, object, array).
  - Test with required and optional fields.
- **Data Binding:**
  - Test that form inputs correctly bind to data based on the schema.
  - Test initial data loading.
- **Validation:**
  - Test client-side validation based on schema rules.
  - Test display of validation errors.
- **Custom Widgets/UI:**
  - If the form supports custom widgets for specific schema types, test their rendering and functionality.
- **Error Handling:**
  - Test behavior with invalid or malformed schemas.

#### `components/SchemaForm/schema-introspection.ts`

- **Schema Parsing:**
  - Test parsing various JSON schema constructs (e.g., `allOf`, `anyOf`, `oneOf`, `not`).
  - Test handling of references (`$ref`).
- **Type Inference:**
  - Test correct type inference from schema definitions.
- **Default Value Extraction:**
  - Test extraction of default values from schemas.
- **Error Handling:**
  - Test behavior with invalid or malformed schemas.

#### `components/SettingsForm/SettingsForm.tsx`

- **Form Rendering:**
  - Test rendering with different schema inputs.
  - Test initial data loading.
- **Form Submission:**
  - Test form submission and `onChange` events.
  - Test validation and error display.
- **Save/Cancel Actions:**
  - Test save and cancel button functionality.
- **Integration:**
  - Test integration with a data source for loading and saving settings.

#### `components/SettingsPage/SettingsPage.tsx`

- **Layout and Navigation:**
  - Test rendering of multiple settings sections or tabs.
  - Test navigation between sections.
- **Data Flow:**
  - Test how settings data flows between the page and its child components.
- **Save/Cancel Actions:**
  - Test overall save and cancel functionality for the entire page.

#### `components/Sidebar/Sidebar.tsx`

- **Rendering:**
  - Test rendering with various navigation items.
  - Test collapsed and expanded states.
- **Interactions:**
  - Test toggling the sidebar.
  - Test click events on navigation items.
- **Responsiveness:**
  - Test behavior on different screen sizes (e.g., mobile vs. desktop).

#### `components/StatusBar/StatusBar.tsx`

- **Rendering:**
  - Test rendering with different messages (e.g., success, error, info).
  - Test dynamic updates to the status message.
  - Test with empty or long messages.
- **Interactions:**
  - If clickable, test click events.

#### `components/ToggleSwitch/ToggleSwitch.tsx`

- **Rendering:**
  - Test rendering in both "on" and "off" states.
  - Test disabled state.
- **Interactions:**
  - Test click events to toggle the switch.
  - Test `onChange` events.
- **Accessibility:**
  - Ensure proper ARIA attributes and keyboard navigation.

#### `views/`

#### `views/DashboardView.tsx`

- **Rendering:**
  - Test rendering with various numbers of plugins (none, few, many).
  - Test display of system status information.
- **Interactions:**
  - Test click events on dashboard elements (e.g., plugin cards).
- **Data Loading:**
  - Test that data (e.g., plugin list) is loaded correctly.
  - Test behavior during data loading (e.g., loading indicators).

#### `views/LogsView.tsx`

- **Log Display:**
  - Test rendering of various log messages (different levels, content).
  - Test with a large number of log entries (performance, scrolling).
  - Test filtering and searching of logs.
- **Real-time Updates:**
  - Test that new log entries are displayed in real-time.
- **Interactions:**
  - Test clearing logs.
  - Test copying logs to clipboard.
- **Error Handling:**
  - Test behavior when log data cannot be retrieved.

#### `views/PluginDetailView.tsx`

- **Rendering:**
  - Test rendering with various plugin data (manifest details, configuration, status).
  - Test different states (e.g., enabled, disabled, installed, not installed).
- **Interactions:**
  - Test enable/disable actions.
  - Test navigation to plugin settings.
- **Data Loading:**
  - Test that plugin details are loaded correctly.
  - Test behavior during data loading.

#### `views/PluginsView.tsx`

- **Rendering:**
  - Test rendering with various numbers of plugins (none, few, many).
  - Test filtering and sorting of plugins.
- **Interactions:**
  - Test click events on plugin cards (e.g., to view details).
  - Test enable/disable actions from the list.
- **Data Loading:**
  - Test that the plugin list is loaded correctly.
  - Test behavior during data loading.

#### `views/SettingsView.tsx`

- **Layout and Navigation:**
  - Test rendering of different settings sections (e.g., app settings, plugin settings).
  - Test navigation between sections.
- **Data Flow:**
  - Test how settings data flows between the view and its child components.
  - Test save and cancel functionality for the entire settings view.

---

### **Root Level `src/` Files**

#### `electron-main.ts`

- **Window Lifecycle Events:**
  - Test `closed` event (window closing).
  - Test `ready-to-show` event.
  - Test `maximize`/`minimize` events.
  - Test `focus`/`blur` events.
- **Multiple Windows:**
  - Test creation and management of multiple `BrowserWindow` instances.
- **IPC Communication:**
  - Test handling of incoming IPC messages from the renderer process.
  - Test sending IPC messages to the renderer process.
- **Electron Features:**
  - Test Menu/Tray/Dock functionality (if implemented).
  - Test notifications, dialogs, and other Electron APIs.
- **Error Handling:**
  - Test behavior if `loadFile` fails.
  - Test behavior if `app.whenReady()` encounters issues.
  - Test unhandled errors in the main process.
- **Preload Script Integration:**
  - Test the functionality exposed by the preload script.
- **Application Lifecycle:**
  - Test `app.on('window-all-closed')` behavior.
  - Test `app.on('activate')` behavior (macOS specific).
  - Test `app.quit()` is called under appropriate circumstances.

#### `index.ts`

- **Initialization Flow:**
  - Test the entire initialization sequence, ensuring all core modules are correctly initialized and interconnected.
  - Test with various configurations (e.g., different plugin paths, app settings).
- **Error Handling:**
  - Test behavior when any part of the initialization process fails (e.g., config loading error, plugin loading error).
  - Ensure graceful shutdown or error reporting.
- **Command Line Arguments:**
  - If the application accepts command-line arguments, test how they influence the startup process.

#### `preload.js`

- **API Exposure:**
  - Test that only the intended APIs are exposed to the renderer process.
  - Test that sensitive Node.js APIs are _not_ exposed.
- **IPC Communication:**
  - Test the `invoke` and `send` methods, ensuring correct data transfer and handling of responses.
  - Test with various data types, including complex objects.
- **Context Isolation:**
  - Verify that context isolation is properly maintained and that the renderer process cannot access Node.js globals directly.
- **Error Handling:**
  - Test behavior when exposed APIs encounter errors.

---

### **Discrepancies and Missing Modules from `NON_UI_TESTING_CHECKLIST.md`**

The following modules were listed in `NON_UI_TESTING_CHECKLIST.md` but **do not exist** in the `src` directory, and therefore cannot be tested:

- `ipc-sanitize.js`
- `ipc-trace.js`
- `startup.ts` (and its related test files `startup.test.ts`, `startup-async-path.test.ts`, `startup-clone.test.ts`)
- `as-built-documenter.test.tsx` (this was a test file, but the corresponding module was not found in `src/plugins` either)
- `context-generator.test.tsx` (same as above)
- `customer-links.test.tsx` (same as above)
- `script-runner.test.ts` (same as above)

Additionally, the `NON_UI_TESTING_CHECKLIST.md` referred to `plugin-manager.js` and `settings-manager.js`, while the actual files in `src/core` are `plugin-manager.ts` and `settings-manager.ts`. The functionalities listed in the checklist for these modules have been incorporated into the respective `.ts` files in the list above.

The `NON_UI_TESTING_CHECKLIST.md` also focused on "Non-UI Testing," but a significant portion of the `src` directory consists of UI components and related logic. These UI components have been included in the list above under `src/ui/` as they represent a substantial amount of untested code.
