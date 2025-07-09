import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { DashboardView } from '../../../src/ui/views/DashboardView.js';
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
      <button onClick={() => onToggle(plugin.id)}>Toggle</button>
      <button onClick={() => onConfigure(plugin.id)}>Configure</button>
    </div>
  )
}));

describe('DashboardView', () => {
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
      status: 'inactive'
    }
  ];

  const mockHandlers = {
    onPluginSelect: jest.fn(),
    onPluginToggle: jest.fn(),
    onPluginConfigure: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plugin cards for all plugins', () => {
    render(
      <DashboardView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    // Check that all plugin cards are rendered
    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.getByText('Customer Links')).toBeInTheDocument();
    expect(screen.getByText('Script Runner')).toBeInTheDocument();
  });

  it('displays plugin descriptions', () => {
    render(
      <DashboardView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Generate context files')).toBeInTheDocument();
    expect(screen.getByText('Manage customer links')).toBeInTheDocument();
    expect(screen.getByText('Run scripts')).toBeInTheDocument();
  });

  it('calls onPluginSelect when plugin card is clicked', () => {
    render(
      <DashboardView 
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
      <DashboardView 
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
      <DashboardView 
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
      <DashboardView 
        plugins={[]}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('No plugins available')).toBeInTheDocument();
  });

  it('shows plugin status correctly', () => {
    render(
      <DashboardView 
        plugins={mockPlugins}
        {...mockHandlers}
      />
    );

    // Check that enabled/disabled plugins are displayed properly
    const activePlugins = screen.getAllByTestId(/plugin-card-.*/).filter(card => 
      card.textContent?.includes('Context Generator') || 
      card.textContent?.includes('Customer Links')
    );
    const inactivePlugins = screen.getAllByTestId(/plugin-card-.*/).filter(card => 
      card.textContent?.includes('Script Runner')
    );

    expect(activePlugins).toHaveLength(2);
    expect(inactivePlugins).toHaveLength(1);
  });
});