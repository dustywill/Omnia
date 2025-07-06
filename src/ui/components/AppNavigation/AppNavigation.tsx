import React from 'react';
import { Sidebar } from '../Sidebar/Sidebar.js';
import styles from './AppNavigation.module.css';

export interface PluginInfo {
  id: string;
  name: string;
  enabled: boolean;
}

export interface AppNavigationProps {
  currentView: string; // Allow any string for plugin views
  onViewChange: (view: string) => void;
  plugins?: PluginInfo[]; // Add plugins prop for individual navigation
}

// Colorful navigation icons (Unus-inspired design)
const DashboardIcon = () => (
  <div style={{
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
    </svg>
  </div>
);

const PluginsIcon = () => (
  <div style={{
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>
    </svg>
  </div>
);

const SettingsIcon = () => (
  <div style={{
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
    </svg>
  </div>
);

const LogsIcon = () => (
  <div style={{
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white'
  }}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z"/>
    </svg>
  </div>
);

// Plugin settings icon
const PluginSettingsIcon = ({ pluginName }: { pluginName: string }) => (
  <div style={{
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'white',
    fontSize: '12px',
    fontWeight: 'bold'
  }}>
    {pluginName.charAt(0).toUpperCase()}
  </div>
);

// Omnia logo icon for the header
const OmniaIcon = () => (
  <div style={{
    width: '40px',
    height: '40px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }}>
    <img 
      src="./assets/omnia_logo.svg" 
      alt="Omnia Logo" 
      style={{
        width: '40px',
        height: '40px'
      }}
    />
  </div>
);

export function AppNavigation({ currentView, onViewChange, plugins = [] }: AppNavigationProps) {
  return (
    <div className={styles.navigationWrapper}>
      <Sidebar width="md" className={styles.navigation}>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          {/* App Header with Logo */}
          <div style={{ 
            padding: '24px', 
            borderBottom: '1px solid #e5e7eb', 
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px'
          }}>
            <OmniaIcon />
            <div>
              <h1 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: '#1f2937',
                margin: 0,
                marginBottom: '4px'
              }}>
                Omnia
              </h1>
              <p style={{ 
                fontSize: '0.875rem', 
                color: '#6b7280',
                margin: 0
              }}>
                Plugin Settings System
              </p>
            </div>
          </div>
          
          {/* Navigation Items */}
          <div style={{ 
            flex: 1, 
            padding: '16px 12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '24px'
          }}>
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease',
                backgroundColor: currentView === 'dashboard' ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
              }}
              onClick={() => onViewChange('dashboard')}
              onMouseEnter={(e) => {
                if (currentView !== 'dashboard') {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'dashboard') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <DashboardIcon />
              </div>
              <div 
                style={{ 
                  color: currentView === 'dashboard' ? '#2563eb' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: currentView === 'dashboard' ? '600' : '400'
                }}
              >
                Dashboard
              </div>
            </div>
            
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease',
                backgroundColor: currentView === 'plugins' ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
              }}
              onClick={() => onViewChange('plugins')}
              onMouseEnter={(e) => {
                if (currentView !== 'plugins') {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'plugins') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <PluginsIcon />
              </div>
              <div 
                style={{ 
                  color: currentView === 'plugins' ? '#2563eb' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: currentView === 'plugins' ? '600' : '400'
                }}
              >
                Plugins
              </div>
            </div>
            
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease',
                backgroundColor: currentView === 'settings' ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
              }}
              onClick={() => onViewChange('settings')}
              onMouseEnter={(e) => {
                if (currentView !== 'settings') {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'settings') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <SettingsIcon />
              </div>
              <div 
                style={{ 
                  color: currentView === 'settings' ? '#2563eb' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: currentView === 'settings' ? '600' : '400'
                }}
              >
                Settings
              </div>
            </div>
            
            <div 
              style={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: '8px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '8px',
                transition: 'background-color 0.2s ease',
                backgroundColor: currentView === 'logs' ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
              }}
              onClick={() => onViewChange('logs')}
              onMouseEnter={(e) => {
                if (currentView !== 'logs') {
                  e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.05)';
                }
              }}
              onMouseLeave={(e) => {
                if (currentView !== 'logs') {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <LogsIcon />
              </div>
              <div 
                style={{ 
                  color: currentView === 'logs' ? '#2563eb' : '#6b7280',
                  fontSize: '0.875rem',
                  fontWeight: currentView === 'logs' ? '600' : '400'
                }}
              >
                Logs
              </div>
            </div>
            
            {/* Plugin Settings Section */}
            {plugins.length > 0 && (
              <>
                {/* Divider */}
                <div style={{
                  height: '1px',
                  backgroundColor: '#e5e7eb',
                  margin: '12px 0'
                }} />
                
                {/* Plugin Settings Title */}
                <div style={{
                  fontSize: '0.75rem',
                  fontWeight: '600',
                  color: '#9ca3af',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  textAlign: 'center',
                  marginBottom: '12px'
                }}>
                  Plugin Settings
                </div>
                
                {/* Individual Plugin Navigation Items */}
                {plugins.filter((plugin: PluginInfo) => plugin.enabled).map((plugin: PluginInfo) => (
                  <div 
                    key={plugin.id}
                    style={{ 
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      textAlign: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      padding: '8px',
                      borderRadius: '8px',
                      transition: 'background-color 0.2s ease',
                      backgroundColor: currentView === `plugin-${plugin.id}` ? 'rgba(37, 99, 235, 0.1)' : 'transparent'
                    }}
                    onClick={() => onViewChange(`plugin-${plugin.id}`)}
                    onMouseEnter={(e) => {
                      if (currentView !== `plugin-${plugin.id}`) {
                        e.currentTarget.style.backgroundColor = 'rgba(107, 114, 128, 0.05)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (currentView !== `plugin-${plugin.id}`) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <PluginSettingsIcon pluginName={plugin.name} />
                    </div>
                    <div 
                      style={{ 
                        color: currentView === `plugin-${plugin.id}` ? '#2563eb' : '#6b7280',
                        fontSize: '0.75rem',
                        fontWeight: currentView === `plugin-${plugin.id}` ? '600' : '400',
                        lineHeight: '1.2',
                        maxWidth: '80px',
                        wordWrap: 'break-word'
                      }}
                    >
                      {plugin.name}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
          
          {/* Footer with Version */}
          <div style={{ 
            padding: '16px', 
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center'
          }}>
            <div style={{ 
              fontSize: '0.75rem', 
              color: '#9ca3af'
            }}>
              Version 0.1.0
            </div>
          </div>
        </div>
      </Sidebar>
    </div>
  );
}