import { z } from 'zod';

// Script definition schema
export const ScriptSchema = z.object({
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
export const ScriptRunnerConfigSchema = z.object({
  // Directory settings
  scriptsDirectory: z.string()
    .default('scripts')
    .describe('Directory containing PowerShell scripts'),
  
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

export type ScriptRunnerConfig = z.infer<typeof ScriptRunnerConfigSchema>;
export type Script = z.infer<typeof ScriptSchema>;

export default ScriptRunnerConfigSchema;