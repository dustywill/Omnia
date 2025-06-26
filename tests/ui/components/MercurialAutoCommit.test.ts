import child_process from 'child_process';
import { createCommitOnSave } from '../../../src/ui/components/MercurialCommit.js';

jest.mock('child_process', () => ({
  exec: jest.fn((_cmd: string, cb: (e: unknown, stdout: string, stderr: string) => void) => cb(null, '', '')),
}));

describe('createCommitOnSave', () => {
  it('creates a commit whenever a file is saved', async () => {
    const execMock = child_process.exec as unknown as jest.Mock;
    const onSave = createCommitOnSave('path/to/file');
    await onSave('msg');
    expect(execMock).toHaveBeenCalledWith(
      'hg commit -m "msg" path/to/file',
      expect.any(Function),
    );
  });
});
