// Load zod dynamically for browser compatibility
const loadZod = async () => {
  if (typeof window !== 'undefined' && window.require) {
    // Electron environment
    return window.require('zod');
  } else {
    // Node.js environment - use the node module loader
    const { loadNodeModule } = await import('../../src/ui/node-module-loader.js');
    return await loadNodeModule('zod');
  }
};

// Factory function to create schemas
export const createSchemas = async () => {
  const zodModule = await loadZod();
  const z = zodModule.z || zodModule.default || zodModule;

  // Script configuration schema (matches ttCommander structure)
  const ScriptConfigurationSchema = z.object({
    enabled: z.boolean()
      .default(true)
      .describe('Enable this script configuration'),
    
    id: z.string()
      .min(1, 'Script ID is required')
      .describe('Unique identifier for this script configuration'),
    
    name: z.string()
      .min(1, 'Script name is required')
      .describe('User-friendly display name for UI'),
    
    description: z.string()
      .default('')
      .describe('Description of what this script does'),
    
    group: z.string()
      .default('')
      .describe('Category for UI grouping (e.g., VPN, Administration)'),
    
    scriptPath: z.string()
      .min(1, 'Script path is required')
      .describe('Path to the script file, relative to scripts directory'),
    
    defaultShellParameters: z.record(z.any())
      .default({})
      .describe('Default parameters to pass to the script'),
    
    elevated: z.boolean()
      .default(false)
      .describe('Run script as administrator'),
    
    parameters: z.array(z.object({
      name: z.string().min(1, 'Parameter name is required'),
      label: z.string().optional(),
      description: z.string().default(''),
      value: z.string().optional()
    })).default([])
      .describe('Runtime parameter definitions')
  });

  // Legacy script definition schema
  const ScriptSchema = z.object({
    id: z.string().min(1, 'Script ID is required'),
    name: z.string().min(1, 'Script name is required'),
    description: z.string().default(''),
    path: z.string().min(1, 'Script path is required'),
    category: z.string().default('general'),
    parameters: z.array(z.object({
      name: z.string(),
      description: z.string().default(''),
      required: z.boolean().default(false),
      type: z.enum(['string', 'number', 'boolean']).default('string'),
      defaultValue: z.string().optional()
    })).default([])
  });

  // Configuration schema for the Script Runner plugin
  const ScriptRunnerConfigSchema = z.object({
    // Core settings matching ttCommander
    enabled: z.boolean()
      .default(true)
      .describe('Enable the Script Runner plugin'),
    
    // Directory settings
    scriptsDirectory: z.string()
      .default('scripts')
      .describe('Directory containing PowerShell scripts'),
    
    scriptConfigurations: z.array(ScriptConfigurationSchema)
      .default([])
      .describe('Pre-configured scripts with their settings'),
    
    outputDirectory: z.string()
      .default('output/script-runner')
      .describe('Directory for script output files'),
    
    // Execution settings
    defaultShell: z.enum(['powershell', 'pwsh', 'cmd'])
      .default('powershell')
      .describe('Default shell for script execution'),
    
    timeout: z.number()
      .min(1)
      .max(3600)
      .default(300)
      .describe('Script execution timeout in seconds'),
    
    maxConcurrentScripts: z.number()
      .min(1)
      .max(10)
      .default(3)
      .describe('Maximum number of scripts that can run simultaneously'),
    
    // UI settings
    showAdvancedOptions: z.boolean()
      .default(false)
      .describe('Show advanced execution options in the UI'),
    
    autoSaveOutput: z.boolean()
      .default(true)
      .describe('Automatically save script output to files'),
    
    showExecutionHistory: z.boolean()
      .default(true)
      .describe('Display execution history in the UI'),
    
    // Security settings
    allowedExtensions: z.array(z.string())
      .default(['.ps1', '.bat', '.cmd'])
      .describe('Allowed script file extensions'),
    
    restrictToScriptsDirectory: z.boolean()
      .default(true)
      .describe('Only allow scripts from the configured scripts directory'),
    
    // Output settings
    maxOutputLength: z.number()
      .min(1000)
      .max(1000000)
      .default(100000)
      .describe('Maximum output length to display (characters)'),
    
    preserveOutputFormatting: z.boolean()
      .default(true)
      .describe('Preserve original formatting in script output'),
    
    // Service settings
    enableService: z.boolean()
      .default(true)
      .describe('Enable script execution service for other plugins'),
    
    serviceApiKey: z.string()
      .optional()
      .describe('API key for service authentication (optional)')
  });

  return { ScriptSchema, ScriptConfigurationSchema, ScriptRunnerConfigSchema, z };
};

// Type definitions for backwards compatibility
export const ScriptRunnerConfig = null; // Will be defined by TypeScript
export const Script = null; // Will be defined by TypeScript

// For backwards compatibility, export the schema creation function as default
export default createSchemas;