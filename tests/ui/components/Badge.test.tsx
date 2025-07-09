import { render, screen } from '@testing-library/react';
import { Badge } from '../../../src/ui/components/Badge/Badge.js';

describe('Badge', () => {
  it('displays children', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });

  it('applies variant and size classes', () => {
    render(<Badge variant="primary" size="lg">A</Badge>);
    const badge = screen.getByText('A');
    expect(badge.className).toContain('bg-blue-95');
    expect(badge.className).toContain('px-3');
  });
});
