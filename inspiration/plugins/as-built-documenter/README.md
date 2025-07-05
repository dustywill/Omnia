# As-Built Documenter Plugin

This document outlines the current status of the plugin and provides suggestions for completing it.

## Current Status
- Plugin manifest (`plugin.json5`) points to `index.js` as the main entry. The main process code was previously stored under `ui/index.js`.
- Basic UI implementation is present with a form to request document generation.
- Configuration schema exists for providing a template path and data source definitions.

## Suggested Next Steps
1. **Finalize Main Process Entry**
   - Ensure `plugins/as-built-documenter/index.js` contains the activation logic. The file has been moved from the `ui` folder for consistency with other plugins.
   - Verify that the plugin loads correctly via the `PluginManager`.
2. **Data Source Handling**
   - Expand support for authentication (e.g., bearer tokens or basic auth) when calling protected endpoints.
   - Allow per-source timeout and retry settings.
   - Normalize fetched data to handle differing response shapes.
3. **Template Processing**
   - Add helper functions to Handlebars for common formatting tasks.
   - Consider caching compiled templates to improve performance when generating multiple documents.
4. **UI Improvements**
   - Provide progress feedback for each data source request.
   - Display a detailed error summary when some data sources fail.
   - Offer an option to save the generated document to disk directly from the UI.
5. **Configuration Management**
   - Expose a UI form for editing data sources and the template path using the configuration schema.
   - Validate user-supplied configuration values on save.

## Error Handling and Logging
- Wrap file and network operations with additional context in error logs using `coreAPI.logger`.
- Distinguish between recoverable warnings (e.g., one data source failed) and fatal errors (e.g., template file missing).
- Include the target IP and data source ID in each log entry to ease troubleshooting.
- Log unexpected exceptions at `logger.error` with stack traces while providing a user-friendly message back to the renderer process.

## JSDoc Additions
Additional JSDoc comments have been added to clarify the return type of `generateDocument()` in the renderer script. Continue documenting all public functions with parameter and return details to aid future maintenance.

## Template Editor Usage
Open the template editor from the As‑Built Documenter tab using the **Open Template Editor** button. Select an existing Markdown template from the dropdown or start with a new file. Use the toolbar to insert Handlebars snippets. Press **Save** to write the template to the `/templates/as-built` directory; you can overwrite the current file or provide a new name.

## Configuration
Configure the plugin in `app-config.json5` under the `plugins` section. Specify a default `templatePath` and one or more `dataSources` with an `id` and `url`. These sources are used by the sample data viewer in the editor and during document generation.

## Functionality

The Template Editor window exposes several controls that read from or write to the application configuration and filesystem.

- **Template File** dropdown (`#template-select`)
  - Lists Markdown files in `templates/as-built` when the editor loads.
  - Selecting a file loads its contents; choosing *Empty* clears the editor.
- **Load…** button (`#load-template-btn`)
  - Opens a file picker to load any `.md` file from disk into the editor.
- **Toolbar** (`#toolbar`)
  - Inserts bold, italic, heading or `{{#each}}` snippets at the cursor.
- **Code Editor** (`#code-editor`)
  - CodeMirror instance for editing the template text.
- **Save** button (`#save-btn`)
  - Writes the template to `templates/as-built`, either overwriting the current file or saving under a new name.
- **Data Source** dropdown (`#data-source-select`)
  - Populated from plugin configuration. Choose a source before loading sample data.
- **Load** button (`#load-sample-btn`)
  - Fetches up to ten rows of sample data for the selected source via IPC.
- **Sample Data Table** (`#sample-table`)
  - Shows fetched rows. Clicking a column header copies a `{{#each}}` loop; clicking a cell copies the field name.
- **Prev/Next** buttons
  - Page through sample rows ten at a time.
- **Configuration Editor** (`#config-textarea`)
  - Displays the plugin configuration as JSON. The content is validated when saved.
- **Save Config** button (`#save-config-btn`)
  - Persists changes using `configAPI.savePluginConfig` and refreshes the data source list.
- **Add Data Source** button (`#add-source-btn`)
  - Prompts for an ID and URL, appends the new source to the configuration and saves it immediately.
