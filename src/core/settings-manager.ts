/**
 * @fileoverview Settings Manager
 * Hybrid configuration system for Omnia with Zod validation and permissions
 */

import type { AppConfig } from '../lib/schemas/app-config.js';
import type { PluginManifest } from '../lib/schemas/plugin-manifest.js';

/**
 * Plugin Registry Entry
 */
export interface PluginRegistryEntry {
  id: string;
  enabled: boolean;
  configPath: string;
}

/**
 * Plugin Registry Structure
 */
export interface PluginRegistry {
  plugins: Record<string, PluginRegistryEntry>;
}

/**
 * Permission Validation Result
 */
export interface PermissionValidationResult {
  allowed: string[];
  denied: string[];
}

/**
 * Configuration Change Callback
 */
export type ConfigChangeCallback<T = any> = (config: T) => void;

/**
 * File Watcher Interface
 */
interface FileWatcher {
  close(): void;
}

/**
 * Settings Manager
 * 
 * Manages hybrid configuration system:
 * - config/app.json5 - Main app settings
 * - config/plugins.json5 - Plugin registry & state  
 * - config/plugins/*.json5 - Individual plugin settings
 */
export class SettingsManager {
  public readonly configDir: string;
  public appConfigPath: string = '';
  public pluginRegistryPath: string = '';
  public pluginConfigsDir: string = '';

  private watchers: Map<string, FileWatcher> = new Map();
  private fs: any;
  private fsSync: any;
  private path: any;
  private JSON5: any;
  private AppConfigSchema: any;
  private defaultAppConfig: any;

  constructor(configDir: string) {
    this.configDir = configDir;
  }

  async init(): Promise<void> {
    await this.initializePaths(this.configDir);
    await this.initializeModules();
  }

  private async initializePaths(configDir: string) {
    const { loadNodeModule } = await import('../ui/node-module-loader.js');
    this.path = await loadNodeModule<typeof import('path')>('path');
    this.appConfigPath = this.path.join(configDir, 'app.json5');
    this.pluginRegistryPath = this.path.join(configDir, 'plugins.json5');
    this.pluginConfigsDir = this.path.join(configDir, 'plugins');
  }

  private async initializeModules() {
    const { loadNodeModule } = await import('../ui/node-module-loader.js');
    this.fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
    this.fsSync = await loadNodeModule<typeof import('fs')>('fs');
    this.JSON5 = await loadNodeModule<typeof import('json5')>('json5');
    
    // Load schemas dynamically
    const { createAppConfigSchemas, defaultAppConfig } = await import('../lib/schemas/app-config.js');
    const { AppConfigSchema } = await createAppConfigSchemas();
    this.AppConfigSchema = AppConfigSchema;
    this.defaultAppConfig = defaultAppConfig;
  }

  /**
   * Load application configuration with schema validation
   */
  async loadAppConfig(): Promise<AppConfig> {
    try {
      const content = await this.fs.readFile(this.appConfigPath, 'utf8');
      const data = await this.JSON5.parse(content);
      return this.AppConfigSchema.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create default
        await this.saveAppConfig(this.defaultAppConfig);
        return this.defaultAppConfig;
      }
      throw error;
    }
  }

  /**
   * Save application configuration with validation
   */
  async saveAppConfig(config: AppConfig): Promise<void> {
    // Validate before saving
    const validatedConfig = this.AppConfigSchema.parse(config);
    
    // Ensure config directory exists
    await this.ensureConfigDir();
    
    // Write formatted JSON5
    const content = this.JSON5.stringify(validatedConfig, null, 2);
    await this.fs.writeFile(this.appConfigPath, content, 'utf8');
  }

  /**
   * Save app config with automatic backup
   */
  async saveAppConfigWithBackup(config: AppConfig): Promise<void> {
    // Create backup if original file exists
    try {
      await this.fs.access(this.appConfigPath);
      const backupPath = `${this.appConfigPath}.backup.${Date.now()}`;
      await this.fs.copyFile(this.appConfigPath, backupPath);
    } catch {
      // Original file doesn't exist, no backup needed
    }

    await this.saveAppConfig(config);
  }

  /**
   * Load plugin registry
   */
  async loadPluginRegistry(): Promise<PluginRegistry> {
    try {
      const content = await this.fs.readFile(this.pluginRegistryPath, 'utf8');
      const data = await this.JSON5.parse(content);
      
      // Basic validation
      if (!data || typeof data !== 'object' || !data.plugins) {
        throw new Error('Invalid plugin registry format');
      }
      
      return data as PluginRegistry;
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create empty registry
        const emptyRegistry: PluginRegistry = { plugins: {} };
        await this.savePluginRegistry(emptyRegistry);
        return emptyRegistry;
      }
      throw error;
    }
  }

  /**
   * Save plugin registry
   */
  async savePluginRegistry(registry: PluginRegistry): Promise<void> {
    await this.ensureConfigDir();
    const content = this.JSON5.stringify(registry, null, 2);
    await this.fs.writeFile(this.pluginRegistryPath, content, 'utf8');
  }

  /**
   * Register a plugin in the registry
   */
  async registerPlugin(pluginId: string, entry: PluginRegistryEntry): Promise<void> {
    const registry = await this.loadPluginRegistry();
    registry.plugins[pluginId] = entry;
    await this.savePluginRegistry(registry);
  }

  /**
   * Unregister a plugin from the registry
   */
  async unregisterPlugin(pluginId: string): Promise<void> {
    const registry = await this.loadPluginRegistry();
    delete registry.plugins[pluginId];
    await this.savePluginRegistry(registry);
  }

  /**
   * Load plugin configuration with schema validation
   */
  async loadPluginConfig<T>(
    pluginId: string, 
    schema: any, 
    defaultConfig?: T
  ): Promise<T> {
    const configPath = this.path.join(this.pluginConfigsDir, `${pluginId}.json5`);
    
    try {
      const content = await this.fs.readFile(configPath, 'utf8');
      const data = await this.JSON5.parse(content);
      return schema.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT' && defaultConfig) {
        // File doesn't exist, create with defaults
        await this.savePluginConfig(pluginId, defaultConfig, schema);
        return defaultConfig;
      }
      throw error;
    }
  }

  /**
   * Save plugin configuration with schema validation
   */
  async savePluginConfig<T>(
    pluginId: string, 
    config: T, 
    schema: any
  ): Promise<void> {
    // Validate before saving
    const validatedConfig = schema.parse(config);
    
    // Ensure plugin configs directory exists
    await this.ensurePluginConfigsDir();
    
    // Write formatted JSON5
    const configPath = this.path.join(this.pluginConfigsDir, `${pluginId}.json5`);
    
    // Ensure we have a string to write
    let content: string;
    try {
      if (this.JSON5 && typeof this.JSON5.stringify === 'function') {
        // JSON5.stringify is synchronous and returns a string
        content = this.JSON5.stringify(validatedConfig, null, 2);
      } else {
        // Fallback to regular JSON if JSON5 is not available
        content = JSON.stringify(validatedConfig, null, 2);
      }
    } catch (error) {
      console.error('Error stringifying config:', error, validatedConfig);
      // Fallback to regular JSON if JSON5 fails
      try {
        content = JSON.stringify(validatedConfig, null, 2);
      } catch (jsonError) {
        console.error('JSON stringify also failed:', jsonError);
        content = '{}'; // Emergency fallback
      }
    }
    
    // Ensure content is a string (should always be true now)
    if (typeof content !== 'string') {
      console.error('Content is not a string:', typeof content, content);
      content = String(content);
    }
    
    await this.fs.writeFile(configPath, content, 'utf8');
  }

  /**
   * Validate permissions against plugin manifest
   */
  validatePermissions(
    _pluginId: string, 
    requestedPermissions: string[], 
    manifest: PluginManifest
  ): PermissionValidationResult {
    const allowedPermissions = manifest.permissions || [];
    
    const result: PermissionValidationResult = {
      allowed: [],
      denied: []
    };

    for (const permission of requestedPermissions) {
      if (allowedPermissions.includes(permission)) {
        result.allowed.push(permission);
      } else {
        result.denied.push(permission);
      }
    }

    return result;
  }

  /**
   * Check if plugin has specific permission
   */
  hasPermission(_pluginId: string, permission: string, manifest: PluginManifest): boolean {
    const allowedPermissions = manifest.permissions || [];
    return allowedPermissions.includes(permission);
  }

  /**
   * Watch app config file for changes
   */
  watchAppConfig(callback: ConfigChangeCallback<AppConfig>): void {
    this.watchFile(this.appConfigPath, 'app-config', async () => {
      try {
        const config = await this.loadAppConfig();
        callback(config);
      } catch (error) {
        console.error('Error reloading app config:', error);
      }
    });
  }

  /**
   * Watch plugin config file for changes
   */
  watchPluginConfig<T>(
    pluginId: string, 
    callback: ConfigChangeCallback<T>,
    schema?: any
  ): void {
    const configPath = this.path.join(this.pluginConfigsDir, `${pluginId}.json5`);
    this.watchFile(configPath, `plugin-${pluginId}`, async () => {
      try {
        if (schema) {
          const config = await this.loadPluginConfig(pluginId, schema);
          callback(config as T);
        } else {
          // Generic callback without schema validation
          const content = await this.fs.readFile(configPath, 'utf8');
          const data = await this.JSON5.parse(content);
          callback(data as T);
        }
      } catch (error) {
        console.error(`Error reloading plugin config for ${pluginId}:`, error);
      }
    });
  }

  /**
   * Stop all file watchers and cleanup
   */
  destroy(): void {
    this.watchers.forEach((watcher, _path) => {
      watcher.close();
    });
    this.watchers.clear();
  }

  /**
   * Migrate old config format to new hybrid format
   */
  async migrateOldConfig(oldConfig: any): Promise<AppConfig> {
    // Extract known app settings from old flat config
    const newConfig: AppConfig = {
      appSettings: {
        version: oldConfig.version || this.defaultAppConfig.appSettings.version,
        debugMode: oldConfig.debugMode ?? this.defaultAppConfig.appSettings.debugMode,
        userName: oldConfig.userName || this.defaultAppConfig.appSettings.userName,
        theme: oldConfig.theme || this.defaultAppConfig.appSettings.theme,
        pluginsDirectory: oldConfig.pluginsDirectory || this.defaultAppConfig.appSettings.pluginsDirectory,
        scriptsDirectory: oldConfig.scriptsDirectory || this.defaultAppConfig.appSettings.scriptsDirectory,
      },
      logging: {
        level: oldConfig.logLevel || oldConfig.logging?.level || this.defaultAppConfig.logging.level,
        prettyPrint: oldConfig.prettyPrint || oldConfig.logging?.prettyPrint || this.defaultAppConfig.logging.prettyPrint,
        filePath: oldConfig.logFile || oldConfig.logging?.filePath || this.defaultAppConfig.logging.filePath,
      },
      window: oldConfig.window || undefined,
      plugins: oldConfig.plugins || {}
    };

    // Save migrated config
    await this.saveAppConfig(newConfig);
    return newConfig;
  }

  /**
   * Ensure config directory exists
   */
  private async ensureConfigDir(): Promise<void> {
    try {
      await this.fs.mkdir(this.configDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Ensure plugin configs directory exists
   */
  private async ensurePluginConfigsDir(): Promise<void> {
    try {
      await this.fs.mkdir(this.pluginConfigsDir, { recursive: true });
    } catch (error: any) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }

  /**
   * Watch a file for changes
   */
  private watchFile(filePath: string, watcherId: string, callback: () => void): void {
    // Close existing watcher if any
    const existingWatcher = this.watchers.get(watcherId);
    if (existingWatcher) {
      existingWatcher.close();
    }

    // Create new watcher
    const watcher = this.fsSync.watch(filePath, (eventType: string) => {
      if (eventType === 'change') {
        callback();
      }
    });

    this.watchers.set(watcherId, watcher);
  }
}