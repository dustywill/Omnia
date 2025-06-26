import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { z } from 'zod';

import { JsonEditor } from '../../../src/ui/components/JsonEditor.js';

describe('JsonEditor component', () => {
  it('opens and edits JSON files without schema', async () => {
    const onChange = jest.fn();
    render(<JsonEditor initialContent='{"foo": "bar"}' onChange={onChange} />);

    const textbox = screen.getByRole('textbox');
    expect(textbox).toHaveValue('{"foo": "bar"}');

    await userEvent.clear(textbox);
    await userEvent.type(textbox, '{"foo": "baz"}');

    expect(onChange).toHaveBeenLastCalledWith('{"foo": "baz"}');
  });

  it('validates against schema when provided', async () => {
    const schema = z.object({ foo: z.string() });
    render(<JsonEditor initialContent='{"foo": "bar"}' schema={schema} />);

    const textbox = screen.getByRole('textbox');
    await userEvent.clear(textbox);
    await userEvent.type(textbox, '{"foo": 123}');

    expect(await screen.findByText(/invalid/i)).toBeInTheDocument();
  });
});
