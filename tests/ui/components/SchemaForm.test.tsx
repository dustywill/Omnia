import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SchemaForm } from '../../../src/ui/components/SchemaForm/SchemaForm.js';
import { z } from 'zod';
import { jest } from '@jest/globals';

describe('SchemaForm', () => {
  const schema = z.object({
    user: z.object({ age: z.number().min(18) }),
    tags: z.array(z.string()).min(1)
  });

  it('renders nested and array fields', async () => {
    render(
      <SchemaForm
        title="Test"
        schema={schema}
        initialValues={{ user: { age: 20 }, tags: ['a'] }}
        onSubmit={jest.fn()}
      />
    );
    expect(await screen.findByLabelText('User - Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags')).toBeInTheDocument();
  });

  it('shows validation errors and submits values', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(
      <SchemaForm
        title="Test"
        schema={schema}
        initialValues={{ user: { age: 17 }, tags: [] }}
        onSubmit={onSubmit}
      />
    );
    await user.click(await screen.findByRole('button', { name: 'Save' }));
    expect(await screen.findByText(/greater than or equal to 18/)).toBeInTheDocument();
    const age = screen.getByLabelText('User - Age');
    await user.clear(age);
    await user.type(age, '18');
    await user.type(screen.getByLabelText('Tags'), 'one');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith(
        { user: { age: 18 }, tags: ['one'] },
        true
      )
    );
  });

  it('calls onChange as values update', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(
      <SchemaForm
        title="Test"
        schema={schema}
        initialValues={{ user: { age: 18 }, tags: ['x'] }}
        onSubmit={jest.fn()}
        onChange={onChange}
      />
    );
    const ageInput = await screen.findByLabelText('User - Age');
    await user.clear(ageInput);
    await user.type(ageInput, '19');
    await waitFor(() => expect(onChange).toHaveBeenCalled());
  });
});
