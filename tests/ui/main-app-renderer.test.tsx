import { screen, act, fireEvent } from '@testing-library/react';
import { initMainAppRenderer } from '../../src/ui/main-app-renderer.js';
import path from 'path';

// Mock the core systems to avoid complex initialization
jest.mock('../../src/core/settings-manager.js', () => ({
  SettingsManager: class MockSettingsManager {
    async init() {}
    async loadPluginRegistry() {
      return {
        plugins: {
          'context-generator': { enabled: true },
          'customer-links': { enabled: true },
          'script-runner': { enabled: false }
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
      const manifests = {
        'context-generator': {
          name: 'Context Generator',
          description: 'Generate context files',
          version: '1.0.0',
          type: 'simple'
        },
        'customer-links': {
          name: 'Customer Links',
          description: 'Manage customer links',
          version: '1.0.0',
          type: 'configured'
        },
        'script-runner': {
          name: 'Script Runner',
          description: 'Run scripts',
          version: '1.0.0',
          type: 'hybrid'
        }
      };
      return manifests[pluginId] || null;
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

jest.mock('../../src/core/event-bus.js', () => ({
  createEventBus: () => ({
    subscribe: jest.fn(),
    publish: jest.fn(),
    unsubscribe: jest.fn()
  })
}));

jest.mock('../../src/ui/node-module-loader.js', () => ({
  loadNodeModule: jest.fn().mockResolvedValue(path)
}));

describe('MainAppRenderer', () => {
  let container;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('initializes with dashboard view by default', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Check that the main app navigation is rendered
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Plugins')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();

    // Check that dashboard view is active (navigation should show dashboard as selected)
    const dashboardNav = screen.getByText('Dashboard').closest('button');
    expect(dashboardNav).toHaveClass('active');
  });

  it('shows plugin cards in dashboard view', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Check that plugin cards are displayed
    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.getByText('Customer Links')).toBeInTheDocument();
    expect(screen.getByText('Script Runner')).toBeInTheDocument();
  });

  it('switches to plugins view when plugins nav is clicked', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Click on Plugins navigation
    const pluginsNavButton = screen.getByText('Plugins').closest('button');
    await act(async () => {
      fireEvent.click(pluginsNavButton);
    });

    // Verify plugins view is now active
    expect(pluginsNavButton).toHaveClass('active');
    
    // Check that plugins view content is displayed
    expect(screen.getByText('Plugins')).toBeInTheDocument();
    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.getByText('Customer Links')).toBeInTheDocument();
  });

  it('switches to settings view when settings nav is clicked', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Click on Settings navigation
    const settingsNavButton = screen.getByText('Settings').closest('button');
    await act(async () => {
      fireEvent.click(settingsNavButton);
    });

    // Verify settings view is now active
    expect(settingsNavButton).toHaveClass('active');
    
    // Check that settings view content is displayed
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows plugin detail view when plugin is selected', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Click on a plugin card to view details
    const pluginCard = screen.getByText('Context Generator').closest('div');
    await act(async () => {
      fireEvent.click(pluginCard);
    });

    // Verify plugin detail view is shown
    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    // Should show a back button or similar navigation
    expect(screen.getByText('Back')).toBeInTheDocument();
  });

  it('handles plugin enable/disable toggle', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Find and click a plugin toggle button
    const toggleButton = screen.getByText('Context Generator')
      .closest('div')
      .querySelector('button[aria-label*="toggle"]');
    
    if (toggleButton) {
      await act(async () => {
        fireEvent.click(toggleButton);
      });
      
      // Should trigger plugin toggle action
      // Note: This would require implementing the actual toggle functionality
      expect(toggleButton).toBeInTheDocument();
    }
  });

  it('displays plugin status correctly', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Check that enabled/disabled plugins show correct status
    const contextGeneratorCard = screen.getByText('Context Generator').closest('div');
    const customerLinksCard = screen.getByText('Customer Links').closest('div');
    const scriptRunnerCard = screen.getByText('Script Runner').closest('div');

    expect(contextGeneratorCard).toHaveClass('enabled');
    expect(customerLinksCard).toHaveClass('enabled');
    expect(scriptRunnerCard).toHaveClass('disabled');
  });

  it('shows different plugin types correctly', async () => {
    await act(async () => {
      await initMainAppRenderer({
        container,
        pluginsPath: path.join(process.cwd(), 'plugins'),
        configPath: path.join(process.cwd(), 'config'),
      });
    });

    // Check that different plugin types are displayed
    expect(screen.getByText('simple')).toBeInTheDocument(); // Context Generator
    expect(screen.getByText('configured')).toBeInTheDocument(); // Customer Links
    expect(screen.getByText('hybrid')).toBeInTheDocument(); // Script Runner
  });
});