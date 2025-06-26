import fs from 'fs/promises';
import path from 'path';
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { discoverScripts, filterScripts } from '../../plugins/script-runner/index.js';

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
});
