import { test, expect } from '@playwright/test';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
import {
  discoverScripts,
  filterScripts,
  customizeScript,
  editScriptConfig,
  removeScriptConfig,
  setupNewScripts,
  createOutputManager,
} from '../../plugins/script-runner/index.js';

test.describe('plugin workflows', () => {
  test('script runner end-to-end workflow', async () => {
    const dir = path.join(__dirname, 'scripts');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const buildPath = path.join(dir, 'build.ps1');
    const deployPath = path.join(dir, 'deploy.ps1');
    await fs.writeFile(
      buildPath,
      '# ID: build\n# Name: Build\n# Description: build project\n'
    );
    await fs.writeFile(
      deployPath,
      '# ID: deploy\n# Name: Deploy\n# Description: deploy project\n'
    );

    const scripts = await discoverScripts(dir);
    expect(scripts.map((s) => s.id).sort()).toEqual(['build', 'deploy']);

    const filtered = filterScripts(scripts, 'deploy');
    expect(filtered).toHaveLength(1);
    expect(filtered[0].id).toBe('deploy');



    const params = await customizeScript(filtered[0], ['-Foo'], {
      prompt: async () => ['-Foo', 'Bar'],
      saveDefaults: async () => {},
    });
    expect(params).toEqual(['-Foo', 'Bar']);

    let config = { build: ['-Foo'] } as Record<string, string[]>;
    config = await editScriptConfig('build', config, {
      prompt: async () => ['-Foo', 'Baz'],
      updateConfig: async () => {},
    });
    expect(config).toEqual({ build: ['-Foo', 'Baz'] });
    config = await removeScriptConfig('build', config, { updateConfig: async () => {} });
    expect(config).toEqual({});

    const setupConfig = await setupNewScripts(scripts, {}, {
      prompt: async () => ['-Default'],
      updateConfig: async () => {},
    });
    expect(Object.keys(setupConfig)).toEqual(['build', 'deploy']);

    const output = createOutputManager({ copy: () => {} });
    output.append('foo');
    output.append('bar');
    expect(output.get()).toBe('foobar');
    output.clear();
    expect(output.get()).toBe('');

    await fs.rm(dir, { recursive: true, force: true });
  });

});
