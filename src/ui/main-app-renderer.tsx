import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { AppNavigation } from './components/AppNavigation/AppNavigation.js';
import { DashboardView } from './views/DashboardView.js';
import { PluginsView } from './views/PluginsView.js';
import { SettingsView } from './views/SettingsView.js';
import { PluginDetailView } from './views/PluginDetailView.js';
import { EnhancedPluginManager } from '../core/enhanced-plugin-manager.js';
import { ServiceRegistry } from '../core/service-registry.js';
import { SettingsManager } from '../core/settings-manager.js';
import { createEventBus } from '../core/event-bus.js';
import { loadNodeModule } from './node-module-loader.js';

export type MainAppRendererOptions = {
  container: HTMLElement;
  pluginsPath: string;
  configPath?: string;
};

export type AppView = 'dashboard' | 'plugins' | 'settings' | 'plugin-detail';

export type PluginInfo = {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  type: 'simple' | 'configured' | 'hybrid';
  enabled: boolean;
  manifest: any;
  config?: any;
  status: 'active' | 'inactive' | 'error' | 'loading';
  permissions?: string[];
  lastUpdated?: Date;
};

const MainApp: React.FC<{
  pluginInfos: PluginInfo[];
  pluginManager: EnhancedPluginManager;
  serviceRegistry: ServiceRegistry;
  settingsManager: SettingsManager;
}> = ({ pluginInfos, pluginManager, serviceRegistry, settingsManager }) => {
  const [currentView, setCurrentView] = React.useState<AppView>('dashboard');
  const [selectedPluginId, setSelectedPluginId] = React.useState<string | null>(null);

  const handleViewChange = (view: 'dashboard' | 'plugins' | 'settings') => {
    setCurrentView(view);
    setSelectedPluginId(null);
  };

  const handlePluginSelect = (pluginId: string) => {
    setSelectedPluginId(pluginId);
    setCurrentView('plugin-detail');
  };


  const handleBackToPlugins = () => {
    setCurrentView('plugins');
    setSelectedPluginId(null);
  };

  const selectedPlugin = selectedPluginId 
    ? pluginInfos.find(p => p.id === selectedPluginId)
    : null;

  const mainStyle: React.CSSProperties = {
    display: 'flex',
    height: '100vh',
    fontFamily: "'Nunito Sans', sans-serif",
    backgroundColor: '#f8fafc'
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflow: 'hidden'
  };

  return (
    <div style={mainStyle}>
      <AppNavigation 
        currentView={currentView === 'plugin-detail' ? 'plugins' : currentView} 
        onViewChange={handleViewChange}
      />
      
      <main style={contentStyle}>
        {currentView === 'dashboard' && (
          <DashboardView 
            plugins={pluginInfos}
            onPluginSelect={handlePluginSelect}
            onPluginToggle={(pluginId) => {
              // TODO: Implement plugin toggle
              console.log('Toggle plugin:', pluginId);
            }}
            onPluginConfigure={(pluginId) => {
              // TODO: Navigate to plugin settings
              console.log('Configure plugin:', pluginId);
            }}
          />
        )}
        
        {currentView === 'plugins' && (
          <PluginsView 
            plugins={pluginInfos}
            onPluginSelect={handlePluginSelect}
            onPluginToggle={(pluginId) => {
              // TODO: Implement plugin toggle
              console.log('Toggle plugin:', pluginId);
            }}
            onPluginConfigure={(pluginId) => {
              // TODO: Navigate to plugin settings
              console.log('Configure plugin:', pluginId);
            }}
            onPluginRemove={(pluginId) => {
              // TODO: Implement plugin removal
              console.log('Remove plugin:', pluginId);
            }}
          />
        )}
        
        {currentView === 'settings' && (
          <SettingsView 
            settingsManager={settingsManager}
            plugins={pluginInfos}
          />
        )}
        
        {currentView === 'plugin-detail' && selectedPlugin && (
          <PluginDetailView 
            plugin={selectedPlugin}
            pluginManager={pluginManager}
            serviceRegistry={serviceRegistry}
            settingsManager={settingsManager}
            onBack={handleBackToPlugins}
          />
        )}
      </main>
    </div>
  );
};

export const initMainAppRenderer = async (
  opts: MainAppRendererOptions,
): Promise<Root> => {
  console.log('[initMainAppRenderer] Starting main application renderer initialization');
  
  const path = await loadNodeModule<typeof import('path')>('path');
  const configPath = opts.configPath || await path.join(process.cwd(), 'config');
  
  // Initialize core systems
  console.log('[initMainAppRenderer] Initializing settings manager');
  const settingsManager = new SettingsManager(configPath);
  await settingsManager.init();
  
  console.log('[initMainAppRenderer] Initializing service registry');
  const serviceRegistry = new ServiceRegistry(createEventBus(), {
    info: async (message: string) => console.log(message),
    warn: async (message: string) => console.warn(message),
    error: async (message: string) => console.error(message)
  });
  
  console.log('[initMainAppRenderer] Initializing plugin manager');
  const pluginManager = new EnhancedPluginManager({
    pluginsDirectory: opts.pluginsPath,
    configDirectory: configPath,
    settingsManager,
    serviceRegistry,
  });
  await pluginManager.init();
  
  // Discover and load plugin information
  console.log('[initMainAppRenderer] Discovering plugins');
  await pluginManager.discoverPlugins();
  
  console.log('[initMainAppRenderer] Loading plugin registry');
  const registry = await settingsManager.loadPluginRegistry();
  
  // Get plugin information for rendering
  const pluginInfos: PluginInfo[] = [];
  
  for (const [pluginId, registryEntry] of Object.entries(registry.plugins)) {
    try {
      const manifest = await pluginManager.loadManifest(pluginId);
      if (!manifest) {
        console.warn(`[initMainAppRenderer] No manifest found for plugin: ${pluginId}`);
        continue;
      }
      
      let config = undefined;
      let status: 'active' | 'inactive' | 'error' | 'loading' = registryEntry.enabled ? 'active' : 'inactive';
      
      // Load configuration for configured and hybrid plugins  
      if (manifest.type === 'configured' || manifest.type === 'hybrid') {
        try {
          // First try to load the default config from the plugin
          const pluginModule = await pluginManager.loadPluginModule(pluginId);
          config = pluginModule?.defaultConfig;
          
          // Then try to load and merge any saved configuration
          const configSchema = await pluginManager.loadConfigSchema(pluginId);
          if (configSchema) {
            const savedConfig = await settingsManager.loadPluginConfig(pluginId, configSchema);
            // Merge saved config with defaults if available
            if (savedConfig && config) {
              config = { ...config, ...savedConfig };
            } else if (savedConfig) {
              config = savedConfig;
            }
          }
        } catch (err) {
          console.warn(`[initMainAppRenderer] Failed to load config for ${pluginId}:`, err);
          // Keep status as active but use default config only
          try {
            const pluginModule = await pluginManager.loadPluginModule(pluginId);
            config = pluginModule?.defaultConfig;
            if (!config) {
              status = 'error';
            }
          } catch (moduleErr) {
            console.error(`[initMainAppRenderer] Failed to load plugin module for ${pluginId}:`, moduleErr);
            status = 'error';
          }
        }
      }
      
      pluginInfos.push({
        id: pluginId,
        name: manifest.name || pluginId,
        description: manifest.description || `${manifest.type} plugin`,
        version: manifest.version || '1.0.0',
        author: manifest.author,
        type: (manifest.type as 'simple' | 'configured' | 'hybrid') || 'simple',
        enabled: registryEntry.enabled !== false,
        manifest,
        config,
        status,
        permissions: manifest.permissions,
        lastUpdated: new Date(), // TODO: Get from file system
      });
      
    } catch (err) {
      console.error(`[initMainAppRenderer] Failed to load plugin info for ${pluginId}:`, err);
      // Add error plugin entry
      pluginInfos.push({
        id: pluginId,
        name: pluginId,
        description: 'Failed to load plugin',
        version: '0.0.0',
        type: 'simple',
        enabled: false,
        manifest: {},
        status: 'error',
      });
    }
  }
  
  console.log(`[initMainAppRenderer] Found ${pluginInfos.length} plugins:`, pluginInfos.map(p => `${p.id} (${p.type})`));
  
  // Initialize services for hybrid plugins
  console.log('[initMainAppRenderer] Initializing plugin services');
  for (const pluginInfo of pluginInfos) {
    if (pluginInfo.enabled && (pluginInfo.type === 'hybrid' || pluginInfo.manifest.services)) {
      try {
        await pluginManager.initializeServices(pluginInfo.id);
        console.log(`[initMainAppRenderer] Services initialized for ${pluginInfo.id}`);
      } catch (err) {
        console.error(`[initMainAppRenderer] Failed to initialize services for ${pluginInfo.id}:`, err);
        // Mark plugin as error
        const plugin = pluginInfos.find(p => p.id === pluginInfo.id);
        if (plugin) plugin.status = 'error';
      }
    }
  }

  const root = createRoot(opts.container);
  root.render(React.createElement(MainApp, {
    pluginInfos,
    pluginManager,
    serviceRegistry,
    settingsManager,
  }));
  
  console.log('[initMainAppRenderer] Main application renderer initialized successfully');
  return root;
};