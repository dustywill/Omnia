## Relevant Files

- `src/core/config.ts` - Handle reading/writing `config/app-config.json5`, merging defaults, and watching for changes.
- `src/core/plugin-manager.ts` - Load plugin manifests and manage lifecycle.
- `src/core/logger.ts` - Provide timestamped logging with plugin identifiers.
- `src/core/event-bus.ts` - Dispatch events between core and plugins.
- `src/ui/renderer.ts` - Initialize the main UI.
- `src/ui/plugin-ui-loader.ts` - Sandbox and display plugin UIs.
- `src/ui/components/FileScanner.tsx` - Reusable file scanner/filter component.
- `src/ui/components/FileScanner.css` - Styles for the FileScanner component.
- `tests/ui/components/FileScanner.test.tsx` - Tests for FileScanner UI behavior.
- `tests/setup.ts` - Jest setup including custom matchers.
- `tests/style-mock.js` - Stub for imported CSS modules during tests.
- `src/ui/components/JsonEditor.tsx` - JSON5 editor with schema enforcement.
- `src/ui/json-editor-api.tsx` - Helper API for opening JsonEditor with a schema.
- `src/ui/compact.ts` - Utility to compact nested JSON data.
- `src/ui/components/JsonEditor.css` - Styles for the JsonEditor component.
- `tests/ui/components/JsonEditor.test.tsx` - Tests for JsonEditor UI behavior.
- `tests/ui/compactNested.test.ts` - Tests for compactNestedData function.
- `tests/ui/components/MercurialCommit.test.ts` - Tests for Mercurial commit behavior.
- `tests/ui/components/MercurialAutoCommit.test.ts` - Tests for committing on file save.
- `tests/ui/components/CommitPrompt.test.tsx` - Tests for prompting commit message.
- `src/ui/components/MercurialCommit.ts` - Commit edited files to Mercurial.
- `src/ui/components/CardGrid.tsx` - Responsive card-based layout component.
- `src/ui/components/CardGrid.css` - Styles for CardGrid component.
- `tests/ui/components/CardGrid.test.tsx` - Tests for CardGrid UI behavior.
- `plugins/script-runner/index.ts` - PowerShell script discovery and execution plugin.
- `tests/plugins/script-runner.test.ts` - Tests for Script Runner plugin behavior, including customizing parameters.
- `tests/plugins/context-generator.test.tsx` - Tests for Context Generator plugin UI behavior.
  - `plugins/context-generator/index.tsx` - Folder scanning and text bundling plugin.
  - `plugins/as-built-documenter/index.tsx` - Documentation generation plugin UI.
  - `tests/plugins/as-built-documenter.test.tsx` - Tests for As-Built Documenter plugin behavior.
  - `plugins/customer-links/index.tsx` - Customer links viewer and exporter.
- `tests/plugins/customer-links.test.tsx` - Tests for Customer Links plugin behavior.
- `config/app-config.json5` - Main application configuration file.
- `tests/core/**/*.ts` - Jest unit tests for core modules and components.
- `tests/e2e/**/*.spec.ts` - Playwright end-to-end tests for plugin flows.
- `tests/e2e/plugin-workflows.spec.ts` - End-to-end tests exercising plugin workflows.
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

    - [x] 2.1.1 Read and write `config/app-config.json5` using JSON5 parser.
    - [x] 2.1.2 Merge plugin default settings on first run.
    - [x] 2.1.3 Watch for configuration changes and notify plugins via event bus.

  - [x] 2.2 Plugin Manager (`src/core/plugin-manager.ts`)
    - [x] 2.2.1 Load each plugin’s `plugin.json5` manifest and main module.
    - [x] 2.2.2 Provide lifecycle hooks to initialize and stop plugins.
    - [x] 2.2.3 Expose helper to retrieve and update plugin configuration.
  - [x] 2.3 Logger (`src/core/logger.ts`)
    - [x] 2.3.1 Create timestamped log entries with plugin identifiers.
    - [x] 2.3.2 Support info, warning, and error levels written to console and file.
  - [x] 2.4 Event Bus (`src/core/event-bus.ts`)
    - [x] 2.4.1 Implement publish/subscribe for core and plugins.
    - [x] 2.4.2 Ensure events are strongly typed and support payloads.

- [x] 3.0 Built-in Components

  - [x] 3.1 FileScanner Component
    - [x] 3.1.1 Display file tree with checkboxes for files and folders.
    - [x] 3.1.2 Provide search box for filtering tree results.
    - [x] 3.1.3 Write failing test for dialog to select root folder and remember path.
    - [x] 3.1.4 Implement dialog to select root folder and remember path.
    - [x] 3.1.5 Write failing test for preset dropdown and filter name field to save presets.
    - [x] 3.1.6 Implement preset dropdown and filter name field to save presets.
    - [x] 3.1.7 Write failing test for include/exclude regex mode selectors.
    - [x] 3.1.8 Implement include/exclude regex mode selectors for folders and files.
    - [x] 3.1.9 Write failing test for max depth setting for recursive scans.
    - [x] 3.1.10 Implement max depth setting for recursive scans.
    - [x] 3.1.11 Write failing test for Apply filters button to rescan with current settings.
    - [x] 3.1.12 Implement Apply filters button to rescan with current settings.
    - [x] 3.1.13 Write failing test for Save Filter and Delete Filter actions.
    - [x] 3.1.14 Implement Save Filter and Delete Filter actions for managing presets.

  - [x] 3.2 JsonEditor Component
    - [x] 3.2.1 Write failing test for opening and editing JSON or JSON5 files with optional schema enforcement.
    - [x] 3.2.2 Implement opening and editing JSON or JSON5 files with optional schema enforcement.
    - [x] 3.2.3 Write failing test for adding and deleting entries within a file.
    - [x] 3.2.4 Implement adding and deleting entries within a file.
    - [x] 3.2.5 Write failing test for API allowing plugins to open a file with its schema.
    - [x] 3.2.6 Implement API allowing plugins to open a file with its schema.
    - [x] 3.2.7 Write failing test for function to compact nested data beyond a chosen depth.
    - [x] 3.2.8 Implement function to compact nested data beyond a chosen depth.
    - [x] 3.2.9 Write failing test for committing changes via Mercurial revision control.
    - [x] 3.2.10 Implement committing changes via Mercurial revision control.

  - [x] 3.3 MercurialCommit Module
    - [x] 3.3.1 Write failing test for creating a commit whenever a file is saved.
    - [x] 3.3.2 Implement creating a commit whenever a file is saved.
    - [x] 3.3.3 Write failing test for popup prompting for commit message with default.
    - [x] 3.3.4 Implement popup prompting for commit message, defaulting when empty.

- [x] 4.0 Plugin Development

  - [x] 4.1 Script Runner Plugin
    - [x] 4.1.1 Write failing test to discover PowerShell scripts and list them with filter by ID, name, or description.
    - [x] 4.1.2 Implement discovery of PowerShell scripts and list them with filter by ID, name, or description.
    - [x] 4.1.3 Write failing test for running scripts with default parameters and showing status indicator.
    - [x] 4.1.4 Implement running scripts with default parameters and showing status indicator.
    - [x] 4.1.5 Write failing test for Customize dialog to override parameters and save defaults.
    - [x] 4.1.6 Implement Customize dialog to override parameters and save defaults.
    - [x] 4.1.7 Write failing test for Edit and Remove actions for script configurations.
    - [x] 4.1.8 Implement Edit and Remove actions for script configurations.
    - [x] 4.1.9 Write failing test for setup dialog when new scripts are discovered.
    - [x] 4.1.10 Implement setup dialog for newly discovered scripts.
    - [x] 4.1.11 Write failing test for Clear Output and Copy Output actions.
    - [x] 4.1.12 Implement Clear Output and Copy Output actions for the output panel.
  - [x] 4.2 Context Generator Plugin
    - [x] 4.2.1 Write failing test for using File Scanner filter component to choose files.
    - [x] 4.2.2 Implement using File Scanner filter component to choose files.
    - [x] 4.2.3 Write failing test for Generate Context button showing progress and character count.
    - [x] 4.2.4 Implement Generate Context button showing progress and character count.
    - [x] 4.2.5 Write failing test for Copy to Clipboard action with confirmation message.
    - [x] 4.2.6 Implement Copy to Clipboard action with confirmation message.
    - [x] 4.2.7 Write failing test for output area displaying progress and character count.
    - [x] 4.2.8 Implement output area displaying progress and character count.
  - [x] 4.3 As-Built Documenter Plugin
    - [x] 4.3.1 Write failing test for Template File dropdown listing Markdown templates and allowing clearing.
    - [x] 4.3.2 Implement Template File dropdown listing Markdown templates and allowing clearing.
    - [x] 4.3.3 Write failing test for Load button opening any `.md` file.
    - [x] 4.3.4 Implement Load button opening any `.md` file.
    - [x] 4.3.5 Write failing test for toolbar to format and insert `{{#each}}` snippets.
    - [x] 4.3.6 Implement toolbar to format and insert `{{#each}}` snippets.
    - [x] 4.3.7 Write failing test for embedding CodeMirror editor for editing templates.
    - [x] 4.3.8 Implement embedding CodeMirror editor for editing templates.
    - [x] 4.3.9 Write failing test for Save button writing templates to `templates/as-built`.
    - [x] 4.3.10 Implement Save button writing templates to `templates/as-built`.
    - [x] 4.3.11 Write failing test for Data Source dropdown populated from configuration.
    - [x] 4.3.12 Implement Data Source dropdown populated from configuration.
    - [x] 4.3.13 Write failing test for loading sample data via IPC.
    - [x] 4.3.14 Implement loading sample data via IPC.
    - [x] 4.3.15 Write failing test for Sample Data Table supporting copying loops or field names.
    - [x] 4.3.16 Implement Sample Data Table supporting copying loops or field names.
    - [x] 4.3.17 Write failing test for Prev/Next buttons paging through sample data.
    - [x] 4.3.18 Implement Prev/Next buttons paging through sample data.
    - [x] 4.3.19 Write failing test for Configuration Editor with Save Config button.
    - [x] 4.3.20 Implement Configuration Editor with Save Config button.
    - [x] 4.3.21 Write failing test for Add Data Source button prompting for ID and URL and saving immediately.
    - [x] 4.3.22 Implement Add Data Source button prompting for ID and URL and saving immediately.
  - [x] 4.4 Customer Links Plugin
    - [x] 4.4.1 Write failing test for scanning configurable JSON or JSON5 file for customer sites.
    - [x] 4.4.2 Implement scanning configurable JSON or JSON5 file for customer sites.
    - [x] 4.4.3 Write failing test for generating standalone HTML and rendering it inside the plugin.
    - [x] 4.4.4 Implement generating standalone HTML and rendering it inside the plugin.
    - [x] 4.4.5 Write failing test for saving generated HTML, CSS, and JavaScript to configured output path.
    - [x] 4.4.6 Implement saving generated HTML, CSS, and JavaScript to configured output path.
    - [x] 4.4.7 Write failing test for launching JsonEditor to modify `Customers.json` and update locations.
    - [x] 4.4.8 Implement launching JsonEditor to modify `Customers.json` and update locations.

 - [x] 5.0 UI and Testing
  - [x] 5.1 Write failing test for creating responsive card-based UI using palette colors and Nunito Sans.
  - [x] 5.2 Implement responsive card-based UI using palette colors and Nunito Sans.
  - [x] 5.3 Write failing test for loading plugin interfaces via `plugin-ui-loader.ts`.
  - [x] 5.4 Implement loading plugin interfaces via `plugin-ui-loader.ts`.
  - [x] 5.5 Write unit tests for core modules and components.
  - [x] 5.6 Write end-to-end tests covering plugin workflows.
  - [x] 5.7 Ensure full test coverage before merging changes.
