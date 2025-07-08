import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsPage } from '../../../src/ui/components/SettingsPage/SettingsPage.js';
import { jest } from '@jest/globals';

jest.mock('../../../src/ui/components/AppSettings/AppSettings.js', () => ({
  AppSettings: () => <div data-testid="app-settings">App</div>
}));

jest.mock('../../../src/ui/components/PluginSettings/PluginSettings.js', () => ({
  PluginSettings: () => <div data-testid="plugin-settings">Plugins</div>
}));

describe('SettingsPage', () => {
  const managers = { settingsManager: {} as any, pluginManager: {} as any };

  it('switches tabs and preserves active tab', async () => {
    const user = userEvent.setup();
    const { rerender } = render(<SettingsPage {...managers} />);
    expect(screen.getByTestId('app-settings')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Plugins' }));
    expect(screen.getByTestId('plugin-settings')).toBeInTheDocument();
    rerender(<SettingsPage {...managers} />);
    expect(screen.getByTestId('plugin-settings')).toBeInTheDocument();
  });
});
