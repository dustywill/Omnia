import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
});
