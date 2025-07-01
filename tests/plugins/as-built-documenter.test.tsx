import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fs from 'fs/promises';
import path from 'path';
import { AsBuiltDocumenter } from '../../plugins/as-built-documenter/index.js';

describe('as-built documenter plugin', () => {
  it('lists Markdown templates in dropdown and allows clearing', async () => {
    render(<AsBuiltDocumenter templates={['one.md', 'two.md']} />);

    const select = screen.getByLabelText(/template file/i) as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(select).toHaveValue('');
    expect(select.options).toHaveLength(3);
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      '',
      'one.md',
      'two.md',
    ]);

    await userEvent.selectOptions(select, 'one.md');
    expect(select.value).toBe('one.md');

    await userEvent.selectOptions(select, '');
    expect(select.value).toBe('');
  });

  it('loads a markdown file using the Load button', async () => {
    const onLoad = jest.fn();
    render(<AsBuiltDocumenter templates={[]} onLoad={onLoad} />);

    const input = screen.getByLabelText(/load template/i) as HTMLInputElement;
    const file = new File(['# Heading'], 'test.md', { type: 'text/markdown' });

    await userEvent.upload(input, file);

    expect(onLoad).toHaveBeenCalledWith(file);
  });

  it('inserts an {{#each}} snippet using the toolbar', async () => {
    render(<AsBuiltDocumenter templates={[]} />);

    const editor = screen.getByRole('textbox');
    expect(editor).toHaveTextContent('');

    await userEvent.click(screen.getByRole('button', { name: /insert each/i }));

    expect(editor).toHaveTextContent('{{#each items}}{{/each}}');
  });

  it('embeds a CodeMirror editor for editing templates', () => {
    render(<AsBuiltDocumenter templates={[]} />);

    const cm = document.querySelector('.cm-editor');
    expect(cm).toBeInTheDocument();
  });

  it('saves templates to templates/as-built folder', async () => {
    const dir = path.join(__dirname, 'tmp-save');
    const saveDir = path.join(dir, 'templates', 'as-built');
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(saveDir, { recursive: true });

    render(
      <AsBuiltDocumenter
        templates={[]}
        saveDir={saveDir}
        initialContent="hello"
      />,
    );

    await userEvent.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(async () => {
      const text = await fs.readFile(path.join(saveDir, 'template.md'), 'utf8');
      expect(text).toBe('hello');
    });

    await fs.rm(dir, { recursive: true, force: true });
  });

  it('populates Data Source dropdown from configuration', () => {
    const dataSources = {
      foo: { url: 'http://foo' },
      bar: { url: 'http://bar' },
    };
    render(
      <AsBuiltDocumenter templates={[]} dataSources={dataSources} />,
    );

    const select = screen.getByLabelText(/data source/i) as HTMLSelectElement;
    expect(select.options).toHaveLength(3);
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      '',
      'foo',
      'bar',
    ]);
  });

  it('loads sample data via IPC', async () => {
    const invoke = jest.fn().mockResolvedValue([{ id: 1 }]);
    (window as any).ipcRenderer = { invoke };

    render(
      <AsBuiltDocumenter
        templates={[]}
        dataSources={{ foo: { url: 'http://foo' } }}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText(/data source/i), 'foo');
    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    );

    expect(invoke).toHaveBeenCalledWith('load-sample-data', {
      id: 'foo',
      url: 'http://foo',
    });

    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('displays sample data table and copies loops or field names', async () => {
    const invoke = jest
      .fn()
      .mockResolvedValue([{ id: 1, name: 'Alice' }]);
    (window as any).ipcRenderer = { invoke };
    const writeText = jest.fn();
    Object.assign(navigator, { clipboard: { writeText } });

    render(
      <AsBuiltDocumenter
        templates={[]}
        dataSources={{ foo: { url: 'http://foo' } }}
      />,
    );

    await userEvent.selectOptions(screen.getByLabelText(/data source/i), 'foo');
    await userEvent.click(
      screen.getByRole('button', { name: /load sample data/i }),
    );

    expect(await screen.findByRole('table')).toBeInTheDocument();
    expect(screen.getByText('id')).toBeInTheDocument();
    expect(screen.getByText('name')).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: /copy field id/i }),
    );
    await userEvent.click(screen.getByRole('button', { name: /copy loop/i }));

    expect(writeText).toHaveBeenNthCalledWith(1, 'id');
    expect(writeText).toHaveBeenNthCalledWith(2, '{{#each items}}');
    expect(screen.getByText(/copied/i)).toBeInTheDocument();
  });

it('pages through sample data with Prev/Next buttons', async () => {
  const invoke = jest.fn().mockResolvedValue([{ id: 1 }, { id: 2 }]);
  (window as any).ipcRenderer = { invoke };

  render(
    <AsBuiltDocumenter
      templates={[]}
      dataSources={{ foo: { url: 'http://foo' } }}
    />,
  );

  await userEvent.selectOptions(screen.getByLabelText(/data source/i), 'foo');
  await userEvent.click(
    screen.getByRole('button', { name: /load sample data/i }),
  );

  expect(await screen.findByRole('button', { name: /next sample/i })).toBeInTheDocument();
  expect(screen.getByText(/"id": 1/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /next sample/i }));
  expect(screen.getByText(/"id": 2/)).toBeInTheDocument();

  await userEvent.click(screen.getByRole('button', { name: /prev sample/i }));
  expect(screen.getByText(/"id": 1/)).toBeInTheDocument();
});

it('saves configuration using Save Config button', async () => {
  const writeFile = jest.spyOn(fs, 'writeFile').mockResolvedValue();
  jest.spyOn(fs, 'readFile').mockResolvedValue('');

  render(
    <AsBuiltDocumenter templates={[]} configPath="/tmp/config.json" />,
  );
  const editor = await screen.findByRole('textbox', {
    name: /configuration editor/i,
  });
  fireEvent.change(editor, { target: { value: '{"foo":1}' } });
  await userEvent.click(screen.getByRole('button', { name: /save config/i }));

  expect(writeFile).toHaveBeenCalledWith('/tmp/config.json', '{"foo":1}');
});

it('adds data source via prompt and saves immediately', async () => {
  jest.spyOn(fs, 'readFile').mockResolvedValue('{}');
  const writeFile = jest.spyOn(fs, 'writeFile').mockResolvedValue();
  const prompt = jest
    .spyOn(window, 'prompt')
    .mockImplementationOnce(() => 'foo')
    .mockImplementationOnce(() => 'http://foo');

  render(
    <AsBuiltDocumenter
      templates={[]}
      dataSources={{}}
      configPath="/tmp/config.json"
    />,
  );

  await userEvent.click(
    screen.getByRole('button', { name: /add data source/i }),
  );

  expect(prompt).toHaveBeenCalledTimes(2);
  expect(writeFile).toHaveBeenCalledWith(
    '/tmp/config.json',
    JSON.stringify({ foo: { url: 'http://foo' } }, null, 2),
  );
  const select = screen.getByRole('combobox', { name: /data source/i }) as HTMLSelectElement;
  expect(Array.from(select.options).map((o) => o.value)).toContain('foo');
});

});
