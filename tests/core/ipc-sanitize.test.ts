import { sanitizeForIpc } from '../../src/core/ipc-sanitize.js';
import { describe, it, expect, jest } from '@jest/globals';

describe('ipc-sanitize', () => {
  it('sanitizes functions', () => {
    const obj = { a: 1, b: () => {}, c: 'test' };
    const sanitized = sanitizeForIpc(obj);
    expect(sanitized).toEqual({ a: 1, c: 'test' });
  });

  it('sanitizes other non-serializable data types', () => {
    const map = new Map();
    map.set('key', 'value');
    const set = new Set([1, 2, 3]);
    const date = new Date();
    const regex = /abc/;
    const sym = Symbol('test');
    const promise = Promise.resolve(1);
    const domElement = typeof document !== 'undefined' ? document.createElement('div') : undefined;

    const obj = {
      map,
      set,
      date,
      regex,
      sym,
      promise,
      domElement,
      undef: undefined,
      num: 123,
      str: 'hello',
      bool: true,
      nul: null,
    };

    const sanitized = sanitizeForIpc(obj);

    expect(sanitized).toEqual({
      date: date.toISOString(), // Dates are converted to ISO strings
      regex: {}, // RegExp objects are converted to empty objects
      num: 123,
      str: 'hello',
      bool: true,
      nul: null,
    });
    expect(sanitized).not.toHaveProperty('map');
    expect(sanitized).not.toHaveProperty('set');
    expect(sanitized).not.toHaveProperty('sym');
    expect(sanitized).not.toHaveProperty('promise');
    expect(sanitized).not.toHaveProperty('domElement');
    expect(sanitized).not.toHaveProperty('undef');
  });

  it('handles nested non-serializable data', () => {
    const obj = {
      level1: {
        func: () => {},
        level2: {
          map: new Map(),
          arr: [1, () => {}, 3],
        },
      },
      str: 'test',
    };

    const sanitized = sanitizeForIpc(obj);

    expect(sanitized).toEqual({
      level1: {
        level2: {
          arr: [1, null, 3], // Functions in arrays become null
        },
      },
      str: 'test',
    });
    expect(sanitized.level1).not.toHaveProperty('func');
    expect(sanitized.level1.level2).not.toHaveProperty('map');
  });

  it('handles circular references', () => {
    const obj: any = { a: 1 };
    obj.b = obj;

    // Expect it to throw an error or handle gracefully (JSON.stringify behavior)
    // For structuredClone, it should throw DataCloneError
    // For JSON.stringify, it will throw TypeError
    expect(() => sanitizeForIpc(obj)).toThrow(TypeError);
  });

  it('does not alter serializable data', () => {
    const obj = {
      a: 1,
      b: 'hello',
      c: true,
      d: null,
      e: [1, 2, { f: 3 }],
      g: { h: 'world' },
    };
    const sanitized = sanitizeForIpc(obj);
    expect(sanitized).toEqual(obj);
  });

  it('handles IPC methods that pass data', () => {
    // This test is conceptual as actual IPC methods are outside this unit.
    // The sanitizeForIpc function is designed to be used *before* IPC.
    const mockIpcSend = jest.fn();
    const dataWithFunction = { a: 1, b: () => {} };
    const sanitizedData = sanitizeForIpc(dataWithFunction);
    mockIpcSend('channel', sanitizedData);
    expect(mockIpcSend).toHaveBeenCalledWith('channel', { a: 1 });
  });

  it('handles unexpected data during sanitization', () => {
    // Simulate an object that might cause issues during JSON.stringify
    const obj = { a: 1, b: BigInt(10) }; // BigInt is not directly serializable by JSON.stringify

    // Depending on the implementation of sanitizeForIpc, it might throw or return a partial object.
    // Assuming it uses JSON.stringify internally, it should throw.
    expect(() => sanitizeForIpc(obj)).toThrow(TypeError);
  });
});