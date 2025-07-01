import { promptCommitMessage } from '../../../src/ui/components/MercurialCommit.js';

describe('promptCommitMessage', () => {
  it('returns user input or default message', () => {
    const original = window.prompt;
    (window.prompt as unknown) = jest.fn().mockReturnValue('');
    expect(promptCommitMessage('default')).toBe('default');
    (window.prompt as unknown) = jest.fn().mockReturnValue('custom');
    expect(promptCommitMessage('default')).toBe('custom');
    window.prompt = original;
  });
});
