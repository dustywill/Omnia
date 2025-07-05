# Context Generator Plugin



This plugin scans a folder and bundles the contents of selected files so they can be copied or pasted elsewhere. The interface supports include/exclude regex-based filters, depth limits, quick search and preset management, and you can select entire folders with a single checkbox.


## Configuration

Settings are stored in `config.schema.json5` and persisted in the application's main configuration file. The plugin automatically remembers the last folder that was scanned using the `lastUsedFolderPath` property. This path is updated after each successful generation and saved via the `savePluginConfig` API. You can also store named filter presets under the `savedFilters` property. It also remembers the last regex settings, filter modes, and maximum depth for convenience.

## Usage
1. Click **Select Root Folder** to choose the directory to scan. The previous folder will load the last used path automatically on start.
2. Pick a filter preset or enter regexes and a max depth, then press **Apply Filters** to refresh the tree.
3. Use the search box and checkboxes to choose files or whole folders.
4. Use **Save Filter** to store the current settings or **Delete Filter** to remove a saved preset.
5. Click **Generate Context** to read the files and show the output length above the text area. Progress is shown while reading and the output length appears above the text area.
6. Press **Copy to Clipboard** to copy the generated text.


The plugin keeps folder and button controls keyboard accessible so you can navigate using the keyboard alone.

## Functionality
- **Select Root Folder** – opens a system dialog to choose the base directory and immediately scans it. The chosen path is saved to the plugin configuration.
- **Preset** – dropdown of built-in and saved filters. Selecting a preset fills the regex fields and modes.
- **Filter Name** – name used when saving a custom preset.
- **Folder Regex / Mode** – pattern and include/exclude switch applied to folder names.
- **File Regex / Mode** – pattern and mode applied to filenames.
- **Max Depth** – optional limit for how deep the scan should recurse.
- **Apply Filters** – rescans the directory using the current filter values.
- **Save Filter** – stores the current filter settings under the given name.
- **Delete Filter** – removes the selected custom preset.
- **Search Files** – filters the tree display by matching text.
- **File Tree** – checkboxes for choosing files or entire folders. Folders toggle all descendants.
- **Generate Context** – reads the selected files and assembles an output summary, updating the character count and progress message.
- **Copy to Clipboard** – copies the generated text to the clipboard with a temporary confirmation message.
- **Output Area** – read-only text box that displays the generated result.
- **Progress Message** – Displays status while files are read.
- **Character Count** – Indicates the length of the generated output.

