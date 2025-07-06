import { render, screen, fireEvent } from '@testing-library/react';
import { AppNavigation } from '../../../src/ui/components/AppNavigation/AppNavigation.js';
import type { AppView } from '../../../src/ui/main-app-renderer.js';

describe('AppNavigation', () => {
  const mockOnViewChange = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navigation buttons', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Plugins')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('highlights current view', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    const pluginsButton = screen.getByText('Plugins').closest('button');
    const settingsButton = screen.getByText('Settings').closest('button');

    expect(dashboardButton).toHaveClass('active');
    expect(pluginsButton).not.toHaveClass('active');
    expect(settingsButton).not.toHaveClass('active');
  });

  it('calls onViewChange when dashboard is clicked', () => {
    render(
      <AppNavigation 
        currentView="plugins"
        onViewChange={mockOnViewChange}
      />
    );

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    fireEvent.click(dashboardButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('dashboard');
  });

  it('calls onViewChange when plugins is clicked', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    const pluginsButton = screen.getByText('Plugins').closest('button');
    fireEvent.click(pluginsButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('plugins');
  });

  it('calls onViewChange when settings is clicked', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    const settingsButton = screen.getByText('Settings').closest('button');
    fireEvent.click(settingsButton);

    expect(mockOnViewChange).toHaveBeenCalledWith('settings');
  });

  it('highlights plugins view correctly', () => {
    render(
      <AppNavigation 
        currentView="plugins"
        onViewChange={mockOnViewChange}
      />
    );

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    const pluginsButton = screen.getByText('Plugins').closest('button');
    const settingsButton = screen.getByText('Settings').closest('button');

    expect(dashboardButton).not.toHaveClass('active');
    expect(pluginsButton).toHaveClass('active');
    expect(settingsButton).not.toHaveClass('active');
  });

  it('highlights settings view correctly', () => {
    render(
      <AppNavigation 
        currentView="settings"
        onViewChange={mockOnViewChange}
      />
    );

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    const pluginsButton = screen.getByText('Plugins').closest('button');
    const settingsButton = screen.getByText('Settings').closest('button');

    expect(dashboardButton).not.toHaveClass('active');
    expect(pluginsButton).not.toHaveClass('active');
    expect(settingsButton).toHaveClass('active');
  });

  it('displays navigation icons', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    // Check for icon elements or specific classes
    expect(screen.getByText('🏠')).toBeInTheDocument(); // Dashboard icon
    expect(screen.getByText('🔌')).toBeInTheDocument(); // Plugins icon
    expect(screen.getByText('⚙️')).toBeInTheDocument(); // Settings icon
  });

  it('has proper accessibility attributes', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    const dashboardButton = screen.getByText('Dashboard').closest('button');
    const pluginsButton = screen.getByText('Plugins').closest('button');
    const settingsButton = screen.getByText('Settings').closest('button');

    expect(dashboardButton).toHaveAttribute('aria-current', 'page');
    expect(pluginsButton).toHaveAttribute('aria-current', 'false');
    expect(settingsButton).toHaveAttribute('aria-current', 'false');
  });

  it('renders with proper navigation structure', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    const nav = screen.getByRole('navigation');
    expect(nav).toBeInTheDocument();
    expect(nav).toHaveClass('app-navigation');
  });

  it('handles keyboard navigation', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    const pluginsButton = screen.getByText('Plugins').closest('button');
    fireEvent.keyDown(pluginsButton, { key: 'Enter' });

    expect(mockOnViewChange).toHaveBeenCalledWith('plugins');
  });

  it('handles space key navigation', () => {
    render(
      <AppNavigation 
        currentView="dashboard"
        onViewChange={mockOnViewChange}
      />
    );

    const settingsButton = screen.getByText('Settings').closest('button');
    fireEvent.keyDown(settingsButton, { key: ' ' });

    expect(mockOnViewChange).toHaveBeenCalledWith('settings');
  });
});