# Context Generator Plugin Conversion Plan for Omnia

## Executive Summary & Goal

This document outlines the detailed plan for converting the `context-generator` plugin from the `Node-ttCommander` project to be fully compatible and integrated with the `Omnia` application. The primary goal is to achieve feature parity with the `Node-ttCommander` version, modernize its UI using React components, and standardize its API interactions with Omnia's core services (`window.fileSystemAPI`, `window.configAPI`).

## Guiding Principles/Core Architectural Changes

1.  **Configuration Centralization:** All plugin settings and user preferences will be managed through Omnia's configuration system, leveraging Zod schemas for validation and persistence.
2.  **API Standardization:** Direct Node.js module imports (`fs/promises`, `path`) for file system operations will be replaced with Omnia's `window.fileSystemAPI` and `window.configAPI` for consistent and secure inter-process communication.
3.  **React-based UI:** The user interface will be fully refactored into React components, utilizing Omnia's existing UI component library where applicable, to ensure a modern and cohesive user experience.
4.  **Feature Parity:** All functionalities present in the `Node-ttCommander` version (e.g., filter presets, file tree search) will be reimplemented in the Omnia version.

## Phases & Objectives

### Phase 1: Configuration Schema Alignment

*   **Objective:** To update `Omnia/plugins/context-generator/config-schema.js` to include all relevant configuration properties from `Node-ttCommander/plugins/context-generator/config.schema.json5`, ensuring correct Zod types, default values, and descriptions.

### Phase 2: API Migration in `index.tsx`

*   **Objective:** To replace all direct Node.js file system and path module usage within `Omnia/plugins/context-generator/index.tsx` with calls to `window.fileSystemAPI` and `window.configAPI`.

### Phase 3: UI Feature Implementation in `index.tsx`

*   **Objective:** To reimplement all missing UI features and functionalities from the `Node-ttCommander` version into the React-based `Omnia/plugins/context-generator/index.tsx`.

### Phase 4: Testing & Verification

*   **Objective:** To thoroughly test all implemented features within the Omnia environment to ensure correct functionality, data persistence, and API interactions.

## Detailed Tasks

### Phase 1: Configuration Schema Alignment

*   **Affected File:** `C:/Users/byron/Documents/Projects/Byron/Omnia/plugins/context-generator/config-schema.js`
*   **Conceptual Changes:**
    *   Add `title` and `description` properties to the `ContextGeneratorConfigSchema` object, mirroring the `Node-ttCommander`'s `plugin.json5` and `config.schema.json5`.
    *   Ensure the `enabled` property is correctly defined with a default of `true`.
    *   Adjust the `lastFileRegex` and `lastFolderRegex` default values to empty strings, as per `Node-ttCommander`'s `config.schema.json5`.
    *   Adjust the `lastFileFilterType` and `lastFolderFilterType` default values to `include`, as per `Node-ttCommander`'s `config.schema.json5`.
    *   Verify that `lastMaxDepth` is correctly defined as an integer with a default of `-1`.
    *   Ensure the `savedFilters` property is a `z.record(SavedFilterSchema)` with a default empty object, and that `SavedFilterSchema` accurately reflects the structure of saved filters (folderRegex, folderFilterType, fileRegex, fileFilterType, maxDepth). Remove the `name` and `description` fields from `SavedFilterSchema` as they are not present in the `Node-ttCommander`'s `config.schema.json5` for saved filters.

### Phase 2: API Migration in `index.tsx`

*   **Affected File:** `C:/Users/byron/Documents/Projects/Byron/Omnia/plugins/context-generator/index.tsx`
*   **Conceptual Changes:**
    *   Remove `loadNodeModule` imports for `fs/promises` and `path`.
    *   Replace `fs.readdir`, `fs.stat`, `fs.readFile` with `window.fileSystemAPI.scanDirectory` and `window.fileSystemAPI.readFiles`.
    *   Replace `path.join`, `path.basename`, `path.extname`, `path.relative` with `window.utilityAPI` functions (e.g., `window.utilityAPI.joinPosix`, `window.utilityAPI.basename`, `window.utilityAPI.relative`).
    *   Replace `process.cwd()` with `window.fileSystemAPI.getRootPath()`.
    *   Replace `prompt('Enter directory path:')` with `window.fileSystemAPI.selectFolder()`.
    *   Replace `navigator.clipboard.writeText(output)` with `window.fileSystemAPI.copyToClipboard(output)`.
    *   Integrate `window.configAPI.getConfigAndSchema()` for initial configuration loading.
    *   Integrate `window.configAPI.savePluginConfig(pluginId, pluginConfig)` for persisting plugin settings (last used path, filter settings, saved presets).

### Phase 3: UI Feature Implementation in `index.tsx`

*   **Affected File:** `C:/Users/byron/Documents/Projects/Byron/Omnia/plugins/context-generator/index.tsx`
*   **Conceptual Changes:**
    *   **File Tree Rendering:**
        *   Refactor `renderFileTreeNode` to accurately reflect the `Node-ttCommander`'s file tree structure, including folder toggles (`+`/`-`), checkboxes for both files and folders, and proper indentation.
        *   Implement the logic for `handleFolderToggle` to expand/collapse folders and `handleFileToggle` to manage selected files.
        *   Implement the `updateParentCheckboxes` logic to correctly set the checked/indeterminate state of parent folder checkboxes based on their children's selection.
        *   Ensure the `selectedFiles` state accurately reflects the checked items.
    *   **Filter Presets:**
        *   Implement the UI for saving, loading, and deleting custom filter presets.
        *   Manage the `customPresets` state and persist it via `window.configAPI`.
        *   Implement `applyPreset` to populate filter inputs when a preset is selected.
        *   Implement `saveCustomFilter` and `deleteCustomFilter` to manage presets in the configuration.
    *   **File Tree Search:**
        *   Implement the `performSearch` function to filter the displayed file tree based on the `searchTerm`.
        *   Add a visual indication for search matches.
    *   **Progress and Character Count:**
        *   Ensure `progress` messages are displayed during scanning and generation.
        *   Update the character count of the generated output.
    *   **Styling:**
        *   Apply appropriate CSS classes or inline styles to match the visual appearance of the `Node-ttCommander` UI, leveraging Omnia's existing UI components (`Button`, `Input`) and design system.
        *   Ensure responsiveness and accessibility.

### Phase 4: Testing & Verification

*   **Affected Files:** `C:/Users/byron/Documents/Projects/Byron/Omnia/plugins/context-generator/index.tsx`, `C:/Users/byron/Documents/Projects/Byron/Omnia/plugins/context-generator/config-schema.js`
*   **Conceptual Changes:**
    *   **Manual Testing:**
        *   Verify that the plugin loads correctly within Omnia.
        *   Test directory selection and scanning with various paths.
        *   Test all filter options (file regex, folder regex, max depth, include/exclude modes).
        *   Verify that the file tree renders correctly, and folder toggles work as expected.
        *   Test file and folder selection using checkboxes, including the tri-state logic for parent folders.
        *   Test context generation for various selections.
        *   Verify copy-to-clipboard functionality.
        *   Test saving, loading, and deleting custom filter presets.
        *   Verify that `lastUsedFolderPath` and other `last*` settings are persisted across application restarts.
        *   Test the file tree search functionality.
    *   **Automated Testing (if applicable):**
        *   Consider adding unit tests for complex logic within `index.tsx` (e.g., filter application, file tree selection logic).

## Prerequisites

*   Omnia application environment set up and running.
*   Node.js and npm/yarn installed for dependency management.

## Expected Outcome/User Experience

Upon successful conversion, the `Context Generator` plugin in Omnia will provide a robust and intuitive interface for scanning directories and generating context from selected files. Users will be able to:

*   Select a root folder for scanning.
*   Apply flexible regex-based filters for files and folders, with include/exclude modes and maximum depth.
*   Save and load custom filter presets for quick access.
*   Interactively select files and folders from a hierarchical tree view.
*   Search within the file tree to quickly locate specific items.
*   Generate a consolidated text output of selected file contents, formatted for easy consumption.
*   Copy the generated context to the clipboard.
*   All user preferences and last-used settings will be automatically persisted.
