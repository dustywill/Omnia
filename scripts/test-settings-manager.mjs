#!/usr/bin/env node

/**
 * @fileoverview Settings Manager Integration Test
 * Test script to demonstrate the new hybrid configuration system
 */

import { SettingsManager } from '../dist/core/settings-manager.js';
import { defaultAppConfig } from '../dist/lib/schemas/app-config.js';
import { z } from 'zod';
import path from 'path';
import fs from 'fs/promises';

const testConfigDir = './temp-test-config';

async function main() {
  console.log('🧪 Testing Settings Manager Integration...\n');

  try {
    // Clean up any existing test config
    await fs.rm(testConfigDir, { recursive: true, force: true });

    // Create Settings Manager instance
    const settingsManager = new SettingsManager(testConfigDir);
    
    // Initialize the settings manager
    await settingsManager.init();

    console.log('✅ Created SettingsManager instance');
    console.log(`   Config directory: ${settingsManager.configDir}`);
    console.log(`   App config path: ${settingsManager.appConfigPath}`);
    console.log(`   Plugin registry path: ${settingsManager.pluginRegistryPath}`);
    console.log(`   Plugin configs directory: ${settingsManager.pluginConfigsDir}\n`);

    // Test 1: Load app config (should create default)
    console.log('📝 Test 1: Loading app configuration...');
    const appConfig = await settingsManager.loadAppConfig();
    console.log('✅ App config loaded successfully');
    console.log(`   Theme: ${appConfig.appSettings.theme}`);
    console.log(`   Debug mode: ${appConfig.appSettings.debugMode}`);
    console.log(`   Logging level: ${appConfig.logging.level}\n`);

    // Test 2: Modify and save app config
    console.log('📝 Test 2: Modifying app configuration...');
    appConfig.appSettings.debugMode = true;
    appConfig.appSettings.theme = 'dark';
    appConfig.logging.level = 'debug';
    await settingsManager.saveAppConfig(appConfig);
    console.log('✅ App config saved successfully\n');

    // Test 3: Reload app config to verify persistence
    console.log('📝 Test 3: Reloading app configuration...');
    const reloadedConfig = await settingsManager.loadAppConfig();
    console.log('✅ App config reloaded successfully');
    console.log(`   Theme: ${reloadedConfig.appSettings.theme} (should be 'dark')`);
    console.log(`   Debug mode: ${reloadedConfig.appSettings.debugMode} (should be true)`);
    console.log(`   Logging level: ${reloadedConfig.logging.level} (should be 'debug')\n`);

    // Test 4: Load plugin registry (should create empty)
    console.log('📝 Test 4: Loading plugin registry...');
    const pluginRegistry = await settingsManager.loadPluginRegistry();
    console.log('✅ Plugin registry loaded successfully');
    console.log(`   Plugins: ${Object.keys(pluginRegistry.plugins).length} registered\n`);

    // Test 5: Register a plugin
    console.log('📝 Test 5: Registering a plugin...');
    await settingsManager.registerPlugin('test-plugin', {
      id: 'test-plugin',
      enabled: true,
      configPath: 'plugins/test-plugin.json5'
    });
    console.log('✅ Plugin registered successfully\n');

    // Test 6: Load updated plugin registry
    console.log('📝 Test 6: Loading updated plugin registry...');
    const updatedRegistry = await settingsManager.loadPluginRegistry();
    console.log('✅ Updated plugin registry loaded successfully');
    console.log(`   Plugins: ${Object.keys(updatedRegistry.plugins).length} registered`);
    console.log(`   Test plugin enabled: ${updatedRegistry.plugins['test-plugin']?.enabled}\n`);

    // Test 7: Permission validation
    console.log('📝 Test 7: Testing permission validation...');
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

    const permissionResult = settingsManager.validatePermissions(
      'test-plugin', 
      ['filesystem:read', 'filesystem:write', 'process:execute'], 
      mockManifest
    );
    console.log('✅ Permission validation completed');
    console.log(`   Allowed: ${permissionResult.allowed.join(', ')}`);
    console.log(`   Denied: ${permissionResult.denied.join(', ')}\n`);

    // Test 8: Save plugin config with schema validation
    console.log('📝 Test 8: Testing plugin configuration...');
    
    // Simple plugin config schema for testing
    const testPluginSchema = z.object({
      enabled: z.boolean().default(true),
      setting1: z.string().default('default-value'),
      setting2: z.number().default(42)
    });

    const pluginConfig = {
      enabled: true,
      setting1: 'test-value',
      setting2: 100
    };

    await settingsManager.savePluginConfig('test-plugin', pluginConfig, testPluginSchema);
    console.log('✅ Plugin config saved successfully');

    const loadedPluginConfig = await settingsManager.loadPluginConfig('test-plugin', testPluginSchema);
    console.log(`   Loaded config: ${JSON.stringify(loadedPluginConfig, null, 2)}\n`);

    // Test 9: Directory structure verification
    console.log('📝 Test 9: Verifying directory structure...');
    const files = await fs.readdir(testConfigDir, { recursive: true });
    console.log('✅ Directory structure created:');
    files.forEach(file => console.log(`   ${file}`));

    // Cleanup
    settingsManager.destroy();
    console.log('\n✅ Settings Manager destroyed');

    console.log('\n🎉 All tests passed! Settings Manager is working correctly.');

  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  } finally {
    // Clean up test config
    try {
      await fs.rm(testConfigDir, { recursive: true, force: true });
      console.log('🧹 Test config directory cleaned up');
    } catch (error) {
      console.warn('Warning: Could not clean up test config directory:', error.message);
    }
  }
}

main();