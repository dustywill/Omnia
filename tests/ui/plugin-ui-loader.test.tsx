import { screen, act } from '@testing-library/react';
import path from 'path';
import { loadPluginUI } from '../../src/ui/plugin-ui-loader.js';
import type { FileNode } from '../../src/ui/components/FileScanner.js';

it('loads plugin interface into container', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const tree: FileNode[] = [
    { name: 'file.txt', path: '/file.txt', isDirectory: false },
  ];
  await act(async () => {
    await loadPluginUI('context-generator', {
      container,
      pluginsPath: path.join(process.cwd(), 'plugins'),
      props: { tree },
    });
  });
  expect(
    screen.getByRole('button', { name: /generate context/i }),
  ).toBeInTheDocument();
});
