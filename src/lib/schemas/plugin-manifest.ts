/**
 * @fileoverview Zod schema for plugin manifest validation
 * 
 * This schema validates plugin.json5 files to ensure they contain all required
 * fields and follow the correct format for plugin registration and loading.
 */

import { z } from 'zod';

/**
 * Pattern for plugin ID validation
 * Allows alphanumeric characters, underscores, dots, and hyphens
 */
const PLUGIN_ID_PATTERN = /^[a-zA-Z0-9_.-]+$/;

/**
 * Semantic version pattern (SemVer)
 * Validates full semantic versioning format including pre-release and build metadata
 */
const SEMVER_PATTERN = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

/**
 * Pattern for main entry point file validation
 * Must be a .js file not starting with / or \
 */
const MAIN_FILE_PATTERN = /^[^/\\].*\.js$/;

/**
 * Schema for engine compatibility requirements
 */
const EngineSchema = z.object({
  /**
   * Compatible ttCommander version range (e.g., ">=0.1.0")
   * Uses node-semver format for version ranges
   */
  ttCommanderVersion: z.string()
    .min(1, 'ttCommander version is required')
    .describe('Compatible ttCommander version range (e.g., >=0.1.0). Uses node-semver format.'),
  
  /**
   * Compatible Node.js version range (e.g., ">=18.0.0")
   * Uses node-semver format for version ranges
   */
  nodeVersion: z.string()
    .min(1)
    .optional()
    .describe('Compatible Node.js version range (e.g., >=18.0.0). Uses node-semver format.'),
}).describe('Specifies compatibility with ttCommander and Node.js.');

/**
 * Schema for UI contributions
 * Extensible object for defining how the plugin contributes to the UI
 */
const UIContributionsSchema = z.record(z.unknown())
  .default({})
  .describe('Defines how this plugin contributes to the UI (e.g., menu items, views).');

/**
 * Schema for plugin permissions
 * Array of permission strings that the plugin requires
 */
const PermissionsSchema = z.array(z.string())
  .default([])
  .describe('Array of permissions required by the plugin (e.g., "executeScript").');

/**
 * Main plugin manifest schema
 * Validates the complete plugin.json5 file structure
 */
export const PluginManifestSchema = z.object({
  /**
   * Unique identifier for the plugin
   * Must follow the pattern: alphanumeric, underscore, dot, or hyphen
   * @example "com.example.myplugin"
   */
  id: z.string()
    .min(1, 'Plugin ID is required')
    .regex(PLUGIN_ID_PATTERN, 'Plugin ID must contain only alphanumeric characters, underscores, dots, and hyphens')
    .describe('Unique identifier for the plugin (e.g., com.example.myplugin).'),

  /**
   * Human-readable name of the plugin
   * Must be at least 1 character long
   */
  name: z.string()
    .min(1, 'Plugin name is required')
    .describe('Human-readable name of the plugin.'),

  /**
   * Semantic version of the plugin
   * Must follow SemVer format (e.g., "1.0.0", "2.1.0-beta.1")
   */
  version: z.string()
    .min(1, 'Plugin version is required')
    .regex(SEMVER_PATTERN, 'Plugin version must follow semantic versioning format (e.g., 1.0.0)')
    .describe('Semantic version of the plugin (e.g., 1.0.0).'),

  /**
   * Brief description of what the plugin does
   */
  description: z.string()
    .min(1, 'Plugin description is required')
    .describe('A brief description of what the plugin does.'),

  /**
   * Author of the plugin
   * @example "John Doe <john@example.com>"
   */
  author: z.string()
    .min(1)
    .optional()
    .describe('Author of the plugin (e.g., Name <email@example.com>).'),

  /**
   * Main JavaScript entry point file for the plugin
   * Must be a .js file relative to the plugin root
   * @example "index.js"
   */
  main: z.string()
    .min(1, 'Main entry point is required')
    .regex(MAIN_FILE_PATTERN, 'Main entry point must be a .js file not starting with / or \\')
    .describe('The main JavaScript entry point file for the plugin, relative to the plugin root (e.g., index.js).'),

  /**
   * Engine compatibility requirements
   * Specifies compatible versions of ttCommander and Node.js
   */
  engine: EngineSchema,

  /**
   * Array of permissions required by the plugin
   * Extensible for future permission types
   */
  permissions: PermissionsSchema,

  /**
   * UI contribution definitions
   * Extensible object for defining UI elements like menu items, views, etc.
   */
  uiContributions: UIContributionsSchema,
}).strict().describe('ttCommander Plugin Manifest Schema');

/**
 * Inferred TypeScript type for the plugin manifest
 * Use this type for type-safe plugin manifest handling
 */
export type PluginManifest = z.infer<typeof PluginManifestSchema>;

/**
 * Inferred TypeScript type for engine compatibility
 */
export type EngineCompatibility = z.infer<typeof EngineSchema>;

/**
 * Inferred TypeScript type for UI contributions
 */
export type UIContributions = z.infer<typeof UIContributionsSchema>;

/**
 * Inferred TypeScript type for permissions
 */
export type Permissions = z.infer<typeof PermissionsSchema>;

/**
 * Validates a plugin manifest object
 * @param manifest - The manifest object to validate
 * @returns Parsed and validated manifest
 * @throws ZodError if validation fails
 */
export function validatePluginManifest(manifest: unknown): PluginManifest {
  return PluginManifestSchema.parse(manifest);
}

/**
 * Safely validates a plugin manifest object
 * @param manifest - The manifest object to validate
 * @returns Success result with parsed manifest or error result
 */
export function safeValidatePluginManifest(manifest: unknown): z.SafeParseReturnType<unknown, PluginManifest> {
  return PluginManifestSchema.safeParse(manifest);
}

/**
 * Validates partial plugin manifest for updates
 * Useful for validating incomplete manifests during development
 */
export const PartialPluginManifestSchema = PluginManifestSchema.partial();

/**
 * Inferred TypeScript type for partial plugin manifest
 */
export type PartialPluginManifest = z.infer<typeof PartialPluginManifestSchema>;