import { compactNestedData } from '../../src/ui/compact.js';

describe('compactNestedData', () => {
  it('compacts data beyond specified depth', () => {
    const data = { a: { b: { c: 1 } } };
    expect(compactNestedData(data, 1)).toEqual({ a: '[...]' });
  });
});
