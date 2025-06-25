import React from 'react';
import { render, screen } from '@testing-library/react';
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
});
