import child_process from 'child_process';
import { commitFile } from '../../../src/ui/components/MercurialCommit.js';

jest.mock('child_process', () => ({
  exec: jest.fn((_cmd: string, cb: (e: unknown, stdout: string, stderr: string) => void) => cb(null, '', '')),
}));

describe('MercurialCommit', () => {
  it('commits changes via hg', async () => {
    const execMock = child_process.exec as unknown as jest.Mock;
    await commitFile('test.json', 'update');
    expect(execMock).toHaveBeenCalledWith(
      'hg commit -m "update" test.json',
      expect.any(Function),
    );
  });
});
