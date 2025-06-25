
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';


import { FileScanner, type FileNode } from '../../../src/ui/components/FileScanner.js';

describe('FileScanner component', () => {
  it('displays file tree with checkboxes for files and folders', () => {
    const tree: FileNode[] = [
      { name: 'folder', path: '/folder', isDirectory: true, children: [
        { name: 'file.txt', path: '/folder/file.txt', isDirectory: false }
      ]},
      { name: 'rootfile.txt', path: '/rootfile.txt', isDirectory: false }
    ];

    render(<FileScanner tree={tree} />);

    expect(screen.getByLabelText('folder')).toBeInTheDocument();
    expect(screen.getByLabelText('file.txt')).toBeInTheDocument();
    expect(screen.getByLabelText('rootfile.txt')).toBeInTheDocument();
  });


  it('filters tree results when searching', async () => {
    const tree: FileNode[] = [
      { name: 'src', path: '/src', isDirectory: true, children: [
        { name: 'index.ts', path: '/src/index.ts', isDirectory: false },
      ]},
      { name: 'README.md', path: '/README.md', isDirectory: false },
    ];

    render(<FileScanner tree={tree} />);

    await userEvent.type(screen.getByPlaceholderText('Search'), 'readme');

    expect(screen.queryByLabelText('src')).not.toBeInTheDocument();
    expect(screen.getByLabelText('README.md')).toBeInTheDocument();
  });
});
