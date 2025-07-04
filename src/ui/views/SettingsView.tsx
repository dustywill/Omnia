import React from 'react';
import { SettingsManager } from '../../core/settings-manager.js';
import { type PluginInfo } from '../main-app-renderer.js';

export interface SettingsViewProps {
  settingsManager: SettingsManager;
  plugins: PluginInfo[];
}

export function SettingsView({ plugins }: SettingsViewProps) {
  const headerStyle: React.CSSProperties = {
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '2rem'
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
    <div>
      {/* Header */}
      <header style={headerStyle}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
          Settings
        </h1>
        <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
          Configure your application preferences
        </p>
      </header>

      <div style={contentStyle}>
        {/* Application Settings */}
        <section style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>Application Settings</h2>
          <div style={{ color: '#6b7280' }}>
            <p>Application configuration options will be available here.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              This section will be populated with settings from your settings manager.
            </p>
          </div>
        </section>

        {/* Plugin Settings */}
        <section style={sectionStyle}>
          <h2 style={sectionHeaderStyle}>Plugin Settings</h2>
          <div style={{ color: '#6b7280' }}>
            <p>Individual plugin configuration options.</p>
            <p style={{ marginTop: '0.5rem', fontSize: '0.875rem' }}>
              Found {plugins.length} plugins with configurable settings.
            </p>
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