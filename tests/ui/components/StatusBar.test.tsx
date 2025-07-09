import { render, screen, fireEvent } from '@testing-library/react';
import { StatusBar } from '../../../src/ui/components/StatusBar/StatusBar.js';

describe('StatusBar', () => {
  it('displays plugin counts and view label', () => {
    render(<StatusBar activePlugins={1} totalPlugins={2} errorPlugins={0} currentView="plugins" />);
    expect(screen.getByText('1 Active')).toBeInTheDocument();
    expect(screen.getByText('1 Inactive')).toBeInTheDocument();
    expect(screen.getByText('Plugin Settings')).toBeInTheDocument();
  });

  it('hides counts on Dashboard', () => {
    const { queryByText } = render(<StatusBar activePlugins={1} totalPlugins={2} errorPlugins={0} currentView="dashboard" />);
    expect(queryByText('1 Active')).toBeNull();
  });

  it('calls onStatusClick', () => {
    const handler = jest.fn();
    render(<StatusBar activePlugins={1} totalPlugins={2} errorPlugins={1} currentView="plugins" onStatusClick={handler} />);
    fireEvent.click(screen.getByText('1 Active'));
    expect(handler).toHaveBeenCalledWith('active');
    fireEvent.click(screen.getByText('1 Errors'));
    expect(handler).toHaveBeenCalledWith('error');
  });
});
