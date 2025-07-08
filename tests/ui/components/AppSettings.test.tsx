import { render, screen } from '@testing-library/react';
import { AppSettings } from '../../../src/ui/components/AppSettings/AppSettings.js';

describe('AppSettings', () => {
  it('renders placeholder content', () => {
    render(<AppSettings settingsManager={{} as any} />);
    expect(screen.getByText('App Settings')).toBeInTheDocument();
    expect(screen.getByText(/temporarily disabled/i)).toBeInTheDocument();
  });
});
