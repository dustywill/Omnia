import fs from 'fs/promises';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { getFileTree } from '../../src/core/file-crawler.js';

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

const tmpDir = path.join(__dirname, 'tree');

beforeEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
  await fs.mkdir(path.join(tmpDir, 'sub'), { recursive: true });
  await fs.writeFile(path.join(tmpDir, 'sub', 'a.txt'), '');
  await fs.writeFile(path.join(tmpDir, 'b.txt'), '');
});

describe('getFileTree', () => {
  it('converts crawl output to FileNode list', async () => {
    const result = await getFileTree(tmpDir);
    expect(result.length).toBe(2);
    const names = result.map((n) => n.name).sort();
    expect(names).toEqual(['b.txt', 'sub']);
  });
});
