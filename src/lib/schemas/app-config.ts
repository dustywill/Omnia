// Type definitions (for static typing)
export type AppConfig = {
  appSettings: AppSettings;
  logging: LoggingSettings;
  window?: WindowSettings;
  plugins: PluginConfigurations;
};

export type AppSettings = {
  version: string;
  debugMode: boolean;
  userName: string;
  theme: 'light' | 'dark' | 'system';
  pluginsDirectory: string;
  scriptsDirectory: string;
};

export type LoggingSettings = {
  level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
  prettyPrint: boolean;
  filePath: string;
};

export type WindowSettings = {
  width: number;
  height: number;
} | undefined;

export type PluginConfigurations = Record<string, any>;

// Default configuration values
export const defaultAppConfig: AppConfig = {
  appSettings: {
    version: '1.0.0',
    debugMode: false,
    userName: 'DefaultUser',
    theme: 'system',
    pluginsDirectory: 'plugins',
    scriptsDirectory: 'scripts',
  },
  logging: {
    level: 'info',
    prettyPrint: false,
    filePath: 'logs/ttcommander.log',
  },
  plugins: {},
};

// Browser-compatible schema factory
// Uses runtime validation instead of Zod in browser environments
export const createAppConfigSchemas = async () => {
  // Check if we're in a Node.js environment (main process or tests)
  const isNodeJS = typeof process !== 'undefined' && process.versions?.node !== undefined;
  // Check if we're in Electron renderer (window exists and electronAPI is available)
  const isElectronRenderer = typeof window !== 'undefined' && typeof (window as any).electronAPI !== 'undefined';
  
  if (isNodeJS && !isElectronRenderer) {
    console.log('[createAppConfigSchemas] Node.js environment detected, loading real Zod');
    return createZodSchemas();
  } else {
    console.log('[createAppConfigSchemas] Browser/Electron renderer environment detected, using proxy validation');
    return createBrowserCompatibleSchemas();
  }
};

// Simple browser-compatible validation (no Zod dependency)
const createBrowserCompatibleSchemas = async () => {
  // Use the node module loader to get Zod mock for the browser
  const { loadNodeModule } = await import('../../ui/node-module-loader.js');
  const zodModule = await loadNodeModule('zod') as any;
  const z = zodModule.z || zodModule.default || zodModule;
  
  console.log('[createBrowserCompatibleSchemas] Creating Zod schema using mock');
  
  // Create the same schema structure as the Node.js version but using the mock
  const AppSettingsSchema = z.object({
    version: z.string().default('0.1.0').describe('Application Version'),
    debugMode: z.boolean().default(false).describe('Enable Debug Mode'),
    userName: z.string().default('User').describe('User Name'),
    theme: z.enum(['light', 'dark', 'system']).default('system').describe('UI Theme'),
    pluginsDirectory: z.string().default('plugins').describe('Plugins Directory'),
    scriptsDirectory: z.string().default('scripts').describe('Scripts Directory'),
  }).describe('Application Settings');

  const LoggingSchema = z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info').describe('Log Level'),
    prettyPrint: z.boolean().default(false).describe('Pretty Print Console Logs'),
    filePath: z.string().default('logs/app.log').describe('Log File Path'),
  }).describe('Logging Settings');

  const WindowSchema = z.object({
    width: z.number().min(800).default(1200).describe('Window Width'),
    height: z.number().min(600).default(800).describe('Window Height'),
  }).optional().describe('Window Settings');

  const PluginsSchema = z.object({}).default({}).describe('Plugin Configurations');

  const AppConfigSchema = z.object({
    appSettings: AppSettingsSchema,
    logging: LoggingSchema,
    window: WindowSchema,
    plugins: PluginsSchema,
  });

  return {
    AppConfigSchema,
    AppSettingsSchema,
    LoggingSchema,
    WindowSchema,
    PluginsSchema,
    z
  };
};

// Full Zod schemas for Node.js environment
const createZodSchemas = async () => {
  try {
    // Dynamic import for Node.js
    const { z } = await import('zod');
    console.log('[createZodSchemas] Zod loaded successfully');

    /**
     * Application Settings Schema
     * Contains core application configuration options
     */
    const AppSettingsSchema = z.object({
      version: z.string().describe('Application Version'),
      debugMode: z.boolean().default(false).describe('Debug Mode'),
      userName: z.string().default('DefaultUser').describe('Username'),
      theme: z.enum(['light', 'dark', 'system']).default('system').describe('UI Theme'),
      pluginsDirectory: z.string().default('plugins').describe('Plugins Directory'),
      scriptsDirectory: z.string().default('scripts').describe('Scripts Directory'),
    });

    /**
     * Logging Settings Schema
     */
    const LoggingSchema = z.object({
      level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
        .default('info')
        .describe('Log Level'),
      prettyPrint: z.boolean().default(false).describe('Pretty Print Console Logs'),
      filePath: z.string().default('logs/ttcommander.log').describe('Log File Path'),
    });

    /**
     * Window Settings Schema
     */
    const WindowSchema = z.object({
      width: z.number().int().min(800).default(1024).describe('Window Width'),
      height: z.number().int().min(600).default(768).describe('Window Height'),
    });

    /**
     * Plugin Configurations Schema
     */
    const PluginsSchema = z.record(z.string(), z.object({}).passthrough())
      .default({})
      .describe('Plugin Configurations');

    /**
     * Main Application Configuration Schema
     */
    const AppConfigSchema = z.object({
      appSettings: AppSettingsSchema.describe('Application Settings'),
      logging: LoggingSchema.describe('Logging Settings'),
      window: WindowSchema.optional().describe('Window Settings'),
      plugins: PluginsSchema.describe('Plugin Configurations'),
    });

    return {
      AppConfigSchema,
      AppSettingsSchema,
      LoggingSchema,
      WindowSchema,
      PluginsSchema,
      z
    };
  } catch (error) {
    console.error('[createZodSchemas] Failed to load Zod, falling back to simple validation:', error);
    return createBrowserCompatibleSchemas();
  }
};

// Backwards compatibility - export the schema factory as the main export
export { createAppConfigSchemas as AppConfigSchema };