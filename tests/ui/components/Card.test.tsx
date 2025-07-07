import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { Card } from '../../../src/ui/components/Card/Card.js';

describe('Card', () => {
  it('renders children', () => {
    const { container } = render(<Card>content</Card>);
    expect(container.firstChild?.textContent).toBe('content');
  });

  it('applies elevated and interactive classes', () => {
    const { container } = render(<Card elevated interactive>text</Card>);
    const card = container.firstElementChild as HTMLElement;
    expect(card.className).toContain('shadow-lg');
    expect(card.className).toContain('interactive');
  });

  it('invokes onClick when interactive', async () => {
    const user = userEvent.setup();
    const onClick = jest.fn();
    const { container } = render(<Card interactive onClick={onClick}>text</Card>);
    await user.click(container.firstElementChild as HTMLElement);
    expect(onClick).toHaveBeenCalled();
  });

  it('merges custom className', () => {
    const { container } = render(<Card className="custom">x</Card>);
    const card = container.firstElementChild as HTMLElement;
    expect(card).toHaveClass('custom');
  });
});
