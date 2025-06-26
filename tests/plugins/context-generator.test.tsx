import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs/promises';
import path from 'path';
import type { FileNode } from '../../src/ui/components/FileScanner.js';
import { ContextGenerator } from '../../plugins/context-generator/index.js';

describe('context generator plugin', () => {
  it('uses FileScanner to choose files', async () => {
    const tree: FileNode[] = [
      {
        name: 'src',
        path: '/src',
        isDirectory: true,
        children: [
          { name: 'index.ts', path: '/src/index.ts', isDirectory: false },
        ],
      },
      { name: 'README.md', path: '/README.md', isDirectory: false },
    ];

    render(<ContextGenerator tree={tree} />);

    await userEvent.click(screen.getByLabelText('index.ts'));
    await userEvent.click(screen.getByLabelText('README.md'));

    expect(screen.getByText('/src/index.ts')).toBeInTheDocument();
    expect(screen.getByText('/README.md')).toBeInTheDocument();
  });

  it('shows progress and character count when generating context', async () => {
    const dir = path.join(__dirname, 'tmp');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const fileA = path.join(dir, 'a.txt');
    const fileB = path.join(dir, 'b.txt');
    await fs.writeFile(fileA, 'abc');
    await fs.writeFile(fileB, 'defg');

    const tree: FileNode[] = [
      { name: 'a.txt', path: fileA, isDirectory: false },
      { name: 'b.txt', path: fileB, isDirectory: false },
    ];

    render(<ContextGenerator tree={tree} />);

    await userEvent.click(screen.getByLabelText('a.txt'));
    await userEvent.click(screen.getByLabelText('b.txt'));
    await userEvent.click(screen.getByRole('button', { name: /generate context/i }));

    const charCount = 3 + 4;
    expect(await screen.findByText(/progress: 2\/2/i)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`characters: ${charCount}`, 'i'))).toBeInTheDocument();

    await fs.rm(dir, { recursive: true, force: true });
  });
});
