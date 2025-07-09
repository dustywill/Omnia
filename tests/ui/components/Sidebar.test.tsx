import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar, SidebarItem } from '../../../src/ui/components/Sidebar/Sidebar.js';

describe('Sidebar and SidebarItem', () => {
  it('invokes callback on item click and highlights active item', () => {
    const onClick = jest.fn();
    render(
      <Sidebar>
        <SidebarItem onClick={onClick} active>One</SidebarItem>
      </Sidebar>
    );
    const item = screen.getByText('One');
    fireEvent.click(item);
    expect(onClick).toHaveBeenCalled();
    expect(item.className).toContain('bg-action');
  });
});
