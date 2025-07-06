import React from 'react';
import styles from './StatusBar.module.css';

export interface StatusBarProps {
  activePlugins: number;
  totalPlugins: number;
  errorPlugins: number;
  currentView: string;
  onStatusClick?: (filter: 'active' | 'inactive' | 'error') => void;
  selectedPlugin?: {
    version: string;
    author?: string;
    type: string;
    permissions?: string[];
  } | null;
}

export function StatusBar({ activePlugins, totalPlugins, errorPlugins, currentView, onStatusClick, selectedPlugin }: StatusBarProps) {
  // Don't show plugin counts on dashboard
  if (currentView === 'dashboard') {
    return (
      <div className={styles.statusBar}>
        <div className={styles.readyStatus}>
          <span>Ready</span>
        </div>
        <div>
          Omnia Plugin Management System
        </div>
      </div>
    );
  }

  return (
    <div className={styles.statusBar}>
      <div className={styles.leftSection}>
        <span 
          className={`${styles.statusItem} ${onStatusClick ? styles.clickable : ''}`}
          onClick={() => onStatusClick?.('active')}
        >
          <div className={`${styles.statusIndicator} ${styles.active}`} />
          {activePlugins} Active
        </span>
        
        <span 
          className={`${styles.statusItem} ${onStatusClick ? styles.clickable : ''}`}
          onClick={() => onStatusClick?.('inactive')}
        >
          <div className={`${styles.statusIndicator} ${styles.inactive}`} />
          {totalPlugins - activePlugins} Inactive
        </span>
        
        {errorPlugins > 0 && (
          <span 
            className={`${styles.statusItem} ${onStatusClick ? styles.clickable : ''}`}
            onClick={() => onStatusClick?.('error')}
          >
            <div className={`${styles.statusIndicator} ${styles.error}`} />
            {errorPlugins} Errors
          </span>
        )}
        
        <span>Total: {totalPlugins}</span>
      </div>
      
      <div className={styles.rightSection}>
        {currentView === 'plugins' && 'Plugin Management'}
        {currentView === 'settings' && 'System Settings'}
        {currentView === 'logs' && 'Application Logs'}
        {currentView === 'plugin-detail' && selectedPlugin && (
          <>
            <span>Version: {selectedPlugin.version}</span>
            {selectedPlugin.author && <span>Author: {selectedPlugin.author}</span>}
            <span>Type: {selectedPlugin.type}</span>
            {selectedPlugin.permissions && selectedPlugin.permissions.length > 0 && (
              <span>Permissions: {selectedPlugin.permissions.join(', ')}</span>
            )}
          </>
        )}
        {currentView === 'plugin-detail' && !selectedPlugin && 'Plugin Details'}
      </div>
    </div>
  );
}