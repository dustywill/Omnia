/**
 * Application Settings Component
 * 
 * Provides a comprehensive settings interface for app configuration
 * using schema-driven forms with live validation.
 */

import React, { useState, useEffect } from 'react';
import { z } from 'zod';
import { SchemaForm } from '../SchemaForm/SchemaForm.js';
import { Card } from '../Card/Card.js';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import { Grid } from '../Grid/Grid.js';
import { SettingsManager } from '../../../core/settings-manager.js';
import { AppConfigSchema, type AppConfig } from '../../../lib/schemas/app-config.js';
import styles from './AppSettings.module.css';

export interface AppSettingsProps {
  settingsManager: SettingsManager;
  onSettingsChange?: (settings: AppConfig) => void;
  className?: string;
}

// Define settings sections based on the actual AppConfig schema
const settingsSection = {
  appSettings: z.object({
    debugMode: z.boolean().default(false).describe('Enable application-wide debug features and verbose logging'),
    userName: z.string().default('DefaultUser').describe('Username for identifying user activity'),
    theme: z.enum(['light', 'dark', 'system']).default('system').describe('Select the user interface theme'),
    pluginsDirectory: z.string().default('plugins').describe('Path to the directory containing plugins'),
    scriptsDirectory: z.string().default('scripts').describe('Directory where scripts are stored'),
  }),
  
  logging: z.object({
    level: z.enum(['trace', 'debug', 'info', 'warn', 'error', 'fatal']).default('info').describe('Minimum log level to record'),
    console: z.boolean().default(true).describe('Enable console logging'),
    file: z.boolean().default(true).describe('Enable file logging'),
    fileFormat: z.enum(['json', 'text']).default('json').describe('Format for log files'),
    maxFileSize: z.string().default('10MB').describe('Maximum size per log file'),
    maxFiles: z.number().default(5).describe('Maximum number of log files to keep'),
  }),
  
  window: z.object({
    width: z.number().default(1200).describe('Default window width'),
    height: z.number().default(800).describe('Default window height'),
    minWidth: z.number().default(800).describe('Minimum window width'),
    minHeight: z.number().default(600).describe('Minimum window height'),
    resizable: z.boolean().default(true).describe('Allow window resizing'),
    alwaysOnTop: z.boolean().default(false).describe('Keep window always on top'),
  }).optional()
};

type SettingsSection = keyof typeof settingsSection;

export function AppSettings({ settingsManager, onSettingsChange, className = '' }: AppSettingsProps) {
  const [currentSettings, setCurrentSettings] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>('appSettings');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load current settings
  useEffect(() => {
    loadSettings();
  }, [settingsManager]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const settings = await settingsManager.loadAppConfig();
      setCurrentSettings(settings);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionChange = (values: any, isValid: boolean) => {
    if (!isValid || !currentSettings) return;

    const updatedSettings = {
      ...currentSettings,
      [activeSection]: values
    };

    setCurrentSettings(updatedSettings);
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!currentSettings) return;

    try {
      setSaving(true);
      setError(null);

      // Validate complete settings object
      const validatedSettings = AppConfigSchema.parse(currentSettings);
      
      // Save to persistent storage
      await settingsManager.saveAppConfig(validatedSettings);
      
      setHasUnsavedChanges(false);
      onSettingsChange?.(validatedSettings);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    await loadSettings();
    setHasUnsavedChanges(false);
  };

  const handleResetToDefaults = async () => {
    try {
      setSaving(true);
      
      // Create default settings
      const defaultSettings = AppConfigSchema.parse({});
      
      await settingsManager.saveAppConfig(defaultSettings);
      setCurrentSettings(defaultSettings);
      setHasUnsavedChanges(false);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className={`${styles.appSettings} ${className}`}>
        <div className="text-center py-8">
          <p className="text-theme-secondary">Loading settings...</p>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={`${styles.appSettings} ${className}`}>
        <div className="text-center py-8">
          <p className="text-danger mb-4">{error}</p>
          <Button onClick={loadSettings} variant="action" size="sm">
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  const sectionLabels: Record<SettingsSection, string> = {
    appSettings: 'Application',
    logging: 'Logging',
    window: 'Window'
  };

  const sectionDescriptions: Record<SettingsSection, string> = {
    appSettings: 'Basic application preferences and interface settings',
    logging: 'Logging configuration and output settings',
    window: 'Window behavior and display preferences'
  };

  return (
    <div className={`${styles.appSettings} ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-3xl font-bold text-theme-primary">Application Settings</h1>
          {hasUnsavedChanges && (
            <Badge variant="warning" size="sm">
              Unsaved Changes
            </Badge>
          )}
        </div>
        <p className="text-theme-secondary">
          Configure application behavior, performance, and security settings.
        </p>
      </div>

      <Grid cols={4} gap="lg">
        {/* Sidebar Navigation */}
        <div className={styles.sidebar}>
          <nav className="space-y-2">
            {Object.entries(sectionLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveSection(key as SettingsSection)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all duration-200 ${
                  activeSection === key
                    ? 'bg-action text-white shadow-sm'
                    : 'text-theme-secondary hover:bg-theme-background hover:text-theme-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Action Buttons */}
          <div className="mt-8 space-y-3">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              variant="primary"
              className="w-full"
            >
              {saving ? 'Saving...' : 'Save All Changes'}
            </Button>

            <Button
              onClick={handleReset}
              disabled={!hasUnsavedChanges || saving}
              variant="secondary"
              className="w-full"
            >
              Reset Changes
            </Button>

            <Button
              onClick={handleResetToDefaults}
              disabled={saving}
              variant="ghost"
              className="w-full"
            >
              Reset to Defaults
            </Button>
          </div>
        </div>

        {/* Settings Form */}
        <div className="col-span-3">
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-theme-primary mb-2">
                {sectionLabels[activeSection]}
              </h2>
              <p className="text-theme-secondary">
                {sectionDescriptions[activeSection]}
              </p>
            </div>

            {currentSettings && (
              <SchemaForm
                title=""
                schema={settingsSection[activeSection]}
                initialValues={currentSettings[activeSection] || {}}
                onSubmit={handleSectionChange}
                submitLabel="Apply Changes"
                showResetButton={false}
                showCancelButton={false}
                realTimeValidation={true}
                className={styles.sectionForm}
              />
            )}
          </Card>
        </div>
      </Grid>
    </div>
  );
}