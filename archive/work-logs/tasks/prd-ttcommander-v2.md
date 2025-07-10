# ttCommander Version 2 - Product Requirements Document

## Introduction / Overview

The goal of ttCommander Version 2 is to rearchitect and modernize the original application while retaining all existing capabilities. The project will be guided by the architecture described in `prompts/redoprompt.md`, maintaining a modular plugin system with configuration handling, logging, and utilities in the core modules. The UI should be redesigned with a modern, card-based style and must remain responsive on all screen sizes, but should be developed as a PC first interface.

## Goals

1. Provide a stable architecture that resolves issues from Version 1.
2. Ensure seamless integration of plugins so users experience a single cohesive application.
3. Keep configuration in JSON5 with one main application file and individual plugin defaults.
4. Support Mercurial commits on file save, without the ability to pull revisions.
5. Log all errors with timestamps, plugin identifiers, and log levels.

## User Stories

- **JSON Editor** – As a user, I want to add a new data source via the **Settings &gt; Data Sources** path. I will edit the configuration in the JSON editor and save the changes.
- **Text Editor** – As a user, I want to open and edit a Markdown file directly, then save it.
- **Plugin Interaction** – As a user, I expect plugins to call the text editor and other components without any obvious transitions between plugins.

## Functional Requirements

1. The core must manage configuration, plugin loading, logging, and utilities as outlined in `redoprompt.md`.
2. The UI layer (`src/ui/`) must load plugin interfaces in sandboxed panels via `plugin-ui-loader.js`.
3. Each plugin resides in its own folder with a `plugin.json5` manifest, an optional `config.schema.json5`, and optional UI assets.
4. The application stores its settings in `config/app-config.json5`; plugin defaults populate `plugins.<plugin-id>` on first launch.
5. Provide built‑in UI components (file scanner/filter, JSON editor, Mercurial commit on save) accessible to plugins.
6. Support PowerShell Script Runner, Context Generator, As‑Built Documenter, and Customer Links plugins as described in `redoprompt.md`.
7. All errors must be handled gracefully, logged with timestamp and plugin identifier.
8. The UI must be responsive and adopt a card-based design using the color palette in `prompts/style..css.md`.

## Non‑Goals (Out of Scope)

- Restoring or pulling historical versions from Mercurial.
- Major changes to plugin functionality beyond parity with Version 1.

## Design Considerations

- Use the color palette defined in `prompts/style..css.md` and load **Nunito Sans** from Google Fonts.
- Maintain a single configuration file for the application with plugin defaults loaded on first use.
- Use card-based layouts that consume available screen space.

## Technical Considerations

- Application and plugin configurations remain in JSON5 format.
- Implement logging and error handling accessible to plugins.
- Plugins must remain decoupled, communicating through well-defined APIs.

## Success Metrics

- All plugins operate without unhandled errors, verified by comprehensive logs.
- Users can edit configuration and Markdown files without issues.
- Plugins integrate smoothly so that transitions are seamless.

## Open Questions

- Are there additional plugins from Version 1 not covered in `redoprompt.md` that must be supported?
- Are there specific performance targets (load time, memory usage) for the new architecture?
