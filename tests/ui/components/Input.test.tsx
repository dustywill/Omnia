import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from '../../../src/ui/components/Input/Input.js';

describe('Input', () => {
  it('renders label and helper text', () => {
    render(<Input label="Email" helperText="Enter email" />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('Enter email')).toBeInTheDocument();
  });

  it('accepts typing', async () => {
    const user = userEvent.setup();
    render(<Input label="Name" />);
    const input = screen.getByLabelText('Name');
    await user.type(input, 'John');
    expect((input as HTMLInputElement).value).toBe('John');
  });

  it('shows error state styling', () => {
    render(<Input label="Password" error="Required" />);
    const input = screen.getByLabelText('Password');
    expect(input.className).toContain('border-danger');
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('renders icon', () => {
    render(<Input label="Search" icon={<span data-testid="icon">i</span>} />);
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('generates id and associates label', () => {
    render(<Input label="Test" />);
    const input = screen.getByLabelText('Test');
    const label = screen.getByText('Test');
    expect(input.id).toMatch(/^input-/);
    expect(label).toHaveAttribute('for', input.id);
  });

  it('focuses input when label clicked', async () => {
    const user = userEvent.setup();
    render(<Input label="Username" />);
    const label = screen.getByText('Username');
    const input = screen.getByLabelText('Username');
    await user.click(label);
    expect(document.activeElement).toBe(input);
  });
});
