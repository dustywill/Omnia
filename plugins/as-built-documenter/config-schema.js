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

  // Data source schema
  const DataSourceSchema = z.object({
    id: z.string().min(1, 'Data source ID is required'),
    description: z.string().default(''),
    url: z.string().url('Must be a valid URL'),
    auth: z.record(z.any()).default({}),
    timeout: z.number().min(1).default(5000),
    retries: z.number().min(0).default(0)
  });

  // Configuration schema for the As-Built Documenter plugin
  const AsBuiltDocumenterConfigSchema = z.object({
    // Core settings matching ttCommander
    enabled: z.boolean()
      .default(true)
      .describe('Enable the As-Built Documenter plugin'),
    
    templatePath: z.string()
      .default('templates/as-built/MES_Template.md')
      .describe('Path to the documentation template file'),
    
    dataSources: z.array(DataSourceSchema)
      .default([])
      .describe('List of data sources to fetch information from'),
    
    customerName: z.string()
      .default('')
      .describe('Customer name to include in generated documentation'),
    
    // Output settings
    outputDirectory: z.string()
      .default('output/as-built-documenter')
      .describe('Directory where generated documentation will be saved'),
    
    outputFileName: z.string()
      .default('as-built-documentation.md')
      .describe('Default filename for generated documentation'),
    
    // Template settings
    templatesDirectory: z.string()
      .default('templates/as-built')
      .describe('Directory containing documentation templates'),
    
    // Processing options
    includeTimestamp: z.boolean()
      .default(true)
      .describe('Include generation timestamp in documentation'),
    
    formatOutput: z.boolean()
      .default(true)
      .describe('Format the generated documentation'),
    
    // Data fetching settings
    connectionTimeout: z.number()
      .min(1000)
      .max(30000)
      .default(10000)
      .describe('Connection timeout for data sources in milliseconds'),
    
    maxRetries: z.number()
      .min(0)
      .max(10)
      .default(3)
      .describe('Maximum number of retry attempts for failed requests'),
    
    // Security settings
    allowInsecureConnections: z.boolean()
      .default(false)
      .describe('Allow connections to insecure (non-HTTPS) endpoints'),
    
    // Variable substitution
    variables: z.record(z.string())
      .default({})
      .describe('Variables available for template substitution (e.g., {ipAddress})')
  });

  return { DataSourceSchema, AsBuiltDocumenterConfigSchema, z };
};

// For backwards compatibility, export the schema creation function as default
export default createSchemas;