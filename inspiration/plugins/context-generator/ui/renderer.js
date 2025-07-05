{
  /**
   * @file plugins/context-generator/ui/renderer.js
   * @description UI logic for the Context Generator plugin.
   */

  // --- STATE ---
  let rootPath = null;
  let pluginConfig = {};
  const checkedFilePaths = new Set();
  const pluginId = "com.ttcommander.context-generator";
  const directoryChildrenMap = new Map();
  const expandedFolders = new Set();

  // --- DOM ELEMENTS ---
  const selectFolderBtn = document.getElementById("select-folder-btn");
  const selectedFolderPathP = document.getElementById("selected-folder-path");
  const generateBtn = document.getElementById("generate-btn");
  const fileTreeDiv = document.getElementById("file-tree");
  const outputTextarea = document.getElementById("output-textarea");
  const outputPanel = document.querySelector(".output-panel");
  const copyBtn = document.getElementById("copy-btn");
  const charCountSpan = document.getElementById("output-char-count");
  const fileRegexInput = document.getElementById("file-regex-input");
  const fileRegexModeSelect = document.getElementById("file-regex-mode");
  const folderRegexInput = document.getElementById("folder-regex-input");
  const folderRegexModeSelect = document.getElementById("folder-regex-mode");
  const filterPresetSelect = document.getElementById("filter-preset-select");
  const filterNameInput = document.getElementById("filter-name-input");
  const maxDepthInput = document.getElementById("max-depth-input");
  const applyFiltersBtn = document.getElementById("apply-filters-btn");
  const saveFilterBtn = document.getElementById("save-filter-btn");
  const deleteFilterBtn = document.getElementById("delete-filter-btn");
  const treeSearchInput = document.getElementById("tree-search-input");
  const progressMessageDiv = document.getElementById("progress-message");

  const filterPresets = {
    common: {
      folderRegex: "node_modules|\\.git|\\.hg|logs|\\.qodo",
      folderFilterType: "exclude",
      fileRegex: "",
      fileFilterType: "include",
    },
    php: {
      folderRegex: "node_modules|vendor|\\.git|\\.hg|logs|\\.qodo",
      folderFilterType: "exclude",
      fileRegex: "\\.(php|inc|module|install)$",
      fileFilterType: "include",
    },
  };
  let customPresets = {};

  const debouncedUpdateHeight = window.domUtils.debounce(() => {
    window.domUtils.updateTextareaMaxHeight(outputPanel, outputTextarea);
  }, 100);
  window.addEventListener("resize", debouncedUpdateHeight);
  debouncedUpdateHeight();

  // --- FUNCTIONS ---
  function updatePathDisplay() {
    selectedFolderPathP.textContent = rootPath || "No folder selected.";
    selectedFolderPathP.title = rootPath || "";
  }

  /**
   * Sanitizes a string so it can be safely used as part of an element ID.
   * Replaces characters outside of [A-Za-z0-9_-] with underscores.
   * @param {string} pathStr
   * @returns {string}
   */
  function sanitizeForId(pathStr) {
    return pathStr.replace(/[^a-zA-Z0-9_-]/g, "_");
  }

  if (typeof window !== "undefined") {
    window.sanitizeForId = sanitizeForId; // expose for unit tests
  }


  function performSearch(term) {
    const query = term.trim().toLowerCase();
    const allLis = fileTreeDiv.querySelectorAll("li");
    allLis.forEach((li) => li.classList.remove("search-match"));
    if (!query) return;
    const labels = fileTreeDiv.querySelectorAll(".tree-item-label");
    labels.forEach((label) => {
      if (label.textContent.toLowerCase().includes(query)) {
        const li = label.closest("li");
        if (li) li.classList.add("search-match");
      }
    });
  }

  if (typeof window !== "undefined") {
    window.performSearch = performSearch; // for testing
  }

  function refreshPresetOptions() {
    if (!filterPresetSelect) return;
    filterPresetSelect.innerHTML = "";
    const customOpt = document.createElement("option");
    customOpt.value = "";
    customOpt.textContent = "Custom...";
    filterPresetSelect.appendChild(customOpt);
    Object.keys(filterPresets).forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent =
        k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, " ");
      filterPresetSelect.appendChild(opt);
    });
    Object.keys(customPresets).forEach((k) => {
      const opt = document.createElement("option");
      opt.value = k;
      opt.textContent = k;
      filterPresetSelect.appendChild(opt);
    });
  }

  function updatePresetButtons() {
    if (!saveFilterBtn || !deleteFilterBtn) return;
    const sel = filterPresetSelect.value;
    if (sel === "") {
      saveFilterBtn.disabled = false;
      deleteFilterBtn.disabled = true;
    } else if (customPresets[sel]) {
      saveFilterBtn.disabled = true;
      deleteFilterBtn.disabled = false;
    } else {
      saveFilterBtn.disabled = true;
      deleteFilterBtn.disabled = true;
    }
  }

  function applyPreset(key) {
    const preset = filterPresets[key] || customPresets[key];
    if (!preset) return;
    folderRegexInput.value = preset.folderRegex || "";
    folderRegexModeSelect.value = preset.folderFilterType || "include";
    fileRegexInput.value = preset.fileRegex || "";
    fileRegexModeSelect.value = preset.fileFilterType || "include";
    if (typeof preset.maxDepth === "number" && preset.maxDepth >= 0) {
      maxDepthInput.value = String(preset.maxDepth);
    } else {
      maxDepthInput.value = "";
    }
  }

  async function saveCustomFilter(name) {
    if (!name) return;
    customPresets[name] = {
      folderRegex: folderRegexInput.value.trim(),
      folderFilterType: folderRegexModeSelect.value,
      fileRegex: fileRegexInput.value.trim(),
      fileFilterType: fileRegexModeSelect.value,
      maxDepth:
        maxDepthInput.value.trim() === ""
          ? -1
          : parseInt(maxDepthInput.value.trim(), 10),
    };
    pluginConfig.savedFilters = customPresets;
    await window.configAPI.savePluginConfig(pluginId, pluginConfig);
    refreshPresetOptions();
    filterPresetSelect.value = name;
    updatePresetButtons();
  }

  async function deleteCustomFilter(name) {
    if (!customPresets[name]) return;
    delete customPresets[name];
    pluginConfig.savedFilters = customPresets;
    await window.configAPI.savePluginConfig(pluginId, pluginConfig);
    refreshPresetOptions();
    filterPresetSelect.value = "";
    updatePresetButtons();
  }

  /**
   * Loads children for a directory into the given UL element if not already loaded.
   * @param {string} dirPath
   * @param {HTMLUListElement} ul
   * @param {number} depth
   */
  function loadChildren(dirPath, ul, depth) {
    if (!ul || ul.dataset.loaded === "true") return;
    const children = directoryChildrenMap.get(dirPath) || [];
    children.forEach((child) => buildTree(child, ul, depth));
    ul.dataset.loaded = "true";
  }

  function recordExpandedState() {
    expandedFolders.clear();
    const toggles = fileTreeDiv.querySelectorAll(".folder-toggle");
    toggles.forEach((toggle) => {
      const subUl = toggle.parentElement.nextElementSibling;
      const li = toggle.closest("li");
      if (subUl && !subUl.classList.contains("collapsed")) {
        expandedFolders.add(li.dataset.path);
      }
    });
  }

  if (typeof window !== "undefined") {
    window.__recordExpandedState = recordExpandedState; // for testing
    window.__expandedFolders = expandedFolders;
  }

  /**
   * Renders the file tree from the data provided by the main process.
   */
  function renderFileTree(node) {
    fileTreeDiv.innerHTML = ""; // Clear previous tree
    if (!node) return;

    directoryChildrenMap.clear();

    const rootUl = document.createElement("ul");
    rootUl.style.paddingLeft = "0";
    // Start the recursive build at depth 0
    buildTree(node, rootUl, 0);
    fileTreeDiv.appendChild(rootUl);
  }

  /**
   * Recursive helper to build the HTML list for the file tree.
   * [MODIFIED] to remove inline event listener.
   */
  function buildTree(node, parentUl, depth = 0) {
    if (!node) return;

    const li = document.createElement("li");
    li.dataset.path = node.path;
    li.dataset.depth = String(depth);

    const itemDiv = document.createElement("div");
    itemDiv.className = "tree-item";

    const isDirectory = node.type === "directory";
    const label = document.createElement("label");
    label.className = "tree-item-label" + (isDirectory ? " directory" : "");
    label.textContent = node.name;

    if (isDirectory) {
      const toggle = document.createElement("span");
      toggle.className = "folder-toggle";
      toggle.setAttribute("role", "button");
      toggle.tabIndex = 0;
      toggle.setAttribute("aria-label", "Toggle folder");
      const folderCheckbox = document.createElement("input");
      folderCheckbox.type = "checkbox";
      folderCheckbox.className = "folder-checkbox";
      folderCheckbox.id = `checkbox-folder-${sanitizeForId(node.path)}`;
      folderCheckbox.dataset.folderPath = node.path;
      label.setAttribute("for", folderCheckbox.id);

      itemDiv.appendChild(toggle);
      itemDiv.appendChild(folderCheckbox);
      itemDiv.appendChild(label);

      const subUl = document.createElement("ul");
      li.appendChild(itemDiv);
      li.appendChild(subUl);

      directoryChildrenMap.set(node.path, node.children || []);

      const isExpanded =
        depth === 0 || expandedFolders.has(node.path);
      if (isExpanded) {
        toggle.textContent = "-";
        loadChildren(node.path, subUl, depth + 1);
      } else {
        subUl.classList.add("collapsed");
        toggle.textContent = "+";
      }
    } else {
      // File logic
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.id = `checkbox-file-${sanitizeForId(node.path)}`;
      checkbox.dataset.filePath = node.path;
      checkbox.classList.add("file-checkbox");
      label.setAttribute("for", checkbox.id);

      itemDiv.appendChild(checkbox);
      itemDiv.appendChild(label);
      li.appendChild(itemDiv);
    }

    parentUl.appendChild(li);
  }

  /**
   * @function updateParentCheckboxes
   * @description Traverses up the DOM from a given checkbox to update the state of parent folder checkboxes.
   * @param {HTMLInputElement} checkboxThatChanged - The file or folder checkbox that was just changed.
   */
  function updateParentCheckboxes(checkboxThatChanged) {
    // Start from the <li> that contains the checkbox
    let currentAncestorLi = checkboxThatChanged.closest("li");
    if (!currentAncestorLi) return;

    // Loop upwards through parent <li> elements.
    // The while loop condition finds the next <li> up the chain and assigns it.
    // The loop stops when .closest('li') returns null (i.e., we've reached the top of the tree).
    while (
      (currentAncestorLi = currentAncestorLi.parentElement.closest("li"))
    ) {
      // Find the folder checkbox for this ancestor
      const folderCheckbox =
        currentAncestorLi.querySelector(".folder-checkbox");
      if (!folderCheckbox) continue; // This ancestor isn't a folder item, so skip it.

      // Get the state of all file checkboxes within this ancestor's scope
      const allDescendantFiles =
        currentAncestorLi.querySelectorAll(".file-checkbox");
      if (allDescendantFiles.length === 0) {
        // This folder branch contains no actual files, so its state is neutral (unchecked and not indeterminate).
        folderCheckbox.checked = false;
        folderCheckbox.indeterminate = false;
        continue;
      }

      const total = allDescendantFiles.length;
      // Count how many of the descendant files are checked
      const checkedCount = Array.from(allDescendantFiles).filter(
        (cb) => cb.checked,
      ).length;

      // Apply the tri-state logic to the parent folder's checkbox
      if (checkedCount === 0) {
        // Nothing is checked
        folderCheckbox.checked = false;
        folderCheckbox.indeterminate = false;
      } else if (checkedCount === total) {
        // Everything is checked
        folderCheckbox.checked = true;
        folderCheckbox.indeterminate = false;
      } else {
        // A mix of checked and unchecked
        folderCheckbox.indeterminate = true;
        folderCheckbox.checked = false; // An indeterminate checkbox's value is false
      }
    }
  }

  /**
   * @function initializeTreeListeners
   * @description Sets up listeners for folder toggles and all checkboxes.
   * [MODIFIED] to correctly handle top-down checking of sub-folders.
   */
  function initializeTreeListeners() {
    // Listener for expanding/collapsing folders
    function handleToggle(target) {
      const toggle = target;
      if (toggle.classList.contains("folder-toggle")) {
        const parentLi = toggle.closest("li");
        const subUl = toggle.parentElement.nextElementSibling;
        if (subUl && subUl.tagName === "UL") {
          if (!subUl.dataset.loaded) {
            const depth = parseInt(parentLi.dataset.depth, 10) + 1;
            loadChildren(parentLi.dataset.path, subUl, depth);
          }
          subUl.classList.toggle("collapsed");
          const collapsed = subUl.classList.contains("collapsed");
          toggle.textContent = collapsed ? "+" : "-";
          if (collapsed) {
            expandedFolders.delete(parentLi.dataset.path);
          } else {
            expandedFolders.add(parentLi.dataset.path);
          }
        }
      }
    }

    fileTreeDiv.addEventListener("click", (event) => {
      handleToggle(event.target);
    });

    fileTreeDiv.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        handleToggle(event.target);
      }
    });

    // Single listener for ALL checkbox changes (both file and folder)
    fileTreeDiv.addEventListener("change", (event) => {
      const checkbox = event.target;
      if (checkbox.type !== "checkbox") return;

      if (checkbox.classList.contains("folder-checkbox")) {
        // --- Top-Down Logic (Select/Deselect All) ---
        const parentLi = checkbox.closest("li");
        if (!parentLi) return;

        const subUl = checkbox.parentElement.nextElementSibling;
        if (subUl && !subUl.dataset.loaded) {
          const depth = parseInt(parentLi.dataset.depth, 10) + 1;
          loadChildren(parentLi.dataset.path, subUl, depth);
        }

        const allDescendantCheckboxes = parentLi.querySelectorAll(
          'input[type="checkbox"]',
        );

        allDescendantCheckboxes.forEach((descendantCb) => {
          // Set its visual state. The top-most checkbox is the source of truth.
          descendantCb.checked = checkbox.checked;
          // A mass check/uncheck action should clear any "indeterminate" states.
          descendantCb.indeterminate = false;

          // If it's a file checkbox, we need to update our master Set of files
          if (descendantCb.classList.contains("file-checkbox")) {
            const filePath = descendantCb.dataset.filePath;
            if (checkbox.checked) {
              checkedFilePaths.add(filePath);
            } else {
              checkedFilePaths.delete(filePath);
            }
          }
        });
      } else if (checkbox.classList.contains("file-checkbox")) {
        // --- Bottom-Up Logic ---
        const filePath = checkbox.dataset.filePath;
        if (checkbox.checked) {
          checkedFilePaths.add(filePath);
        } else {
          checkedFilePaths.delete(filePath);
        }
        // After a single file changes, update its ancestors' state
        updateParentCheckboxes(checkbox);
      }
    });
  }

  async function scanAndRender(path) {
    if (!path) return;
    if (path === rootPath) {
      recordExpandedState();
    } else {
      expandedFolders.clear();
    }
    rootPath = path;
    updatePathDisplay();
    fileTreeDiv.innerHTML = "<em>Scanning...</em>";
    generateBtn.disabled = true;
    checkedFilePaths.clear();
    const opts = {
      startPath: path,
      fileRegex: fileRegexInput.value.trim(),
      fileFilterType: fileRegexModeSelect.value,
      folderRegex: folderRegexInput.value.trim(),
      folderFilterType: folderRegexModeSelect.value,
    };
    const depthVal = maxDepthInput.value.trim();
    if (depthVal !== "") {
      const parsed = parseInt(depthVal, 10);
      if (!Number.isNaN(parsed)) opts.maxDepth = parsed;
    }
    const result = await window.fileSystemAPI.scanDirectory(opts);
    if (result.success && result.data) {
      renderFileTree(result.data);
      performSearch(treeSearchInput.value);
    } else {
      const message = result.error || "Failed to scan directory.";
      window.logger.log(`[UI-ERROR] Directory scan failed: ${message}`);
      fileTreeDiv.innerHTML = `<em class="error-text">Error: ${message}</em>`;
    }
    generateBtn.disabled = false;
    if (pluginConfig) {
      pluginConfig.lastUsedFolderPath = rootPath;
      pluginConfig.lastFileRegex = fileRegexInput.value.trim();
      pluginConfig.lastFileFilterType = fileRegexModeSelect.value;
      pluginConfig.lastFolderRegex = folderRegexInput.value.trim();
      pluginConfig.lastFolderFilterType = folderRegexModeSelect.value;
      pluginConfig.lastMaxDepth = opts.maxDepth ?? -1;
      await window.configAPI.savePluginConfig(pluginId, pluginConfig);
    }
  }

  async function readFilesWithProgress(paths) {
    const results = [];
    for (let i = 0; i < paths.length; i++) {
      if (progressMessageDiv) {
        progressMessageDiv.textContent = `Reading file ${i + 1} of ${paths.length}...`;
      }
      const [result] = await window.fileSystemAPI.readFiles([paths[i]]);
      results.push(result);
    }
    if (progressMessageDiv) progressMessageDiv.textContent = "";
    return results;
  }

  async function generateContext() {
    const outputTextarea = document.getElementById("output-textarea");
    const charCountSpan = document.getElementById("output-char-count");
    if (checkedFilePaths.size === 0) {
      outputTextarea.value =
        "No files selected. Please check one or more files to generate context.";
      charCountSpan.textContent = `Length: 0`;
      window.domUtils.updateTextareaMaxHeight(outputPanel, outputTextarea);
      return;
    }
    outputTextarea.value = `Generating content for ${checkedFilePaths.size} files...`;
    window.domUtils.updateTextareaMaxHeight(outputPanel, outputTextarea);
    generateBtn.disabled = true;
    copyBtn.disabled = true;
    const pathsToRead = Array.from(checkedFilePaths);
    const fileContents = await readFilesWithProgress(pathsToRead);
    if (progressMessageDiv) progressMessageDiv.textContent = "Assembling output...";
    const readErrors = fileContents.filter((f) => f.error);
    let finalOutput = "";
    const separator = rootPath.includes("/") ? "/" : "\\";
    const joinFn = rootPath.includes("/")
      ? window.utilityAPI.joinPosix
      : window.utilityAPI.joinWin32;
    const rootDirWithSep = await joinFn(rootPath, separator);
    const basenamePromises = fileContents.map((f) =>
      f.content !== null ? window.utilityAPI.basename(f.path) : null,
    );
    const basenames = await Promise.all(basenamePromises);

    for (let i = 0; i < fileContents.length; i++) {
      const file = fileContents[i];
      if (file.content !== null) {
        const relativePath = file.path.replace(rootDirWithSep, "");
        const basename = basenames[i];
        finalOutput +=
          `---\nFile: ${basename}\nPath: ${relativePath.replace(/\\/g, "/")}\n---\n\n` +
          "```\n" +
          file.content +
          "\n```\n\n";
      }
    }
    if (readErrors.length > 0) {
      const errorDetails = readErrors.map((e) => `${e.path}: ${e.error}`).join("\n");
      window.logger.log(`[UI-ERROR] Read failures:\n${errorDetails}`);
      finalOutput += `\n---\nErrors:\n${errorDetails}\n---\n`;
    }
    outputTextarea.value = finalOutput;
    window.domUtils.updateTextareaMaxHeight(outputPanel, outputTextarea);
    charCountSpan.textContent = `Length: ${finalOutput.length}`;
    if (progressMessageDiv) progressMessageDiv.textContent = "";
    generateBtn.disabled = false;
    copyBtn.disabled = false;
    if (pluginConfig) {
      pluginConfig.lastUsedFolderPath = rootPath;
      await window.configAPI.savePluginConfig(pluginId, pluginConfig);
      window.logger.log(
        `[UI-INFO] Saved last used folder for ${pluginId}: ${rootPath}`,
      );
    }
  }

  async function initialize() {
    initializeTreeListeners();
    generateBtn.addEventListener("click", generateContext);
    applyFiltersBtn.addEventListener("click", () => scanAndRender(rootPath));
    if (saveFilterBtn)
      saveFilterBtn.addEventListener("click", async () => {
        const name = filterNameInput.value.trim();
        if (!name) return;
        await saveCustomFilter(name);
        filterNameInput.value = "";
      });
    if (deleteFilterBtn)
      deleteFilterBtn.addEventListener("click", async () => {
        const key = filterPresetSelect.value;
        if (key && customPresets[key]) {
          if (confirm(`Delete filter '${key}'?`)) await deleteCustomFilter(key);
        }
      });
    if (filterPresetSelect) {
      filterPresetSelect.addEventListener("change", () => {
        applyPreset(filterPresetSelect.value);
        scanAndRender(rootPath);
        updatePresetButtons();
      });
    }
    [
      fileRegexInput,
      fileRegexModeSelect,
      folderRegexInput,
      folderRegexModeSelect,
      maxDepthInput,
    ].forEach((el) =>
      el.addEventListener("input", () => {
        if (filterPresetSelect.value !== "") {
          filterPresetSelect.value = "";
          updatePresetButtons();
        }
      }),
    );
    treeSearchInput.addEventListener("input", () =>
      performSearch(treeSearchInput.value),
    );
    copyBtn.addEventListener("click", () => {
      window.fileSystemAPI.copyToClipboard(outputTextarea.value);
      copyBtn.textContent = "Copied!";
      setTimeout(() => {
        copyBtn.textContent = "Copy to Clipboard";
      }, 2000);
    });
    selectFolderBtn.addEventListener("click", async () => {
      window.logger.log(
        `[UI-INFO] Clicked Select Root Folder Button for ${pluginId}: ${rootPath}`,
      );
      const selectedPath = await window.fileSystemAPI.selectFolder();
      if (selectedPath) await scanAndRender(selectedPath);
    });
    try {
      const fullConfigResponse = await window.configAPI.getConfigAndSchema();
      if (fullConfigResponse.success) {
        const fullConfig = fullConfigResponse.config;
        pluginConfig = fullConfig.plugins?.[pluginId] || {};
        customPresets = pluginConfig.savedFilters || {};
        refreshPresetOptions();
        updatePresetButtons();
        const lastPath = pluginConfig.lastUsedFolderPath;
        fileRegexInput.value = pluginConfig.lastFileRegex || "";
        fileRegexModeSelect.value =
          pluginConfig.lastFileFilterType || "include";
        folderRegexInput.value = pluginConfig.lastFolderRegex || "";
        folderRegexModeSelect.value =
          pluginConfig.lastFolderFilterType || "include";
        if (!folderRegexInput.value) {
          applyPreset("common");
          if (filterPresetSelect) filterPresetSelect.value = "common";
        }
        if (
          typeof pluginConfig.lastMaxDepth === "number" &&
          pluginConfig.lastMaxDepth >= 0
        ) {
          maxDepthInput.value = String(pluginConfig.lastMaxDepth);
        }
        const initialPath =
          lastPath || (await window.fileSystemAPI.getRootPath());
        await scanAndRender(initialPath);
      } else {
        throw new Error(fullConfigResponse.error);
      }
    } catch (err) {
      console.error("Failed to initialize Context Generator:", err);
      fileTreeDiv.innerHTML = `<em class="error-text">Could not load initial configuration.</em>`;
    }
  }

  // --- SCRIPT EXECUTION STARTS HERE ---
  initialize();

  // Expose internals for unit testing
  if (typeof window !== "undefined") {
    window.__cgTest = {
      scanAndRender,
      generateContext,
      readFilesWithProgress,
      setRootPath: (p) => {
        rootPath = p;
        updatePathDisplay();
      },
      checkedFilePaths,
      applyPreset,
      saveCustomFilter,
      deleteCustomFilter,
      refreshPresetOptions,
    };
  }
}
