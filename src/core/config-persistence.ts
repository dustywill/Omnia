/**
 * Configuration Persistence Service
 * 
 * Provides persistent storage for plugin configurations, script editor content,
 * and other application state that needs to survive across sessions.
 */

import { createLogger } from './logger.js';

// Create logger with a default path for Node.js environments
let logPath: string;
try {
  logPath = typeof process !== 'undefined' && process.cwd ? 
    require('path').join(process.cwd(), 'logs', 'app.log') : 
    'logs/app.log';
} catch {
  logPath = 'logs/app.log';
}

const logger = createLogger('config-persistence', logPath);


export interface ConfigPersistenceOptions {
  pluginId: string;
  configType: 'plugin-config' | 'script-editor' | 'ui-state' | 'custom';
  autoSave?: boolean;
  debounceMs?: number;
}

export interface PersistedConfig {
  id: string;
  pluginId: string;
  configType: string;
  data: any;
  createdAt: string;
  updatedAt: string;
  version: string;
}

/**
 * Configuration persistence service that works in both browser and Electron environments
 */
export class ConfigPersistenceService {
  private debounceTimers: Map<string, NodeJS.Timeout> = new Map();
  private configCache: Map<string, PersistedConfig> = new Map();

  constructor() {
    logger.info('ConfigPersistenceService initialized');
  }

  /**
   * Get the appropriate storage mechanism based on environment
   */
  private getElectronAPI(): any {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return (window as any).electronAPI;
    }
    return null;
  }

  /**
   * Generate a unique key for configuration storage
   */
  private generateConfigKey(pluginId: string, configType: string, configId?: string): string {
    const parts = [pluginId, configType];
    if (configId) parts.push(configId);
    return parts.join(':');
  }


  /**
   * Save configuration to persistent storage
   */
  async saveConfig(
    options: ConfigPersistenceOptions,
    configId: string,
    data: any
  ): Promise<void> {
    const key = this.generateConfigKey(options.pluginId, options.configType, configId);
    const config: PersistedConfig = {
      id: configId,
      pluginId: options.pluginId,
      configType: options.configType,
      data,
      createdAt: this.configCache.get(key)?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    // Update cache
    this.configCache.set(key, config);

    // Handle debounced saving
    if (options.autoSave && options.debounceMs) {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(async () => {
        await this.persistConfig(config);
        this.debounceTimers.delete(key);
      }, options.debounceMs);

      this.debounceTimers.set(key, timer);
    } else {
      await this.persistConfig(config);
    }
  }

  /**
   * Load configuration from persistent storage
   */
  async loadConfig(
    options: ConfigPersistenceOptions,
    configId: string
  ): Promise<any | null> {
    const key = this.generateConfigKey(options.pluginId, options.configType, configId);
    
    // Check cache first
    const cached = this.configCache.get(key);
    if (cached) {
      return cached.data;
    }

    // Load from storage
    const config = await this.loadPersistedConfig(options.pluginId, options.configType, configId);
    if (config) {
      this.configCache.set(key, config);
      return config.data;
    }

    return null;
  }

  /**
   * Load all configurations for a plugin
   */
  async loadAllConfigs(
    pluginId: string,
    configType: string
  ): Promise<Record<string, any>> {
    const electronAPI = this.getElectronAPI();
    if (!electronAPI) {
      logger.warn('Electron API not available, cannot load plugin configurations');
      return {};
    }

    try {
      const configDir = `config/plugins/${pluginId}`;
      const configFile = `${configDir}/${configType}.json5`;
      
      const content = await electronAPI.readFile(configFile, { encoding: 'utf8' });
      const configs = await electronAPI.json5Parse(content);
      
      logger.info(`Loaded ${Object.keys(configs).length} configurations for ${pluginId}:${configType}`);
      return configs;
    } catch (error) {
      logger.debug(`No existing configurations found for ${pluginId}:${configType}`);
      return {};
    }
  }

  /**
   * Save all configurations for a plugin
   */
  async saveAllConfigs(
    pluginId: string,
    configType: string,
    configs: Record<string, any>
  ): Promise<void> {
    const electronAPI = this.getElectronAPI();
    if (!electronAPI) {
      logger.warn('Electron API not available, cannot save plugin configurations');
      return;
    }

    try {
      const configDir = `config/plugins/${pluginId}`;
      const configFile = `${configDir}/${configType}.json5`;
      
      // Ensure directory exists
      await electronAPI.mkdir(configDir, { recursive: true });
      
      // Save configurations
      const content = await electronAPI.json5Stringify(configs, null, 2);
      await electronAPI.writeFile(configFile, content);
      
      logger.info(`Saved ${Object.keys(configs).length} configurations for ${pluginId}:${configType}`);
    } catch (error) {
      logger.error(`Failed to save configurations for ${pluginId}:${configType}: ${error}`);
      throw error;
    }
  }

  /**
   * Delete a configuration
   */
  async deleteConfig(
    options: ConfigPersistenceOptions,
    configId: string
  ): Promise<void> {
    const key = this.generateConfigKey(options.pluginId, options.configType, configId);
    
    // Remove from cache
    this.configCache.delete(key);
    
    // Remove from persistent storage
    const configs = await this.loadAllConfigs(options.pluginId, options.configType);
    delete configs[configId];
    await this.saveAllConfigs(options.pluginId, options.configType, configs);
    
    logger.info(`Deleted configuration ${configId} for ${options.pluginId}:${options.configType}`);
  }

  /**
   * Persist a single configuration to storage
   */
  private async persistConfig(config: PersistedConfig): Promise<void> {
    const configs = await this.loadAllConfigs(config.pluginId, config.configType);
    configs[config.id] = config;
    await this.saveAllConfigs(config.pluginId, config.configType, configs);
  }

  /**
   * Load a single configuration from storage
   */
  private async loadPersistedConfig(
    pluginId: string,
    configType: string,
    configId: string
  ): Promise<PersistedConfig | null> {
    const configs = await this.loadAllConfigs(pluginId, configType);
    return configs[configId] || null;
  }

  /**
   * Clear all debounce timers (useful for cleanup)
   */
  clearDebounceTimers(): void {
    this.debounceTimers.forEach(timer => clearTimeout(timer));
    this.debounceTimers.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.configCache.size,
      keys: Array.from(this.configCache.keys())
    };
  }
}

// Global instance
export const configPersistence = new ConfigPersistenceService();

/**
 * React hook for persistent configuration
 */
// Note: React hooks are now in separate file - src/ui/hooks/useConfigPersistence.ts
// This file only contains the core service implementation


