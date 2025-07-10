# Plan: Omnia Core Enhancement & Script Runner Refactor

**Document Version:** 1.0
**Date:** 2025-07-08

## 1. Executive Summary & Goal

The primary goal is to upgrade the Omnia Script Runner plugin to achieve full feature parity with the ttCommander Script Runner plugin. This will be accomplished not by adding complex logic to the plugin itself, but by enhancing the core Omnia application to provide the necessary APIs and UI capabilities. This approach ensures that Omnia becomes a more powerful and scalable platform, and that future plugins can be developed more rapidly.

The project is divided into two main phases:
1.  **Phase 1: Enhance the Omnia Core Application.** Implement foundational APIs and UI components.
2.  **Phase 2: Refactor the Script Runner Plugin.** Simplify the plugin to leverage the new core functionalities.

## 2. Guiding Principles

-   **Core Responsibility:** The core Omnia application should be responsible for common, complex tasks like file system access, script execution, and configuration management.
-   **Plugin Simplicity:** Plugins should be as simple as possible, focusing on their unique UI and business logic, while relying on the core for heavy lifting.
-   **Centralized Settings:** Plugin configuration should be handled by a central, dynamic settings UI within Omnia, driven by schemas provided by the plugins.

---

## 3. Phase 1: Enhance Omnia Core Application

This phase focuses on adding new capabilities to the Omnia source code located in `C:\Users\byron\Documents\Projects\Byron\Omnia\src`.

### 3.1. Core API Implementation

**Objective:** Create a secure API bridge between the main process (Node.js) and the renderer process (UI) for plugins to use.

**Task 3.1.1: Create the Scripting Service**
*   **Action:** Create a new file at `src/core/script-execution.ts`.
*   **Details:** This file will export an `async` function named `executeScript`.
    *   It will accept `scriptPath` (string), `parameters` (object), and `elevated` (boolean) as arguments.
    *   It will use the Node.js `child_process.spawn` module for standard execution.
    *   For elevated execution (`elevated: true`), it will use the `sudo-prompt` library to securely request administrator privileges from the operating system.
    *   It will return a Promise that resolves to an object containing `{ success, stdout, stderr, exitCode }`.

**Task 3.1.2: Create the Configuration Service**
*   **Action:** Modify the existing file at `src/core/config.ts`.
*   **Details:** Add two new exported functions:
    *   `getPluginConfig(pluginId)`: This function will read the application's main configuration file, find the configuration object for the given `pluginId`, and return it.
    *   `savePluginConfig(pluginId, pluginConfig)`: This function will read the entire configuration file, find and replace the section for the given `pluginId` with the new `pluginConfig` object, and then write the entire, updated configuration back to the disk. This atomic operation prevents data loss.

**Task 3.1.3: Expose Services via IPC (Inter-Process Communication)**
*   **Action:** Modify `src/electron-main.ts` and `src/preload.js`.
*   **Details:**
    1.  In `electron-main.ts`, within the `setupIpcHandlers` function, add three new `ipcMain.handle` listeners:
        *   `"script-execute"`: This handler will call the `executeScript` function from the new scripting service.
        *   `"config-get-plugin"`: This handler will call the `getPluginConfig` function.
        *   `"config-save-plugin"`: This handler will call the `savePluginConfig` function.
    2.  In `preload.js`, add the corresponding functions to the `electronAPI` object that is exposed to the `window`. This will make `window.electronAPI.executeScript`, `window.electronAPI.getPluginConfig`, and `window.electronAPI.savePluginConfig` available to all plugins in the renderer process.

### 3.2. Dynamic Settings UI Enhancement

**Objective:** Upgrade the central settings UI to natively handle the editing of complex arrays of objects, as required by the Script Runner plugin.

**Task 3.2.1: Target the `SchemaForm` Component**
*   **Action:** The primary work will be done in the file `src/ui/components/SchemaForm/SchemaForm.tsx`.
*   **Context:** This component already uses a `schema-introspection.ts` utility to convert a Zod schema into a form. The introspection utility correctly identifies a `z.array(z.object(...))` and assigns it the type `object-array`. We will enhance the rendering for this specific type.

**Task 3.2.2: Implement Modal-Based Array Editing**
*   **Action:** Modify the `renderField` function inside `SchemaForm.tsx`.
*   **Details:** For the `case 'object-array':` block:
    1.  The component will render a list of the currently configured items in the array. Instead of showing all fields, it should show a user-friendly summary (e.g., the `name` property of the script configuration).
    2.  Each item in the list will have an "Edit" and a "Remove" button.
    3.  Below the list, an "Add New" button will be rendered.
    4.  A new state variable will be introduced to manage the visibility of a modal dialog.
    5.  Clicking "Add New" or "Edit" will open this modal.
    6.  **Crucially**, the modal will contain a **new, nested instance of the `<SchemaForm />` component**. This nested form will be passed the schema for a *single object* within the array (which the introspection already provides as `field.schema`).
    7.  This recursive use of the `SchemaForm` will automatically generate the correct, detailed form for editing one script configuration.
    8.  When the modal's form is saved, it will update the corresponding item in the main form's state (the array) and close.

---

## 4. Phase 2: Refactor the Script Runner Plugin

Once the Omnia Core is enhanced, the Script Runner plugin can be significantly simplified.

**Task 4.1: API Integration**
*   **Action:** Refactor `plugins/script-runner/index.tsx`.
*   **Details:** Remove any custom-built services for file system or script execution. All such logic will be replaced with calls to the new, global `window.electronAPI` functions.

**Task 4.2: UI/UX Refactoring**
*   **Action:** Update the plugin's main UI component in `plugins/script-runner/index.tsx`.
*   **Details:**
    1.  The UI will fetch both discovered (unconfigured) and configured scripts.
    2.  Configured scripts will be displayed in groups, according to the `group` property in their configuration.
    3.  Each configured script will have "Run" and "Customize..." buttons with the following behavior:
        *   **Run:** Immediately calls `window.electronAPI.executeScript` with the parameters saved in the configuration.
        *   **Customize...:** Opens a temporary modal to allow the user to override parameters for a single execution, without changing the saved defaults.
    4.  The UI will **no longer have its own "Edit" or "Remove" logic**. Instead, it can include a "Manage Configurations" button that navigates the user to the main Omnia Settings page, where the newly enhanced `SchemaForm` will handle all create, edit, and delete operations.

## 5. Expected Outcome

Upon completion of this plan, the Omnia application will possess a robust set of core services and a powerful, schema-driven settings UI capable of handling complex plugin configurations. The Script Runner plugin will be a lean, powerful example of this new architecture, fully matching the functionality of its predecessor while being simpler to maintain.