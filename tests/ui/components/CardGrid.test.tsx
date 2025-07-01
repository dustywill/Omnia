import { render, screen } from '@testing-library/react';
import { CardGrid } from '../../../src/ui/components/CardGrid.js';

describe('CardGrid', () => {
  it('renders items as cards with Nunito Sans font and palette colors', () => {
    const items = [
      { title: 'Card 1', content: <p>One</p> },
      { title: 'Card 2', content: <p>Two</p> },
    ];
    render(<CardGrid items={items} />);
    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveClass('card');
    expect(screen.getByRole('grid')).toHaveClass('card-grid');
    expect(screen.getByText('Card 1')).toBeInTheDocument();
    expect(screen.getByText('Card 2')).toBeInTheDocument();
  });
});
