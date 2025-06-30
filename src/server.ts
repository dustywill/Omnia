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
    const wantDirents = req.query.withFileTypes === 'true';
    if (typeof relPath !== 'string') {
      res.status(400).send('invalid path');
      return;
    }
    try {
      if (wantDirents) {
        const entries = await fs.readdir(path.join(rootDir, relPath), { withFileTypes: true });
        res.json(entries.map(e => ({ name: e.name, isDirectory: e.isDirectory() })));
      } else {
        const entries = await fs.readdir(path.join(rootDir, relPath));
        res.json(entries);
      }
    } catch (err) {
      res.status(500).send((err as Error).message);
      return;
    }
  });

  app.post('/api/mkdir', async (req, res): Promise<void> => {
    const relPath = req.query.path;
    const options = req.body?.options;
    if (typeof relPath !== 'string') {
      res.status(400).send('path required');
      return;
    }
    try {
      await fs.mkdir(path.join(rootDir, relPath), options);
      res.sendStatus(204);
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

export const openBrowser = (url: string) => {
  const platform = process.platform;
  if (platform === 'win32') {
    spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true }).unref();
  } else {
    const cmd = platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(cmd, [url], { stdio: 'ignore', detached: true }).unref();
  }
};

if (process.env.NODE_ENV !== 'test') {
  const port = process.env.PORT ? Number(process.env.PORT) : 3000;
  const app = createServer();
  app.listen(port, () => {
    console.log(`server running at http://localhost:${port}`);
    openBrowser(`http://localhost:${port}`);
  });
}
