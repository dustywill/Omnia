import { render, screen, fireEvent } from '@testing-library/react';
import { DashboardPluginCard } from '../../../src/ui/components/DashboardPluginCard/DashboardPluginCard.js';

describe('DashboardPluginCard', () => {
  const plugin = {
    id: 'test',
    name: 'Test Plugin',
    description: 'desc',
    version: '1.0.0',
    author: 'me',
    type: 'simple',
    enabled: true,
    manifest: {},
    status: 'active'
  } as any;

  it('fires onPluginSelect on click and shows metadata', () => {
    const onSelect = jest.fn();
    render(<DashboardPluginCard plugin={plugin} onPluginSelect={onSelect} />);
    fireEvent.click(screen.getByText('Test Plugin'));
    expect(onSelect).toHaveBeenCalledWith('test');
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('simple')).toBeInTheDocument();
  });
});
