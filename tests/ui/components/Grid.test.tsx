import { render } from '@testing-library/react';
import { Grid } from '../../../src/ui/components/Grid/Grid.js';

describe('Grid', () => {
  it('creates correct column count', () => {
    const { container } = render(<Grid cols={4}><div>1</div></Grid>);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('lg:grid-cols-4');
  });

  it('applies gap sizes', () => {
    const { container } = render(<Grid gap="lg"><div>1</div></Grid>);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid.className).toContain('gap-8');
  });

  it('passes custom className', () => {
    const { container } = render(<Grid className="custom"><div>1</div></Grid>);
    const grid = container.firstElementChild as HTMLElement;
    expect(grid).toHaveClass('custom');
  });
});
