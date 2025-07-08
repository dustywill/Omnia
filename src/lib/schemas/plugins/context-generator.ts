/**
 * Schema for Context Generator plugin configuration
 * 
 * This schema defines the structure for configuring the Context Generator plugin,
 * which generates context information and documentation for projects.
 */

// Load zod dynamically for browser compatibility
const loadZod = async () => {
  if (typeof window !== 'undefined' && (window as any).require) {
    // Electron environment
    return (window as any).require('zod');
  } else {
    // Node.js environment - use the node module loader
    const { loadNodeModule } = await import('../../../ui/node-module-loader.js');
    return await loadNodeModule('zod');
  }
};

// Factory function to create schemas
export const createContextGeneratorSchemas = async () => {
  const zodModule = await loadZod();
  const z = zodModule.z || zodModule.default || zodModule;

  /**
   * Schema for saved filter configuration
   * Defines reusable filter presets for file and folder patterns
   */
  const savedFilterSchema = z.object({
    /** Display name for this filter preset */
    name: z.string().min(1, 'Filter name is required').describe('Display name for this filter preset'),
    
    /** Regular expression pattern for folder filtering */
    folderRegex: z.string().default('').describe('Regular expression pattern for folder filtering'),
    
    /** Type of folder filter (include or exclude) */
    folderFilterType: z.enum(['include', 'exclude']).default('exclude').describe('Type of folder filter (include or exclude)'),
    
    /** Regular expression pattern for file filtering */
    fileRegex: z.string().default('').describe('Regular expression pattern for file filtering'),
    
    /** Type of file filter (include or exclude) */
    fileFilterType: z.enum(['include', 'exclude']).default('exclude').describe('Type of file filter (include or exclude)'),
    
    /** Maximum directory depth (-1 for unlimited) */
    maxDepth: z.number().default(-1).describe('Maximum directory depth (-1 for unlimited)'),
    
    /** Optional description of what this filter does */
    description: z.string().default('').describe('Optional description of what this filter does'),
  }).describe('Configuration for a saved filter preset');

  /**
   * Main Context Generator plugin configuration schema
   * Defines the complete configuration structure for the Context Generator plugin
   */
  const contextGeneratorConfigSchema = z.object({
    /** Enable or disable the entire plugin */
    enabled: z.boolean()
      .default(true)
      .describe('If unchecked, this plugin will be disabled on next startup.'),
    
    /** Last folder path used for context generation */
    lastUsedFolderPath: z.string()
      .default('')
      .describe('The last folder that was successfully scanned. Automatically saved.'),
    
    /** Last file regex pattern used */
    lastFileRegex: z.string()
      .default('')
      .describe('Last file regex pattern used'),
    
    /** Last file filter type (include or exclude) */
    lastFileFilterType: z.enum(['include', 'exclude'])
      .default('include')
      .describe('File Regex Mode'),
    
    /** Last folder regex pattern used */
    lastFolderRegex: z.string()
      .default('')
      .describe('Last folder regex pattern used'),
    
    /** Last folder filter type (include or exclude) */
    lastFolderFilterType: z.enum(['include', 'exclude'])
      .default('include')
      .describe('Folder Regex Mode'),
    
    /** Last maximum depth setting */
    lastMaxDepth: z.number()
      .default(-1)
      .describe('Last maximum depth setting (-1 means unlimited depth)'),
    
    /** User-defined filter presets */
    savedFilters: z.record(savedFilterSchema)
      .default({})
      .describe('User-defined filter presets keyed by name.'),
    
    /** Directory where generated context files will be saved */
    outputDirectory: z.string()
      .default('output/context-generator')
      .describe('Directory where generated context files will be saved'),
    
    /** Default filename for generated context files */
    outputFileName: z.string()
      .default('context.md')
      .describe('Default filename for generated context files'),
    
    /** Include file contents in generated context */
    includeFileContents: z.boolean()
      .default(true)
      .describe('Include file contents in generated context'),
    
    /** Include directory structure in generated context */
    includeDirectoryStructure: z.boolean()
      .default(true)
      .describe('Include directory structure in generated context'),
    
    /** Include file sizes in directory listings */
    includeFileSizes: z.boolean()
      .default(false)
      .describe('Include file sizes in directory listings'),
    
    /** Include file modification dates */
    includeModificationDates: z.boolean()
      .default(false)
      .describe('Include file modification dates'),
    
    /** Maximum file size to process (bytes) */
    maxFileSize: z.number()
      .min(1024)
      .max(10485760)
      .default(1048576)
      .describe('Maximum file size to process (bytes)'),
    
    /** Maximum number of files to process per directory */
    maxFilesPerDirectory: z.number()
      .min(1)
      .max(10000)
      .default(1000)
      .describe('Maximum number of files to process per directory'),
    
    /** Use Markdown formatting for output */
    useMarkdownFormatting: z.boolean()
      .default(true)
      .describe('Use Markdown formatting for output'),
    
    /** Include line numbers in code blocks */
    includeLineNumbers: z.boolean()
      .default(true)
      .describe('Include line numbers in code blocks'),
    
    /** Show progress indicator during processing */
    enableProgressIndicator: z.boolean()
      .default(true)
      .describe('Show progress indicator during processing'),
    
    /** Enable parallel file processing (experimental) */
    parallelProcessing: z.boolean()
      .default(false)
      .describe('Enable parallel file processing (experimental)'),
    
    /** Default file patterns to exclude */
    defaultFileExclusions: z.array(z.string())
      .default([
        '\\.git', '\\.hg', '\\.svn',
        'node_modules', 'vendor', 'dist', 'build',
        '\\.log$', '\\.tmp$', '\\.cache$'
      ])
      .describe('Default file patterns to exclude'),
    
    /** Default folder patterns to exclude */
    defaultFolderExclusions: z.array(z.string())
      .default([
        'node_modules', 'vendor', '.git', '.hg', '.svn',
        'logs', 'tmp', 'cache', 'dist', 'build'
      ])
      .describe('Default folder patterns to exclude'),
  }).describe('Context Generator Configuration');

  return { savedFilterSchema, contextGeneratorConfigSchema, z };
};

// Export for backwards compatibility - will be loaded dynamically
export let contextGeneratorConfigSchema: any = null;
export let SavedFilter: any = null;
export let ContextGeneratorConfig: any = null;

/**
 * Default configuration for the Context Generator plugin
 */
export const defaultContextGeneratorConfig = {
  enabled: true,
  lastUsedFolderPath: '',
  lastFileRegex: '',
  lastFileFilterType: 'include' as const,
  lastFolderRegex: '',
  lastFolderFilterType: 'include' as const,
  lastMaxDepth: -1,
  savedFilters: {},
  outputDirectory: 'output/context-generator',
  outputFileName: 'context.md',
  includeFileContents: true,
  includeDirectoryStructure: true,
  includeFileSizes: false,
  includeModificationDates: false,
  maxFileSize: 1048576,
  maxFilesPerDirectory: 1000,
  useMarkdownFormatting: true,
  includeLineNumbers: true,
  enableProgressIndicator: true,
  parallelProcessing: false,
  defaultFileExclusions: [
    '\\.git', '\\.hg', '\\.svn',
    'node_modules', 'vendor', 'dist', 'build',
    '\\.log$', '\\.tmp$', '\\.cache$'
  ],
  defaultFolderExclusions: [
    'node_modules', 'vendor', '.git', '.hg', '.svn',
    'logs', 'tmp', 'cache', 'dist', 'build'
  ],
};

/**
 * Validates and parses a Context Generator configuration object
 * @param config - The configuration object to validate
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export async function parseContextGeneratorConfig(config: unknown) {
  const { contextGeneratorConfigSchema } = await createContextGeneratorSchemas();
  return contextGeneratorConfigSchema.parse(config);
}

/**
 * Safely validates a Context Generator configuration object
 * @param config - The configuration object to validate
 * @returns Success result with parsed config or error result with validation issues
 */
export async function validateContextGeneratorConfig(config: unknown) {
  const { contextGeneratorConfigSchema } = await createContextGeneratorSchemas();
  return contextGeneratorConfigSchema.safeParse(config);
}

// For backwards compatibility, export the schema creation function as default
export default createContextGeneratorSchemas;