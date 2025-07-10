/**
 * React hooks for configuration persistence
 */

import { useState, useEffect, useCallback } from 'react';
import { configPersistence } from '../../core/config-persistence.js';
import type { ConfigPersistenceOptions } from '../../core/config-persistence.js';

/**
 * Hook for persistent configuration with automatic loading and saving
 */
export function usePersistedConfig<T = any>(
  pluginId: string,
  configType: ConfigPersistenceOptions['configType'],
  configId: string,
  defaultValue: T,
  options: {
    autoSave?: boolean;
    debounceMs?: number;
  } = {}
): [T, (value: T) => Promise<void>, () => Promise<void>, boolean] {
  const [config, setConfig] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const persistenceOptions: ConfigPersistenceOptions = {
    pluginId,
    configType,
    autoSave: options.autoSave ?? true,
    debounceMs: options.debounceMs ?? 1000
  };

  // Load configuration on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        const loadedConfig = await configPersistence.loadConfig(persistenceOptions, configId);
        if (loadedConfig !== null) {
          setConfig(loadedConfig);
        }
      } catch (error) {
        console.error(`Failed to load configuration ${configId}:`, error);
      } finally {
        setLoaded(true);
      }
    };

    loadConfig();
  }, [pluginId, configType, configId]);

  // Save configuration
  const saveConfig = useCallback(async (value: T) => {
    setSaving(true);
    try {
      await configPersistence.saveConfig(persistenceOptions, configId, value);
      setConfig(value);
    } catch (error) {
      console.error(`Failed to save configuration ${configId}:`, error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [pluginId, configType, configId]);

  // Delete configuration
  const deleteConfig = useCallback(async () => {
    setSaving(true);
    try {
      await configPersistence.deleteConfig(persistenceOptions, configId);
      setConfig(defaultValue);
    } catch (error) {
      console.error(`Failed to delete configuration ${configId}:`, error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [pluginId, configType, configId, defaultValue]);

  return [config, saveConfig, deleteConfig, loaded && !saving];
}

/**
 * Hook for managing multiple configurations for a plugin
 */
export function usePersistedConfigs<T = any>(
  pluginId: string,
  configType: ConfigPersistenceOptions['configType'],
  defaultValue: Record<string, T> = {}
): [
  Record<string, T>,
  (configs: Record<string, T>) => Promise<void>,
  (configId: string, config: T) => Promise<void>,
  (configId: string) => Promise<void>,
  boolean
] {
  const [configs, setConfigs] = useState<Record<string, T>>(defaultValue);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load all configurations on mount
  useEffect(() => {
    const loadConfigs = async () => {
      try {
        const loadedConfigs = await configPersistence.loadAllConfigs(pluginId, configType);
        if (loadedConfigs && Object.keys(loadedConfigs).length > 0) {
          setConfigs(loadedConfigs);
        }
      } catch (error) {
        console.error(`Failed to load configurations for ${pluginId}:${configType}:`, error);
      } finally {
        setLoaded(true);
      }
    };

    loadConfigs();
  }, [pluginId, configType]);

  // Save all configurations
  const saveAllConfigs = useCallback(async (newConfigs: Record<string, T>) => {
    setSaving(true);
    try {
      await configPersistence.saveAllConfigs(pluginId, configType, newConfigs);
      setConfigs(newConfigs);
    } catch (error) {
      console.error(`Failed to save configurations for ${pluginId}:${configType}:`, error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [pluginId, configType]);

  // Save single configuration
  const saveConfig = useCallback(async (configId: string, config: T) => {
    const newConfigs = { ...configs, [configId]: config };
    await saveAllConfigs(newConfigs);
  }, [configs, saveAllConfigs]);

  // Delete single configuration
  const deleteConfig = useCallback(async (configId: string) => {
    const newConfigs = { ...configs };
    delete newConfigs[configId];
    await saveAllConfigs(newConfigs);
  }, [configs, saveAllConfigs]);

  return [configs, saveAllConfigs, saveConfig, deleteConfig, loaded && !saving];
}

/**
 * Hook for script editor persistence
 */
export function usePersistedScript(
  pluginId: string,
  scriptPath: string,
  defaultContent: string = ''
): [string, (content: string) => Promise<void>, boolean, boolean] {
  const [content, setContent] = useState<string>(defaultContent);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Load script content on mount
  useEffect(() => {
    const loadScript = async () => {
      try {
        // Try to load from file system first
        const electronAPI = (window as any).electronAPI;
        if (electronAPI && scriptPath) {
          try {
            const fileContent = await electronAPI.readFile(scriptPath, { encoding: 'utf8' });
            if (fileContent) {
              setContent(fileContent);
              setLoaded(true);
              return;
            }
          } catch (fileError) {
            console.debug(`Could not read script file ${scriptPath}, trying persistence`);
          }
        }

        // Try to load from persistence
        if (scriptPath) {
          const persistedScript = await configPersistence.loadConfig(
            { pluginId, configType: 'script-editor' },
            scriptPath
          );
          
          if (persistedScript?.content) {
            setContent(persistedScript.content);
          }
        }
      } catch (error) {
        console.error(`Failed to load script ${scriptPath}:`, error);
      } finally {
        setLoaded(true);
      }
    };

    if (scriptPath) {
      loadScript();
    } else {
      setLoaded(true);
    }
  }, [pluginId, scriptPath]);

  // Save script content
  const saveScript = useCallback(async (newContent: string) => {
    setSaving(true);
    try {
      const electronAPI = (window as any).electronAPI;
      
      // Always save to persistence first
      await configPersistence.saveConfig(
        { pluginId, configType: 'script-editor', autoSave: true },
        scriptPath,
        { content: newContent, lastModified: new Date().toISOString() }
      );
      
      // Try to save to file system if available
      if (electronAPI && scriptPath) {
        try {
          // Ensure directory exists
          const dir = scriptPath.substring(0, scriptPath.lastIndexOf('/'));
          if (dir) {
            await electronAPI.mkdir(dir, { recursive: true });
          }
          
          // Save to file system
          await electronAPI.writeFile(scriptPath, newContent);
          console.log(`Script saved to both file system and persistence: ${scriptPath}`);
        } catch (fileError) {
          console.warn(`Could not save to file system, saved to persistence only: ${fileError}`);
        }
      }

      setContent(newContent);
    } catch (error) {
      console.error(`Failed to save script ${scriptPath}:`, error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [pluginId, scriptPath]);

  return [content, saveScript, loaded, saving];
}

/**
 * Hook for managing form state with persistence
 */
export function usePersistedForm<T extends Record<string, any>>(
  pluginId: string,
  formId: string,
  defaultValues: T,
  options: {
    autoSave?: boolean;
    debounceMs?: number;
    validateOnLoad?: boolean;
  } = {}
): [
  T,
  (values: Partial<T>) => void,
  (values: T) => Promise<void>,
  () => Promise<void>,
  boolean,
  boolean
] {
  const [values, setValues] = useState<T>(defaultValues);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  const persistenceOptions: ConfigPersistenceOptions = {
    pluginId,
    configType: 'ui-state',
    autoSave: options.autoSave ?? true,
    debounceMs: options.debounceMs ?? 1000
  };

  // Load form values on mount
  useEffect(() => {
    const loadForm = async () => {
      try {
        const loadedValues = await configPersistence.loadConfig(persistenceOptions, formId);
        if (loadedValues) {
          setValues({ ...defaultValues, ...loadedValues });
        }
      } catch (error) {
        console.error(`Failed to load form ${formId}:`, error);
      } finally {
        setLoaded(true);
      }
    };

    loadForm();
  }, [pluginId, formId]);

  // Update form values
  const updateValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  // Save form values
  const saveForm = useCallback(async (valuesToSave: T) => {
    setSaving(true);
    try {
      await configPersistence.saveConfig(persistenceOptions, formId, valuesToSave);
      setValues(valuesToSave);
    } catch (error) {
      console.error(`Failed to save form ${formId}:`, error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [pluginId, formId]);

  // Reset form values
  const resetForm = useCallback(async () => {
    setSaving(true);
    try {
      await configPersistence.deleteConfig(persistenceOptions, formId);
      setValues(defaultValues);
    } catch (error) {
      console.error(`Failed to reset form ${formId}:`, error);
      throw error;
    } finally {
      setSaving(false);
    }
  }, [pluginId, formId, defaultValues]);

  return [values, updateValues, saveForm, resetForm, loaded, saving];
}