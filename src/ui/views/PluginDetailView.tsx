import React from 'react';
import { Button } from '../components/Button/Button.js';
import { type PluginInfo } from '../main-app-renderer.js';
import { EnhancedPluginManager } from '../../core/enhanced-plugin-manager.js';
import { ServiceRegistry } from '../../core/service-registry.js';
import { SettingsManager } from '../../core/settings-manager.js';

export interface PluginDetailViewProps {
  plugin: PluginInfo;
  pluginManager: EnhancedPluginManager;
  serviceRegistry: ServiceRegistry;
  settingsManager: SettingsManager;
  onBack: () => void;
  onConfigure?: (pluginId: string) => void;
}

const PluginComponent: React.FC<{
  plugin: PluginInfo;
  pluginManager: EnhancedPluginManager;
  serviceRegistry: ServiceRegistry;
  settingsManager: SettingsManager;
}> = ({ plugin, pluginManager, serviceRegistry, settingsManager }) => {
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [pluginComponent, setPluginComponent] = React.useState<React.ComponentType<any> | null>(null);
  
  React.useEffect(() => {
    const loadPlugin = async () => {
      try {
        setError(null);
        setLoading(true);
        
        // Load the plugin component
        const pluginModule = await pluginManager.loadPluginModule(plugin.id);
        
        if (!pluginModule) {
          throw new Error(`Failed to load plugin module for ${plugin.id}`);
        }
        
        // Get the default export (React component)
        const Component = pluginModule.default || pluginModule;
        
        if (!Component) {
          throw new Error(`Plugin ${plugin.id} does not export a default component`);
        }
        
        // Store both component and module for config fallback
        setPluginComponent(() => Component);
        setLoading(false);
        
      } catch (err) {
        console.error(`[PluginComponent] Failed to load plugin ${plugin.id}:`, err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        setLoading(false);
      }
    };

    if (plugin.status === 'active') {
      loadPlugin();
    } else {
      setLoading(false);
    }
  }, [plugin.id, plugin.status, pluginManager]);
  
  if (plugin.status !== 'active') {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center', 
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Plugin Not Active</h3>
        <p>This plugin needs to be activated before it can be used.</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ 
        color: '#dc2626', 
        padding: '2rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Plugin Error</h3>
        <p><strong>Error:</strong> {error}</p>
        <p><strong>Plugin ID:</strong> {plugin.id}</p>
        <p><strong>Type:</strong> {plugin.type}</p>
      </div>
    );
  }
  
  if (loading) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Loading Plugin...</h3>
        <p style={{ color: '#6b7280' }}>Loading {plugin.type} plugin: {plugin.name}</p>
      </div>
    );
  }
  
  if (!pluginComponent) {
    return (
      <div style={{ 
        padding: '2rem', 
        textAlign: 'center',
        color: '#6b7280',
        backgroundColor: '#f9fafb',
        border: '1px solid #e5e7eb',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '1rem' }}>Plugin Component Not Available</h3>
        <p>The plugin component could not be loaded.</p>
      </div>
    );
  }
  
  // Render the plugin component with appropriate props based on type
  const componentProps: any = {
    serviceRegistry,
    settingsManager,
  };
  
  // For configured and hybrid plugins, pass the configuration
  if (plugin.type === 'configured' || plugin.type === 'hybrid') {
    // Use plugin config if available, otherwise fallback will be handled by plugin loading
    componentProps.config = plugin.config;
    
    // If no config is provided, log a warning but let the plugin handle it
    if (!plugin.config) {
      console.warn(`[PluginComponent] No config provided for configured plugin ${plugin.id}, plugin should use defaultConfig internally`);
    }
  }
  
  return React.createElement(pluginComponent, componentProps);
};

export function PluginDetailView({ 
  plugin, 
  pluginManager, 
  serviceRegistry, 
  settingsManager, 
  onBack,
  onConfigure 
}: PluginDetailViewProps) {

  const headerStyle: React.CSSProperties = {
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb'
  };

  const contentStyle: React.CSSProperties = {
    padding: '2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
          <Button variant="ghost" size="sm" onClick={onBack}>
            ← Back to Dashboard
          </Button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              {plugin.name}
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem', marginBottom: '1rem' }}>
              {plugin.description}
            </p>
          </div>
          
          <div style={{ display: 'flex', gap: '1rem' }}>
            <Button 
              variant="secondary" 
              size="md"
              onClick={() => onConfigure?.(plugin.id)}
            >
              Configure
            </Button>
          </div>
        </div>
      </header>

      {/* Plugin Content */}
      <div style={contentStyle}>
        <PluginComponent
          plugin={plugin}
          pluginManager={pluginManager}
          serviceRegistry={serviceRegistry}
          settingsManager={settingsManager}
        />
      </div>
    </div>
  );
}