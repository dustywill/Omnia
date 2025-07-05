/**
 * @file plugins/customer-links/index.js
 * @description Backend logic for the Customer Links plugin.
 */

/** @typedef {import('../../src/core/plugin-manager').CoreAPI} CoreAPI */

let core = null;

async function activate(coreAPI) {
  core = coreAPI;
  core.logger.info('Customer Links plugin activated.');
}

async function deactivate() {
  if (core) {
    core.logger.info('Customer Links plugin deactivated.');
    core = null;
  }
}

module.exports = { activate, deactivate };
