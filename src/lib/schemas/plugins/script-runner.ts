import { z } from 'zod';

/**
 * Schema for Script Runner plugin configuration
 * 
 * This schema defines the structure for configuring the Script Runner plugin,
 * which allows execution of PowerShell scripts with customizable parameters.
 */

/**
 * Schema for individual script parameters
 * Defines command-line arguments that can be passed to scripts
 */
const scriptParameterSchema = z.object({
  /** The parameter name passed to the script */
  name: z.string().describe('The parameter name passed to the script'),
  
  /** Friendly name shown in the Customize dialog */
  label: z.string().optional().describe('Friendly name shown in the Customize dialog'),
  
  /** Description of what this parameter does */
  description: z.string().optional().describe('Description of what this parameter does'),
  
  /** Optional default value for this parameter */
  value: z.string().optional().describe('Optional default value for this parameter'),
}).describe('Definition for a script command-line argument');

/**
 * Schema for default shell parameters
 * Can be either an object with key-value pairs or an array of strings
 */
const defaultShellParametersSchema = z.union([
  z.record(z.string(), z.any()).describe('Object with key-value parameter pairs'),
  z.array(z.string()).describe('Array of parameter strings'),
]).describe('Default parameters (-Key Value) to pass to the script. Can be overridden at runtime.');

/**
 * Schema for individual script configuration
 * Defines a complete script setup with parameters and execution settings
 */
const scriptConfigurationSchema = z.object({
  /** Enable or disable this script configuration */
  enabled: z.boolean()
    .default(true)
    .describe('If unchecked, this script configuration will be disabled on next startup.'),
  
  /** Unique identifier for this configuration */
  id: z.string().describe('Unique identifier for this configuration (e.g., \'sync-backup-docs\').'),
  
  /** User-friendly display name for UI */
  name: z.string().describe('User-friendly display name for UI.'),
  
  /** Optional description of what this script does */
  description: z.string().optional().describe('Description of what this script does'),
  
  /** Category for UI grouping */
  group: z.string().optional().describe('Category for UI grouping (e.g., \'Backups\', \'Networking\').'),
  
  /** Path to the .ps1 file, relative to the Scripts Directory */
  scriptPath: z.string().describe('Path to the .ps1 file, relative to the Scripts Directory defined above.'),
  
  /** Default parameters to pass to the script */
  defaultShellParameters: defaultShellParametersSchema.optional(),
  
  /** Whether to run the script as Administrator */
  elevated: z.boolean()
    .default(false)
    .describe('Whether to run the script as Administrator'),
  
  /** Array of parameter definitions for this script */
  parameters: z.array(scriptParameterSchema)
    .default([])
    .describe('Definitions for this script\'s command-line arguments.'),
}).describe('Configuration for a pre-configured script that can be executed');

/**
 * Main Script Runner plugin configuration schema
 * Defines the complete configuration structure for the Script Runner plugin
 */
export const scriptRunnerConfigSchema = z.object({
  /** Enable or disable the entire plugin */
  enabled: z.boolean()
    .default(true)
    .describe('If unchecked, this plugin will be disabled on the next startup.'),
  
  /** Directory where PowerShell scripts are stored */
  scriptsDirectory: z.string()
    .default('scripts')
    .describe('The folder (relative to the application root) where your PowerShell scripts are stored.'),
  
  /** Array of script configurations */
  scriptConfigurations: z.array(scriptConfigurationSchema)
    .default([])
    .describe('Definitions for pre-configured scripts that can be executed.'),
}).describe('Script Runner Configuration');

/**
 * TypeScript type inferred from the Script Runner configuration schema
 */
export type ScriptRunnerConfig = z.infer<typeof scriptRunnerConfigSchema>;

/**
 * TypeScript type for individual script configuration
 */
export type ScriptConfiguration = z.infer<typeof scriptConfigurationSchema>;

/**
 * TypeScript type for script parameters
 */
export type ScriptParameter = z.infer<typeof scriptParameterSchema>;

/**
 * TypeScript type for default shell parameters
 */
export type DefaultShellParameters = z.infer<typeof defaultShellParametersSchema>;

/**
 * Default configuration for the Script Runner plugin
 */
export const defaultScriptRunnerConfig: ScriptRunnerConfig = {
  enabled: true,
  scriptsDirectory: 'scripts',
  scriptConfigurations: [],
};

/**
 * Validates and parses a Script Runner configuration object
 * @param config - The configuration object to validate
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export function parseScriptRunnerConfig(config: unknown): ScriptRunnerConfig {
  return scriptRunnerConfigSchema.parse(config);
}

/**
 * Safely validates a Script Runner configuration object
 * @param config - The configuration object to validate
 * @returns Success result with parsed config or error result with validation issues
 */
export function validateScriptRunnerConfig(config: unknown): z.SafeParseReturnType<unknown, ScriptRunnerConfig> {
  return scriptRunnerConfigSchema.safeParse(config);
}

/**
 * Creates a new script configuration with default values
 * @param overrides - Optional overrides for the default values
 * @returns New script configuration object
 */
export function createScriptConfiguration(overrides: Partial<ScriptConfiguration> = {}): ScriptConfiguration {
  const defaults: ScriptConfiguration = {
    enabled: true,
    id: '',
    name: '',
    scriptPath: '',
    elevated: false,
    parameters: [],
  };
  
  return { ...defaults, ...overrides };
}

/**
 * Creates a new script parameter with default values
 * @param overrides - Optional overrides for the default values
 * @returns New script parameter object
 */
export function createScriptParameter(overrides: Partial<ScriptParameter> = {}): ScriptParameter {
  const defaults: ScriptParameter = {
    name: '',
  };
  
  return { ...defaults, ...overrides };
}

// Export the schema as default for convenience
export default scriptRunnerConfigSchema;