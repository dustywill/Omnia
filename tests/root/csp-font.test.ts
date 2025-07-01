import fs from 'fs/promises';
import path from 'path';
import { expect, it } from '@jest/globals';

it('allows Google Fonts via CSP', async () => {
  const htmlPath = path.join(__dirname, '..', '..', 'index.html');
  const html = await fs.readFile(htmlPath, 'utf8');
  const match = html.match(/<meta[^>]+http-equiv="Content-Security-Policy"[^>]+content="([^"]+)"/);
  expect(match).not.toBeNull();
  const csp = match ? match[1] : '';
  expect(csp).toMatch(/style-src[^;]*https:\/\/fonts.googleapis.com/);
  expect(csp).toMatch(/font-src[^;]*https:\/\/fonts.gstatic.com/);
});
