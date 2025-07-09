import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { StatusBar } from '../../../src/ui/components/StatusBar/StatusBar.js';

describe('StatusBar', () => {
  it('displays plugin counts and view label', () => {
    render(
      <StatusBar activePlugins={2} totalPlugins={5} errorPlugins={1} currentView="plugins" />
    );
    expect(screen.getByText('2 Active')).toBeInTheDocument();
    expect(screen.getByText('3 Inactive')).toBeInTheDocument();
    expect(screen.getByText('1 Errors')).toBeInTheDocument();
    expect(screen.getByText('Total: 5')).toBeInTheDocument();
    expect(screen.getByText('Plugin Settings')).toBeInTheDocument();
  });

  it('hides counts on Dashboard view', () => {
    render(
      <StatusBar activePlugins={2} totalPlugins={5} errorPlugins={0} currentView="dashboard" />
    );
    expect(screen.queryByText(/Active/)).not.toBeInTheDocument();
    expect(screen.getByText('Ready')).toBeInTheDocument();
  });

  it('calls onStatusClick when status clicked', () => {
    const onClick = jest.fn();
    render(
      <StatusBar
        activePlugins={1}
        totalPlugins={2}
        errorPlugins={0}
        currentView="plugins"
        onStatusClick={onClick}
      />
    );
    fireEvent.click(screen.getByText('1 Active'));
    expect(onClick).toHaveBeenCalledWith('active');
  });

  it('shows color indicators', () => {
    const { container } = render(
      <StatusBar activePlugins={1} totalPlugins={2} errorPlugins={1} currentView="plugins" />
    );
    const indicators = container.querySelectorAll('div.' + 'statusIndicator');
    expect(indicators.length).toBeGreaterThan(0);
  });
});
