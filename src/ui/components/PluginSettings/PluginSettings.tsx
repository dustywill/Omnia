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
  className = '' 
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
      
      // For now, use a simple configuration structure
      // In a full implementation, you'd load the actual plugin config file
      const config: PluginConfig = {
        enabled: registryEntry?.enabled ?? true,
        settings: {},
        schema: await createPluginSchema(selectedPlugin!)
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

      // Update plugin configuration
      const updatedConfig: PluginConfig = {
        ...pluginConfig,
        settings: values
      };

      // In a full implementation, you'd save this to the plugin's config file
      setPluginConfig(updatedConfig);
      onSettingsChange?.(selectedPlugin.manifest.id, values);

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
  // This would normally be loaded from the plugin's schema file
  // For now, create a basic schema based on plugin type
  
  try {
    const zodModule = await loadNodeModule<typeof import('zod')>('zod');
    const z = zodModule.z || zodModule.default || zodModule;
    
    switch (plugin.manifest.type) {
      case 'simple':
        return z.object({});
        
      case 'configured':
        return z.object({
          title: z.string().min(1).default(plugin.manifest.name).describe('Display title'),
          enabled: z.boolean().default(true).describe('Enable this plugin feature'),
          refreshInterval: z.number().min(1000).max(60000).default(5000).describe('Refresh interval in milliseconds'),
        });
        
      case 'advanced':
        return z.object({
          logLevel: z.enum(['error', 'warn', 'info', 'debug']).default('info').describe('Plugin logging level'),
          maxRetries: z.number().min(0).max(10).default(3).describe('Maximum retry attempts'),
          timeout: z.number().min(1000).max(30000).default(10000).describe('Operation timeout in milliseconds'),
          enableMetrics: z.boolean().default(false).describe('Enable performance metrics collection'),
        });
        
      default:
        return z.object({});
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