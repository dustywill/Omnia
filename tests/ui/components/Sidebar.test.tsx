import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { Sidebar, SidebarItem } from '../../../src/ui/components/Sidebar/Sidebar.js';

describe('Sidebar and SidebarItem', () => {
  it('applies width classes', () => {
    const { container } = render(<Sidebar width="lg" />);
    const aside = container.firstElementChild as HTMLElement;
    expect(aside.className).toContain('w-80');
  });

  it('handles item click callbacks', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const { container } = render(
      <Sidebar>
        <SidebarItem onClick={onClick}>Item</SidebarItem>
      </Sidebar>
    );
    const item = container.querySelector('div div') as HTMLElement;
    await user.click(item);
    expect(onClick).toHaveBeenCalled();
  });

  it('shows active state and icon', () => {
    const { container } = render(
      <Sidebar>
        <SidebarItem active icon={<span data-testid="icon" />}>Item</SidebarItem>
      </Sidebar>
    );
    const itemDiv = container.querySelector('div div') as HTMLElement;
    expect(itemDiv).toHaveClass('bg-action');
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });
});
