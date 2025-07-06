{
  /**
   * @file plugins/com.example.as-built-documenter/ui/renderer.js
   * @description UI logic for the As-Built Documenter plugin.
   * This entire script is wrapped in a block scope to prevent global variable conflicts.
   */

  // --- DOM ELEMENTS ---
  const ipAddressInput = document.getElementById("ip-address-input");
  const generateBtn = document.getElementById("generate-doc-btn");
  const templateSelect = document.getElementById("template-select-main");
  const templateTextarea = document.getElementById("template-textarea");
  const sampleSourceSelect = document.getElementById("sample-source-select");
  const loadSampleBtn = document.getElementById("load-sample-btn");
  const sampleTable = document.getElementById("sample-data-table");
  const insertLoopBtn = document.getElementById("insert-loop-btn");
  const saveTemplateBtn = document.getElementById("save-template-btn");
  const saveProjectBtn = document.getElementById("save-project-btn");
  const projectNameInput = document.getElementById("project-name-input");
  const projectDescInput = document.getElementById("project-desc-input");
  const customerNameInput = document.getElementById("customer-name-input");
  const integratorNameInput = document.getElementById("integrator-name-input");
  const customTagsInput = document.getElementById("custom-tags-input");
  const templateSelectSetup = document.getElementById("template-select-setup");
  const outputTextarea = document.getElementById("output-textarea");
  const outputSection = document.querySelector(".output-section");
  const copyBtn = document.getElementById("copy-btn");
  const saveBtn = document.getElementById("save-doc-btn");
  const statusMessageSpan = document.getElementById("status-message");
  const errorSummaryDiv = document.getElementById("error-summary");
  const recentProjectsDiv = document.getElementById("recent-projects");
  const templateListDiv = document.getElementById("template-list");
  const projectSelect = document.getElementById("project-select");
  const templateSelectGenerate = document.getElementById(
    "template-select-generate",
  );
  const detailName = document.getElementById("detail-name");
  const detailDesc = document.getElementById("detail-desc");
  const detailTemplate = document.getElementById("detail-template");
  const detailIntegrator = document.getElementById("detail-integrator");

  let currentProject = null;

  const debouncedUpdateHeight =
    window.domUtils && typeof window.domUtils.debounce === "function"
      ? window.domUtils.debounce(() => {
          window.domUtils.updateTextareaMaxHeight(
            outputSection,
            outputTextarea,
          );
        }, 100)
      : null;
  if (debouncedUpdateHeight && typeof window.addEventListener === "function") {
    window.addEventListener("resize", debouncedUpdateHeight);
    debouncedUpdateHeight();
  }

  const promptUser = (label, value, title) => {
    if (window.domUtils && typeof window.domUtils.showPrompt === "function") {
      return window.domUtils.showPrompt(label, value, title);
    }
    return Promise.resolve(window.prompt(label, value));
  };

  const confirmUser = (message, title) => {
    if (window.domUtils && typeof window.domUtils.showConfirm === "function") {
      return window.domUtils.showConfirm(message, title);
    }
    return Promise.resolve(window.confirm(message));
  };

  /**
   * Determines which plugin page is currently loaded based on the file name.
   *
   * @returns {string} The page name without extension.
   */
  function getCurrentPage() {
    const panel = document.getElementById("plugin-panel");
    const currentSrc = panel?.dataset?.currentSrc;
    let file;
    if (currentSrc) {
      file = currentSrc.split(/[\\/]/).pop();
    } else {
      const loc = typeof window !== "undefined" ? window.location : null;
      file = loc?.pathname ? loc.pathname.split("/").pop() : "";
    }
    return (file || "").replace(/\.html$/, "").toLowerCase();
  }

  /**
   * Validates if the input string is a valid IPv4 address.
   * @param {string} ip - The IP address string to validate.
   * @returns {boolean} - True if valid, false otherwise.
   */
  function isValidIpAddress(ip) {
    const parts = ip.split(".");
    if (parts.length !== 4) return false;
    return parts.every((part) => {
      if (!/^\d{1,3}$/.test(part)) return false;
      const num = Number(part);
      return num >= 0 && num <= 255;
    });
  }

  /**
   * Normalizes an IPv4 address by stripping leading zeros from each octet.
   * @param {string} ip - The IP address to normalize.
   * @returns {string} - Normalized IP address.
   */
  function normalizeIpAddress(ip) {
    return ip
      .split(".")
      .map((part) => String(Number(part)))
      .join(".");
  }

  /**
   * Populates the template dropdown with Markdown files found under
   * templates/as-built.
   */
  async function populateTemplateDropdown(targetSelect) {
    const select = targetSelect || templateSelect;
    if (!select) return;
    try {
      const root = await window.fileSystemAPI.getRootPath();
      const dir = await window.utilityAPI.resolve(
        root,
        "templates",
        "as-built",
      );
      const result = await window.fileSystemAPI.scanDirectory({
        startPath: dir,
      });
      if (result.success && result.data) {
        select.innerHTML = '<option value="__new__">New Template...</option>';
        const files = [];
        (function collect(node) {
          if (!node) return;
          if (node.type === "file" && node.name.toLowerCase().endsWith(".md")) {
            files.push(node);
          } else if (node.children) {
            node.children.forEach(collect);
          }
        })(result.data);
        files.sort((a, b) => a.name.localeCompare(b.name));
        for (const file of files) {
          const opt = document.createElement("option");
          opt.value = file.path;
          opt.textContent = file.name;
          select.appendChild(opt);
        }
      }
    } catch (err) {
      window.logger.log(`[UI-ERROR] Failed to load templates: ${err.message}`);
    }
  }

  /**
   * Loads global data sources from configuration and populates the
   * checkbox list on the setup page.
   */
  async function populateDataSourceList() {
    const list = document.getElementById("data-source-list");
    try {
      const result = await window.configAPI.getConfigAndSchema();
      if (!result.success) throw new Error(result.error);
      const sources =
        result.config.plugins?.["com.as-built-documenter"]?.dataSources || [];
      if (list) {
        list.innerHTML = "";
        for (const src of sources) {
          const label = document.createElement("label");
          const cb = document.createElement("input");
          cb.type = "checkbox";
          cb.value = src.id;
          label.appendChild(cb);
          label.append(` ${src.id}`);
          list.appendChild(label);
        }
      }
      if (sampleSourceSelect) {
        sampleSourceSelect.innerHTML = "";
        for (const src of sources) {
          const opt = document.createElement("option");
          opt.value = src.id;
          opt.textContent = src.id;
          sampleSourceSelect.appendChild(opt);
        }
      }
    } catch (err) {
      window.logger.log(
        `[UI-ERROR] Failed to load data sources: ${err.message}`,
      );
    }
  }

  /**
   * Populates the settings table with configured data sources.
   */
  async function populateDataSourceTable() {
    const table = document.getElementById("data-source-table");
    if (!table) return;
    table.innerHTML = "";
    try {
      const result = await window.configAPI.getConfigAndSchema();
      if (!result.success) throw new Error(result.error);
      const pluginCfg =
        result.config.plugins?.["com.as-built-documenter"] || {};
      const sources = Array.isArray(pluginCfg.dataSources)
        ? pluginCfg.dataSources
        : [];
      const thead = document.createElement("thead");
      thead.innerHTML =
        "<tr><th>ID</th><th>Name</th><th>URL</th><th>Selector</th><th></th></tr>";
      table.appendChild(thead);
      const tbody = document.createElement("tbody");
      for (const src of sources) {
        const tr = document.createElement("tr");
        const idCell = document.createElement("td");
        idCell.textContent = src.id;
        const nameCell = document.createElement("td");
        nameCell.textContent = src.name || "";
        const urlCell = document.createElement("td");
        urlCell.textContent = src.url;
        const selectorCell = document.createElement("td");
        selectorCell.textContent = src.selector || "";
        const actions = document.createElement("td");
        const editBtn = document.createElement("button");
        editBtn.textContent = "Edit";
        editBtn.addEventListener("click", () => editDataSource(src.id));
        const delBtn = document.createElement("button");
        delBtn.textContent = "Delete";
        delBtn.addEventListener("click", () => deleteDataSource(src.id));
        actions.appendChild(editBtn);
        actions.appendChild(delBtn);
        tr.appendChild(idCell);
        tr.appendChild(nameCell);
        tr.appendChild(urlCell);
        tr.appendChild(selectorCell);
        tr.appendChild(actions);
        tbody.appendChild(tr);
      }
      table.appendChild(tbody);
    } catch (err) {
      window.logger.log(
        `[UI-ERROR] Failed to load data sources: ${err.message}`,
      );
    }
  }

  async function savePluginConfig(cfg) {
    return window.configAPI.savePluginConfig("com.as-built-documenter", cfg);
  }

  async function addDataSource() {
    const id = await promptUser("Data Source ID", "", "Add Data Source");
    if (!id) return;
    const name = await promptUser("Name", id, "Add Data Source");
    if (name === null) return;
    const description = await promptUser("Description", "", "Add Data Source");
    if (description === null) return;
    const url = await promptUser("URL", "", "Add Data Source");
    if (!url) return;
    const selector = await promptUser(
      "CSS Selector (optional)",
      "",
      "Add Data Source",
    );
    const result = await window.configAPI.getConfigAndSchema();
    if (!result.success) return;
    const cfg = result.config;
    const pluginCfg = cfg.plugins?.["com.as-built-documenter"] || {};
    pluginCfg.dataSources = pluginCfg.dataSources || [];
    pluginCfg.dataSources.push({ id, name, description, url, selector });
    cfg.plugins["com.as-built-documenter"] = pluginCfg;
    const saveResult = await savePluginConfig(pluginCfg);
    if (saveResult.success) populateDataSourceTable();
  }

  async function editDataSource(id) {
    const result = await window.configAPI.getConfigAndSchema();
    if (!result.success) return;
    const cfg = result.config;
    const pluginCfg = cfg.plugins?.["com.as-built-documenter"] || {};
    const ds = (pluginCfg.dataSources || []).find((s) => s.id === id);
    if (!ds) return;
    const name = await promptUser("Name", ds.name || id, "Edit Data Source");
    if (name === null) return;
    const description = await promptUser(
      "Description",
      ds.description || "",
      "Edit Data Source",
    );
    if (description === null) return;
    const url = await promptUser("URL", ds.url, "Edit Data Source");
    if (!url) return;
    const selector = await promptUser(
      "CSS Selector (optional)",
      ds.selector || "",
      "Edit Data Source",
    );
    ds.name = name;
    ds.description = description;
    ds.url = url;
    ds.selector = selector;
    const saveResult = await savePluginConfig(pluginCfg);
    if (saveResult.success) populateDataSourceTable();
  }

  async function deleteDataSource(id) {
    const ok = await confirmUser(
      `Delete data source '${id}'?`,
      "Delete Data Source",
    );
    if (!ok) return;
    const result = await window.configAPI.getConfigAndSchema();
    if (!result.success) return;
    const cfg = result.config;
    const pluginCfg = cfg.plugins?.["com.as-built-documenter"] || {};
    pluginCfg.dataSources = (pluginCfg.dataSources || []).filter(
      (s) => s.id !== id,
    );
    cfg.plugins["com.as-built-documenter"] = pluginCfg;
    const saveResult = await savePluginConfig(pluginCfg);
    if (saveResult.success) populateDataSourceTable();
  }

  async function populateTemplatePathInput() {
    const input = document.getElementById("template-path-input");
    if (!input) return;
    const result = await window.configAPI.getConfigAndSchema();
    if (!result.success) return;
    const pluginCfg = result.config.plugins?.["com.as-built-documenter"] || {};
    input.value = pluginCfg.templatePath || "";
  }

  async function saveTemplatePathFromForm() {
    const input = document.getElementById("template-path-input");
    if (!input) return;
    const tpl = input.value.trim();
    const result = await window.configAPI.getConfigAndSchema();
    if (!result.success) return;
    const cfg = result.config;
    const pluginCfg = cfg.plugins?.["com.as-built-documenter"] || {};
    pluginCfg.templatePath = tpl;
    cfg.plugins["com.as-built-documenter"] = pluginCfg;
    await savePluginConfig(pluginCfg);
  }

  async function browseTemplateFile() {
    const input = document.getElementById("template-path-input");
    if (!input || !window.fileSystemAPI) return;
    const file = await window.fileSystemAPI.selectFile({
      filters: [
        { name: "Markdown", extensions: ["md"] },
        { name: "All Files", extensions: ["*"] },
      ],
    });
    if (file) input.value = file;
  }

  /**
   * Applies a simple IPv4 formatting mask to the given input element.
   * Inserts dots after every octet as the user types numeric characters.
   * Existing dots typed by the user are preserved.
   *
   * @param {HTMLInputElement} input
   */
  function formatIpMask(input) {
    let val = input.value.replace(/[^0-9.]/g, "");
    const parts = val
      .split(".")
      .slice(0, 4)
      .map((p) => p.slice(0, 3));
    if (parts.length < 4) {
      const last = parts[parts.length - 1];
      if (last.length === 3 && !val.endsWith(".")) {
        parts.push("");
      }
    }
    input.value = parts.join(".").slice(0, 15);
  }

  /**
   * Handles the UI state during processing.
   * @param {boolean} isGenerating - True to disable controls, false to enable.
   * @param {string} message - The message to display in the status span.
   */
  function setUiState(isGenerating, message) {
    if (generateBtn) generateBtn.disabled = isGenerating;
    if (ipAddressInput) ipAddressInput.disabled = isGenerating;
    if (saveBtn) saveBtn.disabled = isGenerating;
    if (statusMessageSpan) statusMessageSpan.textContent = message;

    if (isGenerating) {
      clearErrorSummary();
    }

    if (isGenerating && statusMessageSpan) {
      statusMessageSpan.style.color = "inherit";
    }
  }

  /** Clears the error summary display. */
  function clearErrorSummary() {
    if (errorSummaryDiv) {
      errorSummaryDiv.textContent = "";
      errorSummaryDiv.style.display = "none";
    }
  }

  /**
   * Navigates to another plugin page by loading the HTML file through
   * {@link window.pluginUILoader}.
   *
   * @param {string} pageFile - Relative HTML file to load (e.g., "setup.html").
   * @returns {Promise<void>} Resolves when the new page content is loaded.
   */
  async function navigateTo(pageFile) {
    if (!window.pluginUILoader) return;
    const panel = document.getElementById("plugin-panel");
    const currentSrc = panel?.dataset.currentSrc;
    if (!panel || !currentSrc) return;
    const target = await window.utilityAPI.resolve(currentSrc, "..", pageFile);
    await window.pluginUILoader.loadPluginContent(panel, target);
  }

  /**
   * Displays a list of failed data sources in the error summary div.
   * @param {{id: string, message: string}[]} failures
   */
  function displayErrorSummary(failures) {
    if (!errorSummaryDiv || !failures.length) return;
    const lines = failures.map((f) => `\u2022 ${f.id}: ${f.message}`);
    errorSummaryDiv.textContent = `Failed data sources:\n${lines.join("\n")}`;
    errorSummaryDiv.style.display = "block";
    errorSummaryDiv.style.color = "var(--tt-palette--danger)";
  }

  /**
   * Requests document generation from the main process and updates the UI with
   * the result.
   *
   * @returns {Promise<void>} Resolves when the generation workflow is complete.
   */
  async function generateDocument(ipOverride, templateOverride, tagsOverride) {
    const ipRaw =
      ipOverride || (ipAddressInput ? ipAddressInput.value.trim() : "");
    const ip = normalizeIpAddress(ipRaw || "127.0.0.1");
    if (ipAddressInput) {
      ipAddressInput.value = ip;
    }
    const templatePath = templateOverride || templateSelect?.value || "";
    if (!isValidIpAddress(ip)) {
      if (statusMessageSpan) {
        statusMessageSpan.textContent =
          "Error: Please enter a valid IP address.";
        statusMessageSpan.style.color = "var(--tt-palette--danger)";
      }
      return;
    }

    setUiState(true, "Generating document...");
    if (outputTextarea) {
      outputTextarea.value = `Fetching data for ${ip}...`;
      window.domUtils.updateTextareaMaxHeight(outputSection, outputTextarea);
    }
    if (copyBtn) copyBtn.disabled = true;
    if (saveBtn) saveBtn.disabled = true;

    let completed = 0;
    /**
     * Updates the generation progress status in the UI.
     *
     * @param {Event} _event - Progress event emitted from the main process.
     * @param {{index: number, total: number, sourceId: string, success: boolean}} info
     *   - Progress information for the currently processed data source.
     * @returns {void}
     */
    const progressHandler = (_event, info) => {
      completed = info.index;
      const baseMsg = `(${info.index}/${info.total}) ${info.sourceId}`;
      if (statusMessageSpan) {
        statusMessageSpan.textContent = info.success
          ? `${baseMsg} fetched`
          : `${baseMsg} failed`;
        if (!info.success) {
          statusMessageSpan.style.color = "var(--tt-palette--danger)";
        }
      }
    };
    window.electronAPI.on("as-built-documenter:progress", progressHandler);

    try {
      // Send request to the main process via IPC
      const result = await window.electronAPI.invoke(
        "as-built-documenter:generate",
        { ipAddress: ip, templatePath, tags: tagsOverride || {} },
      );

      if (result.success) {
        if (outputTextarea) {
          outputTextarea.value = result.content;
          window.domUtils.updateTextareaMaxHeight(
            outputSection,
            outputTextarea,
          );
        }
        setUiState(false, "Document generated successfully.");
        if (statusMessageSpan) {
          statusMessageSpan.style.color = "var(--tt-palette--success)";
        }
        if (copyBtn) copyBtn.disabled = false;
        if (saveBtn) saveBtn.disabled = false;
        if (Array.isArray(result.failures) && result.failures.length > 0) {
          displayErrorSummary(result.failures);
        }
      } else {
        throw new Error(
          result.error || "An unknown error occurred in the main process.",
        );
      }
    } catch (error) {
      if (outputTextarea) {
        outputTextarea.value = `Error: ${error.message}`;
        window.domUtils.updateTextareaMaxHeight(outputSection, outputTextarea);
      }
      setUiState(false, "Generation failed.");
      if (statusMessageSpan) {
        statusMessageSpan.style.color = "var(--tt-palette--danger)";
      }
      if (saveBtn) saveBtn.disabled = true;
      clearErrorSummary();
    } finally {
      window.electronAPI.removeListener(
        "as-built-documenter:progress",
        progressHandler,
      );
    }
  }

  /**
   * Copies the content of the output textarea to the clipboard.
   *
   * @returns {void}
   */
  function copyToClipboard() {
    if (!outputTextarea || !copyBtn) return;
    window.fileSystemAPI.copyToClipboard(outputTextarea.value);
    copyBtn.textContent = "Copied!";
    setTimeout(() => {
      copyBtn.textContent = "Copy to Clipboard";
    }, 2000);
  }

  function insertAtCursor(el, text) {
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
  }

  function insertVariable(name) {
    insertAtCursor(templateTextarea, `{{${name}}}`);
  }

  function insertLoop() {
    const id = sampleSourceSelect?.value || "items";
    insertAtCursor(templateTextarea, `{{#each ${id}}}\n{{/each}}`);
  }

  function insertAtCursor(el, text) {
    if (!el) return;
    const start = el.selectionStart || 0;
    const end = el.selectionEnd || 0;
    el.value = el.value.slice(0, start) + text + el.value.slice(end);
    el.selectionStart = el.selectionEnd = start + text.length;
    el.focus();
  }

  function insertVariable(name) {
    insertAtCursor(templateTextarea, `{{${name}}}`);
  }

  function insertLoop() {
    const id = sampleSourceSelect?.value || "items";
    insertAtCursor(templateTextarea, `{{#each ${id}}}\n{{/each}}`);
  }

  /**
   * Loads the selected template file into the textarea.
   *
   * @param {string} filePath Absolute path to the markdown template.
   * @returns {Promise<void>}
   */
  async function loadTemplateFile(filePath) {
    if (!templateTextarea || !filePath) return;
    try {
      const [res] = await window.fileSystemAPI.readFiles([filePath]);
      if (res && res.content != null) {
        templateTextarea.value = res.content;
        window.domUtils.autoResizeTextarea(templateTextarea);
      }
    } catch (err) {
      window.logger.log(`[UI-ERROR] Failed to load template: ${err.message}`);
    }
  }

  function normalizeRows(data) {
    if (Array.isArray(data)) {
      if (
        data.length === 1 &&
        data[0] &&
        typeof data[0] === "object" &&
        !Array.isArray(data[0])
      ) {
        const values = Object.values(data[0]);
        if (
          values.every((v) => v && typeof v === "object" && !Array.isArray(v))
        ) {
          return values;
        }
      }
      return data;
    }
    if (data && typeof data === "object") {
      const values = Object.values(data);
      if (
        values.every((v) => v && typeof v === "object" && !Array.isArray(v))
      ) {
        return values;
      }
      return [data];
    }
    return [];
  }

  async function loadSampleData() {
    if (!sampleSourceSelect || !sampleSourceSelect.value) return;
    const result = await window.electronAPI.invoke(
      "as-built-documenter:sample-data",
      { sourceId: sampleSourceSelect.value },
    );
    if (result.success) {
      const rows = normalizeRows(result.rows);
      renderSampleTable(rows);
    }
  }

  function renderSampleTable(rows) {
    if (!sampleTable) return;
    sampleTable.innerHTML = "";
    if (!Array.isArray(rows) || rows.length === 0) return;
    const headers = Object.keys(rows[0]).slice(0, 10);
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headers.forEach((h) => {
      const th = document.createElement("th");
      th.textContent = h;
      th.addEventListener("click", () => insertVariable(h));
      headRow.appendChild(th);
    });
    thead.appendChild(headRow);
    sampleTable.appendChild(thead);
    const tbody = document.createElement("tbody");
    rows.forEach((r) => {
      const tr = document.createElement("tr");
      headers.forEach((h) => {
        const td = document.createElement("td");
        td.textContent = r[h];
        td.addEventListener("click", () => insertVariable(h));
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });
    sampleTable.appendChild(tbody);
  }

  async function saveTemplate() {
    if (!templateTextarea) return;
    const content = templateTextarea.value;
    const root = await window.fileSystemAPI.getRootPath();
    const tplDir = await window.utilityAPI.resolve(
      root,
      "templates",
      "as-built",
    );
    let targetPath =
      templateSelect && !templateSelect.value.startsWith("__")
        ? templateSelect.value
        : null;
    if (targetPath) {
      const overwrite = await confirmUser(
        "Overwrite existing template?",
        "Save Template",
      );
      if (!overwrite) {
        const name = await promptUser(
          "File Name",
          "copy.md",
          "Save Template As",
        );
        if (!name) return;
        targetPath = await window.utilityAPI.resolve(
          tplDir,
          name.endsWith(".md") ? name : `${name}.md`,
        );
      }
    } else {
      const name = await promptUser(
        "File Name",
        "untitled.md",
        "Save Template",
      );
      if (!name) return;
      targetPath = await window.utilityAPI.resolve(
        tplDir,
        name.endsWith(".md") ? name : `${name}.md`,
      );
    }
    const result = await window.fileSystemAPI.writeFile(targetPath, content);
    if (result.success) {
      await populateTemplateDropdown(templateSelect);
      await populateTemplateDropdown(templateSelectSetup);
      templateSelect.value = targetPath;
      alert("Template saved.");
      navigateTo("index.html");
    } else {
      alert(`Error saving template: ${result.error}`);
    }
  }

  async function saveProjectConfig() {
    const name = projectNameInput?.value.trim();
    if (!name) {
      alert("Project Name is required");
      if (projectNameInput) {
        projectNameInput.disabled = false;
        projectNameInput.focus();
      }
      return;
    }
    const description = projectDescInput?.value || "";
    const customer = customerNameInput?.value.trim() || "";
    const integrator = integratorNameInput?.value.trim() || "";
    const custom = customTagsInput?.value || "";
    const tags = {};
    if (customer) tags.customerName = customer;
    if (integrator) tags.integratorName = integrator;
    custom.split(/\n+/).forEach((line) => {
      const [k, v] = line.split("=");
      if (k && v) tags[k.trim()] = v.trim();
    });
    const ip = normalizeIpAddress(ipAddressInput?.value.trim() || "127.0.0.1");
    const tpl = templateSelectSetup?.value || "";
    const srcIds = Array.from(
      document.querySelectorAll(
        '#data-source-list input[type="checkbox"]:checked',
      ),
    ).map((cb) => cb.value);
    try {
      const root = await window.fileSystemAPI.getRootPath();
      const projectsDir = await window.utilityAPI.resolve(
        root,
        "projects",
        "as-built",
      );
      const safeName = name.replace(/[^a-z0-9_-]/gi, "_");
      const filePath = await window.utilityAPI.resolve(
        projectsDir,
        `${safeName}.json5`,
      );
      const content = JSON.stringify(
        {
          name,
          description,
          ipAddress: ip,
          templatePath: tpl,
          dataSources: srcIds,
          tags,
        },
        null,
        2,
      );
      const res = await window.fileSystemAPI.writeFile(filePath, content);
      if (!res.success) throw new Error(res.error);
      navigateTo("index.html");
    } catch (err) {
      alert(`Failed to save project: ${err.message}`);
    }
  }

  async function readProjectFile(filePath) {
    const [res] = await window.fileSystemAPI.readFiles([filePath]);
    if (res.error) throw new Error(res.error);

    return JSON.parse(res.content);
  }

  async function populateSetupForm(project) {
    if (!project) return;
    if (projectNameInput) projectNameInput.value = project.name || "";
    if (projectDescInput) projectDescInput.value = project.description || "";
    if (customerNameInput)
      customerNameInput.value = project.tags?.customerName || "";
    if (integratorNameInput)
      integratorNameInput.value = project.tags?.integratorName || "";
    if (customTagsInput) {
      const extras = Object.entries(project.tags || {})
        .filter(([k]) => k !== "customerName" && k !== "integratorName")
        .map(([k, v]) => `${k}=${v}`)
        .join("\n");
      customTagsInput.value = extras;
    }
    if (ipAddressInput) ipAddressInput.value = project.ipAddress || "";
    if (templateSelectSetup) {
      await populateTemplateDropdown(templateSelectSetup);
      templateSelectSetup.value = project.templatePath || "";
    }
    await populateDataSourceList();
    if (Array.isArray(project.dataSources)) {
      project.dataSources.forEach((id) => {
        const cb = document.querySelector(
          `#data-source-list input[type="checkbox"][value="${id}"]`,
        );
        if (cb) cb.checked = true;
      });
    }
  }

  async function startGenerateFromSetup() {
    const name = projectNameInput?.value.trim() || "";
    if (!name) {
      alert("Project Name is required");
      if (projectNameInput) {
        projectNameInput.disabled = false;
        projectNameInput.focus();
      }
      return;
    }
    const description = projectDescInput?.value || "";
    const customer = customerNameInput?.value.trim() || "";
    const integrator = integratorNameInput?.value.trim() || "";
    const custom = customTagsInput?.value || "";
    const tags = {};
    if (customer) tags.customerName = customer;
    if (integrator) tags.integratorName = integrator;
    custom.split(/\n+/).forEach((line) => {
      const [k, v] = line.split("=");
      if (k && v) tags[k.trim()] = v.trim();
    });
    const ip = normalizeIpAddress(ipAddressInput?.value.trim() || "127.0.0.1");
    const tpl = templateSelectSetup?.value || "";
    const srcIds = Array.from(
      document.querySelectorAll(
        '#data-source-list input[type="checkbox"]:checked',
      ),
    ).map((cb) => cb.value);
    if (typeof sessionStorage !== "undefined") {
      sessionStorage.setItem(
        "asBuiltTempProject",
        JSON.stringify({
          name,
          description,
          ipAddress: ip,
          templatePath: tpl,
          dataSources: srcIds,
          tags,
        }),
      );
    }
    await navigateTo("generate.html");
  }

  async function renderRecentProjects() {
    if (!recentProjectsDiv) return;
    recentProjectsDiv.innerHTML = "";
    try {
      const root = await window.fileSystemAPI.getRootPath();
      const dir = await window.utilityAPI.resolve(root, "projects", "as-built");
      const result = await window.fileSystemAPI.scanDirectory({
        startPath: dir,
      });
      if (!result.success || !result.data) return;
      const files = [];
      (function collect(node) {
        if (!node) return;
        if (
          node.type === "file" &&
          node.name.toLowerCase().endsWith(".json5")
        ) {
          files.push(node);
        } else if (node.children) {
          node.children.forEach(collect);
        }
      })(result.data);
      files.sort((a, b) => a.name.localeCompare(b.name));
      for (const file of files) {
        const data = (await readProjectFile(file.path).catch(() => null)) || {};
        const item = document.createElement("div");
        item.className = "recent-item";
        const info = document.createElement("div");
        const title = document.createElement("p");
        title.className = "title";
        title.textContent = data.name || file.name.replace(/\.json5$/, "");
        const sub = document.createElement("p");
        sub.className = "subtitle";
        sub.textContent = data.description || "";
        info.appendChild(title);
        info.appendChild(sub);
        const actions = document.createElement("div");
        actions.className = "recent-buttons";
        const edit = document.createElement("button");
        edit.className = "btn-outline";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("asBuiltProjectPath", file.path);
          }
          navigateTo("setup.html");
        });
        const gen = document.createElement("button");
        gen.className = "btn";
        gen.textContent = "Generate";
        gen.addEventListener("click", () => {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("asBuiltProjectPath", file.path);
          }
          navigateTo("generate.html");
        });
        const del = document.createElement("button");
        del.className = "btn-danger";
        del.textContent = "Delete";
        del.addEventListener("click", async () => {
          const confirm = await confirmUser(
            "Delete this project?",
            "Delete Project",
          );
          if (!confirm) return;
          const result = await window.fileSystemAPI.deleteFile(file.path);
          if (result.success) {
            item.remove();
          } else {
            window.logger.log(
              `[UI-ERROR] Failed to delete project: ${result.error}`,
            );
          }
        });
        actions.appendChild(edit);
        actions.appendChild(gen);
        actions.appendChild(del);
        item.appendChild(info);
        item.appendChild(actions);
        recentProjectsDiv.appendChild(item);
      }
    } catch (err) {
      window.logger.log(`[UI-ERROR] Failed to load projects: ${err.message}`);
    }
  }

  async function renderTemplateList() {
    if (!templateListDiv) return;
    templateListDiv.innerHTML = "";
    try {
      const root = await window.fileSystemAPI.getRootPath();
      const dir = await window.utilityAPI.resolve(
        root,
        "templates",
        "as-built",
      );
      const result = await window.fileSystemAPI.scanDirectory({
        startPath: dir,
      });
      if (!result.success || !result.data) return;
      const files = [];
      (function collect(node) {
        if (!node) return;
        if (node.type === "file" && node.name.toLowerCase().endsWith(".md")) {
          files.push(node);
        } else if (node.children) {
          node.children.forEach(collect);
        }
      })(result.data);
      files.sort((a, b) => a.name.localeCompare(b.name));
      for (const file of files) {
        const stat = await window.fileSystemAPI.stat(file.path);
        const date = stat.success
          ? new Date(stat.stats.mtimeMs).toLocaleDateString()
          : "";
        const item = document.createElement("div");
        item.className = "recent-item";
        const info = document.createElement("div");
        const title = document.createElement("p");
        title.className = "title";
        title.textContent = file.name;
        const sub = document.createElement("p");
        sub.className = "subtitle";
        sub.textContent = date;
        info.appendChild(title);
        info.appendChild(sub);
        const actions = document.createElement("div");
        actions.className = "recent-buttons";
        const edit = document.createElement("button");
        edit.className = "btn-outline";
        edit.textContent = "Edit";
        edit.addEventListener("click", () => {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("asBuiltTemplatePath", file.path);
          }
          navigateTo("template.html");
        });
        const copy = document.createElement("button");
        copy.className = "btn-outline";
        copy.textContent = "Copy";
        copy.addEventListener("click", () => {
          if (typeof sessionStorage !== "undefined") {
            sessionStorage.setItem("asBuiltTemplateCopyPath", file.path);
          }
          navigateTo("template.html");
        });
        const del = document.createElement("button");
        del.className = "btn-danger";
        del.textContent = "Delete";
        del.addEventListener("click", async () => {
          const ok = await confirmUser(
            "Delete this template?",
            "Delete Template",
          );
          if (!ok) return;
          const res = await window.fileSystemAPI.deleteFile(file.path);
          if (res.success) {
            item.remove();
            await populateTemplateDropdown();
          } else {
            window.logger.log(
              `[UI-ERROR] Failed to delete template: ${res.error}`,
            );
          }
        });
        actions.appendChild(edit);
        actions.appendChild(copy);
        actions.appendChild(del);
        item.appendChild(info);
        item.appendChild(actions);
        templateListDiv.appendChild(item);
      }
    } catch (err) {
      window.logger.log(`[UI-ERROR] Failed to load templates: ${err.message}`);
    }
  }

  async function populateProjectSelector() {
    if (!projectSelect) return;
    projectSelect.innerHTML = '<option value="">Select a project</option>';
    try {
      const root = await window.fileSystemAPI.getRootPath();
      const dir = await window.utilityAPI.resolve(root, "projects", "as-built");
      const result = await window.fileSystemAPI.scanDirectory({
        startPath: dir,
      });
      if (!result.success || !result.data) return;
      const files = [];
      (function collect(node) {
        if (!node) return;
        if (
          node.type === "file" &&
          node.name.toLowerCase().endsWith(".json5")
        ) {
          files.push(node);
        } else if (node.children) {
          node.children.forEach(collect);
        }
      })(result.data);
      files.sort((a, b) => a.name.localeCompare(b.name));
      for (const file of files) {
        const data = (await readProjectFile(file.path).catch(() => null)) || {};
        const opt = document.createElement("option");
        opt.value = file.path;
        opt.textContent = data.name || file.name.replace(/\.json5$/, "");
        projectSelect.appendChild(opt);
      }
    } catch (err) {
      window.logger.log(`[UI-ERROR] Failed to load projects: ${err.message}`);
    }
  }

  function updateProjectDetails(project) {
    currentProject = project || null;
    if (!project) {
      if (detailName) detailName.textContent = "";
      if (detailDesc) detailDesc.textContent = "";
      if (detailTemplate) detailTemplate.textContent = "";
      if (detailIntegrator) detailIntegrator.textContent = "";
      if (templateSelectGenerate) templateSelectGenerate.value = "";
      return;
    }
    if (detailName) detailName.textContent = project.name || "";
    if (detailDesc) detailDesc.textContent = project.description || "";
    if (detailTemplate) detailTemplate.textContent = project.templatePath || "";
    if (detailIntegrator)
      detailIntegrator.textContent = project.tags?.integratorName || "";
    if (templateSelectGenerate)
      templateSelectGenerate.value = project.templatePath || "";
  }

  /**
   * Saves the generated document to a user-selected location.
   *
   * @returns {Promise<void>} Resolves when the save action completes.
   */
  async function saveDocument() {
    if (!outputTextarea || !statusMessageSpan) return;
    const content = outputTextarea.value;
    if (!content.trim()) {
      statusMessageSpan.textContent = "Nothing to save.";
      statusMessageSpan.style.color = "var(--tt-palette--danger)";
      return;
    }

    try {
      const folder = await window.fileSystemAPI.selectFolder();
      if (!folder) {
        statusMessageSpan.textContent = "Save cancelled.";
        statusMessageSpan.style.color = "inherit";
        return;
      }
      const fileName = await promptUser(
        "File Name",
        "document.md",
        "Save Document",
      );
      if (!fileName) {
        statusMessageSpan.textContent = "Save cancelled.";
        statusMessageSpan.style.color = "inherit";
        return;
      }
      const finalName = fileName.endsWith(".md") ? fileName : `${fileName}.md`;
      const filePath = await window.utilityAPI.resolve(folder, finalName);
      const result = await window.fileSystemAPI.writeFile(filePath, content);
      if (result.success) {
        statusMessageSpan.textContent = "Document saved.";
        statusMessageSpan.style.color = "var(--tt-palette--success)";
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      if (statusMessageSpan) {
        statusMessageSpan.textContent = `Save failed: ${error.message}`;
        statusMessageSpan.style.color = "var(--tt-palette--danger)";
      }
    }
  }

  /**
   *   Wires up UI event listeners and performs one-time initialization.
   *
   * @returns {void}
   */
  function initialize() {
    const page = getCurrentPage();

    const allPages = !page;

    const backToTopBtn = document.getElementById("back-to-top");
    if (backToTopBtn) {
      const toggleBackToTop = () => {
        if (
          document.documentElement.scrollHeight > window.innerHeight &&
          window.scrollY > 50
        ) {
          backToTopBtn.style.display = "flex";
        } else {
          backToTopBtn.style.display = "none";
        }
      };
      backToTopBtn.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
      window.addEventListener("scroll", toggleBackToTop);
      window.addEventListener("resize", toggleBackToTop);
      toggleBackToTop();
    }

    const links =
      typeof document.querySelectorAll === "function"
        ? document.querySelectorAll('a[href$=".html"]')
        : [];
    links.forEach((link) => {
      const href = link.getAttribute("href") || "";
      if (href.startsWith("http") || href.startsWith("file:")) return;
      link.addEventListener("click", (e) => {
        e.preventDefault();
        navigateTo(href);
      });
    });

    const settingBtns =
      typeof document.querySelectorAll === "function"
        ? document.querySelectorAll(".settings-button")
        : [];
    settingBtns.forEach((btn) => {
      btn.addEventListener("click", () => navigateTo("settings.html"));
    });

    if (page === "generate" || allPages) {
      if (generateBtn) {
        generateBtn.addEventListener("click", () => {
          if (!currentProject) {
            if (typeof window.alert === "function") {
              window.alert("Please select a project");
            }
            return;
          }
          const tpl =
            (templateSelectGenerate && templateSelectGenerate.value) ||
            currentProject.templatePath;
          generateDocument(currentProject.ipAddress, tpl, currentProject.tags);
        });
      }
      if (copyBtn) copyBtn.addEventListener("click", copyToClipboard);
      if (saveBtn) saveBtn.addEventListener("click", saveDocument);
      if (projectSelect) {
        projectSelect.addEventListener("change", async () => {
          const val = projectSelect.value;
          if (!val || val === "__temp__") {
            updateProjectDetails(currentProject);
            return;
          }
          const proj = await readProjectFile(val).catch(() => null);
          if (proj) {
            updateProjectDetails(proj);
          } else {
            updateProjectDetails(null);
          }
        });
      }
      (async () => {
        if (templateSelectGenerate) {
          await populateTemplateDropdown(templateSelectGenerate);
        }
        await populateProjectSelector();
        if (typeof sessionStorage === "undefined") return;
        const path = sessionStorage.getItem("asBuiltProjectPath");
        if (path) {
          const project = await readProjectFile(path).catch(() => null);
          sessionStorage.removeItem("asBuiltProjectPath");
          if (project) {
            if (projectSelect) projectSelect.value = path;
            updateProjectDetails(project);
          }
        } else {
          const tmp = sessionStorage.getItem("asBuiltTempProject");
          if (tmp) {
            sessionStorage.removeItem("asBuiltTempProject");
            const project = JSON.parse(tmp);
            if (projectSelect) {
              const opt = document.createElement("option");
              opt.value = "__temp__";
              opt.textContent = "(Unsaved Project)";
              projectSelect.prepend(opt);
              projectSelect.value = "__temp__";
              projectSelect.disabled = true;
            }
            updateProjectDetails(project);
          }
        }
      })();
    }

    if (page === "template" || allPages) {
      if (templateSelect) {
        (async () => {
          await populateTemplateDropdown();
          if (typeof sessionStorage !== "undefined") {
            const path = sessionStorage.getItem("asBuiltTemplatePath");
            if (path) {
              sessionStorage.removeItem("asBuiltTemplatePath");
              templateSelect.value = path;
              await loadTemplateFile(path);
            } else {
              const copyPath = sessionStorage.getItem(
                "asBuiltTemplateCopyPath",
              );
              if (copyPath) {
                sessionStorage.removeItem("asBuiltTemplateCopyPath");
                templateSelect.value = "__new__";
                await loadTemplateFile(copyPath);
              }
            }
          }
          if (typeof templateSelect.addEventListener === "function") {
            templateSelect.addEventListener("change", async () => {
              if (templateSelect.value === "__new__") {
                templateTextarea.value = "";
                window.domUtils.autoResizeTextarea(templateTextarea);
              } else {
                await loadTemplateFile(templateSelect.value);
              }
            });
          }
        })();
      }
      if (saveTemplateBtn)
        saveTemplateBtn.addEventListener("click", saveTemplate);
      if (loadSampleBtn)
        loadSampleBtn.addEventListener("click", loadSampleData);
      if (insertLoopBtn) insertLoopBtn.addEventListener("click", insertLoop);
      const varButtons = document.getElementById("variable-buttons");
      if (varButtons) {
        varButtons.addEventListener("click", (e) => {
          const btn = e.target.closest("button[data-var]");
          if (btn) {
            e.preventDefault();
            insertVariable(btn.dataset.var);
          }
        });
      }
      if (sampleSourceSelect) populateDataSourceList();
    }

    if (page === "setup" || allPages) {
      if (ipAddressInput) {
        ipAddressInput.addEventListener("input", () => {
          formatIpMask(ipAddressInput);
          const normalized = normalizeIpAddress(ipAddressInput.value.trim());
          if (isValidIpAddress(normalized)) {
            ipAddressInput.style.borderColor = "var(--tt-palette--success)";
          } else {
            ipAddressInput.style.borderColor = "var(--tt-palette--danger)";
          }
        });
      }
      if (templateSelectSetup) populateTemplateDropdown(templateSelectSetup);
      populateDataSourceList();
      if (saveProjectBtn)
        saveProjectBtn.addEventListener("click", saveProjectConfig);
      (async () => {
        if (typeof sessionStorage === "undefined") return;
        const path = sessionStorage.getItem("asBuiltProjectPath");
        if (path) {
          const project = await readProjectFile(path).catch(() => null);
          sessionStorage.removeItem("asBuiltProjectPath");
          if (project) populateSetupForm(project);
        }
      })();
    }

    if (page === "settings" || allPages) {
      populateDataSourceTable();
      populateTemplatePathInput();
      const addBtn = document.getElementById("add-source-btn");
      if (addBtn) addBtn.addEventListener("click", addDataSource);
      const saveTplBtn = document.getElementById("save-template-path-btn");
      if (saveTplBtn)
        saveTplBtn.addEventListener("click", saveTemplatePathFromForm);
      const browseTplBtn = document.getElementById("browse-template-btn");
      if (browseTplBtn)
        browseTplBtn.addEventListener("click", browseTemplateFile);
    }

    if (page === "index" || allPages) {
      renderRecentProjects();
      renderTemplateList();
    }

    window.logger.log(
      `[UI-INFO] As-Built Documenter UI initialized (${page}).`,
    );
  }

  // --- SCRIPT EXECUTION STARTS HERE ---
  // This script is injected, so we call initialize directly.
  initialize();
}
