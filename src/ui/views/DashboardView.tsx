import React from 'react';
import { DashboardPluginCard } from '../components/DashboardPluginCard/DashboardPluginCard.js';
import { type PluginInfo } from '../main-app-renderer.js';

export interface DashboardViewProps {
  plugins: PluginInfo[];
  onPluginSelect: (pluginId: string) => void;
  onPluginToggle: (pluginId: string) => void;
  onPluginConfigure: (pluginId: string) => void;
}

export function DashboardView({ 
  plugins, 
  onPluginSelect
}: DashboardViewProps) {
  const activePlugins = plugins.filter(p => p.status === 'active');
  const inactivePlugins = plugins.filter(p => p.status === 'inactive');
  const errorPlugins = plugins.filter(p => p.status === 'error');

  const headerStyle: React.CSSProperties = {
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '2rem'
  };

  const contentStyle: React.CSSProperties = {
    padding: '0 2rem 2rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const statsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '1rem',
    marginBottom: '3rem'
  };

  const statCardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    textAlign: 'center'
  };

  const pluginGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem',
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
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Dashboard
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Overview of your plugin ecosystem
        </p>
      </header>

      <div style={contentStyle}>
        {/* Statistics Cards */}
        <div style={statsGridStyle}>
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.5rem' }}>
              {activePlugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Active Plugins</div>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.5rem' }}>
              {inactivePlugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Inactive Plugins</div>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.5rem' }}>
              {errorPlugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Plugins with Errors</div>
          </div>
          
          <div style={statCardStyle}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.5rem' }}>
              {plugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.875rem' }}>Total Plugins</div>
          </div>
        </div>

        {/* Active Plugins Section */}
        {activePlugins.length > 0 && (
          <section>
            <h2 style={sectionHeaderStyle}>Active Plugins</h2>
            <div style={pluginGridStyle}>
              {activePlugins.map((plugin) => (
                <DashboardPluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onPluginSelect={onPluginSelect}
                />
              ))}
            </div>
          </section>
        )}

        {/* Available Plugins Section */}
        {inactivePlugins.length > 0 && (
          <section>
            <h2 style={sectionHeaderStyle}>Available Plugins</h2>
            <div style={pluginGridStyle}>
              {inactivePlugins.map((plugin) => (
                <DashboardPluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onPluginSelect={onPluginSelect}
                />
              ))}
            </div>
          </section>
        )}

        {/* Error Plugins Section */}
        {errorPlugins.length > 0 && (
          <section>
            <h2 style={{ ...sectionHeaderStyle, color: '#dc2626' }}>Plugins with Issues</h2>
            <div style={pluginGridStyle}>
              {errorPlugins.map((plugin) => (
                <DashboardPluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onPluginSelect={onPluginSelect}
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {plugins.length === 0 && (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: '#6b7280'
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>No Plugins Found</h3>
            <p>Add some plugins to get started with Omnia.</p>
          </div>
        )}
      </div>
    </div>
  );
}