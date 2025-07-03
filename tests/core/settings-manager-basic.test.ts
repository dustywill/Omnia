/**
 * @fileoverview Basic Settings Manager Tests
 * Simple tests to verify the Settings Manager works correctly
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { SettingsManager } from '../../src/core/settings-manager.js';
import { defaultAppConfig } from '../../src/lib/schemas/app-config.js';

describe('SettingsManager - Basic Functionality', () => {
  let settingsManager: SettingsManager;
  const tempConfigDir = '/tmp/test-config';

  beforeEach(() => {
    settingsManager = new SettingsManager(tempConfigDir);
  });

  describe('Constructor and Initialization', () => {
    it('should create settings manager with correct config directory', () => {
      expect(settingsManager.configDir).toBe(tempConfigDir);
    });

    it('should initialize with proper default paths', () => {
      expect(settingsManager.appConfigPath).toBe('/tmp/test-config/app.json5');
      expect(settingsManager.pluginRegistryPath).toBe('/tmp/test-config/plugins.json5');
      expect(settingsManager.pluginConfigsDir).toBe('/tmp/test-config/plugins');
    });
  });

  describe('Permission System', () => {
    it('should validate plugin permissions against manifest', () => {
      const mockManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        main: 'index.js',
        engine: {
          ttCommanderVersion: '>=1.0.0'
        },
        permissions: ['filesystem:read', 'process:execute']
      };

      const result = settingsManager.validatePermissions('test-plugin', ['filesystem:read'], mockManifest);

      expect(result.allowed).toEqual(['filesystem:read']);
      expect(result.denied).toEqual([]);
    });

    it('should deny unauthorized permissions', () => {
      const mockManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        main: 'index.js',
        engine: {
          ttCommanderVersion: '>=1.0.0'
        },
        permissions: ['filesystem:read']
      };

      const result = settingsManager.validatePermissions(
        'test-plugin', 
        ['filesystem:read', 'filesystem:write', 'network:access'], 
        mockManifest
      );

      expect(result.allowed).toEqual(['filesystem:read']);
      expect(result.denied).toEqual(['filesystem:write', 'network:access']);
    });

    it('should handle missing permissions in manifest', () => {
      const mockManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        main: 'index.js',
        engine: {
          ttCommanderVersion: '>=1.0.0'
        }
        // No permissions array
      };

      const result = settingsManager.validatePermissions(
        'test-plugin', 
        ['filesystem:read'], 
        mockManifest
      );

      expect(result.allowed).toEqual([]);
      expect(result.denied).toEqual(['filesystem:read']);
    });

    it('should check if plugin has specific permission', () => {
      const mockManifest = {
        id: 'test-plugin',
        name: 'Test Plugin',
        version: '1.0.0',
        description: 'Test plugin',
        main: 'index.js',
        engine: {
          ttCommanderVersion: '>=1.0.0'
        },
        permissions: ['filesystem:read', 'process:execute']
      };

      expect(settingsManager.hasPermission('test-plugin', 'filesystem:read', mockManifest)).toBe(true);
      expect(settingsManager.hasPermission('test-plugin', 'network:access', mockManifest)).toBe(false);
    });
  });

  describe('Configuration Schema Validation', () => {
    it('should have access to default app config', () => {
      expect(defaultAppConfig.appSettings.theme).toBe('system');
      expect(defaultAppConfig.logging.level).toBe('info');
      expect(defaultAppConfig.plugins).toEqual({});
    });

    it('should be able to destroy settings manager', () => {
      // This should not throw
      settingsManager.destroy();
    });
  });
});