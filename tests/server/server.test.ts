/** @jest-environment node */
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import request from 'supertest';
import fs from 'fs/promises';
import path from 'path';
import { createServer } from '../../src/server.js';

let tmpDir: string;
let app: ReturnType<typeof createServer>;

beforeAll(async () => {
  tmpDir = await fs.mkdtemp(path.join(__dirname, 'tmp-'));
  app = createServer(tmpDir);
});

afterAll(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('server', () => {
  it('reads a file from disk', async () => {
    const filePath = path.join(tmpDir, 'a.txt');
    await fs.writeFile(filePath, 'hello');

    const res = await request(app).get('/api/read').query({ path: 'a.txt' });

    expect(res.status).toBe(200);
    expect(res.text).toBe('hello');
  });

  it('creates directories', async () => {
    const res = await request(app).post('/api/mkdir').query({ path: 'dir' }).send({ options: { recursive: true } });
    expect(res.status).toBe(204);
    const stat = await fs.stat(path.join(tmpDir, 'dir'));
    expect(stat.isDirectory()).toBe(true);
  });

  it('lists directory entries with file types', async () => {
    await fs.mkdir(path.join(tmpDir, 'dir2'));
    await fs.writeFile(path.join(tmpDir, 'dir2', 'file.txt'), 'x');
    const res = await request(app)
      .get('/api/readdir')
      .query({ path: 'dir2', withFileTypes: 'true' });
    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ name: 'file.txt', isDirectory: false }]);
  });
});
