import { render } from '@testing-library/react';
import { AppHeader } from '../../../src/ui/components/AppHeader/AppHeader.js';

describe('AppHeader', () => {
  it('renders header element', () => {
    const { container } = render(<AppHeader />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
    expect(header?.textContent).toContain('Omnia');
  });
});
