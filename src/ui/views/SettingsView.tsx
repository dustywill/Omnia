import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../node-module-loader.js';
import { SettingsManager } from '../../core/settings-manager.js';
import { type PluginInfo } from '../main-app-renderer.js';
import { SchemaForm } from '../components/SchemaForm/SchemaForm.js';
import { JsonEditor } from '../components/JsonEditor.js';
import { Button } from '../components/Button/Button.js';

// We'll initialize the demo schema dynamically to avoid direct zod imports
let DemoConfigSchema: any = null;
let defaultDemoConfig: any = null;

const initializeDemoSchema = async () => {
  if (DemoConfigSchema) return DemoConfigSchema;
  
  const z = await loadNodeModule<typeof import('zod')>('zod');
  
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
};

export interface SettingsViewProps {
  settingsManager: SettingsManager;
  plugins: PluginInfo[];
}

export function SettingsView({ settingsManager, plugins }: SettingsViewProps) {
  // Actual app configuration (JSON)
  const [appConfig, setAppConfig] = useState<string>('');
  
  // Demo configuration (typed object)
  const [demoConfig, setDemoConfig] = useState<any>(null);
  const [demoSchema, setDemoSchema] = useState<any>(null);
  
  // Plugin configuration
  const [selectedPluginConfig, setSelectedPluginConfig] = useState<string>('');
  const [selectedPluginId, setSelectedPluginId] = useState<string | null>(null);
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Initialize demo schema and load app configuration
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);
        
        // Initialize demo schema
        const schema = await initializeDemoSchema();
        setDemoSchema(schema);
        setDemoConfig(defaultDemoConfig);
        
        // Load app configuration
        const config = await settingsManager.loadAppConfig();
        setAppConfig(JSON.stringify(config, null, 2));
      } catch (error) {
        console.error('Failed to initialize:', error);
        setAppConfig('{}');
      } finally {
        setIsLoading(false);
      }
    };
    initialize();
  }, [settingsManager]);

  // Load plugin configuration when selected
  useEffect(() => {
    const loadPluginConfig = async () => {
      if (!selectedPluginId) {
        setSelectedPluginConfig('');
        return;
      }
      
      try {
        setIsLoading(true);
        const plugin = plugins.find(p => p.id === selectedPluginId);
        if (plugin?.config) {
          setSelectedPluginConfig(JSON.stringify(plugin.config, null, 2));
        } else {
          setSelectedPluginConfig('{}');
        }
      } catch (error) {
        console.error('Failed to load plugin config:', error);
        setSelectedPluginConfig('{}');
      } finally {
        setIsLoading(false);
      }
    };
    loadPluginConfig();
  }, [selectedPluginId, plugins]);

  const handleSaveAppConfig = async () => {
    try {
      const config = JSON.parse(appConfig);
      await settingsManager.saveAppConfig(config);
      setSaveMessage('Application configuration saved successfully!');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Failed to save app config:', error);
      setSaveMessage('Failed to save configuration. Please check the JSON format.');
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

  const handleSavePluginConfig = async () => {
    if (!selectedPluginId) return;
    
    try {
      const config = JSON.parse(selectedPluginConfig);
      // For now, we'll use a generic schema (we'd need the actual plugin schema in a real implementation)
      const genericSchema = { parse: (data: any) => data };
      await settingsManager.savePluginConfig(selectedPluginId, config, genericSchema);
      alert('Plugin configuration saved successfully!');
    } catch (error) {
      console.error('Failed to save plugin config:', error);
      alert('Failed to save configuration. Please check the JSON format.');
    }
  };
  const headerStyle: React.CSSProperties = {
    padding: '1rem 2rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '1.5rem'
  };

  const contentStyle: React.CSSProperties = {
    padding: '0 2rem 2rem 2rem',
    maxWidth: '800px',
    margin: '0 auto'
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '1.5rem',
    marginBottom: '2rem'
  };

  const sectionHeaderStyle: React.CSSProperties = {
    fontSize: '1.25rem',
    fontWeight: '600',
    marginBottom: '1rem',
    color: '#1f2937'
  };

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Header */}
      <header style={headerStyle}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
          Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
          Configure your application preferences
        </p>
      </header>

      <div style={contentStyle}>
        {/* Enhanced Schema Form Demo */}
        {demoSchema && demoConfig && (
          <section style={{ marginBottom: '2rem' }}>
            <SchemaForm
              title="🚀 Enhanced Schema Form Demo"
              description="This demonstrates the new schema-driven form capabilities with form/JSON hybrid mode. Toggle between views to see both form fields and raw JSON editing."
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
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: '#d1fae5',
                color: '#065f46',
                border: '1px solid #a7f3d0',
                fontSize: '0.875rem'
              }}>
                {saveMessage}
              </div>
            )}
          </section>
        )}

        {/* Application Settings */}
        <section style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>Application Configuration (JSON)</h2>
          <div style={{ marginBottom: '1rem' }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Edit the main application configuration (config/app.json5) in raw JSON format.
            </p>
            {isLoading ? (
              <div style={{ color: '#6b7280' }}>Loading configuration...</div>
            ) : (
              <div>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '6px', 
                  overflow: 'hidden',
                  marginBottom: '1rem'
                }}>
                  <JsonEditor
                    initialContent={appConfig}
                    onChange={setAppConfig}
                  />
                </div>
                <Button 
                  onClick={handleSaveAppConfig}
                  variant="primary"
                  size="sm"
                >
                  Save Application Configuration
                </Button>
              </div>
            )}
            
            {saveMessage && saveMessage.includes('Application') && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '6px',
                backgroundColor: saveMessage.includes('success') ? '#d1fae5' : '#fef2f2',
                color: saveMessage.includes('success') ? '#065f46' : '#991b1b',
                border: `1px solid ${saveMessage.includes('success') ? '#a7f3d0' : '#fecaca'}`,
                fontSize: '0.875rem'
              }}>
                {saveMessage}
              </div>
            )}
          </div>
        </section>

        {/* Plugin Settings */}
        <section style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>Plugin Settings</h2>
          <div style={{ marginBottom: '1.5rem' }}>
            <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
              Configure individual plugin settings. Found {plugins.length} plugins.
            </p>
            
            {/* Plugin Selection Grid */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: '1rem',
              marginBottom: '1.5rem'
            }}>
              {plugins.map((plugin) => (
                <div
                  key={plugin.id}
                  style={{
                    cursor: 'pointer',
                    border: selectedPluginId === plugin.id ? '2px solid #2563eb' : '1px solid #e5e7eb',
                    backgroundColor: selectedPluginId === plugin.id ? '#f0f9ff' : '#ffffff',
                    borderRadius: '8px',
                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
                    transition: 'all 0.2s ease'
                  }}
                  onClick={() => setSelectedPluginId(plugin.id)}
                >
                  <div style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                      <div style={{
                        width: '10px',
                        height: '10px',
                        borderRadius: '50%',
                        backgroundColor: plugin.status === 'active' ? '#059669' : plugin.status === 'error' ? '#ef4444' : '#6b7280',
                        flexShrink: 0
                      }} />
                      <h3 style={{ 
                        fontSize: '1rem', 
                        fontWeight: '600', 
                        color: '#1f2937', 
                        margin: 0 
                      }}>
                        {plugin.name}
                      </h3>
                    </div>
                    <p style={{ 
                      color: '#6b7280', 
                      fontSize: '0.875rem', 
                      margin: '0 0 0.5rem 0',
                      lineHeight: '1.4'
                    }}>
                      {plugin.description}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      gap: '0.5rem', 
                      fontSize: '0.75rem', 
                      color: '#9ca3af' 
                    }}>
                      <span>{plugin.type}</span>
                      <span>v{plugin.version}</span>
                      {plugin.author && <span>by {plugin.author}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Plugin Configuration Editor */}
            {selectedPluginId && (
              <div style={{ 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px', 
                padding: '1.5rem', 
                backgroundColor: '#f9fafb' 
              }}>
                <h3 style={{ 
                  fontSize: '1.125rem', 
                  fontWeight: '600', 
                  color: '#1f2937', 
                  marginBottom: '1rem' 
                }}>
                  {plugins.find(p => p.id === selectedPluginId)?.name} Configuration
                </h3>
                {isLoading ? (
                  <div style={{ color: '#6b7280' }}>Loading plugin configuration...</div>
                ) : (
                  <div>
                    <div style={{ 
                      border: '1px solid #e5e7eb', 
                      borderRadius: '6px', 
                      overflow: 'hidden',
                      marginBottom: '1rem',
                      backgroundColor: '#ffffff'
                    }}>
                      <JsonEditor
                        initialContent={selectedPluginConfig}
                        onChange={setSelectedPluginConfig}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <Button 
                        onClick={handleSavePluginConfig}
                        variant="primary"
                        size="sm"
                      >
                        Save Plugin Configuration
                      </Button>
                      <Button 
                        onClick={() => setSelectedPluginId(null)}
                        variant="secondary"
                        size="sm"
                      >
                        Close Editor
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        {/* System Information */}
        <section style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>System Information</h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr 2fr', 
            gap: '0.5rem',
            fontSize: '0.875rem'
          }}>
            <div style={{ fontWeight: '500', color: '#374151' }}>Version:</div>
            <div style={{ color: '#6b7280' }}>0.1.0</div>
            
            <div style={{ fontWeight: '500', color: '#374151' }}>Environment:</div>
            <div style={{ color: '#6b7280' }}>
              {typeof window !== 'undefined' && (window as any).electronAPI ? 'Electron' : 'Web'}
            </div>
            
            <div style={{ fontWeight: '500', color: '#374151' }}>Total Plugins:</div>
            <div style={{ color: '#6b7280' }}>{plugins.length}</div>
            
            <div style={{ fontWeight: '500', color: '#374151' }}>Active Plugins:</div>
            <div style={{ color: '#6b7280' }}>
              {plugins.filter(p => p.status === 'active').length}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}