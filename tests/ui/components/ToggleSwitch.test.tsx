import { render, screen } from '@testing-library/react';
import { jest } from '@jest/globals';
import userEvent from '@testing-library/user-event';
import { ToggleSwitch } from '../../../src/ui/components/ToggleSwitch/ToggleSwitch.js';

describe('ToggleSwitch', () => {
  it('toggles checked state on click and calls onChange', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} aria-label="toggle" />);
    await user.click(screen.getByRole('switch'));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('supports keyboard activation', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} aria-label="toggle" />);
    const toggle = screen.getByRole('switch');
    toggle.focus();
    await user.keyboard('{Enter}');
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does nothing when disabled', async () => {
    const user = userEvent.setup();
    const onChange = jest.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} disabled aria-label="toggle" />);
    const toggle = screen.getByRole('switch');
    await user.click(toggle);
    await user.keyboard('{Space}');
    expect(onChange).not.toHaveBeenCalled();
  });
});
