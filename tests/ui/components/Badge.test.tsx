import { render, screen } from '@testing-library/react';
import { Badge } from '../../../src/ui/components/Badge/Badge.js';

describe('Badge', () => {
  it('displays children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies variant colours', () => {
    render(<Badge variant="primary">Color</Badge>);
    const badge = screen.getByText('Color');
    expect(badge.className).toContain('bg-blue-95');
  });

  it('applies size options', () => {
    render(<Badge size="lg">Large</Badge>);
    const badge = screen.getByText('Large');
    expect(badge.className).toContain('py-1.5');
  });
});
