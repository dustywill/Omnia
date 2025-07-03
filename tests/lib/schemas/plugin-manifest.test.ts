/**
 * @fileoverview Tests for plugin manifest schema validation
 */

import { describe, it, expect } from '@jest/globals';
import { 
  PluginManifestSchema, 
  validatePluginManifest, 
  safeValidatePluginManifest,
  PartialPluginManifestSchema,
  type PluginManifest
} from '../../../src/lib/schemas/plugin-manifest.js';

describe('PluginManifestSchema', () => {
  const validManifest = {
    id: 'com.example.test-plugin',
    name: 'Test Plugin',
    version: '1.0.0',
    description: 'A test plugin for validation',
    author: 'Test Author <test@example.com>',
    main: 'index.js',
    engine: {
      ttCommanderVersion: '>=0.1.0',
      nodeVersion: '>=18.0.0'
    },
    permissions: ['executeScript'],
    uiContributions: {
      menuItems: ['testMenu']
    }
  };

  describe('valid manifests', () => {
    it('should validate a complete valid manifest', () => {
      const result = validatePluginManifest(validManifest);
      expect(result).toEqual(validManifest);
    });

    it('should validate a minimal valid manifest', () => {
      const minimalManifest = {
        id: 'com.example.minimal',
        name: 'Minimal Plugin',
        version: '1.0.0',
        description: 'A minimal plugin',
        main: 'index.js',
        engine: {
          ttCommanderVersion: '>=0.1.0'
        }
      };
      
      const result = validatePluginManifest(minimalManifest);
      expect(result).toMatchObject(minimalManifest);
      expect(result.permissions).toEqual([]);
      expect(result.uiContributions).toEqual({});
    });

    it('should validate various semver formats', () => {
      const validVersions = [
        '1.0.0',
        '2.1.0',
        '0.0.1',
        '1.2.3-beta.1',
        '1.0.0+build.1',
        '1.0.0-alpha.1+build.1',
        '10.20.30'
      ];

      validVersions.forEach(version => {
        const manifest = { ...validManifest, version };
        expect(() => validatePluginManifest(manifest)).not.toThrow();
      });
    });

    it('should validate various plugin IDs', () => {
      const validIds = [
        'com.example.plugin',
        'my-plugin',
        'my_plugin',
        'plugin123',
        'com.example.plugin-name_v2',
        'simple'
      ];

      validIds.forEach(id => {
        const manifest = { ...validManifest, id };
        expect(() => validatePluginManifest(manifest)).not.toThrow();
      });
    });

    it('should validate various main file paths', () => {
      const validMainFiles = [
        'index.js',
        'main.js',
        'src/index.js',
        'dist/plugin.js',
        'lib/main.js'
      ];

      validMainFiles.forEach(main => {
        const manifest = { ...validManifest, main };
        expect(() => validatePluginManifest(manifest)).not.toThrow();
      });
    });
  });

  describe('invalid manifests', () => {
    it('should reject manifest missing required fields', () => {
      const invalidManifest = {
        id: 'invalid-plugin',
        name: 'Invalid Plugin'
        // Missing version, description, main, engine
      };

      const result = safeValidatePluginManifest(invalidManifest);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errorMessages = result.error.issues.map(issue => issue.message);
        expect(errorMessages).toContain('Plugin version is required');
        expect(errorMessages).toContain('Plugin description is required');
        expect(errorMessages).toContain('Main entry point is required');
        expect(errorMessages).toContain('Required');
      }
    });

    it('should reject invalid semver formats', () => {
      const invalidVersions = [
        '1.0',
        '1.0.0.0',
        'v1.0.0',
        '1.0.0-',
        '1.0.0+',
        'latest',
        '1.0.0.beta',
        '1.0.0-beta-'
      ];

      invalidVersions.forEach(version => {
        const manifest = { ...validManifest, version };
        const result = safeValidatePluginManifest(manifest);
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid plugin IDs', () => {
      const invalidIds = [
        'com.example.plugin!',
        'my@plugin',
        'my plugin',
        'plugin#123',
        'com.example.plugin%',
        'plugin/name',
        'plugin\\name'
      ];

      invalidIds.forEach(id => {
        const manifest = { ...validManifest, id };
        const result = safeValidatePluginManifest(manifest);
        expect(result.success).toBe(false);
      });
    });

    it('should reject invalid main file paths', () => {
      const invalidMainFiles = [
        '/index.js',
        '\\index.js',
        'index.ts',
        'index.jsx',
        'index',
        'main.css',
        '../index.js',
        './index.js'
      ];

      invalidMainFiles.forEach(main => {
        const manifest = { ...validManifest, main };
        const result = safeValidatePluginManifest(manifest);
        expect(result.success).toBe(false);
      });
    });

    it('should reject manifest with empty strings', () => {
      const fieldsToTest = ['id', 'name', 'version', 'description', 'main'];
      
      fieldsToTest.forEach(field => {
        const manifest = { ...validManifest, [field]: '' };
        const result = safeValidatePluginManifest(manifest);
        expect(result.success).toBe(false);
      });
    });

    it('should reject manifest missing ttCommanderVersion', () => {
      const manifest = {
        ...validManifest,
        engine: {
          nodeVersion: '>=18.0.0'
          // Missing ttCommanderVersion
        }
      };

      const result = safeValidatePluginManifest(manifest);
      expect(result.success).toBe(false);
    });

    it('should reject manifest with extra properties', () => {
      const manifestWithExtra = {
        ...validManifest,
        extraField: 'not allowed'
      };

      const result = safeValidatePluginManifest(manifestWithExtra);
      expect(result.success).toBe(false);
    });
  });

  describe('type safety', () => {
    it('should provide correct TypeScript types', () => {
      const manifest: PluginManifest = validatePluginManifest(validManifest);
      
      // These should compile without errors
      expect(typeof manifest.id).toBe('string');
      expect(typeof manifest.name).toBe('string');
      expect(typeof manifest.version).toBe('string');
      expect(typeof manifest.description).toBe('string');
      expect(typeof manifest.main).toBe('string');
      expect(typeof manifest.engine.ttCommanderVersion).toBe('string');
      expect(Array.isArray(manifest.permissions)).toBe(true);
      expect(typeof manifest.uiContributions).toBe('object');
    });
  });

  describe('partial manifest schema', () => {
    it('should validate partial manifests', () => {
      const partialManifest = {
        id: 'com.example.partial',
        name: 'Partial Plugin'
        // Missing other fields
      };

      const result = PartialPluginManifestSchema.safeParse(partialManifest);
      expect(result.success).toBe(true);
    });

    it('should still validate field formats in partial manifests', () => {
      const partialManifest = {
        id: 'invalid@id',
        version: 'invalid-version'
      };

      const result = PartialPluginManifestSchema.safeParse(partialManifest);
      expect(result.success).toBe(false);
    });
  });

  describe('utility functions', () => {
    it('should provide safeValidatePluginManifest function', () => {
      const validResult = safeValidatePluginManifest(validManifest);
      expect(validResult.success).toBe(true);
      
      const invalidResult = safeValidatePluginManifest({});
      expect(invalidResult.success).toBe(false);
    });

    it('should throw on invalid manifest with validatePluginManifest', () => {
      expect(() => validatePluginManifest({})).toThrow();
      expect(() => validatePluginManifest(validManifest)).not.toThrow();
    });
  });
});