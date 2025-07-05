/**
 * @file plugins/script-runner/index.js
 * @description The main logic for the Script Runner plugin.
 */

const path = require("node:path");

/**
 * @typedef {import('../../src/core/plugin-manager').CoreAPI} CoreAPI
 */

let coreAPIInstance = null;

async function activate(coreAPI) {
  coreAPIInstance = coreAPI;
  coreAPI.logger.info("Script Runner plugin is activating!");

  const config = coreAPI.getPluginConfig();
  if (!config) {
    coreAPI.logger.warn(
      "Script Runner configuration is missing. The plugin will not be able to run any scripts.",
    );
    return;
  }

  const { scriptConfigurations } = config;

  if (!scriptConfigurations || scriptConfigurations.length === 0) {
    coreAPI.logger.info(
      "No scripts are configured in the Script Runner plugin settings.",
    );
    return;
  }

  coreAPI.logger.info(
    `Script Runner plugin loaded with ${scriptConfigurations.length} script configuration(s).`,
  );
}

async function deactivate() {
  if (coreAPIInstance) {
    coreAPIInstance.logger.info("Script Runner plugin deactivating.");
    coreAPIInstance = null;
  }
}

module.exports = {
  activate,
  deactivate,
};
