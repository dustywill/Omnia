/**
 * @fileoverview Settings Manager Tests
 * Comprehensive tests for the new hybrid configuration system
 */

import { describe, it, expect, beforeEach, afterEach, jest, beforeAll } from '@jest/globals';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { SettingsManager } from '../../src/core/settings-manager.js';
import { AppConfigSchema } from '../../src/lib/schemas/app-config.js';
import { PluginManifestSchema } from '../../src/lib/schemas/plugin-manifest.js';

// Mock fs operations
jest.mock('fs/promises');
jest.mock('fs');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockFsSync = fsSync as jest.Mocked<typeof fsSync>;

describe('SettingsManager', () => {
  let settingsManager: SettingsManager;
  let tempConfigDir: string;

  beforeAll(() => {
    // Set up temporary config directory path
    tempConfigDir = '/tmp/test-config';
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Create new settings manager instance
    settingsManager = new SettingsManager(tempConfigDir);
  });

  afterEach(() => {
    // Clean up any watchers or listeners
    settingsManager.destroy();
  });

  describe('Constructor and Initialization', () => {
    it('should create settings manager with correct config directory', () => {
      expect(settingsManager.configDir).toBe(tempConfigDir);
    });

    it('should initialize with proper default paths', () => {
      expect(settingsManager.appConfigPath).toBe(path.join(tempConfigDir, 'app.json5'));
      expect(settingsManager.pluginRegistryPath).toBe(path.join(tempConfigDir, 'plugins.json5'));
      expect(settingsManager.pluginConfigsDir).toBe(path.join(tempConfigDir, 'plugins'));
    });
  });

  describe('App Configuration Management', () => {
    it('should load existing app config successfully', async () => {
      const mockConfig = {
        appSettings: {
          version: '1.0.0',
          debugMode: true,
          userName: 'TestUser',
          theme: 'dark' as const,
          pluginsDirectory: 'test-plugins',
          scriptsDirectory: 'test-scripts'
        },
        logging: {
          level: 'debug' as const,
          prettyPrint: true,
          filePath: 'test.log'
        },
        plugins: {}
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await settingsManager.loadAppConfig();

      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'app.json5'), 
        'utf8'
      );
      expect(result).toEqual(mockConfig);
    });

    it('should create default app config when file does not exist', async () => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      mockFs.writeFile.mockResolvedValue();

      const result = await settingsManager.loadAppConfig();

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'app.json5'),
        expect.stringContaining('appSettings'),
        'utf8'
      );
      expect(result.appSettings.theme).toBe('system');
      expect(result.logging.level).toBe('info');
    });

    it('should validate app config against schema', async () => {
      const invalidConfig = {
        appSettings: {
          theme: 'invalid-theme', // Invalid theme value
          debugMode: 'not-boolean' // Invalid type
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));

      await expect(settingsManager.loadAppConfig()).rejects.toThrow();
    });

    it('should save app config with proper formatting', async () => {
      const config = {
        appSettings: {
          version: '1.0.0',
          debugMode: false,
          userName: 'TestUser',
          theme: 'light' as const,
          pluginsDirectory: 'plugins',
          scriptsDirectory: 'scripts'
        },
        logging: {
          level: 'info' as const,
          prettyPrint: false,
          filePath: 'logs/app.log'
        },
        plugins: {}
      };

      mockFs.writeFile.mockResolvedValue();

      await settingsManager.saveAppConfig(config);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'app.json5'),
        expect.stringContaining('appSettings'),
        'utf8'
      );

      // Verify the JSON5 formatting
      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).toMatch(/{\s+appSettings:/);
      expect(writtenContent).toMatch(/debugMode: false/);
    });
  });

  describe('Plugin Registry Management', () => {
    it('should load existing plugin registry', async () => {
      const mockRegistry = {
        plugins: {
          'script-runner': {
            id: 'script-runner',
            enabled: true,
            configPath: 'plugins/script-runner.json5'
          },
          'file-scanner': {
            id: 'file-scanner', 
            enabled: false,
            configPath: 'plugins/file-scanner.json5'
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockRegistry));

      const result = await settingsManager.loadPluginRegistry();

      expect(result).toEqual(mockRegistry);
    });

    it('should create empty plugin registry when file does not exist', async () => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      mockFs.writeFile.mockResolvedValue();

      const result = await settingsManager.loadPluginRegistry();

      expect(result).toEqual({ plugins: {} });
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'plugins.json5'),
        expect.stringContaining('plugins: {}'),
        'utf8'
      );
    });

    it('should register new plugin in registry', async () => {
      const existingRegistry = { plugins: {} };
      const newPlugin = {
        id: 'new-plugin',
        enabled: true,
        configPath: 'plugins/new-plugin.json5'
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(existingRegistry));
      mockFs.writeFile.mockResolvedValue();

      await settingsManager.registerPlugin(newPlugin.id, newPlugin);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'plugins.json5'),
        expect.stringContaining('new-plugin'),
        'utf8'
      );
    });

    it('should unregister plugin from registry', async () => {
      const existingRegistry = {
        plugins: {
          'plugin-to-remove': {
            id: 'plugin-to-remove',
            enabled: true,
            configPath: 'plugins/plugin-to-remove.json5'
          },
          'plugin-to-keep': {
            id: 'plugin-to-keep',
            enabled: true,
            configPath: 'plugins/plugin-to-keep.json5'
          }
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(existingRegistry));
      mockFs.writeFile.mockResolvedValue();

      await settingsManager.unregisterPlugin('plugin-to-remove');

      const writtenContent = mockFs.writeFile.mock.calls[0][1] as string;
      expect(writtenContent).not.toContain('plugin-to-remove');
      expect(writtenContent).toContain('plugin-to-keep');
    });
  });

  describe('Plugin Configuration Management', () => {
    it('should load plugin config with schema validation', async () => {
      const mockPluginConfig = {
        enabled: true,
        scriptsDirectory: 'custom-scripts',
        scriptConfigurations: []
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(mockPluginConfig));

      // Mock plugin schema (this would normally come from plugin manifest)
      const mockSchema = {
        parse: jest.fn().mockReturnValue(mockPluginConfig)
      };

      const result = await settingsManager.loadPluginConfig('script-runner', mockSchema as any);

      expect(mockFs.readFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'plugins', 'script-runner.json5'),
        'utf8'
      );
      expect(mockSchema.parse).toHaveBeenCalledWith(mockPluginConfig);
      expect(result).toEqual(mockPluginConfig);
    });

    it('should create default plugin config when file does not exist', async () => {
      const error = new Error('File not found');
      (error as any).code = 'ENOENT';
      mockFs.readFile.mockRejectedValue(error);
      mockFs.writeFile.mockResolvedValue();

      const defaultConfig = { enabled: true };
      const mockSchema = {
        parse: jest.fn().mockReturnValue(defaultConfig)
      };

      const result = await settingsManager.loadPluginConfig('new-plugin', mockSchema as any, defaultConfig);

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'plugins', 'new-plugin.json5'),
        expect.stringContaining('enabled: true'),
        'utf8'
      );
      expect(result).toEqual(defaultConfig);
    });

    it('should save plugin config with schema validation', async () => {
      const pluginConfig = {
        enabled: false,
        customSetting: 'test-value'
      };

      const mockSchema = {
        parse: jest.fn().mockReturnValue(pluginConfig)
      };

      mockFs.writeFile.mockResolvedValue();

      await settingsManager.savePluginConfig('test-plugin', pluginConfig, mockSchema as any);

      expect(mockSchema.parse).toHaveBeenCalledWith(pluginConfig);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'plugins', 'test-plugin.json5'),
        expect.stringContaining('enabled: false'),
        'utf8'
      );
    });
  });

  describe('Permission System', () => {
    it('should validate plugin permissions against manifest', async () => {
      const mockManifest = {
        id: 'test-plugin',
        permissions: ['filesystem:read', 'process:execute']
      };

      const result = settingsManager.validatePermissions('test-plugin', ['filesystem:read'], mockManifest as any);

      expect(result.allowed).toEqual(['filesystem:read']);
      expect(result.denied).toEqual([]);
    });

    it('should deny unauthorized permissions', async () => {
      const mockManifest = {
        id: 'test-plugin',
        permissions: ['filesystem:read']
      };

      const result = settingsManager.validatePermissions(
        'test-plugin', 
        ['filesystem:read', 'filesystem:write', 'network:access'], 
        mockManifest as any
      );

      expect(result.allowed).toEqual(['filesystem:read']);
      expect(result.denied).toEqual(['filesystem:write', 'network:access']);
    });

    it('should handle missing permissions in manifest', async () => {
      const mockManifest = {
        id: 'test-plugin'
        // No permissions array
      };

      const result = settingsManager.validatePermissions(
        'test-plugin', 
        ['filesystem:read'], 
        mockManifest as any
      );

      expect(result.allowed).toEqual([]);
      expect(result.denied).toEqual(['filesystem:read']);
    });

    it('should check if plugin has specific permission', async () => {
      const mockManifest = {
        id: 'test-plugin',
        permissions: ['filesystem:read', 'process:execute']
      };

      expect(settingsManager.hasPermission('test-plugin', 'filesystem:read', mockManifest as any)).toBe(true);
      expect(settingsManager.hasPermission('test-plugin', 'network:access', mockManifest as any)).toBe(false);
    });
  });

  describe('Configuration Watching', () => {
    it('should start watching app config file', async () => {
      const mockWatcher = {
        on: jest.fn(),
        close: jest.fn()
      };

      // Mock fs.watch
      const fsWatch = jest.fn().mockReturnValue(mockWatcher);
      (fs as any).watch = fsWatch;

      const callback = jest.fn();
      settingsManager.watchAppConfig(callback);

      expect(fsWatch).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'app.json5'),
        expect.any(Function)
      );
    });

    it('should start watching plugin config file', async () => {
      const mockWatcher = {
        on: jest.fn(),
        close: jest.fn()
      };

      const fsWatch = jest.fn().mockReturnValue(mockWatcher);
      (fs as any).watch = fsWatch;

      const callback = jest.fn();
      settingsManager.watchPluginConfig('test-plugin', callback);

      expect(fsWatch).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'plugins', 'test-plugin.json5'),
        expect.any(Function)
      );
    });

    it('should stop all watchers on destroy', async () => {
      const mockWatcher = {
        on: jest.fn(),
        close: jest.fn()
      };

      const fsWatch = jest.fn().mockReturnValue(mockWatcher);
      (fs as any).watch = fsWatch;

      settingsManager.watchAppConfig(jest.fn());
      settingsManager.watchPluginConfig('test-plugin', jest.fn());

      settingsManager.destroy();

      expect(mockWatcher.close).toHaveBeenCalledTimes(2);
    });
  });

  describe('Error Handling', () => {
    it('should handle file system errors gracefully', async () => {
      const fsError = new Error('Permission denied');
      (fsError as any).code = 'EACCES';
      mockFs.readFile.mockRejectedValue(fsError);

      await expect(settingsManager.loadAppConfig()).rejects.toThrow('Permission denied');
    });

    it('should handle invalid JSON gracefully', async () => {
      mockFs.readFile.mockResolvedValue('invalid json content');

      await expect(settingsManager.loadAppConfig()).rejects.toThrow();
    });

    it('should handle schema validation errors with detailed messages', async () => {
      const invalidConfig = {
        appSettings: {
          theme: 'invalid-theme'
        }
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(invalidConfig));

      try {
        await settingsManager.loadAppConfig();
        fail('Should have thrown validation error');
      } catch (error: any) {
        expect(error.message).toContain('validation');
      }
    });
  });

  describe('Integration Features', () => {
    it('should migrate old config format to new format', async () => {
      const oldConfig = {
        theme: 'dark',
        debugMode: true,
        // Old flat structure
      };

      mockFs.readFile.mockResolvedValue(JSON.stringify(oldConfig));
      mockFs.writeFile.mockResolvedValue();

      const result = await settingsManager.migrateOldConfig(oldConfig);

      expect(result.appSettings.theme).toBe('dark');
      expect(result.appSettings.debugMode).toBe(true);
      expect(mockFs.writeFile).toHaveBeenCalled();
    });

    it('should backup config before making changes', async () => {
      const config = {
        appSettings: {
          version: '1.0.0',
          debugMode: false,
          userName: 'TestUser',
          theme: 'light' as const,
          pluginsDirectory: 'plugins',
          scriptsDirectory: 'scripts'
        },
        logging: {
          level: 'info' as const,
          prettyPrint: false,
          filePath: 'logs/app.log'
        },
        plugins: {}
      };

      mockFs.writeFile.mockResolvedValue();
      mockFs.copyFile.mockResolvedValue();

      await settingsManager.saveAppConfigWithBackup(config);

      expect(mockFs.copyFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'app.json5'),
        expect.stringContaining('app.json5.backup')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        path.join(tempConfigDir, 'app.json5'),
        expect.any(String),
        'utf8'
      );
    });
  });
});