import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsForm } from '../../../src/ui/components/SettingsForm/SettingsForm.js';

describe('SettingsForm', () => {
  const fields = [
    { key: 'name', label: 'Name', type: 'text', value: '', required: true },
  ];

  it('generates fields and calls onSave', async () => {
    const onSave = jest.fn();
    render(<SettingsForm title="t" fields={fields} onSave={onSave} />);
    const input = await screen.findByLabelText('Name');
    fireEvent.change(input, { target: { value: 'A' } });
    fireEvent.submit(input);
    await waitFor(() => expect(onSave).toHaveBeenCalled());
  });
});
