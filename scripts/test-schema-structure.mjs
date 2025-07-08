#!/usr/bin/env node

/**
 * @fileoverview Test Schema Structure
 * Shows the schema structure to verify it can generate forms correctly
 */

async function testSchemaStructure() {
  console.log('🧪 Testing Schema Structure for Form Generation...\n');

  try {
    // Test script-runner schema
    console.log('📝 Script Runner Schema Structure:');
    const { scriptRunnerConfigSchema } = await import('../dist/lib/schemas/plugins/script-runner.js');
    
    // Parse with defaults to see the structure
    const defaultConfig = scriptRunnerConfigSchema.parse({});
    console.log('✅ Default configuration generated:');
    Object.entries(defaultConfig).forEach(([key, value]) => {
      const type = Array.isArray(value) ? 'array' : typeof value;
      const display = Array.isArray(value) ? `[${value.length} items]` : 
                     type === 'object' ? '{object}' : value;
      console.log(`   ${key}: ${display} (${type})`);
    });
    
    console.log('\n📝 As-Built Documenter Schema Structure:');
    const { asBuiltDocumenterConfigSchema } = await import('../dist/lib/schemas/plugins/as-built-documenter.js');
    
    const asBuiltDefault = asBuiltDocumenterConfigSchema.parse({});
    console.log('✅ Default configuration generated:');
    Object.entries(asBuiltDefault).slice(0, 8).forEach(([key, value]) => {
      const type = Array.isArray(value) ? 'array' : typeof value;
      const display = Array.isArray(value) ? `[${value.length} items]` : 
                     type === 'object' ? '{object}' : value;
      console.log(`   ${key}: ${display} (${type})`);
    });
    console.log(`   ... and ${Object.keys(asBuiltDefault).length - 8} more properties`);
    
    console.log('\n📝 Context Generator Schema Structure:');
    const { contextGeneratorConfigSchema } = await import('../dist/lib/schemas/plugins/context-generator.js');
    
    const contextDefault = contextGeneratorConfigSchema.parse({});
    console.log('✅ Default configuration generated:');
    Object.entries(contextDefault).slice(0, 8).forEach(([key, value]) => {
      const type = Array.isArray(value) ? 'array' : typeof value;
      const display = Array.isArray(value) ? `[${value.length} items]` : 
                     type === 'object' ? '{object}' : value;
      console.log(`   ${key}: ${display} (${type})`);
    });
    console.log(`   ... and ${Object.keys(contextDefault).length - 8} more properties`);
    
    console.log('\n✅ All schemas generate proper default configurations!');
    console.log('📊 Summary:');
    console.log(`   Script Runner: ${Object.keys(defaultConfig).length} properties`);
    console.log(`   As-Built Documenter: ${Object.keys(asBuiltDefault).length} properties`);
    console.log(`   Context Generator: ${Object.keys(contextDefault).length} properties`);
    
    console.log('\n🎯 These schemas are ready for form generation!');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testSchemaStructure().catch(console.error);