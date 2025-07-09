import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { PluginCard } from '../../../src/ui/components/PluginCard/PluginCard.js';
import type { PluginInfo } from '../../../src/ui/main-app-renderer.js';

describe('PluginCard', () => {
  const mockPlugin: PluginInfo = {
    id: 'context-generator',
    name: 'Context Generator',
    description: 'Generate context files for development',
    version: '1.0.0',
    author: 'Test Author',
    type: 'simple',
    enabled: true,
    manifest: {},
    status: 'active'
  };

  const mockHandlers = {
    onSelect: jest.fn(),
    onToggle: jest.fn(),
    onConfigure: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders plugin information', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Context Generator')).toBeInTheDocument();
    expect(screen.getByText('Generate context files for development')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
    expect(screen.getByText('simple')).toBeInTheDocument();
  });

  it('displays enabled status', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Enabled')).toBeInTheDocument();
    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('displays disabled status', () => {
    const disabledPlugin = {
      ...mockPlugin,
      enabled: false,
      status: 'inactive' as const
    };

    render(
      <PluginCard 
        plugin={disabledPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('Disabled')).toBeInTheDocument();
    expect(screen.getByText('inactive')).toBeInTheDocument();
  });

  it('displays error status', () => {
    const errorPlugin = {
      ...mockPlugin,
      status: 'error' as const
    };

    render(
      <PluginCard 
        plugin={errorPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('calls onSelect when card is clicked', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const card = screen.getByTestId('plugin-card-context-generator');
    fireEvent.click(card);

    expect(mockHandlers.onSelect).toHaveBeenCalledWith('context-generator');
  });

  it('calls onToggle when toggle button is clicked', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const toggleButton = screen.getByLabelText('Toggle plugin');
    fireEvent.click(toggleButton);

    expect(mockHandlers.onToggle).toHaveBeenCalledWith('context-generator');
  });

  it('calls onConfigure when configure button is clicked', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const configureButton = screen.getByLabelText('Configure plugin');
    fireEvent.click(configureButton);

    expect(mockHandlers.onConfigure).toHaveBeenCalledWith('context-generator');
  });

  it('shows configure button only for configured and hybrid plugins', () => {
    // Simple plugin - no configure button
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.queryByLabelText('Configure plugin')).not.toBeInTheDocument();

    // Configured plugin - has configure button
    const configuredPlugin = {
      ...mockPlugin,
      type: 'configured' as const
    };

    render(
      <PluginCard 
        plugin={configuredPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByLabelText('Configure plugin')).toBeInTheDocument();
  });

  it('applies correct CSS classes based on status', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const card = screen.getByTestId('plugin-card-context-generator');
    expect(card).toHaveClass('plugin-card');
    expect(card).toHaveClass('enabled');
    expect(card).toHaveClass('active');
  });

  it('displays author information', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('by Test Author')).toBeInTheDocument();
  });

  it('handles missing author gracefully', () => {
    const pluginWithoutAuthor = {
      ...mockPlugin,
      author: undefined
    };

    render(
      <PluginCard 
        plugin={pluginWithoutAuthor}
        {...mockHandlers}
      />
    );

    expect(screen.queryByText(/^by /)).not.toBeInTheDocument();
  });

  it('truncates long descriptions', () => {
    const pluginWithLongDesc = {
      ...mockPlugin,
      description: 'This is a very long description that should be truncated when it exceeds the maximum length allowed for display in the plugin card component'
    };

    render(
      <PluginCard 
        plugin={pluginWithLongDesc}
        {...mockHandlers}
      />
    );

    const description = screen.getByText(/This is a very long description/);
    expect(description).toHaveClass('truncated');
  });

  it('displays plugin type badge', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const typeBadge = screen.getByText('simple');
    expect(typeBadge).toHaveClass('plugin-type-badge');
  });

  it('displays different type badges correctly', () => {
    const configuredPlugin = {
      ...mockPlugin,
      type: 'configured' as const
    };

    const hybridPlugin = {
      ...mockPlugin,
      type: 'hybrid' as const
    };

    // Test configured type
    const { rerender } = render(
      <PluginCard 
        plugin={configuredPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('configured')).toBeInTheDocument();

    // Test hybrid type
    rerender(
      <PluginCard 
        plugin={hybridPlugin}
        {...mockHandlers}
      />
    );

    expect(screen.getByText('hybrid')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const card = screen.getByTestId('plugin-card-context-generator');
    expect(card).toHaveAttribute('role', 'button');
    expect(card).toHaveAttribute('tabIndex', '0');
    expect(card).toHaveAttribute('aria-label', 'Plugin: Context Generator');
  });

  it('handles keyboard interaction', () => {
    render(
      <PluginCard 
        plugin={mockPlugin}
        {...mockHandlers}
      />
    );

    const card = screen.getByTestId('plugin-card-context-generator');
    
    fireEvent.keyDown(card, { key: 'Enter' });
    expect(mockHandlers.onSelect).toHaveBeenCalledWith('context-generator');

    fireEvent.keyDown(card, { key: ' ' });
    expect(mockHandlers.onSelect).toHaveBeenCalledTimes(2);
  });
});