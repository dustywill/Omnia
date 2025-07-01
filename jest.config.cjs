const config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css)$': '<rootDir>/tests/style-mock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/', '<rootDir>/dist/'],
  transformIgnorePatterns: [
    'node_modules/(?!(@testing-library/jest-dom)/)'
  ],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: './tsconfig.json',
      useESM: true,
    }],
  },

};

module.exports = config;
