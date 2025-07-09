import { render, screen, fireEvent } from '@testing-library/react';
import { ToggleSwitch } from '../../../src/ui/components/ToggleSwitch/ToggleSwitch.js';

describe('ToggleSwitch', () => {
  it('toggles checked state on click and calls onChange', () => {
    const onChange = jest.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} aria-label="switch" />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('handles keyboard activation', () => {
    const onChange = jest.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} aria-label="switch" />);
    const toggle = screen.getByRole('switch');
    fireEvent.keyDown(toggle, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('does not trigger when disabled', () => {
    const onChange = jest.fn();
    render(<ToggleSwitch checked={false} onChange={onChange} disabled aria-label="switch" />);
    const toggle = screen.getByRole('switch');
    fireEvent.click(toggle);
    expect(onChange).not.toHaveBeenCalled();
  });
});
