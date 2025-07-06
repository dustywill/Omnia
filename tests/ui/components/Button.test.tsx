import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../../../src/ui/components/Button/Button.js';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Press</Button>);
    fireEvent.click(screen.getByRole('button', { name: 'Press' }));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies variant and size classes', () => {
    render(
      <Button variant="secondary" size="lg">Test</Button>
    );
    const btn = screen.getByRole('button', { name: 'Test' });
    expect(btn.className).toContain('bg-neutral-80');
    expect(btn.className).toContain('px-6');
  });

  it('does not trigger click when disabled', () => {
    const onClick = jest.fn();
    render(
      <Button onClick={onClick} disabled>Disabled</Button>
    );
    const btn = screen.getByRole('button', { name: 'Disabled' });
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('includes hover and focus classes', () => {
    render(<Button>Hover</Button>);
    const btn = screen.getByRole('button', { name: 'Hover' });
    expect(btn.className).toMatch(/hover:/);
    expect(btn.className).toMatch(/focus:/);
  });
});
