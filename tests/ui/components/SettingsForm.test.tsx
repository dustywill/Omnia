import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SettingsForm, type SettingsField } from '../../../src/ui/components/SettingsForm/SettingsForm.js';
import { jest } from '@jest/globals';

describe('SettingsForm', () => {
  const fields: SettingsField[] = [
    { key: 'name', label: 'Name', type: 'text', value: '', required: true }
  ];

  it('generates fields from schema', async () => {
    render(<SettingsForm title="Test" fields={fields} onSave={jest.fn()} />);
    expect(screen.getByText('Loading configuration...')).toBeInTheDocument();
    const input = await screen.findByLabelText('Name');
    expect(input).toBeInTheDocument();
  });

  it('validates input', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    render(<SettingsForm title="Test" fields={fields} onSave={onSave} />);
    const saveButton = await screen.findByRole('button', { name: 'Save' });
    await user.click(saveButton);
    expect(await screen.findByText('Name is required')).toBeInTheDocument();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('calls onSubmit with values', async () => {
    const user = userEvent.setup();
    const onSave = jest.fn();
    render(<SettingsForm title="Test" fields={fields} onSave={onSave} />);
    const input = await screen.findByLabelText('Name');
    await user.type(input, 'Alice');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    expect(onSave).toHaveBeenCalledWith({ name: 'Alice' });
  });
});
