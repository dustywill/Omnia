/**
 * @fileoverview Provides asynchronous, recursive directory crawling functionality
 * with filtering, depth limiting, and parallel processing of subdirectories.
 * @version 1.1.0
 */

import fs from "node:fs/promises";
import path from "node:path";
import debugPkg from "debug";
import { createLogger } from "./logger.js";
import { sanitizeAbsolutePath } from "./utility.js";

const debugCrawler = debugPkg("app:crawler");

// Simple logger that outputs to console since we don't have a log file path here
const getLogger = () => ({
  error: (error, message) => console.error(`[crawler] ${message}`, error),
  warn: (message) => console.warn(`[crawler] ${message}`),
  info: (message) => console.log(`[crawler] ${message}`),
});

/**
 * @typedef {object} CrawlNode
 * @property {string} name - The name of the file or directory.
 * @property {'directory' | 'file' | 'error'} type - The type of the node.
 * @property {string} path - The absolute path to the file or directory.
 * @property {string} [error] - An error message if type is 'error'.
 * @property {CrawlNode[]} children - An array of child nodes (for directories).
 */

/**
 * Checks if a name matches a given regex pattern based on the filter type.
 * Handles potential regex errors and defaults to case-insensitive matching.
 * @param {string} name - The file or folder name to test.
 * @param {string} regexString - The regular expression pattern string. Can be empty/null.
 * @param {'include'|'exclude'} filterType - Whether to include or exclude matches.
 * @returns {boolean} True if the name passes the filter criteria, false otherwise.
 * @throws {Error} If the regexString is syntactically invalid.
 */
function matchesFilter(name, regexString, filterType) {
  if (
    !regexString ||
    regexString.trim() === "" ||
    /^\/([gimyus]*)$/.test(regexString)
  ) {
    // If no regex, empty, or only flags provided, everything passes
    return true;
  }

  let regex;
  try {
    regex = new RegExp(regexString, "i"); // 'i' for case-insensitive
  } catch (e) {
    const logger = getLogger();
    logger.error(e, `Invalid regular expression provided: "${regexString}"`);
    // Re-throw specific error for main process to handle
    throw new Error(`Invalid regular expression provided: "${regexString}"`);
  }

  const isMatch = regex.test(name);

  // Return true if (including and matches) OR (excluding and doesn't match)
  return filterType === "include" ? isMatch : !isMatch;
}

/**
 * Validates the starting directory path.
 * @param {string} dirPath
 * @returns {Promise<CrawlNode|null>} Error node if permission denied, otherwise null.
 * @throws {Error} If the path is missing or not a directory.
 */
async function validateStartDirectory(dirPath) {
  try {
    const stats = await fs.stat(dirPath);
    if (!stats.isDirectory()) {
      throw new Error(`Starting path is not a directory: ${dirPath}`);
    }
    return null;
  } catch (err) {
    if (err.code === "ENOENT") {
      throw new Error(`Starting directory not found: ${dirPath}`);
    }
    if (err.code === "EPERM" || err.code === "EACCES") {
      const logger = getLogger();
      logger.warn(`Permission denied accessing start directory: ${dirPath}.`);
      return {
        name: path.basename(dirPath) + " (Access Denied)",
        type: "error",
        path: dirPath,
        error: err.message,
        children: [],
      };
    }
    throw new Error(`Cannot access starting path: ${dirPath}. ${err.message}`);
  }
}

/**
 * Reads directory contents and handles errors by logging.
 * @param {string} dirPath
 * @returns {Promise<{dirents: import('fs').Dirent[]}|{error: Error}>}
 */
async function readDirectory(dirPath) {
  try {
    const dirents = await fs.readdir(dirPath, { withFileTypes: true });
    return { dirents };
  } catch (err) {
    const logger = getLogger();
    logger.warn(
      `Could not read directory contents: ${dirPath}. Error: ${err.message}`,
    );
    return { error: err };
  }
}

/**
 * Recursively crawls a directory, applying filters (regex, depth), and returns a tree structure.
 * Uses Promise.all for parallel processing of subdirectories to improve performance.
 * Handles errors during stat, readdir, and recursive calls gracefully by creating 'error' nodes.
 * @async
 * @param {string} dirPath - The absolute path to the directory to start crawling.
 * @param {object} [options] - Optional crawler settings.
 * @param {string} [options.folderRegex] - Regex pattern for filtering folder names.
 * @param {'include'|'exclude'} [options.folderFilterType] - How to apply the folder regex.
 * @param {string} [options.fileRegex] - Regex pattern for filtering file names.
 * @param {'include'|'exclude'} [options.fileFilterType] - How to apply the file regex.
 * @param {number|null} [options.maxDepth] - Maximum depth to crawl (null for unlimited). Depth 0 is the starting directory itself.
 * @param {number} [currentDepth=0] - The current depth of recursion (internal use only).
 * @returns {Promise<CrawlNode|null>} A promise resolving to the root CrawlNode of the scanned directory
 * or null only if the very starting directory doesn't exist or isn't a directory.
 * Subdirectory access/read errors result in error nodes within the tree.
 * @throws {Error} Only if the initial `dirPath` is invalid/inaccessible in a way not handled by error nodes, or if regex is invalid.
 */
async function crawlDirectory(
  dirPath,
  {
    folderRegex: folderRegexString = "",
    folderFilterType = "include",
    fileRegex: fileRegexString = "",
    fileFilterType = "include",
    maxDepth = null,
  } = {},
  currentDepth = 0,
) {
  dirPath = sanitizeAbsolutePath(dirPath);
  debugCrawler("Crawling directory: %s at depth %d", dirPath, currentDepth);

  // --- Validate Starting Directory ---
  const startError = await validateStartDirectory(dirPath);
  if (startError) return startError;

  // --- Node Creation ---
  const dirName = path.basename(dirPath);
  /** @type {CrawlNode} */
  const node = {
    name: dirName,
    type: "directory",
    path: dirPath,
    children: [],
  };

  // --- Depth Limit Check for Recursion ---
  // We can enter directories at maxDepth, but cannot recurse *further*
  const canRecurse = maxDepth == null || currentDepth < maxDepth;

  // --- Read Directory Contents ---
  const { dirents, error: readError } = await readDirectory(dirPath);
  if (readError) {
    node.name += " (Read Error)";
    node.type = "error";
    node.error = readError.message;
    return node;
  }

  // --- Process Directory Entries ---
  /** @type {Promise<CrawlNode|null>[]} */
  const subdirCrawlPromises = []; // Store promises for parallel subdirectory crawls

  for (const dirent of dirents) {
    const fullPath = path.join(dirPath, dirent.name);

    if (dirent.isDirectory()) {
      // Check depth limit and folder filters before queuing crawl
      if (
        canRecurse &&
        matchesFilter(dirent.name, folderRegexString, folderFilterType)
      ) {
        const nextDepth = currentDepth + 1;
        // Push the promise; errors caught below to prevent Promise.all rejection
        subdirCrawlPromises.push(
          crawlDirectory(
            fullPath,
            {
              folderRegex: folderRegexString,
              folderFilterType,
              fileRegex: fileRegexString,
              fileFilterType,
              maxDepth,
            },
            nextDepth,
          ).catch((error) => {
            // Catch errors from THIS recursive call only
            const logger = getLogger();
            logger.warn(
              `Error crawling subdirectory ${fullPath}: ${error.message}.`,
            );
            // Return an error node instead of letting the promise reject
            return {
              name: dirent.name + " (Crawl Error)",
              type: "error",
              path: fullPath,
              error: error.message,
              children: [],
            };
          }),
        );
      }
      // Optional logging for skipped directories (can be noisy)
      else if (!canRecurse)
        debugCrawler(`Depth limit, skip recursion: ${dirent.name}`);
      else debugCrawler(`Folder filter excluded: ${dirent.name}`);
    } else if (dirent.isFile()) {
      // Apply file filter for files directly in this directory
      if (matchesFilter(dirent.name, fileRegexString, fileFilterType)) {
        /** @type {CrawlNode} */
        const fileNode = {
          name: dirent.name,
          type: "file",
          path: fullPath,
          children: [], // Files don't have children
        };
        node.children.push(fileNode);
      }
    }
    // Ignore other types (symlinks, sockets, etc.)
  }

  // --- Wait for all subdirectory crawls to complete in parallel ---
  const subTrees = await Promise.all(subdirCrawlPromises);

  // --- Aggregate valid results from completed promises ---
  for (const subTree of subTrees) {
    // Check if the crawl returned a valid subtree (could be null if filtered, or an error node)
    if (subTree) {
      // Logic for deciding whether to add the subTree to the parent's children
      // Add if: it's an error node OR it has children OR specific filters imply empty dirs are okay
      if (
        subTree.type === "error" ||
        (subTree.children && subTree.children.length > 0) ||
        fileFilterType === "include" || // If including files, keep dir structure even if no files matched inside
        (folderFilterType === "include" && folderRegexString)
      ) {
        // If including folders by regex, keep matched folders
        node.children.push(subTree);
      }
    }
  }

  // --- Sort Children ---
  // Sorts errors first, then directories, then files, alphabetically within type.
  node.children.sort((a, b) => {
    if (a.type === "error" && b.type !== "error") return -1;
    if (b.type === "error" && a.type !== "error") return 1;
    if (a.type === "directory" && b.type !== "directory") return -1;
    if (b.type === "directory" && a.type !== "directory") return 1;
    return a.name.localeCompare(b.name); // Alphabetical within type
  });

  // --- Return the completed node for this directory ---
  return node;
}

// --- Export ---
export { crawlDirectory };
