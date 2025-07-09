import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { PluginsView } from '../../../src/ui/views/PluginsView.js';
import type { PluginInfo } from '../../../src/ui/main-app-renderer.js';

// Mock the PluginCard component
jest.mock('../../../src/ui/components/PluginCard/PluginCard.js', () => ({
  PluginCard: ({ plugin, onSelect, onToggle, onConfigure }) => (
    <div 
      className="plugin-card"
      onClick={() => onSelect(plugin.id)}
      data-testid={`plugin-card-${plugin.id}`}
    >
      <h3>{plugin.name}</h3>
      <p>{plugin.description}</p>
      <span className="plugin-type">{plugin.type}</span>
      <span className="plugin-status">{plugin.status}</span>
      <button onClick={() => onToggle(plugin.id)}>Toggle</button>
      <button onClick={() => onConfigure(plugin.id)}>Configure</button>
    </div>
  )
}));

describe('PluginsView', () => {
  const mockPlugins: PluginInfo[] = [
    {
      id: 'context-generator',
      name: 'Context Generator',
      description: 'Generate context files',
      version: '1.0.0',
      type: 'simple',
      enabled: true,
      manifest: {},
      status: 'active'
    },
    {
      id: 'customer-links',
      name: 'Customer Links',
      description: 'Manage customer links',
      version: '1.0.0',
      type: 'configured',
      enabled: true,
      manifest: {},
      status: 'active'
    },
    {
      id: 'script-runner',
      name: 'Script Runner',
      description: 'Run scripts',
      version: '1.0.0',
      type: 'hybrid',
      enabled: false,
      manifest: {},
      status: 'error'
    }
  ];

  const mockHandlers = {
    onPluginSelect: jest.fn(),
    onPluginToggle: jest.fn(),
    onPluginConfigure: jest.fn(),
    onPluginRemove: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders all plugin cards', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.getByText('Customer Links')).toBeInTheDocument();
    expect(screen.getByText('Script Runner')).toBeInTheDocument();
  });

  it('displays plugin types', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('simple')).toBeInTheDocument();
    expect(screen.getByText('configured')).toBeInTheDocument();
    expect(screen.getByText('hybrid')).toBeInTheDocument();
  });

  it('displays plugin status', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    expect(screen.getAllByText('active')).toHaveLength(2);
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('provides search functionality', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search plugins...');
    fireEvent.change(searchInput, { target: { value: 'context' } });

    // After search, only matching plugins should be visible
    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.queryByText('Customer Links')).not.toBeInTheDocument();
    expect(screen.queryByText('Script Runner')).not.toBeInTheDocument();
  });

  it('provides filter functionality', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    const filterSelect = screen.getByLabelText('Filter by type');
    fireEvent.change(filterSelect, { target: { value: 'simple' } });

    // After filtering, only simple plugins should be visible
    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.queryByText('Customer Links')).not.toBeInTheDocument();
    expect(screen.queryByText('Script Runner')).not.toBeInTheDocument();
  });

  it('calls onPluginSelect when plugin is clicked', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    const pluginCard = screen.getByTestId('plugin-card-context-generator');
    fireEvent.click(pluginCard);

    expect(mockHandlers.onPluginSelect).toHaveBeenCalledWith('context-generator');
  });

  it('calls onPluginToggle when toggle button is clicked', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    const toggleButtons = screen.getAllByText('Toggle');
    fireEvent.click(toggleButtons[0]);

    expect(mockHandlers.onPluginToggle).toHaveBeenCalledWith('context-generator');
  });

  it('calls onPluginConfigure when configure button is clicked', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    const configureButtons = screen.getAllByText('Configure');
    fireEvent.click(configureButtons[0]);

    expect(mockHandlers.onPluginConfigure).toHaveBeenCalledWith('context-generator');
  });

  it('handles empty plugin list', () => {
    render(
      <PluginsView 
        plugins={[]}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('No plugins available')).toBeInTheDocument();
  });

  it('shows plugin statistics', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    // Should show plugin counts
    expect(screen.getByText('3 plugins')).toBeInTheDocument();
    expect(screen.getByText('2 active')).toBeInTheDocument();
    expect(screen.getByText('1 error')).toBeInTheDocument();
  });

  it('filters by status', () => {
    render(
      <PluginsView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    const statusFilter = screen.getByLabelText('Filter by status');
    fireEvent.change(statusFilter, { target: { value: 'active' } });

    // Should show only active plugins
    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.getByText('Customer Links')).toBeInTheDocument();
    expect(screen.queryByText('Script Runner')).not.toBeInTheDocument();
  });
});