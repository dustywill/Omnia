import { screen, act } from '@testing-library/react';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadPluginUI } from '../../src/ui/plugin-ui-loader.js';
import type { FileNode } from '../../src/ui/components/FileScanner.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

it('loads plugin interface into container', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const tree: FileNode[] = [
    { name: 'file.txt', path: '/file.txt', isDirectory: false },
  ];
  await act(async () => {
    await loadPluginUI('context-generator', {
      container,
      pluginsPath: path.join(__dirname, '..', '..', 'plugins'),
      props: { tree },
    });
  });
  expect(
    screen.getByRole('button', { name: /generate context/i }),
  ).toBeInTheDocument();
});
