// Jest setup file - using ES modules
import '@testing-library/jest-dom';
import { fileURLToPath } from 'url';
import path from 'path';

// TypeScript declaration for global utilities
declare global {
  function getTestPath(importMetaUrl: string): { filename: string; dirname: string };
}

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

// Utility for path resolution in tests
global.getTestPath = function(importMetaUrl) {
  const filename = fileURLToPath(importMetaUrl);
  const dirname = path.dirname(filename);
  return { filename, dirname };
};

// ES module - no exports needed
