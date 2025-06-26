import fs from 'fs/promises';
import path from 'path';

export type Script = {
  id: string;
  name: string;
  description: string;
  path: string;
};

const METADATA_REGEX = /^#\s*(ID|Name|Description):\s*(.+)$/i;

export const discoverScripts = async (dir: string): Promise<Script[]> => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const scripts: Script[] = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.toLowerCase().endsWith('.ps1')) continue;
    const filePath = path.join(dir, entry.name);
    const content = await fs.readFile(filePath, 'utf8');

    const lines = content.split(/\r?\n/);
    const meta: Partial<Script> = { path: filePath };
    for (const line of lines) {
      const match = line.match(METADATA_REGEX);
      if (!match) continue;
      const [, key, value] = match;
      switch (key.toLowerCase()) {
        case 'id':
          meta.id = value.trim();
          break;
        case 'name':
          meta.name = value.trim();
          break;
        case 'description':
          meta.description = value.trim();
          break;
      }
    }
    if (meta.id && meta.name && meta.description) {
      scripts.push(meta as Script);
    }
  }

  return scripts;
};

export const filterScripts = (scripts: Script[], query: string): Script[] => {
  const q = query.toLowerCase();
  return scripts.filter(
    (s) =>
      s.id.toLowerCase().includes(q) ||
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q),
  );
};
