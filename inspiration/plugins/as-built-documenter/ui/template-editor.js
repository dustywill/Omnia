/**
 * @file plugins/as-built-documenter/ui/template-editor.js
 * @description Re-exports the bundled template editor logic located in the
 * obsolete folder. This wrapper allows existing tests to import the module
 * using a stable path.
 */

module.exports = require("./obsolete/template-editor.js");
