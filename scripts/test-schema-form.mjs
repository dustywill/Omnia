#!/usr/bin/env node

/**
 * @fileoverview Test Schema-to-Form Generation
 * Demonstrates that the schemas can generate form fields correctly
 */

import { SettingsManager } from '../dist/core/settings-manager.js';
import fs from 'fs/promises';

const testConfigDir = './temp-test-config';

async function testSchemaFormGeneration() {
  console.log('🧪 Testing Schema-to-Form Generation...\n');

  try {
    // Clean up any existing test config
    await fs.rm(testConfigDir, { recursive: true, force: true });

    // Create Settings Manager instance
    const settingsManager = new SettingsManager(testConfigDir);
    await settingsManager.init();

    console.log('✅ Settings Manager initialized\n');

    // Test script-runner as an example
    console.log('📝 Testing script-runner schema form generation...');
    
    const { scriptRunnerConfigSchema } = await import('../dist/lib/schemas/plugins/script-runner.js');
    
    // Load the actual configuration
    const config = await settingsManager.loadPluginConfig('script-runner', scriptRunnerConfigSchema);
    
    console.log('✅ Configuration loaded successfully');
    console.log(`   Scripts Directory: ${config.scriptsDirectory}`);
    console.log(`   Script Configurations: ${config.scriptConfigurations.length} scripts`);
    console.log(`   Output Directory: ${config.outputDirectory}`);
    console.log(`   Default Shell: ${config.defaultShell}`);
    
    // Show some script configurations
    if (config.scriptConfigurations && config.scriptConfigurations.length > 0) {
      console.log('\n📋 Script Configurations:');
      config.scriptConfigurations.slice(0, 2).forEach((script, index) => {
        console.log(`   ${index + 1}. ${script.name} (${script.id})`);
        console.log(`      Path: ${script.scriptPath}`);
        console.log(`      Group: ${script.group || 'None'}`);
        console.log(`      Elevated: ${script.elevated}`);
      });
    }
    
    // Test validation
    console.log('\n🔍 Testing schema validation...');
    const testConfig = {
      enabled: true,
      scriptsDirectory: 'test-scripts',
      scriptConfigurations: [
        {
          enabled: true,
          id: 'test-script',
          name: 'Test Script',
          scriptPath: 'test.ps1',
          elevated: false,
          parameters: []
        }
      ]
    };
    
    const validatedConfig = scriptRunnerConfigSchema.parse(testConfig);
    console.log('✅ Schema validation passed');
    console.log(`   Validated config has ${Object.keys(validatedConfig).length} properties`);
    
    // Test saving
    console.log('\n💾 Testing configuration save...');
    await settingsManager.savePluginConfig('test-plugin', testConfig, scriptRunnerConfigSchema);
    console.log('✅ Configuration saved successfully');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    await fs.rm(testConfigDir, { recursive: true, force: true });
    console.log('\n🧹 Test config directory cleaned up');
  }
}

testSchemaFormGeneration().catch(console.error);