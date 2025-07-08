#!/usr/bin/env node

/**
 * @fileoverview Test Plugin Schema Loading
 * Test script to verify plugin schemas can be loaded correctly
 */

import { SettingsManager } from '../dist/core/settings-manager.js';
import fs from 'fs/promises';

const testConfigDir = './temp-test-config';

async function testPluginSchemas() {
  console.log('🧪 Testing Plugin Schema Loading...\n');

  try {
    // Clean up any existing test config
    await fs.rm(testConfigDir, { recursive: true, force: true });

    // Create Settings Manager instance
    const settingsManager = new SettingsManager(testConfigDir);
    await settingsManager.init();

    console.log('✅ Settings Manager initialized\n');

    // Test loading each plugin schema
    const pluginIds = ['script-runner', 'as-built-documenter', 'context-generator', 'customer-links'];
    
    for (const pluginId of pluginIds) {
      console.log(`📝 Testing ${pluginId} schema...`);
      
      try {
        // Try to load the TypeScript schema
        let schema;
        switch (pluginId) {
          case 'script-runner':
            const scriptModule = await import('../dist/lib/schemas/plugins/script-runner.js');
            schema = scriptModule.scriptRunnerConfigSchema;
            break;
          case 'as-built-documenter':
            const asBuiltModule = await import('../dist/lib/schemas/plugins/as-built-documenter.js');
            schema = asBuiltModule.asBuiltDocumenterConfigSchema;
            break;
          case 'context-generator':
            const contextModule = await import('../dist/lib/schemas/plugins/context-generator.js');
            schema = contextModule.contextGeneratorConfigSchema;
            break;
          case 'customer-links':
            const customerModule = await import('../dist/lib/schemas/plugins/customer-links.js');
            schema = customerModule.customerLinksConfigSchema;
            break;
        }
        
        if (schema) {
          // Test schema parsing with defaults
          const defaultConfig = schema.parse({});
          console.log(`   ✅ Schema loaded and parsed successfully`);
          console.log(`   📊 Config keys: ${Object.keys(defaultConfig).slice(0, 5).join(', ')}${Object.keys(defaultConfig).length > 5 ? '...' : ''}`);
          
          // Test loading with settings manager
          try {
            const config = await settingsManager.loadPluginConfig(pluginId, schema, defaultConfig);
            console.log(`   ✅ Settings manager loaded config successfully`);
            console.log(`   💾 Enabled: ${config.enabled}, Settings count: ${Object.keys(config).length}`);
          } catch (err) {
            console.log(`   ⚠️  Settings manager load failed (expected for new config): ${err.message}`);
          }
        } else {
          console.log(`   ❌ Schema not found`);
        }
        
      } catch (err) {
        console.log(`   ❌ Failed to load schema: ${err.message}`);
      }
      
      console.log('');
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    // Clean up
    await fs.rm(testConfigDir, { recursive: true, force: true });
    console.log('🧹 Test config directory cleaned up');
  }
}

testPluginSchemas().catch(console.error);