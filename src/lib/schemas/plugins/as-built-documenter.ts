/**
 * Schema for As-Built Documenter plugin configuration
 * 
 * This schema defines the three-tier architecture for the As-Built Documenter plugin:
 * 1. Data Sources - Shared library of data endpoints
 * 2. Templates - Shared library of documentation templates  
 * 3. Projects - Combine data sources + templates with project-specific settings
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
   * TIER 1: Data Source Schema
   * Shared library of data endpoints that can be reused across multiple projects
   */
  const dataSourceSchema = z.object({
    /** Unique identifier for this data source */
    id: z.string().min(1, 'Data source ID is required').describe('Unique identifier for this data source'),
    
    /** Display name for this data source */
    name: z.string().min(1, 'Data source name is required').describe('Display name for this data source'),
    
    /** Description of what this data source provides */
    description: z.string().default('').describe('Description of what this data source provides'),
    
    /** URL to fetch data from - supports variable substitution like {ipAddress} */
    url: z.string().url('Must be a valid URL').describe('URL to fetch data from - supports variable substitution like {ipAddress}'),
    
    /** HTTP method for the request */
    method: z.enum(['GET', 'POST']).default('GET').describe('HTTP method for the request'),
    
    /** Request headers */
    headers: z.record(z.string()).default({}).describe('HTTP headers to include with the request'),
    
    /** Authentication configuration */
    auth: z.object({
      type: z.enum(['none', 'bearer', 'basic']).default('none').describe('Authentication type'),
      credentials: z.record(z.string()).default({}).describe('Authentication credentials (token, username, password)')
    }).default({ type: 'none', credentials: {} }).describe('Authentication configuration'),
    
    /** Request timeout in milliseconds */
    timeout: z.number().min(1000).max(30000).default(10000).describe('Request timeout in milliseconds'),
    
    /** Number of retry attempts on failure */
    retries: z.number().min(0).max(5).default(3).describe('Number of retry attempts on failure'),
    
    /** Tags for categorizing data sources */
    tags: z.array(z.string()).default([]).describe('Tags for categorizing this data source'),
    
    /** When this data source was created */
    createdAt: z.string().datetime().optional().describe('When this data source was created'),
    
    /** When this data source was last modified */
    updatedAt: z.string().datetime().optional().describe('When this data source was last modified'),
  }).describe('Shared data source configuration - can be reused across multiple projects');

  /**
   * TIER 2: Template Schema
   * Shared library of documentation templates that can be reused across multiple projects
   */
  const templateSchema = z.object({
    /** Unique identifier for this template */
    id: z.string().min(1, 'Template ID is required').describe('Unique identifier for this template'),
    
    /** Display name for this template */
    name: z.string().min(1, 'Template name is required').describe('Display name for this template'),
    
    /** Description of what this template generates */
    description: z.string().default('').describe('Description of what this template generates'),
    
    /** Path to the template file (relative to templates directory) */
    path: z.string().min(1, 'Template path is required').describe('Path to the template file (relative to templates directory)'),
    
    /** Template engine type */
    engine: z.enum(['handlebars', 'simple']).default('simple').describe('Template engine to use for processing'),
    
    /** Output format */
    outputFormat: z.enum(['markdown', 'html', 'text', 'pdf']).default('markdown').describe('Output format for generated documents'),
    
    /** Required variables that must be provided */
    requiredVariables: z.array(z.string()).default([]).describe('Variables that must be provided for this template'),
    
    /** Optional variables that can be provided */
    optionalVariables: z.array(z.string()).default([]).describe('Optional variables that can be provided'),
    
    /** Tags for categorizing templates */
    tags: z.array(z.string()).default([]).describe('Tags for categorizing this template'),
    
    /** Template version */
    version: z.string().default('1.0.0').describe('Template version'),
    
    /** Template author */
    author: z.string().default('').describe('Template author'),
    
    /** When this template was created */
    createdAt: z.string().datetime().optional().describe('When this template was created'),
    
    /** When this template was last modified */
    updatedAt: z.string().datetime().optional().describe('When this template was last modified'),
  }).describe('Shared template configuration - can be reused across multiple projects');

  /**
   * Customer Information Schema
   */
  const customerInfoSchema = z.object({
    /** Customer company name */
    name: z.string().min(1, 'Customer name is required').describe('Customer company name'),
    
    /** Primary contact person */
    contactPerson: z.string().default('').describe('Primary contact person'),
    
    /** Contact email */
    contactEmail: z.string().email().optional().describe('Contact email address'),
    
    /** Contact phone */
    contactPhone: z.string().default('').describe('Contact phone number'),
    
    /** Customer address */
    address: z.string().default('').describe('Customer address'),
    
    /** Additional customer notes */
    notes: z.string().default('').describe('Additional customer notes'),
  }).describe('Customer information');

  /**
   * Integrator Information Schema
   */
  const integratorInfoSchema = z.object({
    /** Integrator company name */
    name: z.string().min(1, 'Integrator name is required').describe('Integrator company name'),
    
    /** Primary contact person */
    contactPerson: z.string().default('').describe('Primary contact person'),
    
    /** Contact email */
    contactEmail: z.string().email().optional().describe('Contact email address'),
    
    /** Contact phone */
    contactPhone: z.string().default('').describe('Contact phone number'),
    
    /** Integrator address */
    address: z.string().default('').describe('Integrator address'),
    
    /** Additional integrator notes */
    notes: z.string().default('').describe('Additional integrator notes'),
  }).describe('Integrator information');

  /**
   * TIER 3: Project Schema
   * Projects combine data sources and templates with project-specific settings
   */
  const projectSchema = z.object({
    /** Unique identifier for this project */
    id: z.string().min(1, 'Project ID is required').describe('Unique identifier for this project'),
    
    /** Display name for this project */
    name: z.string().min(1, 'Project name is required').describe('Display name for this project'),
    
    /** Project description */
    description: z.string().default('').describe('Description of this project'),
    
    /** Customer information */
    customer: customerInfoSchema.describe('Customer information for this project'),
    
    /** Integrator information */
    integrator: integratorInfoSchema.describe('Integrator information for this project'),
    
    /** References to data source IDs used by this project */
    dataSourceIds: z.array(z.string()).default([]).describe('List of data source IDs to use for this project'),
    
    /** References to template IDs used by this project */
    templateIds: z.array(z.string()).default([]).describe('List of template IDs to use for this project'),
    
    /** Project-specific output directory */
    outputDirectory: z.string().default('output/projects').describe('Directory where generated documentation will be saved'),
    
    /** Project-specific variables for template substitution */
    variables: z.record(z.any()).default({}).describe('Project-specific variables for template substitution'),
    
    /** Project status */
    status: z.enum(['active', 'inactive', 'completed', 'archived']).default('active').describe('Current project status'),
    
    /** Project creation date */
    startDate: z.string().datetime().optional().describe('Project start date'),
    
    /** Project completion date */
    endDate: z.string().datetime().optional().describe('Project completion date'),
    
    /** Tags for categorizing projects */
    tags: z.array(z.string()).default([]).describe('Tags for categorizing this project'),
    
    /** When this project was created */
    createdAt: z.string().datetime().optional().describe('When this project was created'),
    
    /** When this project was last modified */
    updatedAt: z.string().datetime().optional().describe('When this project was last modified'),
  }).describe('Project configuration - combines data sources and templates with project-specific settings');

  /**
   * Global Settings Schema
   */
  const globalSettingsSchema = z.object({
    /** Default connection timeout for data sources in milliseconds */
    connectionTimeout: z.number()
      .min(1000)
      .max(30000)
      .default(10000)
      .describe('Default connection timeout for data sources in milliseconds'),
    
    /** Default maximum number of retry attempts for failed requests */
    maxRetries: z.number()
      .min(0)
      .max(10)
      .default(3)
      .describe('Default maximum number of retry attempts for failed requests'),
    
    /** Allow connections to insecure (non-HTTPS) endpoints */
    allowInsecureConnections: z.boolean()
      .default(false)
      .describe('Allow connections to insecure (non-HTTPS) endpoints'),
    
    /** Default directory containing documentation templates */
    defaultTemplatesDirectory: z.string()
      .default('templates/as-built')
      .describe('Default directory containing documentation templates'),
    
    /** Default output directory for generated documentation */
    defaultOutputDirectory: z.string()
      .default('output/as-built-documenter')
      .describe('Default output directory for generated documentation'),
    
    /** Include generation timestamp in documentation by default */
    includeTimestamp: z.boolean()
      .default(true)
      .describe('Include generation timestamp in documentation by default'),
    
    /** Format the generated documentation by default */
    formatOutput: z.boolean()
      .default(true)
      .describe('Format the generated documentation by default'),
  }).describe('Global plugin settings');

  /**
   * Main As-Built Documenter plugin configuration schema
   * Three-tier architecture: Data Sources → Templates → Projects
   */
  const asBuiltDocumenterConfigSchema = z.object({
    /** Enable or disable the entire plugin */
    enabled: z.boolean()
      .default(true)
      .describe('If unchecked, this plugin will be disabled on next startup.'),
    
    /** Global plugin settings */
    globalSettings: globalSettingsSchema
      .default({})
      .describe('Global plugin settings that apply to all projects'),
    
    /** TIER 1: Shared data sources library */
    dataSources: z.record(dataSourceSchema)
      .default({})
      .describe('Shared library of data sources that can be reused across multiple projects'),
    
    /** TIER 2: Shared templates library */
    templates: z.record(templateSchema)
      .default({})
      .describe('Shared library of templates that can be reused across multiple projects'),
    
    /** TIER 3: Projects that combine data sources and templates */
    projects: z.record(projectSchema)
      .default({})
      .describe('Projects that combine data sources and templates with project-specific settings'),
    
    /** Currently active project ID */
    activeProjectId: z.string()
      .optional()
      .describe('ID of the currently active project'),
    
    /** Global variables available for template substitution */
    globalVariables: z.record(z.any())
      .default({})
      .describe('Global variables available for template substitution (e.g., {ipAddress})'),
  }).describe('As-Built Documenter Three-Tier Configuration');

  return { 
    dataSourceSchema, 
    templateSchema, 
    projectSchema, 
    customerInfoSchema,
    integratorInfoSchema,
    globalSettingsSchema,
    asBuiltDocumenterConfigSchema, 
    z 
  };
};

// Export for backwards compatibility - will be loaded dynamically
export let asBuiltDocumenterConfigSchema: any = null;
export let DataSource: any = null;
export let Template: any = null;
export let Project: any = null;
export let CustomerInfo: any = null;
export let IntegratorInfo: any = null;
export let GlobalSettings: any = null;
export let AsBuiltDocumenterConfig: any = null;

/**
 * Default configuration for the As-Built Documenter plugin (Three-Tier Architecture)
 */
export const defaultAsBuiltDocumenterConfig = {
  enabled: true,
  globalSettings: {
    connectionTimeout: 10000,
    maxRetries: 3,
    allowInsecureConnections: false,
    defaultTemplatesDirectory: 'templates/as-built',
    defaultOutputDirectory: 'output/as-built-documenter',
    includeTimestamp: true,
    formatOutput: true,
  },
  dataSources: {},
  templates: {},
  projects: {},
  activeProjectId: undefined,
  globalVariables: {
    ipAddress: 'localhost'
  },
};

/**
 * Migrates legacy flat configuration to new three-tier architecture
 * @param legacyConfig - The old flat configuration
 * @returns Migrated three-tier configuration
 */
export function migrateLegacyConfig(legacyConfig: any) {
  const now = new Date().toISOString();
  
  // Create default project from legacy config
  const defaultProject = {
    id: 'migrated-project',
    name: legacyConfig.customerName || 'Migrated Project',
    description: 'Automatically migrated from legacy configuration',
    customer: {
      name: legacyConfig.customerName || 'Unknown Customer',
      contactPerson: '',
      contactEmail: undefined,
      contactPhone: '',
      address: '',
      notes: '',
    },
    integrator: {
      name: 'Unknown Integrator',
      contactPerson: '',
      contactEmail: undefined,
      contactPhone: '',
      address: '',
      notes: '',
    },
    dataSourceIds: [],
    templateIds: [],
    outputDirectory: legacyConfig.outputDirectory || 'output/as-built-documenter',
    variables: legacyConfig.variables || {},
    status: 'active' as const,
    startDate: now,
    endDate: undefined,
    tags: ['migrated'],
    createdAt: now,
    updatedAt: now,
  };

  // Migrate data sources
  const dataSources: Record<string, any> = {};
  if (legacyConfig.dataSources && Array.isArray(legacyConfig.dataSources)) {
    legacyConfig.dataSources.forEach((ds: any, index: number) => {
      const id = ds.id || `data-source-${index}`;
      dataSources[id] = {
        id,
        name: ds.name || ds.id || `Data Source ${index + 1}`,
        description: ds.description || '',
        url: ds.url,
        method: 'GET',
        headers: {},
        auth: {
          type: 'none',
          credentials: {}
        },
        timeout: ds.timeout || 10000,
        retries: ds.retries || 3,
        tags: ['migrated'],
        createdAt: now,
        updatedAt: now,
      };
      (defaultProject.dataSourceIds as string[]).push(id);
    });
  }

  // Migrate template
  const templates: Record<string, any> = {};
  if (legacyConfig.templatePath) {
    const templateId = 'migrated-template';
    templates[templateId] = {
      id: templateId,
      name: 'Migrated Template',
      description: 'Automatically migrated from legacy configuration',
      path: legacyConfig.templatePath,
      engine: 'simple',
      outputFormat: 'markdown',
      requiredVariables: [],
      optionalVariables: [],
      tags: ['migrated'],
      version: '1.0.0',
      author: 'Migration Tool',
      createdAt: now,
      updatedAt: now,
    };
    (defaultProject.templateIds as string[]).push(templateId);
  }

  // Create new three-tier configuration
  return {
    enabled: legacyConfig.enabled !== false,
    globalSettings: {
      connectionTimeout: legacyConfig.connectionTimeout || 10000,
      maxRetries: legacyConfig.maxRetries || 3,
      allowInsecureConnections: legacyConfig.allowInsecureConnections || false,
      defaultTemplatesDirectory: legacyConfig.templatesDirectory || 'templates/as-built',
      defaultOutputDirectory: legacyConfig.outputDirectory || 'output/as-built-documenter',
      includeTimestamp: legacyConfig.includeTimestamp !== false,
      formatOutput: legacyConfig.formatOutput !== false,
    },
    dataSources,
    templates,
    projects: {
      'migrated-project': defaultProject
    },
    activeProjectId: 'migrated-project',
    globalVariables: legacyConfig.variables || { ipAddress: 'localhost' },
  };
}

/**
 * Detects if configuration is legacy format
 * @param config - Configuration to check
 * @returns True if legacy format detected
 */
export function isLegacyConfig(config: any): boolean {
  return config && (
    Array.isArray(config.dataSources) ||
    typeof config.templatePath === 'string' ||
    typeof config.customerName === 'string'
  );
}

/**
 * Validates and parses an As-Built Documenter configuration object
 * Automatically migrates legacy configurations
 * @param config - The configuration object to validate
 * @returns Parsed and validated configuration
 * @throws ZodError if validation fails
 */
export async function parseAsBuiltDocumenterConfig(config: unknown) {
  const { asBuiltDocumenterConfigSchema } = await createAsBuiltDocumenterSchemas();
  
  // Check if this is a legacy configuration and migrate it
  if (isLegacyConfig(config)) {
    console.log('[parseAsBuiltDocumenterConfig] Legacy configuration detected, migrating to three-tier architecture');
    config = migrateLegacyConfig(config);
  }
  
  return asBuiltDocumenterConfigSchema.parse(config);
}

/**
 * Safely validates an As-Built Documenter configuration object
 * Automatically migrates legacy configurations
 * @param config - The configuration object to validate
 * @returns Success result with parsed config or error result with validation issues
 */
export async function validateAsBuiltDocumenterConfig(config: unknown) {
  const { asBuiltDocumenterConfigSchema } = await createAsBuiltDocumenterSchemas();
  
  // Check if this is a legacy configuration and migrate it
  if (isLegacyConfig(config)) {
    console.log('[validateAsBuiltDocumenterConfig] Legacy configuration detected, migrating to three-tier architecture');
    config = migrateLegacyConfig(config);
  }
  
  return asBuiltDocumenterConfigSchema.safeParse(config);
}

// For backwards compatibility, export the schema creation function as default
export default createAsBuiltDocumenterSchemas;