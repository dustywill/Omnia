/**
 * Schema for Customer Links plugin configuration
 * 
 * This schema defines the structure for configuring the Customer Links plugin,
 * which generates HTML pages with customer site links and information.
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
export const createCustomerLinksSchemas = async () => {
  const zodModule = await loadZod();
  const z = zodModule.z || zodModule.default || zodModule;

  /**
   * Schema for individual customer site configuration
   * Defines a customer site with its details and URL
   */
  const customerSiteSchema = z.object({
    /** Unique identifier for this customer site */
    id: z.string().min(1, 'Customer site ID is required').describe('Unique identifier for this customer site'),
    
    /** Display name for this customer site */
    name: z.string().min(1, 'Customer site name is required').describe('Display name for this customer site'),
    
    /** URL to the customer site */
    url: z.string().url('Must be a valid URL').describe('URL to the customer site'),
    
    /** Optional description of the customer site */
    description: z.string().default('').describe('Optional description of the customer site'),
    
    /** Optional category for grouping sites */
    category: z.string().default('').describe('Optional category for grouping sites'),
    
    /** Whether this site is active/enabled */
    enabled: z.boolean().default(true).describe('Whether this site is active/enabled'),
  }).describe('Configuration for a customer site');

  /**
   * Main Customer Links plugin configuration schema
   * Defines the complete configuration structure for the Customer Links plugin
   */
  const customerLinksConfigSchema = z.object({
    /** Enable or disable the entire plugin */
    enabled: z.boolean()
      .default(true)
      .describe('If unchecked, this plugin will be disabled on next startup.'),
    
    /** File path where the standalone customer links page will be written */
    savePath: z.string()
      .default('output/customer-links/customers.html')
      .describe('File path where the standalone customer links page will be written.'),
    
    /** Path to the customer sites configuration file */
    configFilePath: z.string()
      .default('config/customer-sites.json')
      .describe('Path to the customer sites configuration file'),
    
    /** Directory where generated files will be saved */
    outputDirectory: z.string()
      .default('output/customer-links')
      .describe('Directory where generated files will be saved'),
    
    /** Title displayed on the generated page */
    title: z.string()
      .default('Customer Links')
      .describe('Title displayed on the generated page'),
    
    /** Show plugin description in the interface */
    showDescription: z.boolean()
      .default(true)
      .describe('Show plugin description in the interface'),
    
    /** Automatically reload sites when file changes */
    autoReload: z.boolean()
      .default(false)
      .describe('Automatically reload sites when file changes'),
    
    /** HTML template style for generated output */
    htmlTemplate: z.enum(['simple', 'styled', 'cards'])
      .default('styled')
      .describe('HTML template style for generated output'),
    
    /** Custom CSS to include in generated files */
    customCss: z.string()
      .default('')
      .describe('Custom CSS to include in generated files (optional)'),
    
    /** Open generated HTML file in browser after creation */
    openAfterGenerate: z.boolean()
      .default(false)
      .describe('Open generated HTML file in browser after creation'),
    
    /** Validate URLs when loading configuration */
    validateUrls: z.boolean()
      .default(true)
      .describe('Validate URLs when loading configuration'),
    
    /** Maximum number of customer sites to display */
    maxSites: z.number()
      .min(1)
      .max(1000)
      .default(100)
      .describe('Maximum number of customer sites to display'),
    
    /** Array of customer site configurations */
    customerSites: z.array(customerSiteSchema)
      .default([])
      .describe('List of customer sites to include in generated links'),
    
    /** Group sites by category */
    groupByCategory: z.boolean()
      .default(false)
      .describe('Group sites by category in the generated output'),
    
    /** Show site descriptions in the generated output */
    showSiteDescriptions: z.boolean()
      .default(true)
      .describe('Show site descriptions in the generated output'),
    
    /** Include timestamp in generated files */
    includeTimestamp: z.boolean()
      .default(true)
      .describe('Include generation timestamp in generated files'),
    
    /** Sort sites alphabetically */
    sortAlphabetically: z.boolean()
      .default(true)
      .describe('Sort sites alphabetically in the generated output'),
  }).describe('Customer Links Configuration');

  return { customerSiteSchema, customerLinksConfigSchema, z };
};

// Export for backwards compatibility - will be loaded dynamically
export let customerLinksConfigSchema: any = null;
export let CustomerSite: any = null;
export let CustomerLinksConfig: any = null;

/**
 * Default configuration for the Customer Links plugin
 */
export const defaultCustomerLinksConfig = {
  enabled: true,
  savePath: 'output/customer-links/customers.html',
  configFilePath: 'config/customer-sites.json',
  outputDirectory: 'output/customer-links',
  title: 'Customer Links',
  showDescription: true,
  autoReload: false,
  htmlTemplate: 'styled' as const,
  customCss: '',
  openAfterGenerate: false,
  validateUrls: true,
  maxSites: 100,
  customerSites: [],
  groupByCategory: false,
  showSiteDescriptions: true,
  includeTimestamp: true,
  sortAlphabetically: true,
};

/**
 * Validates and parses a Customer Links configuration object
 * @param config - The configuration object to validate
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export async function parseCustomerLinksConfig(config: unknown) {
  const { customerLinksConfigSchema } = await createCustomerLinksSchemas();
  return customerLinksConfigSchema.parse(config);
}

/**
 * Safely validates a Customer Links configuration object
 * @param config - The configuration object to validate
 * @returns Success result with parsed config or error result with validation issues
 */
export async function validateCustomerLinksConfig(config: unknown) {
  const { customerLinksConfigSchema } = await createCustomerLinksSchemas();
  return customerLinksConfigSchema.safeParse(config);
}

// For backwards compatibility, export the schema creation function as default
export default createCustomerLinksSchemas;