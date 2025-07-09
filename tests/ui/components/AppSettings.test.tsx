import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';
import { AppSettings } from '../../../src/ui/components/AppSettings/AppSettings.js';

describe('AppSettings', () => {
  it('renders placeholder content', () => {
    render(<AppSettings settingsManager={{} as any} />);
    expect(screen.getByText('App Settings')).toBeInTheDocument();
    expect(screen.getByText(/temporarily disabled/i)).toBeInTheDocument();
  });

  it('saves settings and shows feedback', async () => {
    const user = userEvent.setup();
    const mockManager = {
      loadAppConfig: jest.fn(async () => ({ foo: 'bar' })),
      saveAppConfig: jest.fn(async () => {})
    } as any;
    const onChange = jest.fn();
    render(<AppSettings settingsManager={mockManager} onSettingsChange={onChange} />);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockManager.loadAppConfig).toHaveBeenCalled();
    expect(mockManager.saveAppConfig).toHaveBeenCalled();
    expect(onChange).toHaveBeenCalledWith({ foo: 'bar' });
    expect(screen.getByText(/settings saved successfully/i)).toBeInTheDocument();
  });
});
