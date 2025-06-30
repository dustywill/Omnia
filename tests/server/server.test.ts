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
});
