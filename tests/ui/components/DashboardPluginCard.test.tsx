import { render, screen, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import { DashboardPluginCard } from '../../../src/ui/components/DashboardPluginCard/DashboardPluginCard.js';
import type { PluginInfo } from '../../../src/ui/components/AppNavigation/AppNavigation.js';

describe('DashboardPluginCard', () => {
  const plugin: PluginInfo = {
    id: 'tool-1',
    name: 'Tool One',
    description: 'Test tool',
    version: '1.0.0',
    author: 'Tester',
    type: 'simple',
    enabled: true
  };

  it('calls onPluginSelect when clicked', () => {
    const onSelect = jest.fn();
    render(<DashboardPluginCard plugin={plugin} onPluginSelect={onSelect} />);
    fireEvent.click(screen.getByText('Tool One'));
    expect(onSelect).toHaveBeenCalledWith('tool-1');
  });

  it('displays plugin metadata', () => {
    render(<DashboardPluginCard plugin={plugin} onPluginSelect={() => {}} />);
    expect(screen.getByText('Tool One')).toBeInTheDocument();
    expect(screen.getByText('Test tool')).toBeInTheDocument();
    expect(screen.getByText('simple')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('by Tester')).toBeInTheDocument();
  });

  it('applies hover styles', () => {
    const { container } = render(
      <DashboardPluginCard plugin={plugin} onPluginSelect={() => {}} />
    );
    const card = container.firstElementChild as HTMLElement;
    fireEvent.mouseEnter(card);
    expect(card.style.transform).toBe('translateY(-2px)');
    fireEvent.mouseLeave(card);
    expect(card.style.transform).toBe('translateY(0)');
  });
});
