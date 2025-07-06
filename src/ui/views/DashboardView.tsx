import React from 'react';
import { DashboardPluginCard } from '../components/DashboardPluginCard/DashboardPluginCard.js';
import { type PluginInfo } from '../main-app-renderer.js';

export interface DashboardViewProps {
  plugins: PluginInfo[];
  onPluginSelect: (pluginId: string) => void;
  onPluginToggle: (pluginId: string) => void;
  onPluginConfigure: (pluginId: string) => void;
  onViewChange?: (view: 'dashboard' | 'plugins' | 'settings') => void;
}

export function DashboardView({ 
  plugins, 
  onPluginSelect,
  onViewChange
}: DashboardViewProps) {
  const activePlugins = plugins.filter(p => p.status === 'active');
  const inactivePlugins = plugins.filter(p => p.status === 'inactive');
  const errorPlugins = plugins.filter(p => p.status === 'error');

  const headerStyle: React.CSSProperties = {
    padding: '1rem 2rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  };

  const contentStyle: React.CSSProperties = {
    padding: '0 2rem 2rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const miniStatsGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.5rem',
    width: '200px'
  };

  const miniStatCardStyle: React.CSSProperties = {
    backgroundColor: '#f8fafc',
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
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
    <div style={{ height: '100%', overflowY: 'auto' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
            Dashboard
          </h1>
          <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
            Overview of your plugin ecosystem
          </p>
        </div>
        
        {/* Mini Statistics Cards */}
        <div style={miniStatsGridStyle}>
          <div 
            style={miniStatCardStyle}
            onClick={() => onViewChange?.('plugins')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f0f9ff';
              e.currentTarget.style.borderColor = '#bae6fd';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Click to view active plugins"
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#059669', marginBottom: '0.25rem' }}>
              {activePlugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.6rem' }}>Active</div>
          </div>
          
          <div 
            style={miniStatCardStyle}
            onClick={() => onViewChange?.('plugins')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb';
              e.currentTarget.style.borderColor = '#d1d5db';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Click to view inactive plugins"
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#6b7280', marginBottom: '0.25rem' }}>
              {inactivePlugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.6rem' }}>Inactive</div>
          </div>
          
          <div 
            style={miniStatCardStyle}
            onClick={() => onViewChange?.('plugins')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2';
              e.currentTarget.style.borderColor = '#fecaca';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Click to view plugins with errors"
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#dc2626', marginBottom: '0.25rem' }}>
              {errorPlugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.6rem' }}>Errors</div>
          </div>
          
          <div 
            style={miniStatCardStyle}
            onClick={() => onViewChange?.('plugins')}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#eff6ff';
              e.currentTarget.style.borderColor = '#bfdbfe';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f8fafc';
              e.currentTarget.style.borderColor = '#e5e7eb';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
            title="Click to view all plugins"
          >
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#2563eb', marginBottom: '0.25rem' }}>
              {plugins.length}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.6rem' }}>Total</div>
          </div>
        </div>
      </header>

      <div style={contentStyle}>

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