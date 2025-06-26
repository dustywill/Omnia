
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

  it('opens dialog to select root folder and remembers path', async () => {
    const selectRootFolder = jest.fn().mockResolvedValue('/workspace');
    render(<FileScanner tree={[]} selectRootFolder={selectRootFolder} />);

    await userEvent.click(
      screen.getByRole('button', { name: /select root folder/i }),
    );

    expect(selectRootFolder).toHaveBeenCalled();
    expect(await screen.findByText('/workspace')).toBeInTheDocument();
  });

  it('saves a filter preset with name and shows in dropdown', async () => {
    const onSavePreset = jest.fn();
    render(
      <FileScanner tree={[]} presets={[]} onSavePreset={onSavePreset} />,
    );

    await userEvent.type(
      screen.getByPlaceholderText(/filter name/i),
      'My Filter',
    );
    await userEvent.click(
      screen.getByRole('button', { name: /save preset/i }),
    );

    expect(onSavePreset).toHaveBeenCalledWith('My Filter');
    expect(screen.getByRole('combobox')).toHaveTextContent('My Filter');
  });

  it('allows toggling include/exclude regex modes for folders and files', async () => {
    render(<FileScanner tree={[]} />);

    const includeFolders = screen.getByRole('radio', { name: /include folders/i });
    const excludeFolders = screen.getByRole('radio', { name: /exclude folders/i });
    const includeFiles = screen.getByRole('radio', { name: /include files/i });
    const excludeFiles = screen.getByRole('radio', { name: /exclude files/i });

    expect(includeFolders).toBeInTheDocument();
    expect(excludeFolders).toBeInTheDocument();
    expect(includeFiles).toBeInTheDocument();
    expect(excludeFiles).toBeInTheDocument();

    await userEvent.click(excludeFolders);
    expect(excludeFolders).toBeChecked();

    await userEvent.click(excludeFiles);
    expect(excludeFiles).toBeChecked();
  });

  it('limits displayed depth based on max depth setting', async () => {
    const tree: FileNode[] = [
      {
        name: 'folder',
        path: '/folder',
        isDirectory: true,
        children: [
          {
            name: 'sub',
            path: '/folder/sub',
            isDirectory: true,
            children: [
              { name: 'deep.txt', path: '/folder/sub/deep.txt', isDirectory: false },
            ],
          },
        ],
      },
    ];

    render(<FileScanner tree={tree} />);

    const depthInput = screen.getByLabelText(/max depth/i);
    await userEvent.clear(depthInput);
    await userEvent.type(depthInput, '1');

    expect(screen.getByLabelText('sub')).toBeInTheDocument();
    expect(screen.queryByLabelText('deep.txt')).not.toBeInTheDocument();
  });
  it("rescans when clicking Apply Filters", async () => {
    const onApply = jest.fn();
    render(<FileScanner tree={[]} onApplyFilters={onApply} />);
    await userEvent.type(screen.getByPlaceholderText("Search"), "foo");
    const depthInput = screen.getByLabelText(/max depth/i);
    await userEvent.clear(depthInput);
    await userEvent.type(depthInput, "2");
    await userEvent.click(screen.getByRole("button", { name: /apply filters/i }));
    expect(onApply).toHaveBeenCalledWith(expect.objectContaining({ query: "foo", maxDepth: 2 }));
  });

  it('saves current filter for selected preset', async () => {
    const onSavePreset = jest.fn();
    render(
      <FileScanner tree={[]} presets={["Default"]} onSavePreset={onSavePreset} />,
    );

    await userEvent.selectOptions(
      screen.getByLabelText('Preset Selector'),
      'Default',
    );
    await userEvent.click(screen.getByRole('button', { name: /save filter/i }));

    expect(onSavePreset).toHaveBeenCalledWith('Default');
  });

  it('deletes selected preset from list', async () => {
    const onDeletePreset = jest.fn();
    render(
      <FileScanner
        tree={[]}
        presets={["One", "Two"]}
        onDeletePreset={onDeletePreset}
      />,
    );

    await userEvent.selectOptions(
      screen.getByLabelText('Preset Selector'),
      'One',
    );
    await userEvent.click(screen.getByRole('button', { name: /delete filter/i }));

    expect(onDeletePreset).toHaveBeenCalledWith('One');
    expect(screen.getByLabelText('Preset Selector')).not.toHaveTextContent('One');
  });

});
