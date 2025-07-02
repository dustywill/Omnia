import fs from 'fs/promises';
import path from 'path';

const pluginDir = path.resolve('dist/plugins');
const entries = await fs.readdir(pluginDir, { withFileTypes: true });
for (const entry of entries) {
  if (!entry.isDirectory()) continue;
  const file = path.join(pluginDir, entry.name, 'index.js');
  try {
    let text = await fs.readFile(file, 'utf8');
    text = text.replace(/\.\.\/\.\.\/src\//g, '../../');
    await fs.writeFile(file, text);
  } catch {}
}
