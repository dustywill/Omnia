import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { CardGrid, type CardGridItem } from './components/CardGrid.js';
import { EnhancedPluginManager, PluginType } from '../core/enhanced-plugin-manager.js';
import { ServiceRegistry } from '../core/service-registry.js';
import { createEventBus } from '../core/event-bus.js';
import { SettingsManager } from '../core/settings-manager.js';
import { loadNodeModule } from './node-module-loader.js';

export type EnhancedRendererOptions = {
  container: HTMLElement;
  pluginsPath: string;
  configPath?: string;
};

export type PluginInfo = {
  id: string;
  name: string;
  type: 'simple' | 'configured' | 'hybrid';
  enabled: boolean;
  manifest: any;
  config?: any;
};

const EnhancedPluginPanel: React.FC<{
  pluginInfo: PluginInfo;
  pluginManager: EnhancedPluginManager;
  serviceRegistry: ServiceRegistry;
  settingsManager: SettingsManager;
}> = ({ pluginInfo, pluginManager, serviceRegistry, settingsManager }) => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pluginComponent, setPluginComponent] = React.useState<React.ComponentType<any> | null>(null);
  
  console.log(`[EnhancedPluginPanel] Rendering plugin panel for: ${pluginInfo.id}`);
  
  React.useEffect(() => {
    if (!pluginInfo.enabled) {
      setLoading(false);
      return;
    }

    const loadPlugin = async () => {
      try {
        console.log(`[EnhancedPluginPanel] Loading plugin: ${pluginInfo.id}`);
        setError(null);
        
        // Load the plugin component
        const pluginModule = await pluginManager.loadPluginModule(pluginInfo.id);
        
        if (!pluginModule) {
          throw new Error(`Failed to load plugin module for ${pluginInfo.id}`);
        }
        
        // Get the default export (React component)
        const Component = pluginModule.default || pluginModule;
        
        if (!Component) {
          throw new Error(`Plugin ${pluginInfo.id} does not export a default component`);
        }
        
        setPluginComponent(() => Component);
        setLoading(false);
        
        console.log(`[EnhancedPluginPanel] Plugin ${pluginInfo.id} loaded successfully`);
        
      } catch (err) {
        console.error(`[EnhancedPluginPanel] Failed to load plugin ${pluginInfo.id}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    loadPlugin();
  }, [pluginInfo.id, pluginInfo.enabled, pluginManager]);
  
  if (!pluginInfo.enabled) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', opacity: 0.6 }}>
        <h3>{pluginInfo.name}</h3>
        <p>Plugin is disabled</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        <h3>Plugin Error: {pluginInfo.name}</h3>
        <p><strong>Error:</strong> {error}</p>
        <p><strong>Type:</strong> {pluginInfo.type}</p>
        <p><strong>ID:</strong> {pluginInfo.id}</p>
      </div>
    );
  }
  
  if (loading) {
    console.log(`[EnhancedPluginPanel] Rendering loading state for ${pluginInfo.id}`);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>{pluginInfo.name}</h3>
        <p>Loading {pluginInfo.type} plugin...</p>
      </div>
    );
  }
  
  if (!pluginComponent) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>{pluginInfo.name}</h3>
        <p>Plugin component not available</p>
      </div>
    );
  }
  
  console.log(`[EnhancedPluginPanel] Rendering component for ${pluginInfo.id}`);
  
  // Render the plugin component with appropriate props based on type
  const componentProps: any = {
    serviceRegistry,
    settingsManager,
  };
  
  // For configured and hybrid plugins, pass the configuration
  if (pluginInfo.type === 'configured' || pluginInfo.type === 'hybrid') {
    componentProps.config = pluginInfo.config;
  }
  
  return React.createElement(pluginComponent, componentProps);
};

export const initEnhancedRenderer = async (
  opts: EnhancedRendererOptions,
): Promise<Root> => {
  console.log('[initEnhancedRenderer] Starting enhanced renderer initialization');
  
  const path = await loadNodeModule<typeof import('path')>('path');
  const configPath = opts.configPath || await path.join(process.cwd(), 'config');
  
  // Initialize core systems
  console.log('[initEnhancedRenderer] Initializing settings manager');
  const settingsManager = new SettingsManager(configPath);
  
  console.log('[initEnhancedRenderer] Initializing service registry');
  const serviceRegistry = new ServiceRegistry(createEventBus(), {
    info: async (message: string) => console.log(message),
    warn: async (message: string) => console.warn(message),
    error: async (message: string) => console.error(message)
  });
  
  console.log('[initEnhancedRenderer] Initializing plugin manager');
  const pluginManager = new EnhancedPluginManager({
    pluginsDirectory: opts.pluginsPath,
    configDirectory: configPath,
    settingsManager,
    serviceRegistry,
  });
  
  // Discover and load plugin information
  console.log('[initEnhancedRenderer] Discovering plugins');
  await pluginManager.discoverPlugins();
  
  console.log('[initEnhancedRenderer] Loading plugin registry');
  const registry = await settingsManager.loadPluginRegistry();
  
  // Get plugin information for rendering
  const pluginInfos: PluginInfo[] = [];
  
  for (const [pluginId, registryEntry] of Object.entries(registry.plugins)) {
    try {
      const manifest = await pluginManager.loadManifest(pluginId);
      if (!manifest) {
        console.warn(`[initEnhancedRenderer] No manifest found for plugin: ${pluginId}`);
        continue;
      }
      
      let config = undefined;
      
      // Load configuration for configured and hybrid plugins  
      if (manifest.type === PluginType.CONFIGURED || manifest.type === PluginType.HYBRID) {
        try {
          const configSchema = await pluginManager.loadConfigSchema(pluginId);
          if (configSchema) {
            config = await settingsManager.loadPluginConfig(pluginId, configSchema);
          }
        } catch (err) {
          console.warn(`[initEnhancedRenderer] Failed to load config for ${pluginId}:`, err);
          // Use default config from plugin if available
          const pluginModule = await pluginManager.loadPluginModule(pluginId);
          config = pluginModule?.defaultConfig;
        }
      }
      
      pluginInfos.push({
        id: pluginId,
        name: manifest.name || pluginId,
        type: (manifest.type as 'simple' | 'configured' | 'hybrid') || 'simple',
        enabled: registryEntry.enabled !== false,
        manifest,
        config,
      });
      
    } catch (err) {
      console.error(`[initEnhancedRenderer] Failed to load plugin info for ${pluginId}:`, err);
    }
  }
  
  console.log(`[initEnhancedRenderer] Found ${pluginInfos.length} plugins:`, pluginInfos.map(p => `${p.id} (${p.type})`));
  
  // Initialize services for hybrid plugins
  console.log('[initEnhancedRenderer] Initializing plugin services');
  for (const pluginInfo of pluginInfos) {
    if (pluginInfo.enabled && (pluginInfo.type === 'hybrid' || pluginInfo.manifest.services)) {
      try {
        await pluginManager.initializeServices(pluginInfo.id);
        console.log(`[initEnhancedRenderer] Services initialized for ${pluginInfo.id}`);
      } catch (err) {
        console.error(`[initEnhancedRenderer] Failed to initialize services for ${pluginInfo.id}:`, err);
      }
    }
  }
  
  // Create card grid items
  const items: CardGridItem[] = pluginInfos.map((pluginInfo) => ({
    title: pluginInfo.name,
    content: React.createElement(EnhancedPluginPanel, {
      pluginInfo,
      pluginManager,
      serviceRegistry,
      settingsManager,
    }),
  }));

  const root = createRoot(opts.container);
  root.render(React.createElement(CardGrid, { items }));
  
  console.log('[initEnhancedRenderer] Enhanced renderer initialized successfully');
  return root;
};

// Legacy compatibility wrapper
export const initRenderer = initEnhancedRenderer;