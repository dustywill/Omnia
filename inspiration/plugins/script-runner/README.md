# Script Runner Plugin

The Script Runner plugin discovers and executes PowerShell scripts from a configurable directory. It exposes a simple UI tab where each script can be run, customized with parameters or edited.

## Configuration

Configuration lives under the `plugins.com.ttcommander.script-runner` section of `app-config.json5` and follows `config.schema.json5` in this folder. Important options include:

- **enabled** – Toggles whether the plugin loads on start up.
- **scriptsDirectory** – Folder relative to the application root containing your PowerShell scripts. Defaults to `scripts`.
- **scriptConfigurations** – Array describing each available script. Each entry includes:
  - `id` – Unique identifier used internally.
  - `name` – Friendly name displayed in the UI.
  - `description` – Optional longer description.
  - `group` – Optional category used for grouping buttons.
  - `scriptPath` – Path to the `.ps1` file relative to the scripts directory.
  - `defaultShellParameters` – Parameters passed by default when running the script.
  - `elevated` – If `true`, executes the script with administrator privileges.
  - `parameters` – Definition of custom parameters that can be overridden at runtime.

## Recommended Scripts Layout

Place all scripts under the folder defined by `scriptsDirectory` (by default `scripts/`). Sub‑folders are allowed and script paths in configurations should use forward slashes, for example:

```
workspace/
└─ scripts/
   ├─ backups/
   │  └─ sync-docs.ps1
   └─ cleanup.ps1
```

The corresponding configuration entry would set `scriptPath` to `backups/sync-docs.ps1`.

## Usage

Open the **Script Runner** tab to see all configured scripts. Newly discovered `.ps1` files that are not yet configured appear in their own section with a **Configure** button. Use the filter box to quickly locate a script. Click **Run** to execute a script and view its output. **Customize...** opens a dialog for parameter overrides, while **Edit** and **Remove** modify or delete a configuration. The output area provides **Clear Output** and **Copy Output** actions.

## Functionality

- **Script Filter** – Filters the displayed scripts by ID, name or description and updates the list accordingly.
- **Run** – Executes the selected script using its configuration and default parameters, displaying the output and updating the status indicator.
- **Customize...** – Opens a form to supply parameter overrides. The overrides are saved as new defaults and the script runs with them applied.
- **Edit** – Opens the configuration editor for an existing script and writes changes back to `app-config.json5`.
- **Remove** – Deletes the chosen script configuration from `app-config.json5`.
- **Configure** – Adds a new configuration for an unconfigured script and saves it.
- **Clear Output** – Clears the script output panel.
- **Copy Output** – Copies the contents of the output panel to the clipboard.
- **Status Indicator** – Shows whether the last run succeeded or failed along with the time it finished.

