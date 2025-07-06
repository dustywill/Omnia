/**
 * @file plugins/context-generator/index.js
 * @description Main process activation for the Context Generator plugin.
 */
let coreAPIInstance = null;

async function activate(coreAPI) {
  coreAPIInstance = coreAPI;
  coreAPI.logger.info("Context Generator plugin activated.");
  // In the future, this backend script could do more, but for now, the UI handles everything.
}

async function deactivate() {
  if (coreAPIInstance) {
    coreAPIInstance.logger.info("Context Generator plugin deactivating.");
  }
}
module.exports = { activate, deactivate };
