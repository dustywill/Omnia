import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from '../../../src/ui/components/Card/Card.js';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>content</Card>);
    expect(screen.getByText('content')).toBeInTheDocument();
  });

  it('invokes onClick when interactive', () => {
    const onClick = jest.fn();
    render(<Card interactive onClick={onClick}>click</Card>);
    fireEvent.click(screen.getByText('click'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies elevation and hover classes', () => {
    render(<Card elevated interactive>test</Card>);
    const card = screen.getByText('test');
    expect(card.className).toContain('shadow-lg');
  });

  it('respects custom className', () => {
    render(<Card className="custom">ok</Card>);
    const card = screen.getByText('ok');
    expect(card.className).toContain('custom');
  });
});
