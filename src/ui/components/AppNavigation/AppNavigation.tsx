import React from 'react';
import { Sidebar, SidebarItem } from '../Sidebar/Sidebar.js';
import styles from './AppNavigation.module.css';

export interface AppNavigationProps {
  currentView: 'dashboard' | 'plugins' | 'settings';
  onViewChange: (view: 'dashboard' | 'plugins' | 'settings') => void;
}

// Simple icons (you can replace with your preferred icon library)
const DashboardIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>
  </svg>
);

const PluginsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"/>
  </svg>
);

const SettingsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.14,12.94c0.04-0.3,0.06-0.61,0.06-0.94c0-0.32-0.02-0.64-0.07-0.94l2.03-1.58c0.18-0.14,0.23-0.41,0.12-0.61 l-1.92-3.32c-0.12-0.22-0.37-0.29-0.59-0.22l-2.39,0.96c-0.5-0.38-1.03-0.7-1.62-0.94L14.4,2.81c-0.04-0.24-0.24-0.41-0.48-0.41 h-3.84c-0.24,0-0.43,0.17-0.47,0.41L9.25,5.35C8.66,5.59,8.12,5.92,7.63,6.29L5.24,5.33c-0.22-0.08-0.47,0-0.59,0.22L2.74,8.87 C2.62,9.08,2.66,9.34,2.86,9.48l2.03,1.58C4.84,11.36,4.8,11.69,4.8,12s0.02,0.64,0.07,0.94l-2.03,1.58 c-0.18,0.14-0.23,0.41-0.12,0.61l1.92,3.32c0.12,0.22,0.37,0.29,0.59,0.22l2.39-0.96c0.5,0.38,1.03,0.7,1.62,0.94l0.36,2.54 c0.05,0.24,0.24,0.41,0.48,0.41h3.84c0.24,0,0.44-0.17,0.47-0.41l0.36-2.54c0.59-0.24,1.13-0.56,1.62-0.94l2.39,0.96 c0.22,0.08,0.47,0,0.59-0.22l1.92-3.32c0.12-0.22,0.07-0.47-0.12-0.61L19.14,12.94z M12,15.6c-1.98,0-3.6-1.62-3.6-3.6 s1.62-3.6,3.6-3.6s3.6,1.62,3.6,3.6S13.98,15.6,12,15.6z"/>
  </svg>
);

export function AppNavigation({ currentView, onViewChange }: AppNavigationProps) {
  return (
    <div className={styles.navigationWrapper}>
      <Sidebar width="md" className={styles.navigation}>
        <div className="space-y-2">
          {/* App Title */}
          <div className="px-3 py-4 border-b border-theme mb-4">
            <h1 className="text-xl font-bold text-theme-primary">Omnia</h1>
            <p className="text-sm text-theme-secondary">Plugin Management System</p>
          </div>
          
          {/* Navigation Items */}
          <div className="space-y-1">
            <SidebarItem
              active={currentView === 'dashboard'}
              onClick={() => onViewChange('dashboard')}
              icon={<DashboardIcon />}
            >
              Dashboard
            </SidebarItem>
            
            <SidebarItem
              active={currentView === 'plugins'}
              onClick={() => onViewChange('plugins')}
              icon={<PluginsIcon />}
            >
              Plugins
            </SidebarItem>
            
            <SidebarItem
              active={currentView === 'settings'}
              onClick={() => onViewChange('settings')}
              icon={<SettingsIcon />}
            >
              Settings
            </SidebarItem>
          </div>
          
          {/* Footer */}
          <div className={styles.navigationFooter}>
            <div className="px-3 py-2 text-xs text-theme-secondary border-t border-theme">
              Version 0.1.0
            </div>
          </div>
        </div>
      </Sidebar>
    </div>
  );
}