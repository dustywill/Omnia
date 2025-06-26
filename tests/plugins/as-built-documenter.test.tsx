import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
});
