You are to create the “ttCommander” application Version 2. The new implementation may use any technology stack, but all functionality must match exactly and all add‑ins must remain add‑ins. The UI design may differ, yet it must offer the same capabilities.

**Architecture Overview**

- **Core Modules** – Provide configuration handling, plugin management, logging and utilities (located in `src/core/`).
- **Renderer Assets** – HTML/CSS/JS under `src/ui/`. `renderer.js` initializes the UI, while `plugin-ui-loader.js` loads plugin UIs into a sandboxed panel.
- **Plugins** – Reside in `plugins/` and contain a `plugin.json5` manifest, a main `index.js`, an optional `config.schema.json5`, and an optional `ui/` folder.
- **Configuration** – The main application settings live in `config/app-config.json5`. Each plugin’s configuration is stored under `plugins.<plugin-id>` in that file.
- **Testing** – Jest unit tests and Playwright end-to-end tests ensure functionality.

**Built In Functionality available to the plugins.**

- File Scanner/filter: Should be functionality with UI that a plugin can embed in its own UI
  - File Tree with checkboxes for files and folders.
  - Search Files box for filtering the tree.
  - Select Root Folder dialog that remembers the chosen path.
  - Preset dropdown for built-in and saved filters.
  - Filter Name field when saving presets.
  - Folder Regex/Mode and File Regex/Mode fields for include/exclude rules.
  - Max Depth option for recursive scanning.
  - Apply Filters button to rescan with current settings.
  - Save Filter and Delete Filter actions for managing presets.
- JSON Editor
  - Used for editing the Configurations of the application aand s a stand-alone JSON or JSON5 editor. I have used json-editor for this in the past and with minor tweaking of the UI it was a nice solution and can enforce the schema. : Should be functionality with UI that a plugin can embed in its own UI
    - Allow addition of and deletetion from a JSON file.
    - Open File dialog
    - Allow a plugin to send a file location and optionally it's corresponding schema to this editor and have it opened for edit.
    - Expose a function to the plugins for compacting to a certain level. As data is nested, compact everything past this deep.
    - Have a mechanism to version control
- Mercurial Revision Control Support
  - Any time a file is edited and saved, This application should create a commit for that file. A popup to ask the user what notes they want on the commit is perfect. If they leave the commit popup empty create a standard commit statement including the user, date time and LAZY.
  - At this time I am not interestedin having the ability to restore old version or anything lilike at, just amk sure we save the revisions.

**Plugin Functionality**

1. **Script Runner**  
   The Script Runner plugin discovers PowerShell scripts and presents them in a tabbed UI. All functionality from its README must be implemented:

   - Script filter to narrow results by ID, name, or description.
   - Run button that executes a script with default parameters and shows status.
   - Customize dialog for overriding parameters and saving new defaults.
   - Edit and Remove functions to modify or delete script configurations.
   - Configure option for newly discovered scripts.
   - Clear Output and Copy Output actions for the output panel.
   - Status Indicator displaying success or failure with timestamps.  
     ​:codex-file-citation[codex-file-citation]{line_range_start=39 line_range_end=49 path=plugins/script-runner/README.md git_url="https://github.com/dustywill/ttCommander/blob/TemplateEditor/plugins/script-runner/README.md#L39-L49"}​

2. **Context Generator**  
   This plugin scans a folder, filters files, and bundles text for copying elsewhere. The README lists these required features:

   - Utilizing the File Scanner Filter Function of the main Application
     - Generate Context button showing progress and character count.
     - Copy to Clipboard action with confirmation.
     - Output Area, Progress Message, and Character Count display.

3. **As‑Built Documenter**  
   Generates documentation using templates and data sources. The README’s Functionality section describes these UI elements:

   - Template File dropdown listing Markdown files and clearing to empty.
   - Load… button to open any `.md` file.
   - Toolbar for inserting formatting or `{{#each}}` snippets.
   - Code Editor (CodeMirror) for editing templates.
   - Save button to write templates to `templates/as-built`.
   - Data Source dropdown populated from configuration.
   - Load button to fetch sample data via IPC.
   - Sample Data Table that allows copying loops or field names.
   - Prev/Next buttons to page through samples.
   - Configuration Editor for viewing/editing plugin configuration.
   - Save Config button to persist changes and refresh data sources.
   - Add Data Source button prompting for ID and URL and saving immediately.  
     ​:codex-file-citation[codex-file-citation]{line_range_start=44 line_range_end=72 path=plugins/as-built-documenter/README.md git_url="https://github.com/dustywill/ttCommander/blob/TemplateEditor/plugins/as-built-documenter/README.md#L44-L72"}​

4. **Customer Links**  
   Displays a list of customer sites in collapsible sections and provides a “Save Page” feature. Although it has no README, its functionality is described in the plugin manifest and UI code. Include this behavior in the new application.
   - Scans a configurable JSON or JSON5 file.
   - Using the JSON information it generates a standalone HTML file
   - Renders the file inside the plugin
   - Has a button to save the generated HTML/css/javascript in a single file to a configured output location.
   - Has a button to launch the JSON editor to edit the Customers.json file to add or remove locations and other settings.

**Requirements for the New Implementation**

- Keep the plugin/add‑in architecture intact: each add‑in must have metadata, configuration schema, and optional UI entry points.
- Implement all functionality listed above so the new app matches the original behavior.
- Provide a configuration editor that validates settings, saves to disk, and notifies add-ins when configurations change.
- Ensure logging, error handling, and event dispatch mechanisms are available for plugins.
- Include unit tests and end‑to‑end tests to verify parity with the original.

Retain every capability of the existing add-ins even if the UI and technology stack change. The resulting application should function exactly like the original “ttCommander” project in features and behavior.
