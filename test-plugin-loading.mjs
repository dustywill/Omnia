import { EnhancedPluginManager } from './dist/core/enhanced-plugin-manager.js';
import { SettingsManager } from './dist/core/settings-manager.js';
import { ServiceRegistry } from './dist/core/service-registry.js';
import path from 'path';

// Mock JSDOM for node environment
const { JSDOM } = await import('jsdom');
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.HTMLInputElement = dom.window.HTMLInputElement;
Object.defineProperty(global, 'navigator', { value: { userAgent: 'node.js' }, writable: true });

// Initialize core components
const settingsManager = new SettingsManager({ 
  configDirectory: path.join(process.cwd(), 'config'),
  configFileName: 'app.json5'
});

const serviceRegistry = new ServiceRegistry();

const pluginManager = new EnhancedPluginManager({
  pluginsDirectory: path.join(process.cwd(), 'plugins'),
  configDirectory: path.join(process.cwd(), 'config'),
  settingsManager,
  serviceRegistry
});

await pluginManager.init();

console.log('[TEST] Loading script-runner plugin...');
try {
  const pluginModule = await pluginManager.loadPluginModule('script-runner');
  console.log('[TEST] Plugin module loaded successfully');
  console.log('[TEST] Module keys:', Object.keys(pluginModule));
  console.log('[TEST] Module default type:', typeof pluginModule.default);
  console.log('[TEST] Module named exports:', Object.keys(pluginModule).filter(k => k !== 'default'));
  
  // Test the component extraction logic
  const Component = pluginModule.default || pluginModule;
  console.log('[TEST] Component type:', typeof Component);
  console.log('[TEST] Component name:', Component.name);
  
  if (typeof Component === 'function') {
    console.log('[TEST] Component is a function - should work as React component');
  } else {
    console.log('[TEST] Component is not a function - this is the problem!');
  }
  
} catch (error) {
  console.error('[TEST] Error loading plugin:', error);
}