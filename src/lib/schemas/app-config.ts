import { z } from 'zod';

/**
 * Application Settings Schema
 * Contains core application configuration options
 */
const AppSettingsSchema = z.object({
  /**
   * Current version of the application (read-only)
   */
  version: z.string().describe('Application Version'),
  
  /**
   * Enable application-wide debug features and verbose logging to console
   */
  debugMode: z.boolean().default(false).describe('Debug Mode'),
  
  /**
   * Username for identifying user activity (for logging/auditing purposes)
   */
  userName: z.string().default('DefaultUser').describe('Username'),
  
  /**
   * Select the user interface theme
   */
  theme: z.enum(['light', 'dark', 'system']).default('system').describe('UI Theme'),
  
  /**
   * Path to the directory containing ttCommander plugins (relative to app root or absolute)
   */
  pluginsDirectory: z.string().default('plugins').describe('Plugins Directory'),
  
  /**
   * The directory (relative to the application root) where PowerShell scripts are stored
   */
  scriptsDirectory: z.string().default('scripts').describe('Scripts Directory'),
});

/**
 * Logging Settings Schema
 * Configuration for application logging behavior
 */
const LoggingSchema = z.object({
  /**
   * Minimum log level to record. Affects both console and file logs
   */
  level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal'])
    .default('info')
    .describe('Log Level'),
  
  /**
   * Format console logs for easier readability (recommended for development)
   */
  prettyPrint: z.boolean().default(false).describe('Pretty Print Console Logs'),
  
  /**
   * Path to the log file, relative to the application root
   */
  filePath: z.string().default('logs/ttcommander.log').describe('Log File Path'),
});

/**
 * Window Settings Schema
 * Configuration for application window dimensions and state
 */
const WindowSchema = z.object({
  /**
   * Window width in pixels
   */
  width: z.number().int().min(800).default(1024).describe('Window Width'),
  
  /**
   * Window height in pixels
   */
  height: z.number().int().min(600).default(768).describe('Window Height'),
});

/**
 * Plugin Configurations Schema
 * Settings specific to installed plugins
 */
const PluginsSchema = z.record(z.string(), z.object({}).passthrough())
  .default({})
  .describe('Plugin Configurations');

/**
 * Main Application Configuration Schema
 * Complete schema for ttCommander configuration file (app-config.json5)
 */
export const AppConfigSchema = z.object({
  /**
   * Application Settings
   * Core application configuration options
   */
  appSettings: AppSettingsSchema.describe('Application Settings'),
  
  /**
   * Logging Settings
   * Configuration for application logging behavior
   */
  logging: LoggingSchema.describe('Logging Settings'),
  
  /**
   * Window Settings
   * Configuration for application window dimensions and state
   */
  window: WindowSchema.optional().describe('Window Settings'),
  
  /**
   * Plugin Configurations
   * Settings specific to installed plugins will appear here
   */
  plugins: PluginsSchema.describe('Plugin Configurations'),
});

// Type exports using z.infer
export type AppConfig = z.infer<typeof AppConfigSchema>;
export type AppSettings = z.infer<typeof AppSettingsSchema>;
export type LoggingSettings = z.infer<typeof LoggingSchema>;
export type WindowSettings = z.infer<typeof WindowSchema> | undefined;
export type PluginConfigurations = z.infer<typeof PluginsSchema>;

// Export individual schemas for potential reuse
export {
  AppSettingsSchema,
  LoggingSchema,
  WindowSchema,
  PluginsSchema,
};

// Default configuration values
export const defaultAppConfig: AppConfig = {
  appSettings: {
    version: '1.0.0', // This should be set by the application
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