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
});
