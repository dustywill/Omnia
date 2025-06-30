import express from 'express';
import path from 'path';
import fs from 'fs/promises';
import { spawn } from 'child_process';

export const createServer = (rootDir = process.cwd()) => {
  const app = express();
  app.use(express.json());

  app.get('/api/read', async (req, res): Promise<void> => {
    const relPath = req.query.path;
    if (typeof relPath !== 'string') {
      res.status(400).send('path query required');
      return;
    }
    try {
      const fullPath = path.join(rootDir, relPath);
      const data = await fs.readFile(fullPath, 'utf8');
      res.send(data);
    } catch (err) {
      res.status(500).send((err as Error).message);
      return;
    }
  });

  app.get('/api/readdir', async (req, res): Promise<void> => {
    const relPath = req.query.path || '.';
    if (typeof relPath !== 'string') {
      res.status(400).send('invalid path');
      return;
    }
    try {
      const entries = await fs.readdir(path.join(rootDir, relPath));
      res.json(entries);
    } catch (err) {
      res.status(500).send((err as Error).message);
      return;
    }
  });

  app.post('/api/write', async (req, res): Promise<void> => {
    const relPath = req.query.path;
    const data = req.body?.data;
    if (typeof relPath !== 'string' || typeof data !== 'string') {
      res.status(400).send('path and data required');
      return;
    }
    try {
      await fs.writeFile(path.join(rootDir, relPath), data);
      res.sendStatus(204);
    } catch (err) {
      res.status(500).send((err as Error).message);
      return;
    }
  });

  const distPath = path.join(rootDir, 'dist');
  app.use(express.static(distPath));

  app.use((_req, res) => {
    res.sendFile(path.join(rootDir, 'index.html'));
  });

  return app;
};

const openBrowser = (url: string) => {
  const platform = process.platform;
  const cmd = platform === 'darwin' ? 'open' : platform === 'win32' ? 'start' : 'xdg-open';
  spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();
};

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const app = createServer();
  app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
    openBrowser(`http://localhost:${port}`);
  });
}
