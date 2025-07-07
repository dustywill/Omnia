import { render, screen } from '@testing-library/react';
import { CardGrid } from '../../../src/ui/components/CardGrid.js';

describe('CardGrid', () => {
  it('renders items into a grid of cards', () => {
    const items = [
      { title: 'Card 1', content: <p>One</p> },
      { title: 'Card 2', content: <p>Two</p> }
    ];
    const { container } = render(<CardGrid items={items} />);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.getAttribute('role')).toBe('grid');
    expect(grid.style.display).toBe('grid');
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0].querySelector('header')?.textContent).toBe('Card 1');
    expect(cards[1].querySelector('header')?.textContent).toBe('Card 2');
  });
});
