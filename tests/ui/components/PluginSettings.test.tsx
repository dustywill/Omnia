import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PluginSettings } from '../../../src/ui/components/PluginSettings/PluginSettings.js';
import { PluginStatus } from '../../../src/core/enhanced-plugin-manager.js';
import { jest } from '@jest/globals';
import { z } from 'zod';

jest.mock('../../../src/ui/node-module-loader.js', () => ({
  loadNodeModule: async () => ({ z })
}));

jest.mock('../../../src/lib/schemas/plugins/script-runner.js', () => ({
  createScriptRunnerSchemas: async () => ({
    scriptRunnerConfigSchema: z.object({ foo: z.string().min(2) })
  })
}));

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

  it('loads plugin schema and validates configuration', async () => {
    const user = userEvent.setup();
    const plugin = {
      manifest: {
        id: 'script-runner',
        name: 'Script Runner',
        description: 'desc',
        version: '1.0.0',
        type: 'configured',
        permissions: []
      },
      status: PluginStatus.ACTIVE,
      loadedAt: Date.now()
    };
    const pluginManager2 = {
      getLoadedPlugins: jest.fn(() => [plugin]),
      unloadPlugin: jest.fn()
    } as any;

    const settingsManager2 = {
      loadPluginRegistry: jest.fn(async () => ({ plugins: { 'script-runner': { id: 'script-runner', enabled: true, configPath: '' } } })),
      savePluginRegistry: jest.fn(async () => {}),
      loadPluginConfig: jest.fn(async () => ({})),
      savePluginConfig: jest.fn(async () => {})
    } as any;

    render(
      <PluginSettings
        settingsManager={settingsManager2}
        pluginManager={pluginManager2}
        targetPluginId="script-runner"
      />
    );

    const input = await screen.findByLabelText('Foo');
    await user.type(input, 'a');
    await user.click(screen.getByRole('button', { name: 'Save Plugin Settings' }));
    expect(await screen.findByText(/least 2/)).toBeInTheDocument();
    expect(settingsManager2.savePluginConfig).not.toHaveBeenCalled();
  });
});
