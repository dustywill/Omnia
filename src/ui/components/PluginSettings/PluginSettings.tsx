/**
 * Plugin Settings Component
 * 
 * Provides settings management for individual plugins with schema-driven forms
 * and real-time validation based on plugin configuration schemas.
 */

import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../node-module-loader.js';
import { SchemaForm } from '../SchemaForm/SchemaForm.js';
import { Card } from '../Card/Card.js';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { PluginCard } from '../PluginCard/PluginCard.js';
import { Grid } from '../Grid/Grid.js';
import { SettingsManager } from '../../../core/settings-manager.js';
import { EnhancedPluginManager, type LoadedPlugin, PluginStatus } from '../../../core/enhanced-plugin-manager.js';
import styles from './PluginSettings.module.css';

export interface PluginSettingsProps {
  settingsManager: SettingsManager;
  pluginManager: EnhancedPluginManager;
  onSettingsChange?: (pluginId: string, settings: any) => void;
  className?: string;
  targetPluginId?: string; // If specified, show only this plugin's settings
}

interface PluginConfig {
  enabled: boolean;
  settings: Record<string, any>;
  schema?: any; // ZodSchema loaded dynamically
}

export function PluginSettings({ 
  settingsManager, 
  pluginManager, 
  onSettingsChange, 
  className = '',
  targetPluginId
}: PluginSettingsProps) {
  const [plugins, setPlugins] = useState<LoadedPlugin[]>([]);
  const [selectedPlugin, setSelectedPlugin] = useState<LoadedPlugin | null>(null);
  const [pluginConfig, setPluginConfig] = useState<PluginConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load plugins
  useEffect(() => {
    loadPlugins();
  }, [pluginManager]);
  
  // Auto-select target plugin if specified
  useEffect(() => {
    if (targetPluginId && plugins.length > 0) {
      const targetPlugin = plugins.find(p => p.manifest.id === targetPluginId);
      if (targetPlugin) {
        setSelectedPlugin(targetPlugin);
      }
    }
  }, [targetPluginId, plugins]);

  const loadPlugins = () => {
    try {
      const loadedPlugins = pluginManager.getLoadedPlugins();
      setPlugins(loadedPlugins);
      
      // Select first plugin by default
      if (loadedPlugins.length > 0 && !selectedPlugin) {
        setSelectedPlugin(loadedPlugins[0]);
      }
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugins');
    } finally {
      setLoading(false);
    }
  };

  // Load plugin configuration when selection changes
  useEffect(() => {
    if (selectedPlugin) {
      loadPluginConfig(selectedPlugin.manifest.id);
    }
  }, [selectedPlugin]);

  const loadPluginConfig = async (pluginId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load plugin registry to get enabled status
      const registry = await settingsManager.loadPluginRegistry();
      const registryEntry = registry.plugins[pluginId];
      
      // Load the actual plugin schema and configuration
      const schema = await createPluginSchema(selectedPlugin!);
      let settings = {};
      
      // Try to load the actual plugin configuration file
      if (selectedPlugin?.manifest.type !== 'simple') {
        try {
          settings = await settingsManager.loadPluginConfig(pluginId, schema);
        } catch (err) {
          // If config file doesn't exist, use defaults from schema
          console.log(`No config file found for ${pluginId}, using defaults`);
          if (schema && typeof schema.parse === 'function') {
            try {
              settings = schema.parse({});
            } catch (parseErr) {
              console.warn(`Failed to parse default config for ${pluginId}:`, parseErr);
              settings = {};
            }
          }
        }
      }
      
      const config: PluginConfig = {
        enabled: registryEntry?.enabled ?? true,
        settings,
        schema
      };

      setPluginConfig(config);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plugin configuration');
    } finally {
      setLoading(false);
    }
  };

  const handlePluginToggle = async (pluginId: string) => {
    try {
      const plugin = plugins.find(p => p.manifest.id === pluginId);
      if (!plugin) return;

      if (plugin.status === PluginStatus.ACTIVE) {
        await pluginManager.unloadPlugin(pluginId);
      } else {
        // Would need to implement plugin loading from directory
        // For now, just update the status
      }

      loadPlugins();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle plugin');
    }
  };

  const handleConfigSave = async (values: any, isValid: boolean) => {
    if (!isValid || !selectedPlugin || !pluginConfig) return;

    try {
      setSaving(true);
      setError(null);

      // Save the plugin configuration to the actual config file
      await settingsManager.savePluginConfig(
        selectedPlugin.manifest.id, 
        values, 
        pluginConfig.schema
      );

      // Update local state
      const updatedConfig: PluginConfig = {
        ...pluginConfig,
        settings: values
      };
      
      setPluginConfig(updatedConfig);
      onSettingsChange?.(selectedPlugin.manifest.id, values);

      // Show success message (you could add a success state for better UX)
      console.log(`Plugin ${selectedPlugin.manifest.id} configuration saved successfully`);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save plugin settings');
    } finally {
      setSaving(false);
    }
  };

  const handleEnableToggle = async () => {
    if (!selectedPlugin || !pluginConfig) return;

    try {
      setSaving(true);
      
      const newEnabled = !pluginConfig.enabled;
      
      // Update registry
      const registry = await settingsManager.loadPluginRegistry();
      registry.plugins[selectedPlugin.manifest.id] = {
        id: selectedPlugin.manifest.id,
        enabled: newEnabled,
        configPath: `plugins/${selectedPlugin.manifest.id}.json5`
      };
      
      await settingsManager.savePluginRegistry(registry);
      
      setPluginConfig({
        ...pluginConfig,
        enabled: newEnabled
      });

      // Toggle plugin if it's loaded
      if (newEnabled && selectedPlugin.status !== PluginStatus.ACTIVE) {
        // Would implement plugin loading here
      } else if (!newEnabled && selectedPlugin.status === PluginStatus.ACTIVE) {
        await pluginManager.unloadPlugin(selectedPlugin.manifest.id);
      }

      loadPlugins();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle plugin');
    } finally {
      setSaving(false);
    }
  };

  if (loading && plugins.length === 0) {
    return (
      <Card className={`${styles.pluginSettings} ${className}`}>
        <div className="text-center py-8">
          <p className="text-theme-secondary">Loading plugins...</p>
        </div>
      </Card>
    );
  }

  if (plugins.length === 0) {
    return (
      <Card className={`${styles.pluginSettings} ${className}`}>
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-theme-primary mb-2">No Plugins Found</h3>
          <p className="text-theme-secondary">No plugins are currently loaded.</p>
        </div>
      </Card>
    );
  }

  // For plugin-only mode (when targetPluginId is specified), render only the settings
  if (targetPluginId && selectedPlugin) {
    return (
      <div className={`${styles.pluginSettings} ${className}`}>
        {/* Plugin Settings Form for single plugin */}
        {pluginConfig && (
          <Card>
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-semibold text-theme-primary">
                  Plugin Configuration
                </h2>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-theme-secondary">
                    {pluginConfig.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <Button
                    onClick={handleEnableToggle}
                    variant={pluginConfig.enabled ? 'danger' : 'success'}
                    size="sm"
                    disabled={saving}
                  >
                    {pluginConfig.enabled ? 'Disable' : 'Enable'}
                  </Button>
                </div>
              </div>
              
              {selectedPlugin.manifest.type === 'simple' && (
                <p className="text-theme-secondary">
                  This is a simple plugin with no configurable settings.
                </p>
              )}
            </div>

            {pluginConfig.schema && selectedPlugin.manifest.type !== 'simple' && (
              <SchemaForm
                title=""
                schema={pluginConfig.schema}
                initialValues={pluginConfig.settings}
                onSubmit={handleConfigSave}
                loading={saving}
                submitLabel="Save Plugin Settings"
                showResetButton={true}
                realTimeValidation={true}
              />
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-95 border border-red-80 rounded-lg">
                <p className="text-danger text-sm">{error}</p>
              </div>
            )}
          </Card>
        )}
      </div>
    );
  }

  // Full mode with plugin list
  return (
    <div className={`${styles.pluginSettings} ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-theme-primary mb-2">Plugin Settings</h1>
        <p className="text-theme-secondary">
          Configure individual plugin settings and manage plugin states.
        </p>
      </div>

      <Grid cols={3} gap="lg">
        {/* Plugin List */}
        <div className={styles.pluginList}>
          <Card>
            <h2 className="text-lg font-semibold text-theme-primary mb-4">
              Installed Plugins ({plugins.length})
            </h2>
            
            <div className="space-y-3">
              {plugins.map((plugin) => (
                <div
                  key={plugin.manifest.id}
                  onClick={() => setSelectedPlugin(plugin)}
                  className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                    selectedPlugin?.manifest.id === plugin.manifest.id
                      ? 'border-action bg-blue-95'
                      : 'border-theme hover:border-neutral-60 hover:bg-theme-background'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-theme-primary">{plugin.manifest.name}</h3>
                    <Badge 
                      variant={
                        plugin.status === PluginStatus.ACTIVE ? 'success' :
                        plugin.status === PluginStatus.ERROR ? 'danger' :
                        plugin.status === PluginStatus.LOADING ? 'info' : 'secondary'
                      }
                      size="sm"
                    >
                      {plugin.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-theme-secondary line-clamp-2">
                    {plugin.manifest.description}
                  </p>
                  <div className="text-xs text-theme-secondary mt-2">
                    v{plugin.manifest.version} • {plugin.manifest.type}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Plugin Details & Settings */}
        <div className="col-span-2">
          {selectedPlugin ? (
            <div className="space-y-6">
              {/* Plugin Overview */}
              <PluginCard
                plugin={{
                  id: selectedPlugin.manifest.id,
                  name: selectedPlugin.manifest.name,
                  description: selectedPlugin.manifest.description,
                  version: selectedPlugin.manifest.version,
                  author: selectedPlugin.manifest.author,
                  status: selectedPlugin.status,
                  permissions: selectedPlugin.manifest.permissions,
                  lastUpdated: selectedPlugin.loadedAt
                }}
                onToggle={handlePluginToggle}
                onConfigure={() => {}}
              />

              {/* Plugin Settings Form */}
              {pluginConfig && (
                <Card>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-2">
                      <h2 className="text-xl font-semibold text-theme-primary">
                        Plugin Configuration
                      </h2>
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-theme-secondary">
                          {pluginConfig.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                        <Button
                          onClick={handleEnableToggle}
                          variant={pluginConfig.enabled ? 'danger' : 'success'}
                          size="sm"
                          disabled={saving}
                        >
                          {pluginConfig.enabled ? 'Disable' : 'Enable'}
                        </Button>
                      </div>
                    </div>
                    
                    {selectedPlugin.manifest.type === 'simple' && (
                      <p className="text-theme-secondary">
                        This is a simple plugin with no configurable settings.
                      </p>
                    )}
                  </div>

                  {pluginConfig.schema && selectedPlugin.manifest.type !== 'simple' && (
                    <SchemaForm
                      title=""
                      schema={pluginConfig.schema}
                      initialValues={pluginConfig.settings}
                      onSubmit={handleConfigSave}
                      loading={saving}
                      submitLabel="Save Plugin Settings"
                      showResetButton={true}
                      realTimeValidation={true}
                    />
                  )}

                  {error && (
                    <div className="mt-4 p-4 bg-red-95 border border-red-80 rounded-lg">
                      <p className="text-danger text-sm">{error}</p>
                    </div>
                  )}
                </Card>
              )}
            </div>
          ) : (
            <Card>
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-theme-primary mb-2">
                  Select a Plugin
                </h3>
                <p className="text-theme-secondary">
                  Choose a plugin from the list to view and configure its settings.
                </p>
              </div>
            </Card>
          )}
        </div>
      </Grid>
    </div>
  );
}

/**
 * Create a schema for plugin configuration based on plugin type
 */
async function createPluginSchema(plugin: LoadedPlugin): Promise<any> {
  try {
    const zodModule = await loadNodeModule<typeof import('zod')>('zod');
    const z = zodModule.z || zodModule.default || zodModule;
    
    // For simple plugins, return empty schema
    if (plugin.manifest.type === 'simple') {
      return z.object({});
    }
    
    // Load plugin-specific schemas for configured/advanced plugins
    const pluginId = plugin.manifest.id;
    
    try {
      // Try to load the specific plugin schema
      switch (pluginId) {
        case 'script-runner':
          const scriptModule = await import('../../../lib/schemas/plugins/script-runner.js');
          const { scriptRunnerConfigSchema } = await scriptModule.createScriptRunnerSchemas();
          return scriptRunnerConfigSchema;
          
        case 'as-built-documenter':
          const asBuiltModule = await import('../../../lib/schemas/plugins/as-built-documenter.js');
          const { asBuiltDocumenterConfigSchema } = await asBuiltModule.createAsBuiltDocumenterSchemas();
          return asBuiltDocumenterConfigSchema;
          
        case 'context-generator':
          const contextModule = await import('../../../lib/schemas/plugins/context-generator.js');
          const { contextGeneratorConfigSchema } = await contextModule.createContextGeneratorSchemas();
          return contextGeneratorConfigSchema;
          
        case 'customer-links':
          const customerModule = await import('../../../lib/schemas/plugins/customer-links.js');
          const { customerLinksConfigSchema } = await customerModule.createCustomerLinksSchemas();
          return customerLinksConfigSchema;
          
        default:
          // Try to load plugin config schema from plugin directory
          try {
            const configSchemaModule = await import(`../../../plugins/${pluginId}/config-schema.js`);
            if (configSchemaModule.createSchemas) {
              const schemas = await configSchemaModule.createSchemas();
              // Return the main config schema (usually the last one in the object)
              const schemaKeys = Object.keys(schemas);
              const configSchemaKey = schemaKeys.find(key => key.toLowerCase().includes('config'));
              if (configSchemaKey) {
                return schemas[configSchemaKey];
              }
              // Fallback to the first schema if no config schema found
              return schemas[schemaKeys[0]];
            }
            return configSchemaModule.default || z.object({});
          } catch (schemaError) {
            console.warn(`Could not load schema for plugin ${pluginId}:`, schemaError);
            // Fall back to a generic schema based on plugin type
            return createFallbackSchema(plugin, z);
          }
      }
    } catch (error) {
      console.warn(`Could not load specific schema for plugin ${pluginId}:`, error);
      // Fall back to a generic schema based on plugin type
      return createFallbackSchema(plugin, z);
    }
    
  } catch (error) {
    console.error('Failed to load Zod for plugin schema:', error);
    // Return a simple fallback schema
    return {
      parse: () => ({}),
      safeParse: () => ({ success: true, data: {} })
    };
  }
}

/**
 * Create a fallback schema when plugin-specific schema cannot be loaded
 */
function createFallbackSchema(plugin: LoadedPlugin, z: any): any {
  switch (plugin.manifest.type) {
    case 'configured':
      return z.object({
        enabled: z.boolean().default(true).describe('Enable this plugin'),
        title: z.string().min(1).default(plugin.manifest.name).describe('Display title'),
        refreshInterval: z.number().min(1000).max(60000).default(5000).describe('Refresh interval in milliseconds'),
      });
      
    case 'advanced':
      return z.object({
        enabled: z.boolean().default(true).describe('Enable this plugin'),
        logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info').describe('Plugin logging level'),
        maxRetries: z.number().min(0).max(10).default(3).describe('Maximum retry attempts'),
        timeout: z.number().min(1000).max(30000).default(10000).describe('Operation timeout in milliseconds'),
        enableMetrics: z.boolean().default(false).describe('Enable performance metrics collection'),
      });
      
    default:
      return z.object({});
  }
}