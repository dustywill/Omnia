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

  // Saved filter schema (matching ttCommander structure)
  const SavedFilterSchema = z.object({
    fileRegex: z.string().default(''),
    fileFilterType: z.enum(['include', 'exclude']).default('include'),
    folderRegex: z.string().default(''),
    folderFilterType: z.enum(['include', 'exclude']).default('include'),
    maxDepth: z.number().default(-1),
  });

  // Configuration schema for the Context Generator plugin
  const ContextGeneratorConfigSchema = z.object({
    title: z.string().default('Context Generator'),
    description: z.string().default('Generates context from selected files in a directory.'),
    // Core settings matching ttCommander
    enabled: z.boolean()
      .default(true)
      .describe('Enable the Context Generator plugin'),
    
    // Last used settings (remembers user preferences)
    lastUsedFolderPath: z.string()
      .default('')
      .describe('Last folder path used for context generation'),
    
    lastFileRegex: z.string()
      .default('')
      .describe('Last file regex pattern used'),
    
    lastFileFilterType: z.enum(['include', 'exclude'])
      .default('include')
      .describe('Last file filter type (include or exclude matching files)'),
    
    lastFolderRegex: z.string()
      .default('')
      .describe('Last folder regex pattern used'),
    
    lastFolderFilterType: z.enum(['include', 'exclude'])
      .default('include')
      .describe('Last folder filter type (include or exclude matching folders)'),
    
    lastMaxDepth: z.number()
      .default(-1)
      .describe('Last maximum depth setting (-1 for unlimited)'),
    
    // Saved filter configurations
    savedFilters: z.record(SavedFilterSchema)
      .default({})
      .describe('User-defined filter presets'),
    
    // Output settings
    outputDirectory: z.string()
      .default('output/context-generator')
      .describe('Directory where generated context files will be saved'),
    
    outputFileName: z.string()
      .default('context.md')
      .describe('Default filename for generated context files'),
    
    // Processing options
    includeFileContents: z.boolean()
      .default(true)
      .describe('Include file contents in generated context'),
    
    includeDirectoryStructure: z.boolean()
      .default(true)
      .describe('Include directory structure in generated context'),
    
    includeFileSizes: z.boolean()
      .default(false)
      .describe('Include file sizes in directory listings'),
    
    includeModificationDates: z.boolean()
      .default(false)
      .describe('Include file modification dates'),
    
    // File processing limits
    maxFileSize: z.number()
      .min(1024)
      .max(10485760)
      .default(1048576)
      .describe('Maximum file size to process (bytes)'),
    
    maxFilesPerDirectory: z.number()
      .min(1)
      .max(10000)
      .default(1000)
      .describe('Maximum number of files to process per directory'),
    
    // Content formatting
    useMarkdownFormatting: z.boolean()
      .default(true)
      .describe('Use Markdown formatting for output'),
    
    includeLineNumbers: z.boolean()
      .default(true)
      .describe('Include line numbers in code blocks'),
    
    // Performance settings
    enableProgressIndicator: z.boolean()
      .default(true)
      .describe('Show progress indicator during processing'),
    
    parallelProcessing: z.boolean()
      .default(false)
      .describe('Enable parallel file processing (experimental)'),
    
    // Default filter presets
    defaultFileExclusions: z.array(z.string())
      .default([
        '\\.git', '\\.hg', '\\.svn',
        'node_modules', 'vendor', 'dist', 'build',
        '\\.log$', '\\.tmp$', '\\.cache$'
      ])
      .describe('Default file patterns to exclude'),
    
    defaultFolderExclusions: z.array(z.string())
      .default([
        'node_modules', 'vendor', '.git', '.hg', '.svn',
        'logs', 'tmp', 'cache', 'dist', 'build'
      ])
      .describe('Default folder patterns to exclude')
  });

  return { SavedFilterSchema, ContextGeneratorConfigSchema, z };
};

// For backwards compatibility, export the schema creation function as default
export default createSchemas;