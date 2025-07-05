/**
 * @file plugins/com.example.as-built-documenter/index.js
 * @description Main process logic for the As-Built Documenter plugin.
 */

const { ipcMain } = require("electron");
const { getJson, getText } = require("../http-client.js");
const { JSDOM } = require("jsdom");
const fs = require("node:fs/promises");
const path = require("node:path");
const Handlebars = require("handlebars");

/**
 * @typedef {import('../../src/core/plugin-manager').CoreAPI} CoreAPI
 */

/**
 * Plugin configuration structure.
 * @typedef {Object} DocumenterConfig
 * @property {boolean} [enabled] Whether the plugin is enabled.
 * @property {string} templatePath Path to the Markdown template file.
 * @property {{
 *   id: string,
 *   name?: string,
 *   description?: string,
 *   url: string,
 *   selector?: string,
 *   auth?: object,
 *   timeout?: number,
 *   retries?: number
 * }[]} dataSources List of data source definitions.
 * @property {string} [customerName] Name of the customer included in documents.
 *   This value is inserted into {@link GenerationInfo.customer} when a document
 *   is generated.
 */

/**
 * Metadata about the generation request.
 * @typedef {Object} GenerationInfo
 * @property {string} ipAddress Target IP address used for data fetch.
 * @property {string} customer Customer name from plugin configuration.
 * @property {string} date UTC timestamp when generation occurred.
 */

let coreAPIInstance;

/**
 * Fetches data from a given URL.
 * @param {string} url - The URL to fetch from.
 * @param {{auth?: object, timeout?: number, retries?: number}} [options] -
 *   Request options passed through to the HTTP client.
 * @param {string} [selector] - Optional CSS selector for scraping HTML.
 * @returns {Promise<any>} The fetched data or scraped content.
 */
async function fetchData(url, options = {}, selector) {
  try {
    if (selector) {
      const html = await getText(url, options);
      const dom = new JSDOM(html);
      const elements = dom.window.document.querySelectorAll(selector);
      return Array.from(elements, (el) => el.textContent.trim());
    }
    return await getJson(url, options);
  } catch (error) {
    coreAPIInstance.logger.error(
      { err: error, url },
      `Failed to fetch data from URL.`,
    );
    return { error: `Failed to fetch from ${url}: ${error.message}` };
  }
}

/**
 * Fetches multiple named values from a web page using selectors.
 *
 * @param {string} url - The page URL.
 * @param {{selector: string, name: string}[]} members - Members to scrape.
 * @param {{auth?: object, timeout?: number, retries?: number}} [options]
 *   Request options passed through to the HTTP client.
 * @returns {Promise<object>} An object mapping member names to scraped values.
 */
async function fetchScrapeMembers(url, members, options = {}) {
  try {
    const html = await getText(url, options);
    const dom = new JSDOM(html);
    const result = {};
    for (const { selector, name } of members) {
      const el = dom.window.document.querySelector(selector);
      result[name] = el ? el.textContent.trim() : null;
    }
    return result;
  } catch (error) {
    coreAPIInstance.logger.error(
      { err: error, url },
      `Failed to scrape data from URL.`,
    );
    return { error: `Failed to fetch from ${url}: ${error.message}` };
  }
}

/**
 * IPC handler to fetch a small sample from a configured data source.
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {{sourceId: string}} args
 * @returns {Promise<{success: boolean, rows?: any[], error?: string}>}
 */
async function handleFetchSampleData(event, { sourceId, ipAddress }) {
  if (!coreAPIInstance) {
    return { success: false, error: "Plugin not fully activated." };
  }

  const { getPluginConfig } = coreAPIInstance;
  coreAPIInstance.logger.info(
    `handleFetchSampleData invoked for source '${sourceId}'`,
  );
  const config = getPluginConfig();
  const dsList = Array.isArray(config.dataSources) ? config.dataSources : [];
  const scrapeList = Array.isArray(config.scrapeSources)
    ? config.scrapeSources
    : [];
  if (dsList.length === 0 && scrapeList.length === 0) {
    return { success: false, error: "No data sources configured." };
  }
  const source = dsList.find((ds) => ds.id === sourceId) ||
    scrapeList.find((ds) => ds.id === sourceId);
  if (!source) {
    return { success: false, error: `Data source '${sourceId}' not found.` };
  }
  const isScrape = Boolean(source.members);

  const finalIp = ipAddress || "127.0.0.1";
  const url = source.url.replace("{ipAddress}", finalIp);
  const data = isScrape
    ? await fetchScrapeMembers(
        url,
        source.members,
        {
          auth: source.auth,
          timeout: source.timeout,
          retries: source.retries,
        },
      )
    : await fetchData(
        url,
        {
          auth: source.auth,
          timeout: source.timeout,
          retries: source.retries,
        },
        source.selector,
      );
  if (data.error) {
    coreAPIInstance.logger.error(
      { sourceId, err: data.error },
      "sample data fetch failed",
    );
    return { success: false, error: data.error };
  }

  coreAPIInstance.logger.info(
    `sample data fetched for '${sourceId}' with ${Array.isArray(data) ? data.length : 1} rows`,
  );

  let rows = Array.isArray(data) ? data.slice(0, 10) : [data];
  return { success: true, rows };
}

/**
 * IPC handler for the document generation request from the UI.
 * Reads {@link DocumenterConfig} to build the Handlebars context.
 * @param {Electron.IpcMainInvokeEvent} event
 * @param {object} args
 * @param {string} args.ipAddress - The target IP address from the UI.
 * @param {object} [args.tags] - Key/value pairs substituted into the template.
 * @returns {Promise<{
 *   success: boolean,
 *   content?: string,
 *   error?: string,
 *   failures?: {id: string, message: string}[]
 * }>}
 */
async function handleGenerateDocument(event, { ipAddress, templatePath, tags = {} }) {
  if (!coreAPIInstance) {
    return { success: false, error: "Plugin not fully activated." };
  }

  const { logger, getPluginConfig } = coreAPIInstance;
  logger.info(
    `handleGenerateDocument invoked with ip ${ipAddress} and template ${templatePath || "default"}`,
  );
  const config = getPluginConfig();

  if (!config || !config.templatePath || !config.dataSources) {
    logger.warn("Plugin configuration missing templatePath or dataSources");
    return { success: false, error: "Plugin is not configured correctly." };
  }

  // 1. Read the Handlebars template file
  let templateContent;
  try {
    const finalPath = templatePath || config.templatePath;
    const absoluteTemplatePath = path.resolve(process.cwd(), finalPath);
    templateContent = await fs.readFile(absoluteTemplatePath, "utf8");
    logger.info(`Template file read successfully from ${absoluteTemplatePath}`);
  } catch (e) {
    logger.error({ err: e }, "Failed to read template file.");
    return {
      success: false,
      error: `Could not read template file: ${e.message}`,
    };
  }

  // 2. Fetch data from all configured sources concurrently while reporting
  //    progress back to the renderer that initiated the request.
  const dsList = Array.isArray(config.dataSources) ? config.dataSources : [];
  const scrapeList = Array.isArray(config.scrapeSources)
    ? config.scrapeSources
    : [];
  const allSources = [...dsList, ...scrapeList];
  const totalSources = allSources.length;
  const failures = [];
  const dataPromises = allSources.map(async (source, index) => {
    const url = source.url.replace("{ipAddress}", ipAddress);
    const isScrape = Boolean(source.members);
    const data = isScrape
      ? await fetchScrapeMembers(
          url,
          source.members,
          {
            auth: source.auth,
            timeout: source.timeout,
            retries: source.retries,
          },
        )
      : await fetchData(
          url,
          {
            auth: source.auth,
            timeout: source.timeout,
            retries: source.retries,
          },
          source.selector,
        );
    // Emit progress update for each resolved fetch
    event.sender.send("as-built-documenter:progress", {
      sourceId: source.id,
      index: index + 1,
      total: totalSources,
      success: !data.error,
      error: data.error,
    });
    return data;
  });

  const results = await Promise.allSettled(dataPromises);

  // 3. Combine all fetched data into a single context object
  const templateContext = { ...tags };
  results.forEach((result, index) => {
    const sourceId = allSources[index].id;
    if (result.status === "fulfilled" && !result.value.error) {
      templateContext[sourceId] = result.value;
    } else {
      const errorMessage =
        result.reason?.message || result.value?.error || "Unknown fetch error";
      logger.warn(`Data source '${sourceId}' failed: ${errorMessage}`);
      templateContext[sourceId] = { error: errorMessage };
      failures.push({ id: sourceId, message: errorMessage });
    }
  });

  // Add some metadata to the context using the plugin configuration
  const { customerName } = config;
  /** @type {GenerationInfo} */
  templateContext.generationInfo = {
    ipAddress,
    customer: customerName || "N/A",
    date: new Date().toUTCString(),
  };

  // 4. Compile the template with Handlebars and inject the data
  try {
    const template = Handlebars.compile(templateContent);
    const finalDocument = template(templateContext);
    logger.info("Successfully compiled template with fetched data.");
    return { success: true, content: finalDocument, failures };
  } catch (e) {
    logger.error({ err: e }, "Handlebars template compilation failed.");
    return { success: false, error: `Template error: ${e.message}` };
  }
}

/**
 * Activates the plugin.
 * @param {CoreAPI} coreAPI - The Core API provided by ttCommander.
 */
async function activate(coreAPI) {
  coreAPIInstance = coreAPI;
  coreAPI.logger.info("As-Built Documenter plugin activated.");

  // Register IPC handlers
  ipcMain.handle("as-built-documenter:generate", handleGenerateDocument);
  ipcMain.handle("as-built-documenter:sample-data", handleFetchSampleData);
}

/**
 * Deactivates the plugin.
 */
async function deactivate() {
  if (coreAPIInstance) {
    coreAPIInstance.logger.info("As-Built Documenter plugin deactivating.");
  }
  // Unregister IPC handlers to prevent memory leaks
  ipcMain.removeHandler("as-built-documenter:generate");
  ipcMain.removeHandler("as-built-documenter:sample-data");
}

module.exports = { activate, deactivate };
