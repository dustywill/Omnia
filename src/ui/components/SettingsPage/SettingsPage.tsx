/**
 * Settings Page Component
 * 
 * Main settings interface with tabbed navigation for app settings,
 * plugin settings, and system configuration.
 */

import React, { useState } from 'react';
import { AppSettings } from '../AppSettings/AppSettings.js';
import { PluginSettings } from '../PluginSettings/PluginSettings.js';
import { Card } from '../Card/Card.js';
import { Badge } from '../Badge/Badge.js';
import { SettingsManager } from '../../../core/settings-manager.js';
import { EnhancedPluginManager } from '../../../core/enhanced-plugin-manager.js';
import styles from './SettingsPage.module.css';

export interface SettingsPageProps {
  settingsManager: SettingsManager;
  pluginManager: EnhancedPluginManager;
  className?: string;
}

type SettingsTab = 'app' | 'plugins' | 'system';

interface SettingsTabInfo {
  id: SettingsTab;
  label: string;
  description: string;
  icon: string;
  badge?: string;
}

const settingsTabs: SettingsTabInfo[] = [
  {
    id: 'app',
    label: 'Application',
    description: 'General app preferences and behavior',
    icon: '⚙️'
  },
  {
    id: 'plugins',
    label: 'Plugins',
    description: 'Plugin configuration and management',
    icon: '🧩'
  },
  {
    id: 'system',
    label: 'System',
    description: 'Advanced system and security settings',
    icon: '🔧',
    badge: 'Advanced'
  }
];

export function SettingsPage({ settingsManager, pluginManager, className = '' }: SettingsPageProps) {
  const [activeTab, setActiveTab] = useState<SettingsTab>('app');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSettingsChange = () => {
    setHasUnsavedChanges(true);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'app':
        return (
          <AppSettings
            settingsManager={settingsManager}
            onSettingsChange={handleSettingsChange}
          />
        );
        
      case 'plugins':
        return (
          <PluginSettings
            settingsManager={settingsManager}
            pluginManager={pluginManager}
            onSettingsChange={handleSettingsChange}
          />
        );
        
      case 'system':
        return (
          <SystemSettings
            settingsManager={settingsManager}
            onSettingsChange={handleSettingsChange}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <div className={`${styles.settingsPage} ${className}`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold text-theme-primary mb-2">Settings</h1>
            <p className="text-lg text-theme-secondary">
              Configure Omnia to work exactly how you need it.
            </p>
          </div>
          
          {hasUnsavedChanges && (
            <Badge variant="warning" size="lg">
              Unsaved Changes
            </Badge>
          )}
        </div>
        
        {/* Tab Navigation */}
        <div className={styles.tabNavigation}>
          {settingsTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`${styles.tabButton} ${
                activeTab === tab.id ? styles.activeTab : ''
              }`}
            >
              <div className={styles.tabIcon}>{tab.icon}</div>
              <div className={styles.tabContent}>
                <div className="flex items-center gap-2">
                  <span className={styles.tabLabel}>{tab.label}</span>
                  {tab.badge && (
                    <Badge variant="info" size="sm">{tab.badge}</Badge>
                  )}
                </div>
                <span className={styles.tabDescription}>{tab.description}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className={styles.tabContent}>
        {renderTabContent()}
      </div>
    </div>
  );
}

/**
 * System Settings Component
 * Advanced system and security configuration
 */
function SystemSettings({ onSettingsChange }: {
  settingsManager: SettingsManager;
  onSettingsChange: () => void;
}) {
  // Suppress unused variable warning
  onSettingsChange;
  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-theme-primary mb-4">System Information</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-theme-primary mb-3">Application</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-secondary">Version:</span>
                <span className="text-theme-primary">0.1.0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">Environment:</span>
                <span className="text-theme-primary">Development</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">Node.js:</span>
                <span className="text-theme-primary">{process.version || 'N/A'}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-theme-primary mb-3">Plugins</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-theme-secondary">Total Plugins:</span>
                <span className="text-theme-primary">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">Active Plugins:</span>
                <span className="text-theme-primary">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-theme-secondary">Plugin Directory:</span>
                <span className="text-theme-primary">plugins/</span>
              </div>
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <h2 className="text-2xl font-bold text-theme-primary mb-4">Advanced Settings</h2>
        <p className="text-theme-secondary mb-6">
          These settings affect system behavior and should only be modified by advanced users.
        </p>
        
        <div className="bg-orange-95 border border-orange-80 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-warning">⚠️</span>
            <span className="font-semibold text-warning">Advanced Configuration</span>
          </div>
          <p className="text-sm text-theme-secondary">
            Advanced system settings will be available in a future release. 
            These include log management, cache configuration, and performance tuning.
          </p>
        </div>
      </Card>
    </div>
  );
}