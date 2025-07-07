import fs from 'fs/promises';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from '@jest/globals';
import { getFileTree } from '../../src/core/file-crawler.js';

const tmpDir = path.join(process.cwd(), 'tree');

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

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

  it('correctly represents hierarchical structures', async () => {
    const result = await getFileTree(tmpDir);
    const subDir = result.find((node) => node.name === 'sub');
    expect(subDir).toBeDefined();
    expect(subDir?.children).toBeDefined();
    expect(subDir?.children?.length).toBe(1);
    expect(subDir?.children?.[0].name).toBe('a.txt');
  });

  it('returns an empty array for an empty directory', async () => {
    const emptyDir = path.join(process.cwd(), 'empty-tree');
    await fs.mkdir(emptyDir, { recursive: true });
    const result = await getFileTree(emptyDir);
    expect(result).toEqual([]);
    await fs.rm(emptyDir, { recursive: true, force: true });
  });

  it('returns an empty array for a non-existent directory', async () => {
    const nonExistentDir = path.join(process.cwd(), 'non-existent-tree');
    const result = await getFileTree(nonExistentDir);
    expect(result).toEqual([]);
  });
});