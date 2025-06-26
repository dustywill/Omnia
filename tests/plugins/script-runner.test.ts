import fs from 'fs/promises';
import path from 'path';
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import child_process from 'child_process';
import {
  discoverScripts,
  filterScripts,
  runScript,
} from '../../plugins/script-runner/index.js';

describe('script runner plugin', () => {
  const tmpDir = path.join(__dirname, 'scripts');

  beforeEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
    await fs.mkdir(tmpDir, { recursive: true });
    await fs.writeFile(
      path.join(tmpDir, 'build.ps1'),
      '# ID: build\n# Name: Build\n# Description: build project\n',
    );
    await fs.writeFile(
      path.join(tmpDir, 'deploy.ps1'),
      '# ID: deploy\n# Name: Deploy\n# Description: deploy project\n',
    );
  });

  afterEach(async () => {
    await fs.rm(tmpDir, { recursive: true, force: true });
  });

  it('discovers PowerShell scripts and filters them by query', async () => {
    const scripts = await discoverScripts(tmpDir);
    expect(scripts.map((s) => s.id).sort()).toEqual(['build', 'deploy']);

    const filtered = filterScripts(scripts, 'deploy');
    expect(filtered).toEqual([{ id: 'deploy', name: 'Deploy', description: 'deploy project', path: path.join(tmpDir, 'deploy.ps1') }]);
  });

  it('runs scripts with default parameters and shows status', async () => {
    const spawnMock = jest
      .spyOn(child_process, 'spawn')
      .mockImplementation((): any => {
        const handlers: Record<string, (code: number) => void> = {};
        return {
          on: (event: string, cb: (code: number) => void) => {
            handlers[event] = cb;
          },
          kill: jest.fn(),
          __handlers: handlers,
        } as any;
      });

    const script = {
      id: 'build',
      name: 'Build',
      description: 'build project',
      path: path.join(tmpDir, 'build.ps1'),
    } as const;

    const statuses: string[] = [];
    const promise = runScript(script, ['-Foo', 'Bar'], (s) => statuses.push(s));

    const child = spawnMock.mock.results[0].value;
    child.__handlers.exit(0);
    await promise;

    expect(spawnMock).toHaveBeenCalledWith('pwsh', [
      '-File',
      script.path,
      '-Foo',
      'Bar',
    ]);
    expect(statuses).toEqual(['running', 'success']);

    spawnMock.mockRestore();
  });

  it('opens Customize dialog to override parameters and save defaults', async () => {
    const { customizeScript } = await import('../../plugins/script-runner/index.js');
    const saveDefaults = jest.fn();
    const prompt = jest.fn().mockResolvedValue(['-Foo', 'Baz']);
    const script = {
      id: 'build',
      name: 'Build',
      description: 'build project',
      path: path.join(tmpDir, 'build.ps1'),
    } as const;

    const result = await customizeScript(script, ['-Foo', 'Bar'], {
      prompt,
      saveDefaults,
    });

    expect(prompt).toHaveBeenCalledWith(['-Foo', 'Bar']);
    expect(saveDefaults).toHaveBeenCalledWith(script.id, ['-Foo', 'Baz']);
    expect(result).toEqual(['-Foo', 'Baz']);
  });

  it('edits and removes script configurations', async () => {
    const { editScriptConfig, removeScriptConfig } = await import(
      '../../plugins/script-runner/index.js'
    );
    const updateConfig = jest.fn();
    const prompt = jest.fn().mockResolvedValue(['-Foo', 'Baz']);

    let config = { build: ['-Foo', 'Bar'] };
    config = await editScriptConfig('build', config, { prompt, updateConfig });

    expect(prompt).toHaveBeenCalledWith(['-Foo', 'Bar']);
    expect(updateConfig).toHaveBeenCalledWith({ build: ['-Foo', 'Baz'] });
    expect(config).toEqual({ build: ['-Foo', 'Baz'] });

    config = await removeScriptConfig('build', config, { updateConfig });
    expect(updateConfig).toHaveBeenCalledWith({});
    expect(config).toEqual({});
  });

  it('opens setup dialog when new scripts are discovered', async () => {
    const { setupNewScripts } = await import(
      '../../plugins/script-runner/index.js'
    );
    const prompt = jest.fn().mockResolvedValue(['-Default']);
    const updateConfig = jest.fn();

    const scripts = [
      {
        id: 'build',
        name: 'Build',
        description: 'build project',
        path: path.join(tmpDir, 'build.ps1'),
      },
      {
        id: 'deploy',
        name: 'Deploy',
        description: 'deploy project',
        path: path.join(tmpDir, 'deploy.ps1'),
      },
    ];

    const config = await setupNewScripts(
      scripts,
      { build: ['-Foo'] },
      { prompt, updateConfig },
    );

    expect(prompt).toHaveBeenCalledTimes(1);
    expect(prompt).toHaveBeenCalledWith(scripts[1]);
    expect(updateConfig).toHaveBeenCalledWith({
      build: ['-Foo'],
      deploy: ['-Default'],
    });
    expect(config).toEqual({ build: ['-Foo'], deploy: ['-Default'] });
  });

  it('clears output and copies it', async () => {
    const { createOutputManager } = await import(
      '../../plugins/script-runner/index.js'
    );
    const copy = jest.fn();
    const output = createOutputManager({ copy });

    output.append('foo');
    output.append('bar');

    await output.copy();
    expect(copy).toHaveBeenCalledWith('foobar');

    output.clear();
    expect(output.get()).toBe('');
  });
});
