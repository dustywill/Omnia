import { render } from '@testing-library/react';
import { Grid } from '../../../src/ui/components/Grid/Grid.js';

describe('Grid', () => {
  it('creates correct column count and gap', () => {
    const { container } = render(<Grid cols={2} gap="lg"><div>a</div><div>b</div></Grid>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('grid-cols-1 md:grid-cols-2');
    expect(div.className).toContain('gap-8');
  });

  it('passes through custom className', () => {
    const { container } = render(<Grid className="custom"><div>a</div></Grid>);
    const div = container.firstChild as HTMLElement;
    expect(div.className).toContain('custom');
  });
});
