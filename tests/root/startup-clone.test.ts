import { jest } from '@jest/globals';

// Test structured clone functionality without importing the full application
test('structured clone works with typical IPC data', () => {
  // Test common data types that would be passed through IPC
  const testData = [
    { id: 'test', name: 'Test Plugin' },
    ['item1', 'item2', 'item3'],
    'simple string',
    42,
    true,
    null,
    { nested: { data: 'value' } },
    new Date().toISOString(),
  ];

  for (const data of testData) {
    expect(() => structuredClone(data)).not.toThrow();
  }
});

test('preload sanitizeForIpc function concept', () => {
  // Test the key functionality without importing the actual preload script
  const sanitizeForIpc = (label: string, value: any) => {
    try {
      structuredClone(value);
      return value;
    } catch (_err) {
      console.warn(`${label} is not serializable`, value);
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        return null;
      }
    }
  };

  // Test with serializable data
  const serializable = { id: 'test', data: ['a', 'b', 'c'] };
  expect(sanitizeForIpc('test', serializable)).toEqual(serializable);

  // Test with non-serializable data (function)
  const nonSerializable = { id: 'test', fn: () => {} };
  const result = sanitizeForIpc('test', nonSerializable);
  expect(result).toEqual({ id: 'test' }); // function should be stripped
});
