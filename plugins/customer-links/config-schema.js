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

  // Customer site schema
  const CustomerSiteSchema = z.object({
    id: z.string().min(1, 'ID is required'),
    name: z.string().min(1, 'Name is required'),
    url: z.string().url('Must be a valid URL')
  });

  // Configuration schema for the Customer Links plugin
  const CustomerLinksConfigSchema = z.object({
    // File paths
    configFilePath: z.string()
      .default('config/customer-sites.json')
      .describe('Path to the customer sites configuration file'),
    
    outputDirectory: z.string()
      .default('output/customer-links')
      .describe('Directory where generated files will be saved'),
    
    // Display options
    title: z.string()
      .default('Customer Links')
      .describe('Title displayed on the generated page'),
    
    showDescription: z.boolean()
      .default(true)
      .describe('Show plugin description in the interface'),
    
    autoReload: z.boolean()
      .default(false)
      .describe('Automatically reload sites when file changes'),
    
    // Template customization
    htmlTemplate: z.enum(['simple', 'styled', 'cards'])
      .default('styled')
      .describe('HTML template style for generated output'),
    
    customCss: z.string()
      .default('')
      .describe('Custom CSS to include in generated files (optional)'),
    
    // Behavior options
    openAfterGenerate: z.boolean()
      .default(false)
      .describe('Open generated HTML file in browser after creation'),
    
    validateUrls: z.boolean()
      .default(true)
      .describe('Validate URLs when loading configuration'),
    
    maxSites: z.number()
      .min(1)
      .max(1000)
      .default(100)
      .describe('Maximum number of customer sites to display')
  });

  return { CustomerSiteSchema, CustomerLinksConfigSchema, z };
};

// For backwards compatibility, export the schema creation function as default
export default createSchemas;