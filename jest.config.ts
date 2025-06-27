import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'jsdom',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
    '\\.(css)$': '<rootDir>/tests/style-mock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testPathIgnorePatterns: ['<rootDir>/tests/e2e/', '<rootDir>/dist/'],

  globals: {
    'ts-jest': {
      tsconfig: './tsconfig.json',
    },
  },

};

export default config;
