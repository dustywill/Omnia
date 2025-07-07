import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../node-module-loader.js';
import { SettingsManager } from '../../core/settings-manager.js';
import { type PluginInfo } from '../main-app-renderer.js';
import { SchemaForm } from '../components/SchemaForm/SchemaForm.js';
import { PluginSettings } from '../components/PluginSettings/PluginSettings.js';
import styles from './SettingsView.module.css';

// We'll initialize the demo schema dynamically to avoid direct zod imports
let DemoConfigSchema: any = null;
let defaultDemoConfig: any = null;

const initializeDemoSchema = async () => {
  if (DemoConfigSchema) return DemoConfigSchema;
  
  try {
    const zodModule = await loadNodeModule<typeof import('zod')>('zod');
    const z = zodModule.z || zodModule.default || zodModule;
  
  DemoConfigSchema = z.object({
    displaySettings: z.object({
      theme: z.enum(['light', 'dark', 'auto']).default('auto').describe('Choose your preferred color theme'),
      fontSize: z.number().min(12).max(24).default(14).describe('Base font size in pixels'),
      compactMode: z.boolean().default(false).describe('Enable compact interface layout'),
      showTooltips: z.boolean().default(true).describe('Show helpful tooltips')
    }).describe('User interface display preferences'),
    
    performance: z.object({
      maxConcurrentTasks: z.number().min(1).max(10).default(3).describe('Maximum number of tasks to run simultaneously'),
      cacheSize: z.number().min(10).max(1000).default(100).describe('Cache size in MB'),
      enableLazyLoading: z.boolean().default(true).describe('Load content only when needed')
    }).describe('Performance and resource settings'),
    
    notifications: z.object({
      enableSounds: z.boolean().default(true).describe('Play notification sounds'),
      level: z.enum(['all', 'important', 'none']).default('important').describe('Which notifications to show'),
      emailUpdates: z.boolean().default(false).describe('Receive email notifications')
    }).describe('Notification preferences'),
    
    advanced: z.object({
      debugMode: z.boolean().default(false).describe('Enable detailed logging and debug features'),
      experimentalFeatures: z.boolean().default(false).describe('Enable experimental features (may be unstable)'),
      customApiEndpoint: z.string().url().optional().describe('Custom API endpoint URL'),
      tags: z.array(z.string()).default(['production']).describe('Environment tags')
    }).describe('Advanced configuration options')
  });

    defaultDemoConfig = DemoConfigSchema.parse({});
    return DemoConfigSchema;
  } catch (error) {
    console.error('Failed to load Zod for demo schema:', error);
    // Return a simple fallback schema
    return {
      parse: () => ({}),
      safeParse: () => ({ success: true, data: {} })
    };
  }
};

type SettingsSection = 'app-config' | 'demo-config' | 'plugin-config' | 'system-info' | string;

export interface SettingsViewProps {
  settingsManager: SettingsManager;
  plugins: PluginInfo[];
  pluginManager?: any; // EnhancedPluginManager - using any to avoid import issues
  navigationTarget?: {
    pluginId: string;
    focusEditor?: boolean;
  } | null;
  viewMode?: 'full' | 'plugin-only'; // New prop to control view mode
  targetPluginId?: string | null; // Specific plugin to show in plugin-only mode
}

export function SettingsView({ 
  settingsManager, 
  plugins, 
  pluginManager, 
  navigationTarget, 
  viewMode = 'full',
  targetPluginId 
}: SettingsViewProps) {
  // Navigation state
  const [activeSection, setActiveSection] = useState<SettingsSection>('app-config');
  
  // App configuration (typed object and schema)
  const [appConfig, setAppConfig] = useState<any>(null);
  const [appConfigSchema, setAppConfigSchema] = useState<any>(null);
  
  // Demo configuration (typed object)
  const [demoConfig, setDemoConfig] = useState<any>(null);
  const [demoSchema, setDemoSchema] = useState<any>(null);
  
  // Plugin configuration (handled by PluginSettings component)
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [autoOpenedPlugin, setAutoOpenedPlugin] = useState<string | null>(null);

  // Initialize schemas and load configurations
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize demo schema
        const demoSchemaInstance = await initializeDemoSchema();
        setDemoSchema(demoSchemaInstance);
        setDemoConfig(defaultDemoConfig);
        
        // Load app configuration schema using Zod mock
        const zodModule = await loadNodeModule('zod');
        const z = zodModule.z || zodModule.default || zodModule;
        
        // Create a proper schema for the app configuration
        const appConfigSchema = z.object({
          appSettings: z.object({
            version: z.string().default('0.1.0').describe('Application Version'),
            debugMode: z.boolean().default(false).describe('Enable Debug Mode'),
            userName: z.string().default('User').describe('User Name'),
            theme: z.enum(['light', 'dark', 'system']).default('system').describe('UI Theme'),
            pluginsDirectory: z.string().default('plugins').describe('Plugins Directory'),
            scriptsDirectory: z.string().default('scripts').describe('Scripts Directory'),
          }).describe('Application Settings'),
          logging: z.object({
            level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info').describe('Log Level'),
            prettyPrint: z.boolean().default(false).describe('Pretty Print Console Logs'),
            filePath: z.string().default('logs/app.log').describe('Log File Path'),
          }).describe('Logging Settings'),
          window: z.object({
            width: z.number().min(800).default(1200).describe('Window Width'),
            height: z.number().min(600).default(800).describe('Window Height'),
          }).optional().describe('Window Settings'),
          plugins: z.object({}).default({}).describe('Plugin Configurations'),
        });
        
        setAppConfigSchema(appConfigSchema);
        
        // Load app configuration
        const config = await settingsManager.loadAppConfig();
        // Reduced logging verbosity for routine operations
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.debug('[SettingsView] Loaded app config:', config);
        }
        setAppConfig(config);
      } catch (error) {
        console.error('Failed to initialize:', error);
        setAppConfig({});
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [settingsManager]);

  // Plugin configuration is now handled by PluginSettings component

  // Handle navigation target (auto-open plugin configuration)
  useEffect(() => {
    if (navigationTarget?.pluginId && 
        navigationTarget.pluginId !== autoOpenedPlugin) {
      console.log('[SettingsView] Auto-opening plugin configuration:', navigationTarget.pluginId);
      setActiveSection('plugin-config');
      setAutoOpenedPlugin(navigationTarget.pluginId);
    }
  }, [navigationTarget?.pluginId, autoOpenedPlugin]);

  const handleSaveAppConfig = async (config: any, isValid: boolean) => {
    if (!isValid) {
      setSaveMessage('Please fix validation errors before saving.');
      return;
    }

    try {
      setIsSaving(true);
      await settingsManager.saveAppConfig(config);
      setAppConfig(config); // Update local state
      setSaveMessage('Application configuration saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save app config:', error);
      setSaveMessage('Failed to save configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDemoConfig = async (config: any, isValid: boolean) => {
    if (!isValid) {
      setSaveMessage('Please fix validation errors before saving.');
      return;
    }

    try {
      setIsSaving(true);
      // For demo purposes, just update local state
      setDemoConfig(config);
      setSaveMessage('Demo configuration saved successfully! (This is a demonstration - not saved to disk)');
      
      // Clear message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save demo config:', error);
      setSaveMessage('Failed to save configuration: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  // Plugin configuration saving is now handled by PluginSettings component
  const renderSidebarContent = () => {
    const sidebarItems = [
      {
        id: 'app-config' as SettingsSection,
        label: 'Application Settings',
        icon: '⚙️',
        section: 'Core Settings'
      },
      {
        id: 'demo-config' as SettingsSection,
        label: 'Demo Configuration',
        icon: '🚀',
        section: 'Core Settings'
      },
      {
        id: 'plugin-config' as SettingsSection,
        label: 'Plugin Settings',
        icon: '🔌',
        section: 'Plugin Settings',
        badge: plugins.length.toString()
      },
      {
        id: 'system-info' as SettingsSection,
        label: 'System Information',
        icon: '📊',
        section: 'System'
      }
    ];

    // Plugin selection is now handled within PluginSettings component
    const allItems = sidebarItems;
    const sections = ['Core Settings', 'Plugin Settings', 'System'];

    return (
      <div className={styles.sidebar}>
        {sections.map(section => (
          <div key={section} className={styles.sidebarSection}>
            <h3 className={styles.sidebarSectionTitle}>{section}</h3>
            {allItems
              .filter(item => item.section === section)
              .map(item => (
                <div
                  key={item.id}
                  className={`${styles.sidebarItem} ${activeSection === item.id ? styles.active : ''}`}
                  onClick={() => setActiveSection(item.id)}
                >
                  <span className={styles.sidebarItemIcon}>{item.icon}</span>
                  <span className={styles.sidebarItemText}>{item.label}</span>
                  {(item as any).badge && (
                    <span className={styles.sidebarItemBadge}>{(item as any).badge}</span>
                  )}
                </div>
              ))}
          </div>
        ))}
      </div>
    );
  };

  const renderMainContent = () => {
    switch (activeSection) {
      case 'app-config':
        return (
          <div className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>Application Configuration</h2>
              <p className={styles.contentDescription}>
                Configure main application settings using a schema-driven form with validation.
              </p>
            </div>
            <div className={styles.contentBody}>
              {isLoading ? (
                <div className="text-gray-500">Loading configuration...</div>
              ) : appConfigSchema && appConfig ? (
                <div>
                  <SchemaForm
                    title="Application Settings"
                    description=""
                    schema={appConfigSchema}
                    initialValues={appConfig}
                    onSubmit={handleSaveAppConfig}
                    mode="hybrid"
                    defaultMode="form"
                    submitLabel="Save Application Configuration"
                    loading={isSaving}
                    compact={false}
                  />
                  
                  {saveMessage && saveMessage.includes('Application') && (
                    <div className={`mt-4 p-3 rounded-md text-sm ${
                      saveMessage.includes('success') 
                        ? 'bg-green-50 text-green-700 border border-green-200' 
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {saveMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Loading application configuration...</div>
              )}
            </div>
          </div>
        );

      case 'demo-config':
        return (
          <div className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>Demo Configuration</h2>
              <p className={styles.contentDescription}>
                Schema-driven form with hybrid form/JSON editing mode. Toggle between views to see both form fields and raw JSON editing.
              </p>
            </div>
            <div className={styles.contentBody}>
              {demoSchema && demoConfig ? (
                <div>
                  <SchemaForm
                    title="Configuration Settings"
                    description=""
                    schema={demoSchema}
                    initialValues={demoConfig}
                    onSubmit={handleSaveDemoConfig}
                    mode="hybrid"
                    defaultMode="form"
                    submitLabel="Save Demo Configuration"
                    loading={isSaving}
                    compact={false}
                  />
                  
                  {saveMessage && saveMessage.includes('Demo') && (
                    <div className="mt-4 p-3 bg-green-50 text-green-700 border border-green-200 rounded-md text-sm">
                      {saveMessage}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-gray-500">Loading demo configuration...</div>
              )}
            </div>
          </div>
        );

      case 'plugin-config':
        return pluginManager ? (
          <PluginSettings
            settingsManager={settingsManager}
            pluginManager={pluginManager}
            onSettingsChange={(pluginId, settings) => {
              console.log('Plugin settings changed:', pluginId, settings);
            }}
          />
        ) : (
          <div className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>Plugin Settings</h2>
              <p className={styles.contentDescription}>
                Plugin manager not available. Please try refreshing the page.
              </p>
            </div>
          </div>
        );

      case 'system-info':
        const environment = typeof window !== 'undefined' && (window as any).electronAPI ? 'Electron' : 'Web';
        const activePlugins = plugins.filter(p => p.status === 'active');
        const loadingPlugins = plugins.filter(p => p.status === 'loading');
        const errorPlugins = plugins.filter(p => p.status === 'error');
        
        return (
          <div className={styles.contentSection}>
            <div className={styles.contentHeader}>
              <h2 className={styles.contentTitle}>System Information</h2>
              <p className={styles.contentDescription}>
                View detailed application and environment information.
              </p>
            </div>
            <div className={styles.contentBody}>
              <div className="space-y-6">
                
                {/* Application Information */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">🏗️</span>
                    Application Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Version</span>
                        <span className="text-gray-600 font-mono">0.1.0</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Environment</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          environment === 'Electron' 
                            ? 'bg-blue-100 text-blue-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {environment}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Build Mode</span>
                        <span className="text-gray-600">
                          {typeof process !== 'undefined' && process.env?.NODE_ENV === 'production' ? 'Production' : 'Development'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">User Agent</span>
                        <span className="text-gray-600 text-sm truncate max-w-48" title={navigator.userAgent}>
                          {navigator.userAgent.split(' ')[0]}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Platform</span>
                        <span className="text-gray-600">{navigator.platform}</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Language</span>
                        <span className="text-gray-600">{navigator.language}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Plugin System Status */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">🔌</span>
                    Plugin System Status
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="text-2xl font-bold text-green-600">{activePlugins.length}</div>
                      <div className="text-sm text-green-700">Active</div>
                    </div>
                    <div className="text-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="text-2xl font-bold text-yellow-600">{loadingPlugins.length}</div>
                      <div className="text-sm text-yellow-700">Loading</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                      <div className="text-2xl font-bold text-red-600">{errorPlugins.length}</div>
                      <div className="text-sm text-red-700">Error</div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{plugins.length}</div>
                      <div className="text-sm text-blue-700">Total</div>
                    </div>
                  </div>
                  
                  {/* Plugin Details */}
                  {plugins.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-700 mb-2">Plugin Details</h4>
                      <div className="max-h-48 overflow-y-auto space-y-1">
                        {plugins.map((plugin) => (
                          <div key={plugin.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded border">
                            <div className="flex items-center space-x-3">
                              <div className={`w-2 h-2 rounded-full ${
                                plugin.status === 'active' ? 'bg-green-500' : 
                                plugin.status === 'loading' ? 'bg-yellow-500' : 
                                plugin.status === 'error' ? 'bg-red-500' : 'bg-gray-400'
                              }`} />
                              <span className="font-medium text-sm">{plugin.name}</span>
                              <span className="text-xs text-gray-500">v{plugin.version}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                plugin.type === 'simple' ? 'bg-gray-100 text-gray-700' :
                                plugin.type === 'configured' ? 'bg-blue-100 text-blue-700' :
                                plugin.type === 'hybrid' ? 'bg-purple-100 text-purple-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {plugin.type}
                              </span>
                              <span className={`px-2 py-1 rounded-full text-xs capitalize ${
                                plugin.status === 'active' ? 'bg-green-100 text-green-700' :
                                plugin.status === 'loading' ? 'bg-yellow-100 text-yellow-700' :
                                plugin.status === 'error' ? 'bg-red-100 text-red-700' :
                                'bg-gray-100 text-gray-700'
                              }`}>
                                {plugin.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* System Performance */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">⚡</span>
                    Performance Metrics
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Memory Usage</span>
                        <span className="text-gray-600">
                          {typeof (performance as any).memory !== 'undefined' 
                            ? `${Math.round((performance as any).memory.usedJSHeapSize / 1024 / 1024)} MB`
                            : 'Not available'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Heap Limit</span>
                        <span className="text-gray-600">
                          {typeof (performance as any).memory !== 'undefined'
                            ? `${Math.round((performance as any).memory.jsHeapSizeLimit / 1024 / 1024)} MB`
                            : 'Not available'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Online Status</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          navigator.onLine ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {navigator.onLine ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Hardware Concurrency</span>
                        <span className="text-gray-600">{navigator.hardwareConcurrency} cores</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Connection Type</span>
                        <span className="text-gray-600">
                          {(navigator as any).connection?.effectiveType || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-700">Device Memory</span>
                        <span className="text-gray-600">
                          {(navigator as any).deviceMemory 
                            ? `${(navigator as any).deviceMemory} GB`
                            : 'Not available'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Configuration Paths */}
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="mr-2">📁</span>
                    Directory Structure
                  </h3>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="p-3 bg-gray-50 rounded border">
                      <div className="font-medium text-gray-700 mb-1">Configuration</div>
                      <div className="text-gray-600">config/app.json5</div>
                      <div className="text-gray-600">config/plugins.json5</div>
                      <div className="text-gray-600">config/plugins/</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <div className="font-medium text-gray-700 mb-1">Plugins</div>
                      <div className="text-gray-600">plugins/ (source)</div>
                      <div className="text-gray-600">dist/plugins/ (compiled)</div>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border">
                      <div className="font-medium text-gray-700 mb-1">Application</div>
                      <div className="text-gray-600">dist/ (built application)</div>
                      <div className="text-gray-600">logs/ (application logs)</div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className={styles.emptyState}>
            <h3 className={styles.emptyStateTitle}>Select a section</h3>
            <p className={styles.emptyStateDescription}>
              Choose a section from the sidebar to view and edit settings.
            </p>
          </div>
        );
    }
  };

  // For plugin-only mode, render directly without sidebar
  if (viewMode === 'plugin-only' && targetPluginId && pluginManager) {
    const targetPlugin = plugins.find(p => p.id === targetPluginId);
    
    return (
      <div className={styles.settingsView}>
        {/* Header */}
        <header className={styles.header}>
          <h1 className={styles.title}>
            {targetPlugin ? `${targetPlugin.name} Settings` : 'Plugin Settings'}
          </h1>
          <p className={styles.subtitle}>
            {targetPlugin ? targetPlugin.description || 'Configure plugin settings' : 'Plugin configuration'}
          </p>
        </header>

        {/* Direct plugin settings content */}
        <main className={styles.pluginOnlyContent}>
          <PluginSettings
            settingsManager={settingsManager}
            pluginManager={pluginManager}
            targetPluginId={targetPluginId}
            onSettingsChange={(pluginId, settings) => {
              console.log('Plugin settings changed:', pluginId, settings);
            }}
          />
        </main>
      </div>
    );
  }

  // Full mode with sidebar (original behavior)
  return (
    <div className={styles.settingsView}>
      {/* Header */}
      <header className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Configure your application preferences</p>
      </header>

      {/* Content */}
      <div className={styles.content}>
        {renderSidebarContent()}
        <main className={styles.mainContent}>
          {renderMainContent()}
        </main>
      </div>
    </div>
  );
}