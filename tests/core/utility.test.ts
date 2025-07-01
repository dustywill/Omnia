import { sanitizeAbsolutePath } from '../../src/core/utility.js';
import path from 'path';

describe('sanitizeAbsolutePath', () => {
  it('throws when path is empty', () => {
    expect(() => sanitizeAbsolutePath('')).toThrow('Path is required');
  });

  it('converts relative paths to absolute', () => {
    const rel = './foo/bar';
    const expected = path.normalize(path.resolve(rel));
    expect(sanitizeAbsolutePath(rel)).toBe(expected);
  });

  it('normalizes paths with .. segments', () => {
    const p = '/tmp/foo/../bar';
    const expected = path.normalize(path.resolve(p));
    expect(sanitizeAbsolutePath(p)).toBe(expected);
  });
});
