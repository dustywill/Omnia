## Relevant Files

- `src/core/config.ts` - Handle reading/writing `config/app-config.json5`, merging defaults, and watching for changes.
- `src/core/plugin-manager.ts` - Load plugin manifests and manage lifecycle.
- `src/core/logger.ts` - Provide timestamped logging with plugin identifiers.
- `src/core/event-bus.ts` - Dispatch events between core and plugins.
- `src/ui/renderer.ts` - Initialize the main UI.
- `src/ui/plugin-ui-loader.ts` - Sandbox and display plugin UIs.
- `src/ui/components/FileScanner.tsx` - Reusable file scanner/filter component.
- `src/ui/components/JsonEditor.tsx` - JSON5 editor with schema enforcement.
- `src/ui/components/MercurialCommit.ts` - Commit edited files to Mercurial.
- `plugins/script-runner/index.ts` - PowerShell script discovery and execution plugin.
- `plugins/context-generator/index.ts` - Folder scanning and text bundling plugin.
- `plugins/as-built-documenter/index.ts` - Documentation generation plugin.
- `plugins/customer-links/index.ts` - Customer links viewer and exporter.
- `config/app-config.json5` - Main application configuration file.
- `tests/core/**/*.ts` - Jest unit tests for core modules and components.
- `tests/e2e/**/*.spec.ts` - Playwright end-to-end tests for plugin flows.
- `tasks/tasks-redoprompt.md` - Task list for project management.

### Notes

- Follow Test-Driven Development: write failing tests before implementation.
- Use TypeScript in strict mode for all source files.
- Apply the color palette from `prompts/style..css.md` and the Nunito Sans font for UI components.
- Mark a task complete only after test coverage verifies the behavior.

## Tasks

- [x] 1.0 Environment Setup
  - [x] 1.1 Create base folder structure (`src/core`, `src/ui`, `plugins`, `config`).
  - [x] 1.2 Configure TypeScript strict mode via `tsconfig.json`.
  - [x] 1.3 Install and configure Jest and Playwright for testing.

- [x] 2.0 Core Modules Implementation

  - [x] 2.1 Configuration Manager (`src/core/config.ts`)
    - [x] Read and write `config/app-config.json5` using JSON5 parser.
    - [x] Merge plugin default settings on first run.
    - [x] Watch for configuration changes and notify plugins via event bus.

  - [x] 2.2 Plugin Manager (`src/core/plugin-manager.ts`)
    - [x] Load each plugin’s `plugin.json5` manifest and main module.
    - [x] Provide lifecycle hooks to initialize and stop plugins.
    - [x] Expose helper to retrieve and update plugin configuration.
  - [x] 2.3 Logger (`src/core/logger.ts`)
    - [x] Create timestamped log entries with plugin identifiers.
    - [x] Support info, warning, and error levels written to console and file.
  - [x] 2.4 Event Bus (`src/core/event-bus.ts`)
    - [x] Implement publish/subscribe for core and plugins.
    - [x] Ensure events are strongly typed and support payloads.

- [ ] 3.0 Built-in Components
  - [ ] 3.1 FileScanner Component
    - [x] Display file tree with checkboxes for files and folders.
    - [ ] Provide search box for filtering tree results.
    - [ ] Include dialog to select root folder and remember path.
    - [ ] Offer preset dropdown and filter name field to save presets.
    - [ ] Allow include/exclude regex for folders and files with mode selectors.
    - [ ] Support max depth setting for recursive scans.
    - [ ] Apply filters button to rescan with current settings.
    - [ ] Save Filter and Delete Filter actions for managing presets.
  - [ ] 3.2 JsonEditor Component
    - [ ] Open and edit JSON or JSON5 files with optional schema enforcement.
    - [ ] Allow adding and deleting entries within a file.
    - [ ] Provide API for plugins to open a file with its schema.
    - [ ] Expose function to compact nested data beyond a chosen depth.
    - [ ] Commit changes via Mercurial revision control.
  - [ ] 3.3 MercurialCommit Module
    - [ ] Create commit whenever a file is saved.
    - [ ] Show popup prompting for commit message, defaulting when empty.

- [ ] 4.0 Plugin Development
  - [ ] 4.1 Script Runner Plugin
    - [ ] Discover PowerShell scripts and list them with filter by ID, name, or description.
    - [ ] Run scripts with default parameters and show status indicator.
    - [ ] Provide Customize dialog for overriding parameters and saving defaults.
    - [ ] Offer Edit and Remove actions for script configurations.
    - [ ] Configure newly discovered scripts through a setup dialog.
    - [ ] Clear Output and Copy Output actions for the output panel.
  - [ ] 4.2 Context Generator Plugin
    - [ ] Use File Scanner filter component to choose files.
    - [ ] Generate Context button shows progress and character count.
    - [ ] Copy to Clipboard action with confirmation message.
    - [ ] Display output area with progress message and character count.
  - [ ] 4.3 As-Built Documenter Plugin
    - [ ] Template File dropdown lists Markdown templates and allows clearing.
    - [ ] Load button opens any `.md` file.
    - [ ] Provide toolbar for formatting and inserting `{{#each}}` snippets.
    - [ ] Embed CodeMirror editor for editing templates.
    - [ ] Save button writes templates to `templates/as-built`.
    - [ ] Data Source dropdown populated from configuration.
    - [ ] Load sample data via IPC.
    - [ ] Sample Data Table supports copying loops or field names.
    - [ ] Prev/Next buttons page through sample data.
    - [ ] Configuration Editor for plugin settings with Save Config button.
    - [ ] Add Data Source button prompts for ID and URL and saves immediately.
  - [ ] 4.4 Customer Links Plugin
    - [ ] Scan configurable JSON or JSON5 file for customer sites.
    - [ ] Generate standalone HTML and render it inside the plugin.
    - [ ] Save generated HTML, CSS, and JavaScript to configured output path.
    - [ ] Launch JsonEditor to modify `Customers.json` and update locations.

- [ ] 5.0 UI and Testing
  - [ ] 5.1 Create responsive card-based UI using palette colors and Nunito Sans.
  - [ ] 5.2 Load plugin interfaces via `plugin-ui-loader.ts`.
  - [ ] 5.3 Write unit tests for core modules and components.
  - [ ] 5.4 Write end-to-end tests covering plugin workflows.
  - [ ] 5.5 Ensure full test coverage before merging changes.
