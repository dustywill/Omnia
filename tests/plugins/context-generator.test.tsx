import { jest } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
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
    const dir = path.join(process.cwd(), 'tmp');
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

  it('displays progress in output area with character count', async () => {
    const dir = path.join(process.cwd(), 'tmpout');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const file1 = path.join(dir, 'one.txt');
    const file2 = path.join(dir, 'two.txt');
    await fs.writeFile(file1, 'foo');
    await fs.writeFile(file2, 'bar');

    const tree: FileNode[] = [
      { name: 'one.txt', path: file1, isDirectory: false },
      { name: 'two.txt', path: file2, isDirectory: false },
    ];

    render(<ContextGenerator tree={tree} />);

    await userEvent.click(screen.getByLabelText('one.txt'));
    await userEvent.click(screen.getByLabelText('two.txt'));
    await userEvent.click(screen.getByRole('button', { name: /generate context/i }));

    const output = (await screen.findByRole('textbox', {
      name: /context output/i,
    })) as HTMLTextAreaElement;
    const charCount = 3 + 3;
    await waitFor(() => expect(output.value).toContain('Step 2/2'));
    expect(output.value).toContain(`Chars: ${charCount}`);

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('copies context to clipboard and shows confirmation', async () => {
    const dir = path.join(process.cwd(), 'tmpcopy');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const file = path.join(dir, 'c.txt');
    await fs.writeFile(file, 'hello');

    const tree: FileNode[] = [
      { name: 'c.txt', path: file, isDirectory: false },
    ];

    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    render(<ContextGenerator tree={tree} />);

    await userEvent.click(screen.getByLabelText('c.txt'));
    await userEvent.click(
      screen.getByRole('button', { name: /generate context/i }),
    );
    await screen.findByText(/progress: 1\/1/i);

    await userEvent.click(
      screen.getByRole('button', { name: /copy to clipboard/i }),
    );

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(screen.getByText(/copied/i)).toBeInTheDocument();

    await fs.rm(dir, { recursive: true, force: true });
  });
});
