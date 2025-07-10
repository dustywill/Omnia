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
        console.log(`[PluginDetailView] About to call loadPluginModule for: ${plugin.id}`);
        const pluginModule = await pluginManager.loadPluginModule(plugin.id);
        
        console.log(`[PluginDetailView] loadPluginModule returned:`, pluginModule);
        console.log(`[PluginDetailView] pluginModule type:`, typeof pluginModule);
        console.log(`[PluginDetailView] pluginModule keys:`, Object.keys(pluginModule || {}));
        console.log(`[PluginDetailView] pluginModule.default:`, pluginModule?.default);
        
        if (!pluginModule) {
          throw new Error(`Failed to load plugin module for ${plugin.id}`);
        }
        
        // Runtime component conversion utility
        const extractReactComponent = (moduleObj: any, pluginId: string): React.ComponentType<any> | null => {
          console.log(`[PluginComponent] Extracting React component from ${pluginId}:`);
          console.log('  moduleObj:', moduleObj);
          console.log('  moduleObj type:', typeof moduleObj);
          console.log('  moduleObj keys:', Object.keys(moduleObj || {}));
          
          // Try different extraction strategies
          const strategies = [
            // Strategy 1: Standard default export
            () => moduleObj?.default,
            
            // Strategy 2: Named export matching plugin name or common patterns
            () => moduleObj?.[pluginId] || moduleObj?.[pluginId + 'Plugin'] || moduleObj?.[pluginId + 'Component'],
            
            // Strategy 3: Look for React component functions in the module
            () => {
              const keys = Object.keys(moduleObj || {});
              for (const key of keys) {
                const value = moduleObj[key];
                if (typeof value === 'function' && 
                    (key.endsWith('Plugin') || key.endsWith('Component') || key.includes('Plugin'))) {
                  console.log(`  Found potential component: ${key}`);
                  return value;
                }
              }
              return null;
            },
            
            // Strategy 4: Look for any React component functions
            () => {
              const keys = Object.keys(moduleObj || {});
              for (const key of keys) {
                const value = moduleObj[key];
                if (typeof value === 'function') {
                  // Check if it looks like a React component
                  const funcStr = value.toString();
                  if (funcStr.includes('jsx') || funcStr.includes('React') || 
                      funcStr.includes('createElement') || funcStr.includes('useState') ||
                      funcStr.includes('useEffect') || /^[A-Z]/.test(key)) {
                    console.log(`  Found React-like function: ${key}`);
                    return value;
                  }
                }
              }
              return null;
            },
            
            // Strategy 5: If module itself is a function, use it directly
            () => typeof moduleObj === 'function' ? moduleObj : null,
            
            // Strategy 6: Look for export patterns from CommonJS/ES6 mixed modules
            () => moduleObj?.exports?.default || moduleObj?.exports,
            
            // Strategy 7: Last resort - try to find ANY function
            () => {
              const keys = Object.keys(moduleObj || {});
              for (const key of keys) {
                const value = moduleObj[key];
                if (typeof value === 'function') {
                  console.log(`  Last resort function: ${key}`);
                  return value;
                }
              }
              return null;
            }
          ];
          
          for (let i = 0; i < strategies.length; i++) {
            try {
              const result = strategies[i]();
              if (result && typeof result === 'function') {
                console.log(`  Strategy ${i + 1} successful, found component:`, result.name || 'anonymous');
                return result;
              }
            } catch (error) {
              console.log(`  Strategy ${i + 1} failed:`, error);
            }
          }
          
          return null;
        };
        
        // Extract component using the utility
        const Component = extractReactComponent(pluginModule, plugin.id);
        
        if (!Component) {
          console.error(`[PluginComponent] No React component found in module for ${plugin.id}`);
          throw new Error(`Plugin ${plugin.id} does not export a React component`);
        }
        
        if (typeof Component !== 'function') {
          console.error(`[PluginComponent] Component for ${plugin.id} is not a function:`, Component);
          throw new Error(`Plugin ${plugin.id} component is not a function, got ${typeof Component}`);
        }
        
        // Store both component and module for config fallback
        // use functional update form to store the component function itself
        setPluginComponent(() => Component);
        setLoading(false);
        
      } catch (err) {
        console.error(`[PluginComponent] Failed to load plugin ${plugin.id}:`, err);
        
        // Provide more specific error messages for common plugin loading issues
        let errorMessage = err instanceof Error ? err.message : 'Unknown error';
        
        if (errorMessage.includes('Failed to resolve module specifier')) {
          const moduleMatch = errorMessage.match(/Failed to resolve module specifier "([^"]+)"/);
          const moduleName = moduleMatch ? moduleMatch[1] : 'unknown module';
          errorMessage = `Plugin import error: Missing dependency "${moduleName}". This plugin needs to be updated to work in the browser environment.`;
        } else if (errorMessage.includes('module is empty')) {
          errorMessage = `Plugin loading failed: The plugin code could not be loaded properly. This may be due to import errors or compilation issues.`;
        } else if (errorMessage.includes('failed to load')) {
          errorMessage = `Plugin unavailable: ${errorMessage}`;
        }
        
        setError(errorMessage);
        setLoading(false);
      }
    };

    if (plugin.status === 'active') {
      loadPlugin();
    } else {
      setLoading(false);
    }
  }, [plugin.id, plugin.status, pluginManager]);
  
  // Determine what to render based on state - but don't return early to avoid hook order issues
  let renderContent: React.ReactNode;
  
  if (plugin.status !== 'active') {
    renderContent = (
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
  } else
  
  if (error) {
    const isImportError = error.includes('Missing dependency') || error.includes('import error');
    const isDevelopmentError = error.includes('module is empty') || error.includes('compilation issues');
    
    renderContent = (
      <div style={{ 
        color: '#dc2626', 
        padding: '2rem',
        backgroundColor: '#fef2f2',
        border: '1px solid #fecaca',
        borderRadius: '8px'
      }}>
        <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>
          🚫 Plugin Loading Failed
        </h3>
        
        <div style={{ marginBottom: '1.5rem' }}>
          <p style={{ marginBottom: '0.5rem' }}><strong>Error:</strong> {error}</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Plugin:</strong> {plugin.name} ({plugin.id})</p>
          <p style={{ marginBottom: '0.5rem' }}><strong>Type:</strong> {plugin.type}</p>
        </div>
        
        {isImportError && (
          <div style={{ 
            backgroundColor: '#fffbeb',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>💡 For Developers</h4>
            <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: '1.4' }}>
              This plugin has unresolved dependencies that need to be updated for browser compatibility. 
              Consider using the <code>node-module-loader.js</code> utility for Node.js modules or 
              ensure all imports are browser-compatible.
            </p>
          </div>
        )}
        
        {isDevelopmentError && (
          <div style={{ 
            backgroundColor: '#fffbeb',
            border: '1px solid #fbbf24',
            borderRadius: '6px',
            padding: '1rem',
            marginBottom: '1rem'
          }}>
            <h4 style={{ color: '#f59e0b', marginBottom: '0.5rem' }}>🔧 For Developers</h4>
            <p style={{ color: '#92400e', fontSize: '0.9rem', lineHeight: '1.4' }}>
              The plugin code could not be compiled or loaded properly. Check the plugin's 
              source code for syntax errors, missing exports, or build configuration issues.
            </p>
          </div>
        )}
        
        <div style={{ 
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
          padding: '1rem',
          fontSize: '0.9rem'
        }}>
          <p style={{ color: '#6b7280', margin: 0 }}>
            <strong>Status:</strong> This plugin is non-functional but the application continues to work normally. 
            Other plugins are not affected by this error.
          </p>
        </div>
      </div>
    );
  } else if (loading) {
    renderContent = (
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
  } else if (!pluginComponent) {
    renderContent = (
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
  } else {
    // Render the plugin component with appropriate props based on plugin type and ID
    let componentProps: any = {};
    
    // Plugin-specific prop structure based on current plugin expectations
    switch (plugin.id) {
      case 'context-generator':
        componentProps = {
          initialPath: undefined, // Let plugin handle default
        };
        break;
        
      case 'as-built-documenter':
        componentProps = {
          context: {
            config: plugin.config,
            serviceRegistry,
            settingsManager,
          },
        };
        break;
        
      case 'customer-links':
      case 'script-runner':
        componentProps = {
          config: plugin.config,
        };
        break;
        
      default:
        // For simple plugins or unknown plugins, pass minimal props
        componentProps = {};
        break;
    }
    
    // Add service registry and settings manager as fallback for plugins that might need them
    componentProps.serviceRegistry = serviceRegistry;
    componentProps.settingsManager = settingsManager;
    
    try {
      renderContent = React.createElement(pluginComponent, componentProps);
    } catch (error) {
      console.error(`[PluginComponent] Error rendering plugin ${plugin.id}:`, error);
      renderContent = (
        <div style={{ 
          color: '#dc2626', 
          padding: '2rem',
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '8px'
        }}>
          <h3 style={{ marginBottom: '1rem', color: '#dc2626' }}>Plugin Rendering Error</h3>
          <p>The plugin encountered an error while rendering: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      );
    }
  }

  return <>{renderContent}</>;
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