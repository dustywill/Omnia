/**
 * Enhanced Plugin Manager with Service Registry and Three-Tier Architecture
 * 
 * Supports Simple, Configured, and Advanced plugin types with permission-based security
 * and inter-plugin communication through the service registry.
 */

import fs from 'fs/promises';
import JSON5 from 'json5';
import path from 'path';
import { pathToFileURL } from 'url';
import { EventBus, createEventBus } from './event-bus.js';
import { ServiceRegistry, ServiceDefinition } from './service-registry.js';
import { Logger } from './logger.js';
import { SettingsManager } from './settings-manager.js';

export enum PluginType {
  SIMPLE = 'simple',
  CONFIGURED = 'configured', 
  ADVANCED = 'advanced',
  HYBRID = 'hybrid'
}

export enum PluginStatus {
  INACTIVE = 'inactive',
  LOADING = 'loading',
  ACTIVE = 'active',
  ERROR = 'error'
}

export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description: string;
  author?: string;
  type: PluginType;
  main: string;
  permissions: string[];
  dependencies?: string[];
  services?: ServiceDefinition[];
  configSchema?: string; // Path to Zod schema file for configured plugins
}

export interface PluginContext {
  pluginId: string;
  config: any;
  eventBus: EventBus<Record<string, unknown>>;
  serviceRegistry: ServiceRegistry;
  permissions: string[];
  logger: Logger;
}

export interface SimplePlugin {
  component: React.ComponentType;
}

export interface ConfiguredPlugin {
  component: React.ComponentType<{ config: any }>;
  defaultConfig?: any;
  configSchema?: any; // Zod schema
}

export interface AdvancedPlugin {
  init(context: PluginContext): Promise<void> | void;
  stop?(context: PluginContext): Promise<void> | void;
  component?: React.ComponentType<{ context: PluginContext }>;
  services?: Record<string, any>; // Service implementations
}

export type PluginModule = SimplePlugin | ConfiguredPlugin | AdvancedPlugin;

export interface LoadedPlugin {
  manifest: PluginManifest;
  module: PluginModule;
  status: PluginStatus;
  context: PluginContext;
  error?: string;
  loadedAt?: Date;
}

export interface PluginManagerOptions {
  pluginsDirectory: string;
  configDirectory: string;
  settingsManager: SettingsManager;
  serviceRegistry: ServiceRegistry;
}

export class EnhancedPluginManager {
  private plugins = new Map<string, LoadedPlugin>();
  private pluginsDirectory: string;
  private settingsManager: SettingsManager;
  private eventBus: EventBus<Record<string, unknown>>;
  private serviceRegistry: ServiceRegistry;
  private logger: Logger;
  private fs: any;
  private path: any;

  constructor(options: PluginManagerOptions) {
    this.pluginsDirectory = options.pluginsDirectory;
    this.settingsManager = options.settingsManager;
    this.serviceRegistry = options.serviceRegistry;
    
    // Initialize default dependencies
    this.eventBus = createEventBus();
    this.logger = {
      info: async (message: string) => console.log(message),
      warn: async (message: string) => console.warn(message),
      error: async (message: string) => console.error(message)
    };
    
    this.initializeModules();

    this.logger.info('Enhanced Plugin Manager initialized');
  }

  private async initializeModules() {
    const { loadNodeModule } = await import('../ui/node-module-loader.js');
    this.fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
    this.path = await loadNodeModule<typeof import('path')>('path');
  }

  /**
   * Discover and load all plugins from the plugins directory
   */
  async discoverPlugins(): Promise<void> {
    this.logger.info(`Discovering plugins in: ${this.pluginsDirectory}`);
    
    try {
      const entries = await this.fs.readdir(this.pluginsDirectory, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const pluginPath = await this.path.join(this.pluginsDirectory, entry.name);
          try {
            await this.loadPlugin(pluginPath);
          } catch (error) {
            this.logger.error(`Failed to load plugin from ${pluginPath}: ${error}`);
          }
        }
      }
      
      this.logger.info(`Discovered ${this.plugins.size} plugins`);
    } catch (error) {
      this.logger.error(`Failed to discover plugins: ${error}`);
    }
  }

  /**
   * Load all plugins from the plugins directory  
   */
  async loadAllPlugins(): Promise<void> {
    this.logger.info('Starting plugin discovery and loading');

    try {
      const entries = await fs.readdir(this.pluginsDirectory, { withFileTypes: true });
      
      for (const entry of entries) {
        if (!entry.isDirectory()) continue;
        
        const pluginDir = path.join(this.pluginsDirectory, entry.name);
        await this.loadPlugin(pluginDir);
      }

      this.logger.info(`Plugin loading complete. Loaded ${this.plugins.size} plugins`);
      
      // Emit event for plugin discovery completion
      this.eventBus.publish('plugins:discovery-complete' as any, {
        totalPlugins: this.plugins.size,
        activePlugins: Array.from(this.plugins.values()).filter(p => p.status === PluginStatus.ACTIVE).length
      } as any);
      
    } catch (error) {
      this.logger.error(`Plugin discovery failed: ${error}`);
      throw error;
    }
  }

  /**
   * Load a single plugin from directory
   */
  async loadPlugin(pluginDir: string): Promise<void> {
    const manifestPath = path.join(pluginDir, 'plugin.json5');
    
    try {
      // Read and validate manifest
      const manifest = await this.readManifest(manifestPath);
      this.logger.info(`Loading plugin: ${manifest.id}`);

      // Check if plugin is already loaded
      if (this.plugins.has(manifest.id)) {
        this.logger.warn(`Plugin ${manifest.id} is already loaded`);
        return;
      }

      // Get plugin configuration from registry
      const registry = await this.settingsManager.loadPluginRegistry();
      const registryEntry = registry.plugins[manifest.id];
      const config = { enabled: registryEntry?.enabled ?? true, settings: {} };
      
      // Check if plugin is enabled
      if (!config.enabled) {
        this.logger.info(`Plugin ${manifest.id} is disabled, skipping load`);
        return;
      }

      // Validate permissions
      this.validatePluginPermissions(manifest);

      // Create plugin context
      const context: PluginContext = {
        pluginId: manifest.id,
        config: config.settings || {},
        eventBus: this.eventBus,
        serviceRegistry: this.serviceRegistry,
        permissions: manifest.permissions,
        logger: this.logger
      };

      // Create plugin entry with loading status
      const plugin: LoadedPlugin = {
        manifest,
        module: {} as PluginModule, // Will be set after loading
        status: PluginStatus.LOADING,
        context
      };

      this.plugins.set(manifest.id, plugin);
      this.eventBus.publish('plugin:loading' as any, { pluginId: manifest.id } as any);

      try {
        // Load the plugin module
        const modulePath = path.join(pluginDir, manifest.main);
        const moduleUrl = pathToFileURL(modulePath).href;
        const loadedModule = await import(moduleUrl);
        
        plugin.module = loadedModule.default || loadedModule;
        
        // Initialize plugin based on type
        await this.initializePlugin(plugin);
        
        plugin.status = PluginStatus.ACTIVE;
        plugin.loadedAt = new Date();
        
        this.logger.info(`Plugin ${manifest.id} loaded successfully`);
        this.eventBus.publish('plugin:loaded' as any, { 
          pluginId: manifest.id, 
          type: manifest.type,
          version: manifest.version 
        } as any);

      } catch (error) {
        plugin.status = PluginStatus.ERROR;
        plugin.error = error instanceof Error ? error.message : String(error);
        
        this.logger.error(`Failed to load plugin ${manifest.id}: ${error}`);
        this.eventBus.publish('plugin:error' as any, { 
          pluginId: manifest.id, 
          error: plugin.error 
        } as any);
      }

    } catch (error) {
      this.logger.error(`Failed to process plugin in ${pluginDir}: ${error}`);
    }
  }

  /**
   * Initialize plugin based on its type
   */
  private async initializePlugin(plugin: LoadedPlugin): Promise<void> {
    const { manifest, module, context } = plugin;

    switch (manifest.type) {
      case PluginType.SIMPLE:
        // Simple plugins just need their component to be available
        if (!('component' in module)) {
          throw new Error('Simple plugin must export a component');
        }
        break;

      case PluginType.CONFIGURED:
        // Configured plugins may have default config and schema
        if ('defaultConfig' in module && module.defaultConfig) {
          // Merge default config with user config
          context.config = { ...module.defaultConfig, ...context.config };
        }
        
        if (!('component' in module)) {
          throw new Error('Configured plugin must export a component');
        }
        break;

      case PluginType.ADVANCED:
        const advancedModule = module as AdvancedPlugin;
        
        // Register services if provided
        if (advancedModule.services && manifest.services) {
          for (const serviceDefinition of manifest.services) {
            const implementation = advancedModule.services[serviceDefinition.name];
            if (implementation) {
              await this.serviceRegistry.registerService(
                manifest.id,
                serviceDefinition,
                implementation,
                manifest.permissions
              );
            }
          }
        }

        // Call init method if provided
        if (advancedModule.init) {
          await advancedModule.init(context);
        }
        break;

      default:
        throw new Error(`Unknown plugin type: ${manifest.type}`);
    }
  }

  /**
   * Unload a plugin
   */
  async unloadPlugin(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    this.logger.info(`Unloading plugin: ${pluginId}`);

    try {
      // Stop advanced plugins
      if (plugin.manifest.type === PluginType.ADVANCED) {
        const advancedModule = plugin.module as AdvancedPlugin;
        if (advancedModule.stop) {
          await advancedModule.stop(plugin.context);
        }

        // Unregister services
        if (plugin.manifest.services) {
          for (const service of plugin.manifest.services) {
            await this.serviceRegistry.unregisterService(
              pluginId, 
              service.name, 
              service.version
            );
          }
        }
      }

      plugin.status = PluginStatus.INACTIVE;
      this.plugins.delete(pluginId);

      this.logger.info(`Plugin ${pluginId} unloaded successfully`);
      this.eventBus.publish('plugin:unloaded' as any, { pluginId } as any);

    } catch (error) {
      this.logger.error(`Failed to unload plugin ${pluginId}: ${error}`);
      throw error;
    }
  }

  /**
   * Get all loaded plugins
   */
  getLoadedPlugins(): LoadedPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get a specific loaded plugin
   */
  getPlugin(pluginId: string): LoadedPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Load plugin module by ID
   */
  async loadPluginModule(pluginId: string): Promise<any> {
    const plugin = this.plugins.get(pluginId);
    if (plugin) {
      return plugin.module;
    }

    // If not loaded yet, try to load it
    const pluginPath = await this.path.join(this.pluginsDirectory, pluginId);
    await this.loadPlugin(pluginPath);
    
    const loadedPlugin = this.plugins.get(pluginId);
    return loadedPlugin?.module;
  }

  /**
   * Load manifest from plugin directory
   */
  async loadManifest(pluginId: string): Promise<PluginManifest | null> {
    try {
      const pluginPath = await this.path.join(this.pluginsDirectory, pluginId);
      const manifestPath = await this.path.join(pluginPath, 'plugin.json5');
      
      try {
        const manifestContent = await this.fs.readFile(manifestPath, 'utf8');
        const JSON5 = await import('json5');
        return JSON5.parse(manifestContent) as PluginManifest;
      } catch {
        // Try .json extension
        const jsonManifestPath = await this.path.join(pluginPath, 'plugin.json');
        const manifestContent = await this.fs.readFile(jsonManifestPath, 'utf8');
        return JSON.parse(manifestContent) as PluginManifest;
      }
    } catch (error) {
      this.logger.warn(`Could not load manifest for plugin ${pluginId}: ${error}`);
      return null;
    }
  }

  /**
   * Load configuration schema for a plugin
   */
  async loadConfigSchema(pluginId: string): Promise<any> {
    const manifest = await this.loadManifest(pluginId);
    if (!manifest?.configSchema) {
      return null;
    }

    try {
      const pluginPath = await this.path.join(this.pluginsDirectory, pluginId);
      const schemaPath = await this.path.join(pluginPath, manifest.configSchema);
      
      // Import the schema module
      const schemaModule = await import(schemaPath);
      return schemaModule.default || schemaModule.configSchema;
    } catch (error) {
      this.logger.warn(`Could not load config schema for plugin ${pluginId}: ${error}`);
      return null;
    }
  }

  /**
   * Initialize services for a plugin
   */
  async initializeServices(pluginId: string): Promise<void> {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }

    const { manifest, module } = plugin;
    
    // Initialize services for hybrid plugins
    if (manifest.type === PluginType.HYBRID && manifest.services) {
      for (const service of manifest.services) {
        try {
          // Look for service class in the module
          const serviceClass = (module as any)[service.name] || (module as any)[`${service.name}Service`];
          if (serviceClass) {
            const serviceInstance = new serviceClass(plugin.context.config);
            
            // Register service methods
            const serviceDefinition: ServiceDefinition = {
              name: service.name,
              description: service.description || `Service from plugin ${pluginId}`,
              version: service.version || '1.0.0',
              methods: service.methods || [],
              permissions: manifest.permissions || []
            };
            
            await this.serviceRegistry.registerService(
              pluginId,
              serviceDefinition,
              serviceInstance,
              manifest.permissions || []
            );
          }
        } catch (error) {
          this.logger.error(`Failed to initialize service ${service.name} for plugin ${pluginId}: ${error}`);
        }
      }
    }
  }


  /**
   * Get plugins by status
   */
  getPluginsByStatus(status: PluginStatus): LoadedPlugin[] {
    return Array.from(this.plugins.values()).filter(p => p.status === status);
  }

  /**
   * Get plugin statistics
   */
  getPluginStats(): {
    total: number;
    byStatus: Record<PluginStatus, number>;
    byType: Record<PluginType, number>;
  } {
    const plugins = Array.from(this.plugins.values());
    
    const byStatus = {
      [PluginStatus.ACTIVE]: 0,
      [PluginStatus.INACTIVE]: 0,
      [PluginStatus.LOADING]: 0,
      [PluginStatus.ERROR]: 0
    };

    const byType = {
      [PluginType.SIMPLE]: 0,
      [PluginType.CONFIGURED]: 0,
      [PluginType.ADVANCED]: 0,
      [PluginType.HYBRID]: 0
    };

    plugins.forEach(plugin => {
      byStatus[plugin.status]++;
      byType[plugin.manifest.type]++;
    });

    return {
      total: plugins.length,
      byStatus,
      byType
    };
  }

  /**
   * Read and validate plugin manifest
   */
  private async readManifest(manifestPath: string): Promise<PluginManifest> {
    try {
      const content = await fs.readFile(manifestPath, 'utf8');
      const manifest = JSON5.parse(content) as PluginManifest;

      // Validate required fields
      if (!manifest.id || !manifest.name || !manifest.version || !manifest.type || !manifest.main) {
        throw new Error('Manifest missing required fields: id, name, version, type, main');
      }

      // Validate plugin type
      if (!Object.values(PluginType).includes(manifest.type)) {
        throw new Error(`Invalid plugin type: ${manifest.type}`);
      }

      // Set defaults
      manifest.permissions = manifest.permissions || [];
      manifest.dependencies = manifest.dependencies || [];

      return manifest;

    } catch (error) {
      throw new Error(`Failed to read manifest ${manifestPath}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Validate plugin permissions against system capabilities
   */
  private validatePluginPermissions(manifest: PluginManifest): void {
    const systemPermissions = [
      'filesystem:read',
      'filesystem:write', 
      'network:http',
      'system:exec',
      'plugins:communicate',
      'settings:read',
      'settings:write'
    ];

    const invalidPermissions = manifest.permissions.filter(
      permission => !systemPermissions.includes(permission)
    );

    if (invalidPermissions.length > 0) {
      throw new Error(`Plugin ${manifest.id} requests invalid permissions: ${invalidPermissions.join(', ')}`);
    }
  }
}