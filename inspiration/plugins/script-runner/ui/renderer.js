{
  /**
   * @file plugins/script-runner/ui/renderer.js
   * @description UI logic for the Script Runner plugin.
   */

  // --- STATE ---
  const pluginId = "com.ttcommander.script-runner";
  let pluginConfig = {}; // Will be loaded during initialization
  let pluginSchema = {}; // Schema slice for this plugin

  // --- DOM ELEMENTS ---
  const scriptListContainer = document.getElementById("script-list-container");
  const scriptFilterInput = document.getElementById("script-filter-input");
  const outputPre = document.getElementById("output-pre");
  const clearOutputBtn = document.getElementById("clear-output-btn");
  const copyOutputBtn = document.getElementById("copy-output-btn");

  let allConfiguredScripts = [];
  let allUnconfiguredScripts = [];
  const executionStatus = {}; // { [id]: {status: 'success'|'failure'|'running', time: Date} }

  // --- FUNCTIONS ---

  function formatStatus(s) {
    const icon =
      s.status === "running"
        ? "\u23F3"
        : s.status === "success"
        ? "\u2713"
        : "\u2717";
    return `${icon} ${s.time.toLocaleTimeString()}`;
  }

  function filterAndRenderScripts() {
    const filter = (scriptFilterInput.value || "").toLowerCase();
    const cfg = allConfiguredScripts.filter((s) => {
      return (
        s.name.toLowerCase().includes(filter) ||
        s.id.toLowerCase().includes(filter) ||
        (s.description || "").toLowerCase().includes(filter)
      );
    });
    const unc = allUnconfiguredScripts.filter((s) =>
      s.name.toLowerCase().includes(filter),
    );
    renderScriptLists(cfg, unc);
  }

  function updateStatusDisplay(id) {
    const span = document.querySelector(
      `.script-button-container[data-script-id="${id}"] .execution-status`,
    );
    const status = executionStatus[id];
    if (span && status) {
      span.textContent = formatStatus(status);
      span.dataset.status = status.status;
    } else if (span) {
      span.textContent = "";
      span.removeAttribute("data-status");
    }
  }

  /**
   * Renders both configured and unconfigured script sections with appropriate buttons.
   * @param {object[]} configuredScripts
   * @param {object[]} unconfiguredScripts
   */
  function renderScriptLists(configuredScripts, unconfiguredScripts) {
    scriptListContainer.innerHTML = ""; // Clear previous content

    // --- Render Configured Scripts ---
    if (configuredScripts.length > 0) {
      const groups = configuredScripts.reduce((acc, script) => {
        const groupName = script.group || "General";
        if (!acc[groupName]) acc[groupName] = [];
        acc[groupName].push(script);
        return acc;
      }, {});

      for (const groupName of Object.keys(groups).sort()) {
        const groupDiv = document.createElement("div");
        groupDiv.className = "script-group";
        const groupHeader = document.createElement("h4");
        groupHeader.textContent = groupName;
        groupDiv.appendChild(groupHeader);

        groups[groupName].forEach((script) => {
          const container = document.createElement("div");
          container.className = "script-button-container";
          container.dataset.scriptId = script.id;
          const description = document.createElement("p");
          description.className = "script-description";
          description.textContent = script.name;
          description.title = script.description || script.name;

          const actionsDiv = document.createElement("div");
          actionsDiv.className = "script-actions";

          const runBtn = document.createElement("button");
          runBtn.className = "script-button-run";
          runBtn.textContent = "Run";
          runBtn.dataset.scriptId = script.id;

          const customizeBtn = document.createElement("button");
          customizeBtn.className = "script-button-customize";
          customizeBtn.textContent = "Customize...";
          customizeBtn.dataset.scriptId = script.id;

          const editBtn = document.createElement("button");
          editBtn.className = "script-button-edit";
          editBtn.textContent = "Edit";
          editBtn.dataset.scriptId = script.id;

          const removeBtn = document.createElement("button");
          removeBtn.className = "script-button-remove";
          removeBtn.textContent = "Remove";
          removeBtn.dataset.scriptId = script.id;

          actionsDiv.appendChild(runBtn);
          actionsDiv.appendChild(customizeBtn);
          actionsDiv.appendChild(editBtn);
          actionsDiv.appendChild(removeBtn);
          const statusSpan = document.createElement("span");
          statusSpan.className = "execution-status";
          const status = executionStatus[script.id];
          if (status) {
            statusSpan.textContent = formatStatus(status);
            statusSpan.dataset.status = status.status;
          }
          container.appendChild(description);
          container.appendChild(actionsDiv);
          container.appendChild(statusSpan);
          groupDiv.appendChild(container);
        });
        scriptListContainer.appendChild(groupDiv);
      }
    }

    // --- Render Unconfigured Scripts ---
    if (unconfiguredScripts.length > 0) {
      const groupDiv = document.createElement("div");
      groupDiv.className = "script-group";
      const groupHeader = document.createElement("h4");
      groupHeader.textContent = "Discovered Scripts (Not Configured)";
      groupHeader.style.color = "var(--tt-palette--o50)";
      groupDiv.appendChild(groupHeader);

      unconfiguredScripts.forEach((script) => {
        const container = document.createElement("div");
        container.className = "script-button-container unconfigured";
        const description = document.createElement("p");
        description.className = "script-description";
        description.textContent = `Found: ${script.name}`;
        const configureBtn = document.createElement("button");
        configureBtn.className = "configure-button";
        configureBtn.textContent = "Configure";
        configureBtn.dataset.scriptPath = script.path;
        configureBtn.dataset.scriptName = script.name;
        container.appendChild(description);
        container.appendChild(configureBtn);
        groupDiv.appendChild(container);
      });
      scriptListContainer.appendChild(groupDiv);
    }

    if (configuredScripts.length === 0 && unconfiguredScripts.length === 0) {
      scriptListContainer.innerHTML =
        '<p class="placeholder-text">No scripts configured or found. Add .ps1 files to your scripts folder.</p>';
    }
  }

  /**
   * Creates and displays a modal form to configure a new script.
   * @param {string} scriptPath - The relative path of the script being configured.
   * @param {string} scriptName - The filename of the script.
   */
  function handleConfigureScript(scriptPath, scriptName) {
    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    const suggestedId = scriptName
      .toLowerCase()
      .replace(".ps1", "")
      .replace(/[^a-z0-9]/g, "-");

    modalContent.innerHTML = `
        <h3>Configure New Script</h3>
        <div class="form-grid">
            <label for="config-id">ID:</label>
            <input type="text" id="config-id" value="${suggestedId}">
            <label for="config-name">Display Name:</label>
            <input type="text" id="config-name" value="${scriptName.replace(".ps1", "")}">
            <label for="config-desc">Description:</label>
            <input type="text" id="config-desc" placeholder="Optional description...">
            <label for="config-group">Group:</label>
            <input type="text" id="config-group" placeholder="e.g., Backups, Networking">
            <label for="config-elevated">Run as Admin:</label>
            <input type="checkbox" id="config-elevated">
        </div>
        <div class="modal-actions">
            <button id="config-cancel-btn">Cancel</button>
            <button id="config-save-btn">Save Configuration</button>
        </div>
    `;

    backdrop.appendChild(modalContent);
    document.body.appendChild(backdrop);

    const closeModal = () => document.body.removeChild(backdrop);
    document
      .getElementById("config-cancel-btn")
      .addEventListener("click", closeModal);

    document
      .getElementById("config-save-btn")
      .addEventListener("click", async () => {
        const newConfig = {
          id: document.getElementById("config-id").value.trim(),
          name: document.getElementById("config-name").value.trim(),
          description: document.getElementById("config-desc").value.trim(),
          group: document.getElementById("config-group").value.trim(),
          elevated: document.getElementById("config-elevated").checked,
          scriptPath: scriptPath.replace(/\\/g, "/"),
          defaultShellParameters: {},
        };
        if (!newConfig.id || !newConfig.name)
          return alert("ID and Display Name are required.");
        pluginConfig.scriptConfigurations.push(newConfig);
        const result = await window.configAPI.savePluginConfig(
          pluginId,
          pluginConfig,
        );
        if (result.success) {
          closeModal();
          initialize();
        } else {
          alert(`Error saving configuration: ${result.error}`);
        }
      });
  }

  /**
   * Opens a modal form to edit an existing script configuration.
   * @param {string} scriptId The ID of the configuration to edit.
   */
  function showEditScriptForm(scriptId) {
    const index = pluginConfig.scriptConfigurations.findIndex(
      (c) => c.id === scriptId,
    );
    if (index === -1) return;
    const cfg = pluginConfig.scriptConfigurations[index];

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    modalContent.innerHTML = `
        <h3>Edit Script</h3>
        <div class="form-grid">
            <label for="edit-id">ID:</label>
            <input type="text" id="edit-id" value="${cfg.id}" disabled>
            <label for="edit-name">Display Name:</label>
            <input type="text" id="edit-name" value="${cfg.name}">
            <label for="edit-desc">Description:</label>
            <input type="text" id="edit-desc" value="${cfg.description || ""}">
            <label for="edit-group">Group:</label>
            <input type="text" id="edit-group" value="${cfg.group || ""}">
            <label for="edit-path">Script Path:</label>
            <input type="text" id="edit-path" value="${cfg.scriptPath}">
            <label for="edit-elevated">Run as Admin:</label>
            <input type="checkbox" id="edit-elevated" ${cfg.elevated ? "checked" : ""}>
        </div>
        <div class="modal-actions">
            <button id="edit-cancel-btn">Cancel</button>
            <button id="edit-save-btn">Save Changes</button>
        </div>`;

    backdrop.appendChild(modalContent);
    document.body.appendChild(backdrop);

    const closeModal = () => document.body.removeChild(backdrop);
    document
      .getElementById("edit-cancel-btn")
      .addEventListener("click", closeModal);

    document.getElementById("edit-save-btn").addEventListener("click", async () => {
      cfg.name = document.getElementById("edit-name").value.trim();
      cfg.description = document.getElementById("edit-desc").value.trim();
      cfg.group = document.getElementById("edit-group").value.trim();
      cfg.scriptPath = document.getElementById("edit-path")
        .value.trim()
        .replace(/\\/g, "/");
      cfg.elevated = document.getElementById("edit-elevated").checked;

      pluginConfig.scriptConfigurations[index] = cfg;
      const result = await window.configAPI.savePluginConfig(pluginId, pluginConfig);
      if (result.success) {
        closeModal();
        initialize();
      } else {
        alert(`Error saving configuration: ${result.error}`);
      }
    });
  }

  /**
   * Removes an existing script configuration after confirmation.
   * @param {string} scriptId The ID of the configuration to remove.
   */
  async function handleRemoveScript(scriptId) {
    if (!confirm("Remove this script configuration?")) return;
    const index = pluginConfig.scriptConfigurations.findIndex(
      (c) => c.id === scriptId,
    );
    if (index === -1) return;
    pluginConfig.scriptConfigurations.splice(index, 1);
    const result = await window.configAPI.savePluginConfig(pluginId, pluginConfig);
    if (result.success) {
      initialize();
    } else {
      alert(`Error saving configuration: ${result.error}`);
    }
  }

  /**
   * Opens a modal form to customize parameters before running a script.
   * @param {string} scriptId The ID of the script to customize.
   */
  function showParameterForm(scriptId) {
    const config = (pluginConfig.scriptConfigurations || []).find(
      (c) => c.id === scriptId,
    );
    if (!config)
      return alert(
        `Error: Could not find configuration for script ID "${scriptId}".`,
      );

    const backdrop = document.createElement("div");
    backdrop.className = "modal-backdrop";
    const modalContent = document.createElement("div");
    modalContent.className = "modal-content";

    let formHtml = `<h3>Run Script: ${config.name}</h3><div class="form-grid">`;
    const schemaDefault =
      pluginSchema.properties?.scriptConfigurations?.items?.properties?.parameters
        ?.default || [];
    const definedParams =
      (config.parameters && config.parameters.length > 0)
        ? config.parameters
        : schemaDefault;
    if (definedParams.length === 0)
      formHtml += "<p>This script has no defined parameters.</p>";

    definedParams.forEach((param) => {
      const defaultValue =
        (config.defaultShellParameters || {})[param.name] || param.value || "";
      formHtml += `<label for="param-${param.name}">${param.label || param.name}:</label>
                     <input type="text" id="param-${param.name}" data-param-name="${param.name}" value="${defaultValue}" placeholder="${param.description || ""}">`;
    });

    formHtml += `</div><div class="modal-actions">
        <button id="param-cancel-btn">Cancel</button>
        <button id="param-run-btn">Run with these Parameters</button>
    </div>`;

    modalContent.innerHTML = formHtml;
    backdrop.appendChild(modalContent);
    document.body.appendChild(backdrop);

    const closeModal = () => document.body.removeChild(backdrop);
    document
      .getElementById("param-cancel-btn")
      .addEventListener("click", closeModal);

    document
      .getElementById("param-run-btn")
      .addEventListener("click", async () => {
        const overrides = {};
        definedParams.forEach((param) => {
          const input = document.getElementById(`param-${param.name}`);
          if (input) overrides[param.name] = input.value;
        });

        const index = pluginConfig.scriptConfigurations.findIndex(
          (c) => c.id === scriptId,
        );
        if (index !== -1) {
          pluginConfig.scriptConfigurations[index].defaultShellParameters = {
            ...(pluginConfig.scriptConfigurations[index].defaultShellParameters || {}),
            ...overrides,
          };
          await window.configAPI.savePluginConfig(pluginId, pluginConfig);
        }

        closeModal();
        handleScriptExecution(scriptId, overrides);
      });
  }

  /**
   * Handles the actual execution of a script, with optional parameter overrides.
   * @param {string} scriptId - The ID of the script to execute.
   * @param {Record<string, any>} [parameterOverrides] - Optional parameters to merge with defaults.
   */
  async function handleScriptExecution(scriptId, parameterOverrides = {}) {
    const button = document.querySelector(
      `.script-button-run[data-script-id="${scriptId}"]`,
    );
    if (!button) return;

    const originalText = button.textContent;
    button.disabled = true;
    button.textContent = "Running...";
    executionStatus[scriptId] = { status: "running", time: new Date() };
    updateStatusDisplay(scriptId);
    outputPre.textContent = `[${new Date().toLocaleTimeString()}] Executing script (ID: ${scriptId})...\n\n`;

    try {
      const result = await window.scriptingAPI.executeScriptById(
        scriptId,
        parameterOverrides,
      );
      executionStatus[scriptId] = {
        status: result.success ? "success" : "failure",
        time: new Date(),
      };
      updateStatusDisplay(scriptId);
      outputPre.textContent += `--- Execution Finished ---\nSuccess: ${result.success}\nExit Code: ${result.exitCode}\n\n`;
      if (result.stdout)
        outputPre.textContent += `--- STDOUT ---\n${result.stdout}\n\n`;
      if (result.stderr)
        outputPre.textContent += `--- STDERR ---\n${result.stderr}\n\n`;
    } catch (err) {
      executionStatus[scriptId] = { status: "failure", time: new Date() };
      updateStatusDisplay(scriptId);
      outputPre.textContent += `\nCRITICAL ERROR: ${err.message}`;
    } finally {
      button.disabled = false;
      button.textContent = originalText;
      outputPre.scrollTop = outputPre.scrollHeight;
    }
  }

  /**
   * Clears the output display area.
   */
  function handleClearOutput() {
    outputPre.textContent = "";
  }

  /**
   * Copies the current output text to the system clipboard.
   */
  function handleCopyOutput() {
    window.fileSystemAPI.copyToClipboard(outputPre.textContent);
    if (copyOutputBtn) {
      copyOutputBtn.textContent = "Copied!";
      setTimeout(() => {
        copyOutputBtn.textContent = "Copy Output";
      }, 2000);
    }
  }

  /**
   * Handles click events within the script list container.
   * @param {MouseEvent} event
   */
  function handleScriptListClick(event) {
    const button = event.target.closest("button");
    if (!button) return;
    const scriptId = button.dataset.scriptId;
    if (button.classList.contains("script-button-run") && scriptId) {
      handleScriptExecution(scriptId);
    } else if (
      button.classList.contains("script-button-customize") &&
      scriptId
    ) {
      showParameterForm(scriptId);
    } else if (button.classList.contains("script-button-edit") && scriptId) {
      showEditScriptForm(scriptId);
    } else if (button.classList.contains("script-button-remove") && scriptId) {
      handleRemoveScript(scriptId);
    } else if (button.classList.contains("configure-button")) {
      handleConfigureScript(button.dataset.scriptPath, button.dataset.scriptName);
    }
  }

  /**
   * Initializes the plugin's UI.
   */
  async function initialize() {
    scriptListContainer.removeEventListener("click", handleScriptListClick);
    scriptListContainer.addEventListener("click", handleScriptListClick);

    if (scriptFilterInput) {
      scriptFilterInput.removeEventListener("input", filterAndRenderScripts);
      scriptFilterInput.addEventListener("input", filterAndRenderScripts);
    }

    clearOutputBtn.removeEventListener("click", handleClearOutput);
    clearOutputBtn.addEventListener("click", handleClearOutput);

    copyOutputBtn.removeEventListener("click", handleCopyOutput);
    copyOutputBtn.addEventListener("click", handleCopyOutput);

    try {
      const fullConfigResponse = await window.configAPI.getConfigAndSchema();
      if (!fullConfigResponse.success)
        throw new Error(fullConfigResponse.error);

      pluginConfig = fullConfigResponse.config.plugins?.[pluginId] || {
        scriptConfigurations: [],
        scriptsDirectory: "scripts",
      };
      pluginSchema =
        fullConfigResponse.schema.properties.plugins.properties?.[pluginId] || {};
      if (!pluginConfig.scriptConfigurations)
        pluginConfig.scriptConfigurations = [];

      const allConfigured = pluginConfig.scriptConfigurations;
      const configuredScripts = allConfigured.filter((c) => c.enabled !== false);
      const scriptsDir = pluginConfig.scriptsDirectory || "scripts";
      const appRoot = await window.fileSystemAPI.getRootPath();
      const absoluteScriptsDir = await window.utilityAPI.resolve(
        appRoot,
        scriptsDir,
      );

      const separator = absoluteScriptsDir.includes("/") ? "/" : "\\";
      const baseDirWithSep = absoluteScriptsDir.endsWith(separator)
        ? absoluteScriptsDir
        : absoluteScriptsDir + separator;

      const scanResult = await window.fileSystemAPI.scanDirectory({
        startPath: absoluteScriptsDir,
      });
      const allDiscoveredFiles = [];
      function flattenTree(node) {
        if (!node) return;
        if (node.type === "file" && node.name.toLowerCase().endsWith(".ps1")) {
          const relativePath = node.path
            .replace(baseDirWithSep, "")
            .replace(/\\/g, "/");
          allDiscoveredFiles.push({ name: node.name, path: relativePath });
        }
        if (node.children) node.children.forEach(flattenTree);
      }
      if (scanResult.success) flattenTree(scanResult.data);

      const configuredPaths = new Set(
        allConfigured.map((s) => s.scriptPath),
      );
      const unconfiguredScripts = allDiscoveredFiles.filter(
        (f) => !configuredPaths.has(f.path),
      );

      allConfiguredScripts = configuredScripts;
      allUnconfiguredScripts = unconfiguredScripts;
      filterAndRenderScripts();
    } catch (err) {
      scriptListContainer.innerHTML =
        `<p class="placeholder-text error-text">Error initializing: ${err.message}</p>`;
    }
  }

  // Run initialization logic immediately.
  initialize();
}
