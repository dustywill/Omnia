import { screen, act } from '@testing-library/react';
import path from 'path';
import { initMainAppRenderer } from '../../src/ui/main-app-renderer.js';

// Mock the core systems to avoid complex initialization
jest.mock('../../src/core/settings-manager.js', () => ({
  SettingsManager: class MockSettingsManager {
    async init() {}
    async loadPluginRegistry() {
      return {
        plugins: {
          'context-generator': { enabled: true }
        }
      };
    }
    async loadPluginConfig() {
      return {};
    }
  }
}));

jest.mock('../../src/core/enhanced-plugin-manager.js', () => ({
  EnhancedPluginManager: class MockEnhancedPluginManager {
    async init() {}
    async discoverPlugins() {}
    async loadManifest(pluginId) {
      if (pluginId === 'context-generator') {
        return {
          name: 'Context Generator',
          description: 'Generate context files',
          version: '1.0.0',
          type: 'simple'
        };
      }
      return null;
    }
    async loadConfigSchema() {
      return null;
    }
    async loadPluginModule() {
      return null;
    }
    async initializeServices() {}
  }
}));

jest.mock('../../src/core/service-registry.js', () => ({
  ServiceRegistry: class MockServiceRegistry {
    constructor() {}
  }
}));

it('initializes main app renderer with dashboard view', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const pluginsPath = path.join(process.cwd(), 'plugins');
  const configPath = path.join(process.cwd(), 'config');
  
  await act(async () => {
    await initMainAppRenderer({
      container,
      pluginsPath,
      configPath,
    });
  });
  
  // Check that the main app navigation is rendered
  expect(screen.getByText('Dashboard')).toBeInTheDocument();
  expect(screen.getByText('Plugins')).toBeInTheDocument();
  expect(screen.getByText('Settings')).toBeInTheDocument();
  
  // Check that the dashboard view shows plugin cards
  expect(screen.getByText('Context Generator')).toBeInTheDocument();
});
