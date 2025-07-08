import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PluginSettings } from '../../../src/ui/components/PluginSettings/PluginSettings.js';
import { PluginStatus } from '../../../src/core/enhanced-plugin-manager.js';
import { jest } from '@jest/globals';

describe('PluginSettings', () => {
  const plugin = {
    manifest: {
      id: 'test',
      name: 'Test Plugin',
      description: 'desc',
      version: '1.0.0',
      type: 'simple',
      permissions: []
    },
    status: PluginStatus.ACTIVE,
    loadedAt: Date.now()
  };

  const pluginManager = {
    getLoadedPlugins: jest.fn(() => [plugin]),
    unloadPlugin: jest.fn()
  } as any;

  const settingsManager = {
    loadPluginRegistry: jest.fn(async () => ({ plugins: { test: { id: 'test', enabled: true, configPath: '' } } })),
    savePluginRegistry: jest.fn(async () => {}),
    loadPluginConfig: jest.fn(async () => ({})),
    savePluginConfig: jest.fn(async () => {})
  } as any;

  it('toggles enable state for a plugin', async () => {
    const user = userEvent.setup();
    render(
      <PluginSettings
        settingsManager={settingsManager}
        pluginManager={pluginManager}
        targetPluginId="test"
      />
    );
    await screen.findByText('Plugin Configuration');
    const toggle = screen.getByRole('button', { name: 'Disable' });
    await user.click(toggle);
    await waitFor(() => expect(settingsManager.savePluginRegistry).toHaveBeenCalled());
    expect(pluginManager.unloadPlugin).toHaveBeenCalledWith('test');
  });
});
