## Relevant Files

- `src/core/config.ts` - Handle reading and writing `config/app-config.json5` and plugin defaults.
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
- `src/**/*.test.ts` - Jest unit tests for core modules and components.
- `tests/e2e/**/*.spec.ts` - Playwright end-to-end tests for plugin flows.

### Notes

- Follow Test-Driven Development: write failing tests before implementation.
- Use TypeScript in strict mode for all source files.
- Apply the color palette from `prompts/style..css.md` and the Nunito Sans font for UI components.

## Tasks

- [ ] 1.0 Environment Setup
  - [ ] 1.1 Create base folder structure (`src/core`, `src/ui`, `plugins`, `config`).
  - [ ] 1.2 Configure TypeScript strict mode via `tsconfig.json`.
  - [ ] 1.3 Install and configure Jest and Playwright for testing.

- [ ] 2.0 Core Modules Implementation
  - [ ] 2.1 Implement configuration handling in `src/core/config.ts`.
  - [ ] 2.2 Implement plugin loader in `src/core/plugin-manager.ts`.
  - [ ] 2.3 Add logging utilities in `src/core/logger.ts` with plugin IDs and timestamps.
  - [ ] 2.4 Provide event bus in `src/core/event-bus.ts` for core <-> plugin communication.

- [ ] 3.0 Built-in Components
  - [ ] 3.1 Build `FileScanner` component with tree view, search, and filter presets.
  - [ ] 3.2 Build `JsonEditor` component with file open, schema support, and compaction controls.
  - [ ] 3.3 Implement Mercurial commit functionality in `MercurialCommit` module.

- [ ] 4.0 Plugin Development
  - [ ] 4.1 Implement Script Runner plugin features.
  - [ ] 4.2 Implement Context Generator plugin features.
  - [ ] 4.3 Implement As-Built Documenter plugin features.
  - [ ] 4.4 Implement Customer Links plugin features.

- [ ] 5.0 UI and Testing
  - [ ] 5.1 Create responsive card-based UI using palette colors and Nunito Sans.
  - [ ] 5.2 Load plugin interfaces via `plugin-ui-loader.ts`.
  - [ ] 5.3 Write unit tests for core modules and components.
  - [ ] 5.4 Write end-to-end tests covering plugin workflows.
  - [ ] 5.5 Ensure full test coverage before merging changes.
