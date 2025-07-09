/**
 * Application Settings Component
 * 
 * Temporarily disabled due to zod import issues in browser environment.
 * This component needs refactoring to use dynamic schema loading.
 */

import React, { useState } from 'react';
import { Card } from '../Card/Card.js';
import { SettingsManager } from '../../../core/settings-manager.js';
import { type AppConfig } from '../../../lib/schemas/app-config.js';
import styles from './AppSettings.module.css';

export interface AppSettingsProps {
  settingsManager: SettingsManager;
  onSettingsChange?: (settings: AppConfig) => void;
  className?: string;
}

export function AppSettings({
  settingsManager,
  onSettingsChange,
  className = ''
}: AppSettingsProps) {
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaved(false);
    try {
      const config = (await settingsManager.loadAppConfig?.()) as AppConfig;
      await settingsManager.saveAppConfig?.(config);
      onSettingsChange?.(config);
      setSaved(true);
    } catch {
      // ignore errors in placeholder implementation
    }
  };

  return (
    <div className={`${styles.appSettings} ${className}`}>
      <Card className={styles.card}>
        <h2>App Settings</h2>
        <p>This component is temporarily disabled due to schema import issues.</p>
        <p>The enhanced plugin manager provides core functionality without this component.</p>
        <p>Settings can still be managed through the SettingsManager programmatically.</p>
        <button onClick={handleSave}>Save</button>
        {saved && <p>Settings saved successfully</p>}
      </Card>
    </div>
  );}