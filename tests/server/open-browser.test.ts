import { jest } from '@jest/globals';

const unrefMock = jest.fn();
const spawnMock = jest.fn(() => ({ unref: unrefMock }));

jest.mock('child_process', () => ({ spawn: spawnMock }));

beforeEach(() => {
  spawnMock.mockClear();
  unrefMock.mockClear();
});

describe('openBrowser', () => {
  it('uses cmd start on windows', async () => {
    Object.defineProperty(process, 'platform', { value: 'win32' });
    const { openBrowser } = await import('../../src/server.js');
    openBrowser('http://example.com');
    expect(spawnMock).toHaveBeenCalledWith('cmd', ['/c', 'start', '', 'http://example.com'], { stdio: 'ignore', detached: true });
  });

  it('uses open on darwin', async () => {
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    const { openBrowser } = await import('../../src/server.js');
    openBrowser('http://example.com');
    expect(spawnMock).toHaveBeenCalledWith('open', ['http://example.com'], { stdio: 'ignore', detached: true });
  });
});
