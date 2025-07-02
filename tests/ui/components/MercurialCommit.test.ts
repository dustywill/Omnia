import { jest } from '@jest/globals';

const mockExec = jest.fn((_cmd: string, cb: (e: unknown, stdout: string, stderr: string) => void) => cb(null, '', ''));

jest.unstable_mockModule('child_process', () => ({
  exec: mockExec,
}));

const { commitFile } = await import('../../../src/ui/components/MercurialCommit.js');

describe('MercurialCommit', () => {
  it('commits changes via hg', async () => {
    await commitFile('test.json', 'update');
    expect(mockExec).toHaveBeenCalledWith(
      'hg commit -m "update" test.json',
      expect.any(Function),
    );
  });
});
