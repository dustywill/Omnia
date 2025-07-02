import { jest } from '@jest/globals';

const mockExec = jest.fn((_cmd: string, cb: (e: unknown, stdout: string, stderr: string) => void) => cb(null, '', ''));

jest.unstable_mockModule('child_process', () => ({
  exec: mockExec,
}));

const { createCommitOnSave } = await import('../../../src/ui/components/MercurialCommit.js');

describe('createCommitOnSave', () => {
  it('creates a commit whenever a file is saved', async () => {
    const onSave = createCommitOnSave('path/to/file');
    await onSave('msg');
    expect(mockExec).toHaveBeenCalledWith(
      'hg commit -m "msg" path/to/file',
      expect.any(Function),
    );
  });
});
