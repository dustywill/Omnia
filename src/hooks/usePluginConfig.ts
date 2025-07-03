/**
 * React Hook for Plugin Configuration Management
 * 
 * Provides plugins with reactive access to their configuration with real-time updates
 */

import { useState, useEffect, useCallback } from 'react';
import { SettingsManager } from '../core/settings-manager.js';
import { EventBus } from '../core/event-bus.js';
// import { z } from 'zod';

export interface UsePluginConfigOptions {
  pluginId: string;
  settingsManager: SettingsManager;
  eventBus: EventBus<Record<string, unknown>>;
  schema?: any; // Zod schema for validation
}

export interface UsePluginConfigReturn<T = any> {
  config: T;
  updateConfig: (updates: Partial<T>) => Promise<void>;
  resetConfig: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  hasUnsavedChanges: boolean;
  validationErrors: Record<string, string>;
}

export function usePluginConfig<T = any>({
  pluginId,
  settingsManager,
  eventBus,
  schema
}: UsePluginConfigOptions): UsePluginConfigReturn<T> {
  const [config, setConfig] = useState<T>({} as T);
  const [originalConfig, setOriginalConfig] = useState<T>({} as T);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Calculate if there are unsaved changes
  const hasUnsavedChanges = JSON.stringify(config) !== JSON.stringify(originalConfig);

  // Load initial configuration
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load from plugin registry for now  
        const registry = await settingsManager.loadPluginRegistry();
        const settings = (registry.plugins[pluginId]?.configPath ? {} : {}) as T;
        
        setConfig(settings);
        setOriginalConfig(settings);
        
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, [pluginId, settingsManager]);

  // Listen for configuration changes from other sources
  useEffect(() => {
    const handleConfigChange = (event: any) => {
      if (event.pluginId === pluginId) {
        setConfig(event.newConfig);
        setOriginalConfig(event.newConfig);
      }
    };

    eventBus.subscribe('plugin:config-changed', handleConfigChange);
    
    return () => {
      eventBus.unsubscribe('plugin:config-changed', handleConfigChange);
    };
  }, [pluginId, eventBus]);

  // Validate configuration using schema
  const validateConfig = useCallback((configToValidate: T): Record<string, string> => {
    if (!schema) return {};

    try {
      schema.parse(configToValidate);
      return {};
    } catch (error: any) {
      const errors: Record<string, string> = {};
      
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
      }
      
      return errors;
    }
  }, [schema]);

  // Update configuration
  const updateConfig = useCallback(async (updates: Partial<T>) => {
    try {
      setError(null);
      
      const newConfig = { ...config, ...updates };
      
      // Validate if schema is provided
      const errors = validateConfig(newConfig);
      setValidationErrors(errors);
      
      if (Object.keys(errors).length > 0) {
        throw new Error('Configuration validation failed');
      }

      // Update local state immediately for responsive UI
      setConfig(newConfig);
      
      // Save to persistent storage (simplified for now)
      // await settingsManager.savePluginConfig(pluginId, newConfig, schema || z.any());
      
      // Update original config to reflect saved state
      setOriginalConfig(newConfig);
      
      // Emit event for other components
      eventBus.publish('plugin:config-updated', {
        pluginId,
        newConfig,
        updatedFields: Object.keys(updates)
      });
      
    } catch (err) {
      // Revert local state on error
      setConfig(originalConfig);
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
      throw err;
    }
  }, [config, originalConfig, pluginId, settingsManager, eventBus, validateConfig]);

  // Reset configuration to original state
  const resetConfig = useCallback(async () => {
    try {
      setError(null);
      setValidationErrors({});
      
      // Reload from storage  
      const registry = await settingsManager.loadPluginRegistry();
      const settings = (registry.plugins[pluginId]?.configPath ? {} : {}) as T;
      
      setConfig(settings);
      setOriginalConfig(settings);
      
      eventBus.publish('plugin:config-reset', { pluginId });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset configuration');
      throw err;
    }
  }, [pluginId, settingsManager, eventBus]);

  return {
    config,
    updateConfig,
    resetConfig,
    isLoading,
    error,
    hasUnsavedChanges,
    validationErrors
  };
}