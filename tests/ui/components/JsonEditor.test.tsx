import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

import { JsonEditor } from '../../../src/ui/components/JsonEditor.js';
import { openJsonEditor } from '../../../src/ui/json-editor-api.js';

describe('JsonEditor component', () => {
  it('opens and edits JSON files without schema', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<JsonEditor initialContent='{"foo": "bar"}' onChange={onChange} />);

    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveValue('{"foo": "bar"}');
    await user.clear(textbox);
    await user.click(textbox);
    await user.paste('{"foo": "baz"}');
    expect(onChange).toHaveBeenLastCalledWith('{"foo": "baz"}');
  });

  it('validates against schema when provided', async () => {
    const schema = z.object({ foo: z.string() });
    const user = userEvent.setup();
    render(<JsonEditor initialContent='{"foo": "bar"}' schema={schema} />);

    const textbox = screen.getByRole('textbox');
    await user.clear(textbox);
    await user.click(textbox);
    await user.paste('{"foo": 123}');
    expect(await screen.findByText(/invalid/i)).toBeInTheDocument();
  });

  it('adds a new entry', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(<JsonEditor initialContent='{"foo": "bar"}' onChange={onChange} />);

    await user.click(screen.getByRole('button', { name: /add entry/i }));

    expect(onChange).toHaveBeenLastCalledWith('{"foo": "bar", "new": ""}');
  });

  it('deletes an entry', async () => {
    const onChange = jest.fn();
    const user = userEvent.setup();
    render(
      <JsonEditor initialContent='{"foo": "bar", "baz": 1}' onChange={onChange} />, 
    );

    await user.click(screen.getByRole('button', { name: /delete foo/i }));

    expect(onChange).toHaveBeenLastCalledWith('{"baz": 1}');
  });

  it('opens a file with schema via API', async () => {
    const tempPath = path.join(__dirname, 'temp.json');
    await fs.writeFile(tempPath, '{"foo":"bar"}', 'utf8');
    const schema = z.object({ foo: z.string() });
    const element = await openJsonEditor(tempPath, schema);
    const user = userEvent.setup();
    render(element);
    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveValue('{"foo":"bar"}');
    await user.clear(textbox);
    await user.paste('{"foo":123}');
    expect(await screen.findByText(/invalid/i)).toBeInTheDocument();
    await fs.rm(tempPath);
  });
});
