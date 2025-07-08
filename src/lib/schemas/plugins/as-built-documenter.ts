/**
 * Schema for As-Built Documenter plugin configuration
 * 
 * This schema defines the structure for configuring the As-Built Documenter plugin,
 * which generates documentation from data sources and templates.
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
export const createAsBuiltDocumenterSchemas = async () => {
  const zodModule = await loadZod();
  const z = zodModule.z || zodModule.default || zodModule;

  /**
   * Schema for individual data source configuration
   * Defines endpoints and settings for fetching data
   */
  const dataSourceSchema = z.object({
    /** Unique identifier for this data source */
    id: z.string().min(1, 'Data source ID is required').describe('Unique identifier for this data source'),
    
    /** Optional display name for this data source */
    name: z.string().optional().describe('Display name for this data source'),
    
    /** Optional description of what this data source provides */
    description: z.string().default('').describe('Optional description of what this data source provides'),
    
    /** URL to fetch data from - supports variable substitution like {ipAddress} */
    url: z.string().url('Must be a valid URL').describe('URL to fetch data from - supports variable substitution like {ipAddress}'),
    
    /** Optional CSS selector for scraping web pages */
    selector: z.string().optional().describe('Optional CSS selector for scraping web pages'),
    
    /** Authentication credentials for protected endpoints */
    auth: z.record(z.any()).default({}).describe('Authentication credentials for protected endpoints'),
    
    /** Request timeout in milliseconds */
    timeout: z.number().min(1).default(5000).describe('Request timeout in milliseconds'),
    
    /** Number of retry attempts on failure */
    retries: z.number().min(0).default(0).describe('Number of retry attempts on failure'),
  }).describe('Configuration for a data source endpoint');

  /**
   * Schema for scrape source configuration
   * Defines web pages to scrape for multiple data points
   */
  const scrapeSourceSchema = z.object({
    /** Unique identifier for this scrape source */
    id: z.string().min(1, 'Scrape source ID is required').describe('Unique identifier for this scrape source'),
    
    /** Display name for this scrape source */
    name: z.string().optional().describe('Display name for this scrape source'),
    
    /** URL to scrape - supports variable substitution */
    url: z.string().url('Must be a valid URL').describe('URL to scrape - supports variable substitution'),
    
    /** Array of data members to extract from the page */
    members: z.array(z.object({
      /** CSS selector for the element containing the data */
      selector: z.string().min(1, 'Selector is required').describe('CSS selector for the element containing the data'),
      
      /** Name of the value in the resulting data object */
      name: z.string().min(1, 'Member name is required').describe('Name of the value in the resulting data object'),
    })).describe('Array of data members to extract from the page'),
    
    /** Authentication credentials for protected pages */
    auth: z.record(z.any()).default({}).describe('Authentication credentials for protected pages'),
    
    /** Request timeout in milliseconds */
    timeout: z.number().min(1).default(5000).describe('Request timeout in milliseconds'),
    
    /** Number of retry attempts on failure */
    retries: z.number().min(0).default(0).describe('Number of retry attempts on failure'),
  }).describe('Configuration for a web scraping data source');

  /**
   * Main As-Built Documenter plugin configuration schema
   * Defines the complete configuration structure for the As-Built Documenter plugin
   */
  const asBuiltDocumenterConfigSchema = z.object({
    /** Enable or disable the entire plugin */
    enabled: z.boolean()
      .default(true)
      .describe('If unchecked, this plugin will be disabled on next startup.'),
    
    /** Path to the Handlebars-enabled .md template file */
    templatePath: z.string()
      .default('templates/as-built/MES_Template.md')
      .describe('Path to the Handlebars-enabled .md template file (relative to app root or absolute).'),
    
    /** Array of data source configurations */
    dataSources: z.array(dataSourceSchema)
      .default([])
      .describe('A list of endpoints or web pages to fetch data from. Use {ipAddress} as a placeholder.'),
    
    /** Array of scrape source configurations */
    scrapeSources: z.array(scrapeSourceSchema)
      .default([])
      .describe('Web pages to scrape multiple values from.'),
    
    /** Customer name to include in generated documentation */
    customerName: z.string()
      .default('')
      .describe('Customer name to include in generated documentation'),
    
    /** Directory where generated documentation will be saved */
    outputDirectory: z.string()
      .default('output/as-built-documenter')
      .describe('Directory where generated documentation will be saved'),
    
    /** Default filename for generated documentation */
    outputFileName: z.string()
      .default('as-built-documentation.md')
      .describe('Default filename for generated documentation'),
    
    /** Directory containing documentation templates */
    templatesDirectory: z.string()
      .default('templates/as-built')
      .describe('Directory containing documentation templates'),
    
    /** Include generation timestamp in documentation */
    includeTimestamp: z.boolean()
      .default(true)
      .describe('Include generation timestamp in documentation'),
    
    /** Format the generated documentation */
    formatOutput: z.boolean()
      .default(true)
      .describe('Format the generated documentation'),
    
    /** Connection timeout for data sources in milliseconds */
    connectionTimeout: z.number()
      .min(1000)
      .max(30000)
      .default(10000)
      .describe('Connection timeout for data sources in milliseconds'),
    
    /** Maximum number of retry attempts for failed requests */
    maxRetries: z.number()
      .min(0)
      .max(10)
      .default(3)
      .describe('Maximum number of retry attempts for failed requests'),
    
    /** Allow connections to insecure (non-HTTPS) endpoints */
    allowInsecureConnections: z.boolean()
      .default(false)
      .describe('Allow connections to insecure (non-HTTPS) endpoints'),
    
    /** Variables available for template substitution */
    variables: z.record(z.string())
      .default({})
      .describe('Variables available for template substitution (e.g., {ipAddress})'),
  }).describe('As-Built Documenter Configuration');

  return { dataSourceSchema, scrapeSourceSchema, asBuiltDocumenterConfigSchema, z };
};

// Export for backwards compatibility - will be loaded dynamically
export let asBuiltDocumenterConfigSchema: any = null;
export let DataSource: any = null;
export let ScrapeSource: any = null;
export let AsBuiltDocumenterConfig: any = null;

/**
 * Default configuration for the As-Built Documenter plugin
 */
export const defaultAsBuiltDocumenterConfig = {
  enabled: true,
  templatePath: 'templates/as-built/MES_Template.md',
  dataSources: [],
  scrapeSources: [],
  customerName: '',
  outputDirectory: 'output/as-built-documenter',
  outputFileName: 'as-built-documentation.md',
  templatesDirectory: 'templates/as-built',
  includeTimestamp: true,
  formatOutput: true,
  connectionTimeout: 10000,
  maxRetries: 3,
  allowInsecureConnections: false,
  variables: {},
};

/**
 * Validates and parses an As-Built Documenter configuration object
 * @param config - The configuration object to validate
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export async function parseAsBuiltDocumenterConfig(config: unknown) {
  const { asBuiltDocumenterConfigSchema } = await createAsBuiltDocumenterSchemas();
  return asBuiltDocumenterConfigSchema.parse(config);
}

/**
 * Safely validates an As-Built Documenter configuration object
 * @param config - The configuration object to validate
 * @returns Success result with parsed config or error result with validation issues
 */
export async function validateAsBuiltDocumenterConfig(config: unknown) {
  const { asBuiltDocumenterConfigSchema } = await createAsBuiltDocumenterSchemas();
  return asBuiltDocumenterConfigSchema.safeParse(config);
}

// For backwards compatibility, export the schema creation function as default
export default createAsBuiltDocumenterSchemas;