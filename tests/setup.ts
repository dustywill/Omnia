// Jest setup file - using ES modules
import '@testing-library/jest-dom';

// Add DOM polyfills for CodeMirror
global.Range.prototype.getClientRects = function() {
  return {
    length: 0,
    item: () => null,
    [Symbol.iterator]: function* () {},
  };
};

global.Range.prototype.getBoundingClientRect = function() {
  return {
    bottom: 0,
    height: 0,
    left: 0,
    right: 0,
    top: 0,
    width: 0,
    x: 0,
    y: 0,
    toJSON: function() { return {}; }
  };
};

// Mock navigator.clipboard for copy operations only if it doesn't exist
if (!global.navigator.clipboard) {
  Object.defineProperty(global.navigator, 'clipboard', {
    value: {
      writeText: function() { return Promise.resolve(); },
    },
    configurable: true,
    writable: true,
  });
}

// ES module - no exports needed
