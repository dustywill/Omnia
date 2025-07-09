import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { captureSnapshot, compareSnapshots } from './SnapshotManager.js';

const toHaveScreenshot = jest.fn();
const toEqual = jest.fn();
jest.mock('@playwright/test', () => ({
  expect: () => ({ toHaveScreenshot, toEqual })
}));

jest.mock('fs');
const mockedFs = fs as unknown as jest.Mocked<typeof fs>;

class MockLocator {
  evaluate = jest.fn();
  screenshot = jest.fn();
}

describe('SnapshotManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures element CSS and screenshot', async () => {
    const locator = new MockLocator();
    locator.evaluate
      .mockResolvedValueOnce('el-id')
      .mockResolvedValueOnce('{}');
    const testInfo = { title: 'test', config: { rootDir: '.' } } as any;

    await captureSnapshot(locator as any, 'default', testInfo);

    const dir = path.join(path.resolve('tests/snapshots'), 'test');
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith(dir, { recursive: true });
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      path.join(dir, 'el-id-default.json'),
      '{}'
    );
    expect(locator.screenshot).toHaveBeenCalledWith({
      path: path.join(dir, 'el-id-default.png')
    });
  });

  it('reads baseline CSS for comparison', async () => {
    const locator = new MockLocator();
    locator.evaluate
      .mockResolvedValueOnce('el-id')
      .mockResolvedValueOnce({ color: 'red' });
    const testInfo = { title: 'test', config: { rootDir: '.' } } as any;

    mockedFs.readFileSync.mockReturnValue(JSON.stringify({ color: 'red' }));

    await compareSnapshots(locator as any, 'default', testInfo);

    const dir = path.join(path.resolve('tests/snapshots'), 'test');
    expect(mockedFs.readFileSync).toHaveBeenCalledWith(
      path.join(dir, 'el-id-default.json'),
      'utf-8'
    );
    expect(toHaveScreenshot).toHaveBeenCalledWith('el-id-default.png');
    expect(toEqual).toHaveBeenCalledWith({ color: 'red' });
  });
});
