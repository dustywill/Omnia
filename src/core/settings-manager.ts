/**
 * @fileoverview Settings Manager
 * Hybrid configuration system for Omnia with Zod validation and permissions
 */

import * as fs from 'fs/promises';
import * as fsSync from 'fs';
import * as path from 'path';
import JSON5 from 'json5';
import { z } from 'zod';
import { AppConfigSchema, type AppConfig, defaultAppConfig } from '../lib/schemas/app-config.js';
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
  public readonly appConfigPath: string;
  public readonly pluginRegistryPath: string;
  public readonly pluginConfigsDir: string;

  private watchers: Map<string, FileWatcher> = new Map();

  constructor(configDir: string) {
    this.configDir = configDir;
    this.appConfigPath = path.join(configDir, 'app.json5');
    this.pluginRegistryPath = path.join(configDir, 'plugins.json5');
    this.pluginConfigsDir = path.join(configDir, 'plugins');
  }

  /**
   * Load application configuration with schema validation
   */
  async loadAppConfig(): Promise<AppConfig> {
    try {
      const content = await fs.readFile(this.appConfigPath, 'utf8');
      const data = JSON5.parse(content);
      return AppConfigSchema.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // File doesn't exist, create default
        await this.saveAppConfig(defaultAppConfig);
        return defaultAppConfig;
      }
      throw error;
    }
  }

  /**
   * Save application configuration with validation
   */
  async saveAppConfig(config: AppConfig): Promise<void> {
    // Validate before saving
    const validatedConfig = AppConfigSchema.parse(config);
    
    // Ensure config directory exists
    await this.ensureConfigDir();
    
    // Write formatted JSON5
    const content = JSON5.stringify(validatedConfig, null, 2);
    await fs.writeFile(this.appConfigPath, content, 'utf8');
  }

  /**
   * Save app config with automatic backup
   */
  async saveAppConfigWithBackup(config: AppConfig): Promise<void> {
    // Create backup if original file exists
    try {
      await fs.access(this.appConfigPath);
      const backupPath = `${this.appConfigPath}.backup.${Date.now()}`;
      await fs.copyFile(this.appConfigPath, backupPath);
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
      const content = await fs.readFile(this.pluginRegistryPath, 'utf8');
      const data = JSON5.parse(content);
      
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
    const content = JSON5.stringify(registry, null, 2);
    await fs.writeFile(this.pluginRegistryPath, content, 'utf8');
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
    schema: z.ZodSchema<T>, 
    defaultConfig?: T
  ): Promise<T> {
    const configPath = path.join(this.pluginConfigsDir, `${pluginId}.json5`);
    
    try {
      const content = await fs.readFile(configPath, 'utf8');
      const data = JSON5.parse(content);
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
    schema: z.ZodSchema<T>
  ): Promise<void> {
    // Validate before saving
    const validatedConfig = schema.parse(config);
    
    // Ensure plugin configs directory exists
    await this.ensurePluginConfigsDir();
    
    // Write formatted JSON5
    const configPath = path.join(this.pluginConfigsDir, `${pluginId}.json5`);
    const content = JSON5.stringify(validatedConfig, null, 2);
    await fs.writeFile(configPath, content, 'utf8');
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
    schema?: z.ZodSchema<T>
  ): void {
    const configPath = path.join(this.pluginConfigsDir, `${pluginId}.json5`);
    this.watchFile(configPath, `plugin-${pluginId}`, async () => {
      try {
        if (schema) {
          const config = await this.loadPluginConfig(pluginId, schema);
          callback(config);
        } else {
          // Generic callback without schema validation
          const content = await fs.readFile(configPath, 'utf8');
          const data = JSON5.parse(content);
          callback(data);
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
        version: oldConfig.version || defaultAppConfig.appSettings.version,
        debugMode: oldConfig.debugMode ?? defaultAppConfig.appSettings.debugMode,
        userName: oldConfig.userName || defaultAppConfig.appSettings.userName,
        theme: oldConfig.theme || defaultAppConfig.appSettings.theme,
        pluginsDirectory: oldConfig.pluginsDirectory || defaultAppConfig.appSettings.pluginsDirectory,
        scriptsDirectory: oldConfig.scriptsDirectory || defaultAppConfig.appSettings.scriptsDirectory,
      },
      logging: {
        level: oldConfig.logLevel || oldConfig.logging?.level || defaultAppConfig.logging.level,
        prettyPrint: oldConfig.prettyPrint || oldConfig.logging?.prettyPrint || defaultAppConfig.logging.prettyPrint,
        filePath: oldConfig.logFile || oldConfig.logging?.filePath || defaultAppConfig.logging.filePath,
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
      await fs.mkdir(this.configDir, { recursive: true });
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
      await fs.mkdir(this.pluginConfigsDir, { recursive: true });
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
    const watcher = fsSync.watch(filePath, (eventType) => {
      if (eventType === 'change') {
        callback();
      }
    });

    this.watchers.set(watcherId, watcher);
  }
}