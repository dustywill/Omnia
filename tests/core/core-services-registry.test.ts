/**
 * CoreServicesRegistry Tests
 * 
 * Comprehensive test suite for the CoreServicesRegistry including:
 * - Service registration and integration
 * - Configuration management
 * - Service lifecycle management
 * - Error handling
 * - Cleanup operations
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CoreServicesRegistry, createDefaultCoreServicesConfig } from '../../src/core/core-services-registry.js';

// Mock ServiceRegistry
const mockServiceRegistry = {
  registerService: jest.fn(),
  unregisterService: jest.fn(),
  getAvailableServices: jest.fn(),
  getServiceStats: jest.fn()
};

// Mock Logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock Services
const mockFileSystemService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  updateConfig: jest.fn(),
  cleanup: jest.fn()
};

const mockHttpClientService = {
  get: jest.fn(),
  post: jest.fn(),
  updateConfig: jest.fn(),
  cleanup: jest.fn()
};

const mockProgressTrackingService = {
  createProgress: jest.fn(),
  updateConfig: jest.fn(),
  cleanup: jest.fn()
};

const mockScriptExecutionService = {
  executeScript: jest.fn(),
  setFileSystemService: jest.fn(),
  setProgressService: jest.fn(),
  updateConfig: jest.fn(),
  cleanup: jest.fn()
};

const mockDocumentGeneratorService = {
  generateDocument: jest.fn(),
  updateConfig: jest.fn(),
  cleanup: jest.fn()
};

const mockTemplateEngineService = {
  render: jest.fn(),
  compile: jest.fn(),
  updateConfig: jest.fn(),
  cleanup: jest.fn()
};

// Mock service constructors
jest.mock('../../src/core/services/file-system.js', () => ({
  FileSystemService: jest.fn().mockImplementation(() => mockFileSystemService)
}));

jest.mock('../../src/core/services/http-client.js', () => ({
  HttpClientService: jest.fn().mockImplementation(() => mockHttpClientService)
}));

jest.mock('../../src/core/services/progress-tracking.js', () => ({
  ProgressTrackingService: jest.fn().mockImplementation(() => mockProgressTrackingService)
}));

jest.mock('../../src/core/services/script-execution.js', () => ({
  ScriptExecutionService: jest.fn().mockImplementation(() => mockScriptExecutionService)
}));

jest.mock('../../src/core/services/document-generator.js', () => ({
  DocumentGeneratorService: jest.fn().mockImplementation(() => mockDocumentGeneratorService)
}));

jest.mock('../../src/core/services/template-engine.js', () => ({
  TemplateEngineService: jest.fn().mockImplementation(() => mockTemplateEngineService)
}));

describe('CoreServicesRegistry', () => {
  let registry: CoreServicesRegistry;
  let testConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    registry = new CoreServicesRegistry(mockServiceRegistry as any, mockLogger as any);
    
    testConfig = {
      fileSystem: {
        maxFileSize: 1024 * 1024,
        allowedExtensions: ['.txt', '.md'],
        restrictToBasePath: true,
        basePath: '/test/base'
      },
      httpClient: {
        timeout: 30000,
        retries: 3,
        retryDelay: 1000
      },
      progressTracking: {
        enablePersistence: true,
        maxConcurrentTasks: 10,
        enableRealTimeUpdates: true
      },
      scriptExecution: {
        defaultShell: 'powershell' as const,
        defaultTimeout: 300,
        maxConcurrentScripts: 3,
        enableSandbox: true
      }
    };
  });

  afterEach(async () => {
    await registry.cleanup();
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    it('should create registry with dependencies', () => {
      expect(registry).toBeDefined();
      expect(registry.isInitialized()).toBe(false);
    });
  });

  describe('Initialization', () => {
    it('should initialize all services successfully', async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      
      await registry.initialize(testConfig);
      
      expect(registry.isInitialized()).toBe(true);
      expect(mockServiceRegistry.registerService).toHaveBeenCalledTimes(6); // 6 services
      expect(mockLogger.info).toHaveBeenCalledWith('Core services registry initialized successfully');
    });

    it('should not initialize twice', async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      
      await registry.initialize(testConfig);
      await registry.initialize(testConfig);
      
      expect(mockLogger.warn).toHaveBeenCalledWith('Core services already initialized');
    });

    it('should handle initialization errors', async () => {
      mockServiceRegistry.registerService.mockRejectedValue(new Error('Registration failed'));
      
      await expect(registry.initialize(testConfig)).rejects.toThrow('Registration failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize core services: Error: Registration failed');
    });

    it('should set up service dependencies', async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      
      await registry.initialize(testConfig);
      
      expect(mockScriptExecutionService.setFileSystemService).toHaveBeenCalledWith(mockFileSystemService);
      expect(mockScriptExecutionService.setProgressService).toHaveBeenCalledWith(mockProgressTrackingService);
    });
  });

  describe('Service Registration', () => {
    beforeEach(async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      await registry.initialize(testConfig);
    });

    it('should register FileSystemService', () => {
      expect(mockServiceRegistry.registerService).toHaveBeenCalledWith(
        'core',
        expect.objectContaining({
          name: 'filesystem',
          version: '1.0.0',
          description: 'Core file system operations with security validation'
        }),
        mockFileSystemService,
        ['filesystem:read', 'filesystem:write']
      );
    });

    it('should register HttpClientService', () => {
      expect(mockServiceRegistry.registerService).toHaveBeenCalledWith(
        'core',
        expect.objectContaining({
          name: 'http-client',
          version: '1.0.0',
          description: 'HTTP client with authentication, retry logic, and progress tracking'
        }),
        mockHttpClientService,
        ['network:http']
      );
    });

    it('should register ProgressTrackingService', () => {
      expect(mockServiceRegistry.registerService).toHaveBeenCalledWith(
        'core',
        expect.objectContaining({
          name: 'progress-tracking',
          version: '1.0.0',
          description: 'Unified progress tracking and reporting system'
        }),
        mockProgressTrackingService,
        []
      );
    });

    it('should register ScriptExecutionService', () => {
      expect(mockServiceRegistry.registerService).toHaveBeenCalledWith(
        'core',
        expect.objectContaining({
          name: 'script-execution',
          version: '1.0.0',
          description: 'Secure script execution with progress tracking and sandboxing'
        }),
        mockScriptExecutionService,
        ['system:exec', 'filesystem:read', 'filesystem:write']
      );
    });

    it('should register DocumentGeneratorService', () => {
      expect(mockServiceRegistry.registerService).toHaveBeenCalledWith(
        'core',
        expect.objectContaining({
          name: 'document-generator',
          version: '1.0.0',
          description: 'Document generation from templates and data'
        }),
        mockDocumentGeneratorService,
        ['filesystem:read', 'filesystem:write']
      );
    });

    it('should register TemplateEngineService', () => {
      expect(mockServiceRegistry.registerService).toHaveBeenCalledWith(
        'core',
        expect.objectContaining({
          name: 'template-engine',
          version: '1.0.0',
          description: 'Template processing and rendering engine'
        }),
        mockTemplateEngineService,
        []
      );
    });
  });

  describe('Service Method Definitions', () => {
    beforeEach(async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      await registry.initialize(testConfig);
    });

    it('should define FileSystemService methods correctly', () => {
      const fileSystemCall = mockServiceRegistry.registerService.mock.calls.find(
        call => call[1].name === 'filesystem'
      );
      
      expect(fileSystemCall[1].methods).toMatchObject({
        readFile: expect.objectContaining({
          description: 'Read file contents',
          requiresPermission: 'filesystem:read'
        }),
        writeFile: expect.objectContaining({
          description: 'Write file contents',
          requiresPermission: 'filesystem:write'
        }),
        deleteFile: expect.objectContaining({
          description: 'Delete a file',
          requiresPermission: 'filesystem:write'
        })
      });
    });

    it('should define HttpClientService methods correctly', () => {
      const httpCall = mockServiceRegistry.registerService.mock.calls.find(
        call => call[1].name === 'http-client'
      );
      
      expect(httpCall[1].methods).toMatchObject({
        get: expect.objectContaining({
          description: 'HTTP GET request',
          requiresPermission: 'network:http'
        }),
        post: expect.objectContaining({
          description: 'HTTP POST request',
          requiresPermission: 'network:http'
        }),
        setAuthentication: expect.objectContaining({
          description: 'Set authentication configuration'
        })
      });
    });

    it('should define ScriptExecutionService methods correctly', () => {
      const scriptCall = mockServiceRegistry.registerService.mock.calls.find(
        call => call[1].name === 'script-execution'
      );
      
      expect(scriptCall[1].methods).toMatchObject({
        executeScript: expect.objectContaining({
          description: 'Execute a script file',
          requiresPermission: 'system:exec'
        }),
        validateScriptSecurity: expect.objectContaining({
          description: 'Validate script for security issues'
        }),
        cancelScript: expect.objectContaining({
          description: 'Cancel a running script',
          requiresPermission: 'system:exec'
        })
      });
    });
  });

  describe('Service Access', () => {
    beforeEach(async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      await registry.initialize(testConfig);
    });

    it('should get service by name', () => {
      const service = registry.getService('filesystem');
      
      expect(service).toBe(mockFileSystemService);
    });

    it('should return undefined for non-existent service', () => {
      const service = registry.getService('non-existent');
      
      expect(service).toBeUndefined();
    });

    it('should get all services', () => {
      const services = registry.getAllServices();
      
      expect(services.size).toBe(6);
      expect(services.get('filesystem')).toBe(mockFileSystemService);
      expect(services.get('http-client')).toBe(mockHttpClientService);
      expect(services.get('progress-tracking')).toBe(mockProgressTrackingService);
      expect(services.get('script-execution')).toBe(mockScriptExecutionService);
      expect(services.get('document-generator')).toBe(mockDocumentGeneratorService);
      expect(services.get('template-engine')).toBe(mockTemplateEngineService);
    });
  });

  describe('Configuration Management', () => {
    beforeEach(async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      await registry.initialize(testConfig);
    });

    it('should update service configuration', async () => {
      const newConfig = { maxFileSize: 2048 * 1024 };
      
      await registry.updateServiceConfig('filesystem', newConfig);
      
      expect(mockFileSystemService.updateConfig).toHaveBeenCalledWith(newConfig);
      expect(mockLogger.info).toHaveBeenCalledWith('Updated configuration for filesystem service');
    });

    it('should handle configuration update for non-existent service', async () => {
      await expect(registry.updateServiceConfig('non-existent', {}))
        .rejects.toThrow('Service non-existent not found');
    });

    it('should handle configuration update for service without updateConfig', async () => {
      // Create a service without updateConfig method
      const serviceWithoutUpdate = {};
      registry['services'].set('no-update', serviceWithoutUpdate);
      
      await expect(registry.updateServiceConfig('no-update', {}))
        .rejects.toThrow('Service no-update not found or does not support configuration updates');
    });
  });

  describe('Cleanup', () => {
    beforeEach(async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      await registry.initialize(testConfig);
    });

    it('should cleanup all services', async () => {
      await registry.cleanup();
      
      expect(mockFileSystemService.cleanup).toHaveBeenCalled();
      expect(mockHttpClientService.cleanup).toHaveBeenCalled();
      expect(mockProgressTrackingService.cleanup).toHaveBeenCalled();
      expect(mockScriptExecutionService.cleanup).toHaveBeenCalled();
      expect(mockDocumentGeneratorService.cleanup).toHaveBeenCalled();
      expect(mockTemplateEngineService.cleanup).toHaveBeenCalled();
      
      expect(registry.isInitialized()).toBe(false);
      expect(mockLogger.info).toHaveBeenCalledWith('Core services cleanup completed');
    });

    it('should handle cleanup errors gracefully', async () => {
      mockFileSystemService.cleanup.mockRejectedValue(new Error('Cleanup failed'));
      
      await registry.cleanup();
      
      expect(mockLogger.error).toHaveBeenCalledWith('Error cleaning up filesystem service: Error: Cleanup failed');
      expect(registry.isInitialized()).toBe(false);
    });

    it('should skip cleanup for services without cleanup method', async () => {
      // Create a service without cleanup method
      const serviceWithoutCleanup = {};
      registry['services'].set('no-cleanup', serviceWithoutCleanup);
      
      await registry.cleanup();
      
      // Should not throw
      expect(registry.isInitialized()).toBe(false);
    });
  });

  describe('Default Configuration', () => {
    it('should create default configuration', () => {
      const defaultConfig = createDefaultCoreServicesConfig();
      
      expect(defaultConfig).toMatchObject({
        fileSystem: expect.objectContaining({
          maxFileSize: 10 * 1024 * 1024,
          allowedExtensions: [],
          restrictToBasePath: true
        }),
        httpClient: expect.objectContaining({
          timeout: 30000,
          retries: 3,
          retryDelay: 1000
        }),
        progressTracking: expect.objectContaining({
          enablePersistence: true,
          maxConcurrentTasks: 50,
          enableRealTimeUpdates: true
        }),
        scriptExecution: expect.objectContaining({
          defaultShell: expect.any(String),
          defaultTimeout: 300,
          maxConcurrentScripts: 3,
          enableSandbox: true
        })
      });
    });

    it('should set platform-specific defaults', () => {
      const defaultConfig = createDefaultCoreServicesConfig();
      
      if (process.platform === 'win32') {
        expect(defaultConfig.scriptExecution.defaultShell).toBe('powershell');
      } else {
        expect(defaultConfig.scriptExecution.defaultShell).toBe('bash');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle service registration errors', async () => {
      mockServiceRegistry.registerService.mockRejectedValueOnce(new Error('Registration failed'));
      
      await expect(registry.initialize(testConfig)).rejects.toThrow('Registration failed');
      expect(mockLogger.error).toHaveBeenCalledWith('Failed to initialize core services: Error: Registration failed');
    });

    it('should handle service creation errors', async () => {
      const { FileSystemService } = require('../../src/core/services/file-system.js');
      FileSystemService.mockImplementation(() => {
        throw new Error('Service creation failed');
      });
      
      await expect(registry.initialize(testConfig)).rejects.toThrow('Service creation failed');
    });
  });

  describe('Service Dependencies', () => {
    beforeEach(async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      await registry.initialize(testConfig);
    });

    it('should establish service dependencies correctly', () => {
      expect(mockScriptExecutionService.setFileSystemService).toHaveBeenCalledWith(mockFileSystemService);
      expect(mockScriptExecutionService.setProgressService).toHaveBeenCalledWith(mockProgressTrackingService);
    });
  });

  describe('Logging', () => {
    it('should log initialization', async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      
      await registry.initialize(testConfig);
      
      expect(mockLogger.info).toHaveBeenCalledWith('Initializing core services registry');
      expect(mockLogger.info).toHaveBeenCalledWith('Core services registry initialized successfully');
    });

    it('should log service registration', async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      
      await registry.initialize(testConfig);
      
      expect(mockLogger.info).toHaveBeenCalledWith('FileSystemService registered');
      expect(mockLogger.info).toHaveBeenCalledWith('HttpClientService registered');
      expect(mockLogger.info).toHaveBeenCalledWith('ProgressTrackingService registered');
      expect(mockLogger.info).toHaveBeenCalledWith('ScriptExecutionService registered');
      expect(mockLogger.info).toHaveBeenCalledWith('DocumentGeneratorService registered');
      expect(mockLogger.info).toHaveBeenCalledWith('TemplateEngineService registered');
    });

    it('should log cleanup', async () => {
      mockServiceRegistry.registerService.mockResolvedValue(undefined);
      await registry.initialize(testConfig);
      
      await registry.cleanup();
      
      expect(mockLogger.info).toHaveBeenCalledWith('Cleaning up core services');
      expect(mockLogger.info).toHaveBeenCalledWith('Core services cleanup completed');
    });
  });
});