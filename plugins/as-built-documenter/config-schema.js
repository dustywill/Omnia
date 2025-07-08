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

  /**
   * TIER 1: Data Source Schema
   * Shared library of data endpoints that can be reused across multiple projects
   */
  const DataSourceSchema = z.object({
    id: z.string().min(1, 'Data source ID is required'),
    name: z.string().min(1, 'Data source name is required'),
    description: z.string().default(''),
    url: z.string().url('Must be a valid URL'),
    method: z.enum(['GET', 'POST']).default('GET'),
    headers: z.record(z.string()).default({}),
    auth: z.object({
      type: z.enum(['none', 'bearer', 'basic']).default('none'),
      credentials: z.record(z.string()).default({})
    }).default({ type: 'none', credentials: {} }),
    timeout: z.number().min(1000).max(30000).default(10000),
    retries: z.number().min(0).max(5).default(3),
    tags: z.array(z.string()).default([]),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  });

  /**
   * TIER 2: Template Schema
   * Shared library of documentation templates that can be reused across multiple projects
   */
  const TemplateSchema = z.object({
    id: z.string().min(1, 'Template ID is required'),
    name: z.string().min(1, 'Template name is required'),
    description: z.string().default(''),
    path: z.string().min(1, 'Template path is required'),
    engine: z.enum(['handlebars', 'simple']).default('simple'),
    outputFormat: z.enum(['markdown', 'html', 'text', 'pdf']).default('markdown'),
    requiredVariables: z.array(z.string()).default([]),
    optionalVariables: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    version: z.string().default('1.0.0'),
    author: z.string().default(''),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  });

  /**
   * Customer Information Schema
   */
  const CustomerInfoSchema = z.object({
    name: z.string().min(1, 'Customer name is required'),
    contactPerson: z.string().default(''),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().default(''),
    address: z.string().default(''),
    notes: z.string().default(''),
  });

  /**
   * Integrator Information Schema
   */
  const IntegratorInfoSchema = z.object({
    name: z.string().min(1, 'Integrator name is required'),
    contactPerson: z.string().default(''),
    contactEmail: z.string().email().optional(),
    contactPhone: z.string().default(''),
    address: z.string().default(''),
    notes: z.string().default(''),
  });

  /**
   * TIER 3: Project Schema
   * Projects combine data sources and templates with project-specific settings
   */
  const ProjectSchema = z.object({
    id: z.string().min(1, 'Project ID is required'),
    name: z.string().min(1, 'Project name is required'),
    description: z.string().default(''),
    customer: CustomerInfoSchema,
    integrator: IntegratorInfoSchema,
    dataSourceIds: z.array(z.string()).default([]),
    templateIds: z.array(z.string()).default([]),
    outputDirectory: z.string().default('output/projects'),
    variables: z.record(z.any()).default({}),
    status: z.enum(['active', 'inactive', 'completed', 'archived']).default('active'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    tags: z.array(z.string()).default([]),
    createdAt: z.string().datetime().optional(),
    updatedAt: z.string().datetime().optional(),
  });

  /**
   * Global Settings Schema
   */
  const GlobalSettingsSchema = z.object({
    connectionTimeout: z.number().min(1000).max(30000).default(10000),
    maxRetries: z.number().min(0).max(10).default(3),
    allowInsecureConnections: z.boolean().default(false),
    defaultTemplatesDirectory: z.string().default('templates/as-built'),
    defaultOutputDirectory: z.string().default('output/as-built-documenter'),
    includeTimestamp: z.boolean().default(true),
    formatOutput: z.boolean().default(true),
  });

  /**
   * Main As-Built Documenter Configuration Schema (Three-Tier Architecture)
   */
  const AsBuiltDocumenterConfigSchema = z.object({
    enabled: z.boolean()
      .default(true)
      .describe('Enable the As-Built Documenter plugin'),
    
    globalSettings: GlobalSettingsSchema
      .default({})
      .describe('Global plugin settings that apply to all projects'),
    
    dataSources: z.record(DataSourceSchema)
      .default({})
      .describe('Shared library of data sources that can be reused across multiple projects'),
    
    templates: z.record(TemplateSchema)
      .default({})
      .describe('Shared library of templates that can be reused across multiple projects'),
    
    projects: z.record(ProjectSchema)
      .default({})
      .describe('Projects that combine data sources and templates with project-specific settings'),
    
    activeProjectId: z.string()
      .optional()
      .describe('ID of the currently active project'),
    
    globalVariables: z.record(z.any())
      .default({})
      .describe('Global variables available for template substitution (e.g., {ipAddress})'),
  });

  return { 
    DataSourceSchema, 
    TemplateSchema, 
    ProjectSchema, 
    CustomerInfoSchema,
    IntegratorInfoSchema,
    GlobalSettingsSchema,
    AsBuiltDocumenterConfigSchema, 
    z 
  };
};

// For backwards compatibility, export the schema creation function as default
export default createSchemas;