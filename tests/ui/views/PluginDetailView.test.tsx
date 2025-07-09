import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { PluginDetailView } from '../../../src/ui/views/PluginDetailView.js';
import type { PluginInfo } from '../../../src/ui/main-app-renderer.js';

// Mock the plugin UI loader
jest.mock('../../../src/ui/plugin-ui-loader.js', () => ({
  loadPluginUI: jest.fn().mockResolvedValue({}),
}));

// Mock the core systems
jest.mock('../../../src/core/enhanced-plugin-manager.js', () => ({
  EnhancedPluginManager: class MockEnhancedPluginManager {
    async loadPluginModule() {
      return {
        default: () => <div>Mock Plugin UI</div>
      };
    }
  }
}));

jest.mock('../../../src/core/service-registry.js', () => ({
  ServiceRegistry: class MockServiceRegistry {
    getService() {
      return null;
    }
  }
}));

jest.mock('../../../src/core/settings-manager.js', () => ({
  SettingsManager: class MockSettingsManager {
    async loadPluginConfig() {
      return {};
    }
  }
}));

describe('PluginDetailView', () => {
  const mockPlugin: PluginInfo = {
    id: 'context-generator',
    name: 'Context Generator',
    description: 'Generate context files for development',
    version: '1.0.0',
    author: 'Test Author',
    type: 'simple',
    enabled: true,
    manifest: {
      name: 'Context Generator',
      description: 'Generate context files for development',
      version: '1.0.0',
      author: 'Test Author',
      type: 'simple',
      permissions: ['read-files', 'write-files']
    },
    status: 'active',
    permissions: ['read-files', 'write-files']
  };

  const mockHandlers = {
    onBack: jest.fn(),
    pluginManager: {} as any,
    serviceRegistry: {} as any,
    settingsManager: {} as any
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plugin information', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate context files for development')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('simple')).toBeInTheDocument();
  });

  it('displays plugin status', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('active')).toBeInTheDocument();
    expect(screen.getByText('Enabled')).toBeInTheDocument();
  });

  it('shows plugin permissions', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('read-files')).toBeInTheDocument();
    expect(screen.getByText('write-files')).toBeInTheDocument();
  });

  it('renders back button', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const backButton = screen.getByText('Back');
    expect(backButton).toBeInTheDocument();
  });

  it('calls onBack when back button is clicked', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const backButton = screen.getByText('Back');
    fireEvent.click(backButton);

    expect(mockHandlers.onBack).toHaveBeenCalled();
  });

  it('loads and displays plugin UI', async () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    // Wait for plugin UI to load
    await screen.findByText('Mock Plugin UI');
    expect(screen.getByText('Mock Plugin UI')).toBeInTheDocument();
  });

  it('shows loading state while plugin UI loads', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Loading plugin...')).toBeInTheDocument();
  });

  it('handles disabled plugin', () => {
    const disabledPlugin = {
      ...mockPlugin,
      enabled: false,
      status: 'inactive' as const
    };

    render(
      <PluginDetailView 
        plugin={disabledPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('inactive')).toBeInTheDocument();
    expect(screen.getByText('Disabled')).toBeInTheDocument();
  });

  it('handles error plugin', () => {
    const errorPlugin = {
      ...mockPlugin,
      status: 'error' as const
    };

    render(
      <PluginDetailView 
        plugin={errorPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('error')).toBeInTheDocument();
    expect(screen.getByText('Error loading plugin')).toBeInTheDocument();
  });

  it('shows plugin configuration section for configured plugins', () => {
    const configuredPlugin = {
      ...mockPlugin,
      type: 'configured' as const,
      config: {
        option1: 'value1',
        option2: 'value2'
      }
    };

    render(
      <PluginDetailView 
        plugin={configuredPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Configuration')).toBeInTheDocument();
    expect(screen.getByText('option1')).toBeInTheDocument();
    expect(screen.getByText('value1')).toBeInTheDocument();
  });

  it('shows services section for hybrid plugins', () => {
    const hybridPlugin = {
      ...mockPlugin,
      type: 'hybrid' as const,
      manifest: {
        ...mockPlugin.manifest,
        services: ['file-processor', 'data-transformer']
      }
    };

    render(
      <PluginDetailView 
        plugin={hybridPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Services')).toBeInTheDocument();
    expect(screen.getByText('file-processor')).toBeInTheDocument();
    expect(screen.getByText('data-transformer')).toBeInTheDocument();
  });

  it('provides plugin actions', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Enable/Disable')).toBeInTheDocument();
    expect(screen.getByText('Configure')).toBeInTheDocument();
    expect(screen.getByText('Remove')).toBeInTheDocument();
  });

  it('shows plugin metadata', () => {
    render(
      <PluginDetailView 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Plugin ID:')).toBeInTheDocument();
    expect(screen.getByText('context-generator')).toBeInTheDocument();
    expect(screen.getByText('Version:')).toBeInTheDocument();
    expect(screen.getByText('Type:')).toBeInTheDocument();
    expect(screen.getByText('Status:')).toBeInTheDocument();
  });
});