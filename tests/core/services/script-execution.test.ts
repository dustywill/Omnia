/**
 * ScriptExecutionService Tests
 * 
 * Comprehensive test suite for the ScriptExecutionService including:
 * - Script execution with various shells
 * - Parameter validation and injection
 * - Security validation
 * - Progress tracking integration
 * - Error handling and timeouts
 * - Resource management
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { ScriptExecutionService, createScriptExecutionService } from '../../../src/core/services/script-execution.js';
import { EventEmitter } from 'events';

// Mock child_process
const mockSpawn = jest.fn();
const mockChildProcess = {
  stdout: new EventEmitter(),
  stderr: new EventEmitter(),
  on: jest.fn(),
  kill: jest.fn(),
  killed: false
};

// Mock fs
const mockExistsSync = jest.fn();

// Mock path
const mockPath = {
  resolve: jest.fn(),
  join: jest.fn(),
  basename: jest.fn(),
  dirname: jest.fn(),
  extname: jest.fn()
};

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock FileSystemService
const mockFileSystemService = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  exists: jest.fn(),
  validatePath: jest.fn()
};

// Mock ProgressTrackingService
const mockProgressTracker = {
  setPhase: jest.fn(),
  updateProgress: jest.fn(),
  complete: jest.fn(),
  fail: jest.fn(),
  cancel: jest.fn()
};

const mockProgressService = {
  createProgress: jest.fn().mockReturnValue(mockProgressTracker)
};

jest.mock('child_process', () => ({
  spawn: mockSpawn
}));

jest.mock('fs', () => ({
  existsSync: mockExistsSync
}));

jest.mock('path', () => mockPath);

jest.mock('../../../src/core/logger.js', () => ({
  logger: mockLogger
}));

describe('ScriptExecutionService', () => {
  let service: ScriptExecutionService;
  let testConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    
    testConfig = {
      defaultShell: 'powershell' as const,
      defaultTimeout: 30,
      maxConcurrentScripts: 2,
      allowedExtensions: ['.ps1', '.bat', '.cmd'],
      restrictToBasePath: true,
      basePath: '/test/scripts',
      maxOutputLength: 1000,
      enableOutputStreaming: true,
      enableProgressTracking: true,
      autoSaveResults: false,
      resourceLimits: {
        maxMemory: 256,
        maxCpuTime: 120,
        maxFileSize: 1024 * 1024
      },
      securityOptions: {
        enableSandbox: true,
        allowNetworkAccess: false,
        allowFileSystemAccess: true,
        allowRegistryAccess: false,
        allowEnvironmentAccess: true
      }
    };

    service = new ScriptExecutionService(testConfig);
    
    // Setup default mocks
    mockSpawn.mockReturnValue(mockChildProcess);
    mockExistsSync.mockReturnValue(true);
    mockPath.resolve.mockImplementation((...args) => args.join('/'));
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.basename.mockImplementation((path) => path.split('/').pop());
    mockPath.extname.mockImplementation((path) => {
      const parts = path.split('.');
      return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
    });
    
    // Setup child process mock
    mockChildProcess.on.mockImplementation((event, callback) => {
      if (event === 'close') {
        setTimeout(() => callback(0), 10); // Simulate successful completion
      }
      return mockChildProcess;
    });
  });

  afterEach(async () => {
    await service.cleanup();
    jest.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create service with default configuration', () => {
      const defaultService = createScriptExecutionService();
      expect(defaultService).toBeInstanceOf(ScriptExecutionService);
      expect(defaultService).toBeInstanceOf(EventEmitter);
      expect(mockLogger.info).toHaveBeenCalledWith('ScriptExecutionService initialized', expect.any(Object));
    });

    it('should create service with custom configuration', () => {
      const customConfig = {
        defaultShell: 'bash' as const,
        defaultTimeout: 60,
        maxConcurrentScripts: 5
      };
      
      const customService = createScriptExecutionService(customConfig);
      expect(customService).toBeInstanceOf(ScriptExecutionService);
      expect(customService.getConfig()).toMatchObject(customConfig);
    });

    it('should set file system service', () => {
      service.setFileSystemService(mockFileSystemService as any);
      // Should not throw
    });

    it('should set progress service', () => {
      service.setProgressService(mockProgressService as any);
      // Should not throw
    });
  });

  describe('Script Validation', () => {
    beforeEach(() => {
      service.setFileSystemService(mockFileSystemService as any);
    });

    it('should validate script path successfully', async () => {
      const scriptPath = '/test/scripts/valid.ps1';
      mockPath.resolve.mockReturnValue(scriptPath);
      mockPath.extname.mockReturnValue('.ps1');
      
      // Should not throw
      await expect(service.executeScript(scriptPath)).resolves.toBeDefined();
    });

    it('should reject scripts with invalid extensions', async () => {
      const scriptPath = '/test/scripts/invalid.exe';
      mockPath.resolve.mockReturnValue(scriptPath);
      mockPath.extname.mockReturnValue('.exe');
      
      await expect(service.executeScript(scriptPath)).rejects.toThrow('Script validation failed');
    });

    it('should reject scripts outside base path', async () => {
      const scriptPath = '/outside/script.ps1';
      mockPath.resolve.mockReturnValue(scriptPath);
      mockPath.extname.mockReturnValue('.ps1');
      
      await expect(service.executeScript(scriptPath)).rejects.toThrow('Script validation failed');
    });

    it('should reject non-existent scripts', async () => {
      const scriptPath = '/test/scripts/nonexistent.ps1';
      mockExistsSync.mockReturnValue(false);
      
      await expect(service.executeScript(scriptPath)).rejects.toThrow('Script validation failed');
    });
  });

  describe('Security Validation', () => {
    beforeEach(() => {
      service.setFileSystemService(mockFileSystemService as any);
      mockPath.resolve.mockReturnValue('/test/scripts/script.ps1');
      mockPath.extname.mockReturnValue('.ps1');
    });

    it('should validate secure scripts', async () => {
      mockFileSystemService.readFile.mockResolvedValue('Write-Host "Hello World"');
      
      const result = await service.validateScriptSecurity('/test/scripts/script.ps1');
      
      expect(result.safe).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect dangerous commands', async () => {
      mockFileSystemService.readFile.mockResolvedValue('rm -rf /');
      
      const result = await service.validateScriptSecurity('/test/scripts/script.ps1');
      
      expect(result.safe).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });

    it('should detect network access when not allowed', async () => {
      mockFileSystemService.readFile.mockResolvedValue('Invoke-WebRequest http://example.com');
      
      const result = await service.validateScriptSecurity('/test/scripts/script.ps1');
      
      expect(result.safe).toBe(false);
      expect(result.issues.some(issue => issue.includes('network access'))).toBe(true);
    });

    it('should detect obfuscated content', async () => {
      mockFileSystemService.readFile.mockResolvedValue('base64 encoded content here');
      
      const result = await service.validateScriptSecurity('/test/scripts/script.ps1');
      
      expect(result.safe).toBe(false);
      expect(result.issues.some(issue => issue.includes('encoded content'))).toBe(true);
    });
  });

  describe('Script Execution', () => {
    beforeEach(() => {
      service.setFileSystemService(mockFileSystemService as any);
      service.setProgressService(mockProgressService as any);
      
      mockPath.resolve.mockReturnValue('/test/scripts/script.ps1');
      mockPath.extname.mockReturnValue('.ps1');
      mockFileSystemService.readFile.mockResolvedValue('Write-Host "Hello World"');
    });

    it('should execute script successfully', async () => {
      const result = await service.executeScript('/test/scripts/script.ps1');
      
      expect(result.success).toBe(true);
      expect(result.exitCode).toBe(0);
      expect(result.scriptPath).toBe('/test/scripts/script.ps1');
      expect(result.id).toBeDefined();
      expect(result.startTime).toBeDefined();
      expect(result.endTime).toBeDefined();
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should execute PowerShell script', async () => {
      const result = await service.executePowerShell('/test/scripts/script.ps1');
      
      expect(result.success).toBe(true);
      expect(result.shell).toBe('powershell');
    });

    it('should handle script execution with parameters', async () => {
      const options = {
        parameters: { name: 'world', count: 5 }
      };
      
      const result = await service.executeScript('/test/scripts/script.ps1', options);
      
      expect(result.success).toBe(true);
      expect(result.parameters).toEqual(options.parameters);
    });

    it('should handle script execution with custom shell', async () => {
      const options = {
        shell: 'cmd'
      };
      
      const result = await service.executeScript('/test/scripts/script.ps1', options);
      
      expect(result.success).toBe(true);
      expect(result.shell).toBe('cmd');
    });

    it('should handle script execution with timeout', async () => {
      const options = {
        timeout: 1 // 1 second
      };
      
      // Mock long-running process
      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 2000); // 2 seconds
        }
        return mockChildProcess;
      });
      
      const result = await service.executeScript('/test/scripts/script.ps1', options);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });

    it('should capture script output', async () => {
      const mockOutput = 'Hello World\n';
      
      // Mock stdout data
      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 10);
        }
        return mockChildProcess;
      });
      
      // Simulate output
      setTimeout(() => {
        mockChildProcess.stdout.emit('data', mockOutput);
      }, 5);
      
      const result = await service.executeScript('/test/scripts/script.ps1');
      
      expect(result.success).toBe(true);
      expect(result.output).toContain(mockOutput);
    });

    it('should handle script execution errors', async () => {
      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10); // Exit with error
        }
        return mockChildProcess;
      });
      
      const result = await service.executeScript('/test/scripts/script.ps1');
      
      expect(result.success).toBe(false);
      expect(result.exitCode).toBe(1);
    });

    it('should enforce concurrent script limits', async () => {
      // Start maximum concurrent scripts
      const promises = [];
      for (let i = 0; i < testConfig.maxConcurrentScripts; i++) {
        promises.push(service.executeScript(`/test/scripts/script${i}.ps1`));
      }
      
      // This should fail due to limit
      await expect(service.executeScript('/test/scripts/overflow.ps1'))
        .rejects.toThrow('Maximum concurrent scripts limit reached');
    });

    it('should truncate long output', async () => {
      const longOutput = 'a'.repeat(testConfig.maxOutputLength + 100);
      
      // Mock long output
      setTimeout(() => {
        mockChildProcess.stdout.emit('data', longOutput);
      }, 5);
      
      const result = await service.executeScript('/test/scripts/script.ps1');
      
      expect(result.output.length).toBeLessThanOrEqual(testConfig.maxOutputLength + 50); // Account for truncation message
      expect(result.output).toContain('(output truncated)');
    });
  });

  describe('Parameter Validation', () => {
    const testSchema = [
      {
        name: 'name',
        type: 'string' as const,
        required: true,
        description: 'Name parameter'
      },
      {
        name: 'count',
        type: 'number' as const,
        required: false,
        description: 'Count parameter',
        validation: { min: 1, max: 10 }
      }
    ];

    it('should validate parameters successfully', () => {
      const params = { name: 'test', count: 5 };
      
      const result = service.validateParameters(params, testSchema);
      
      expect(result).toBe(true);
    });

    it('should reject missing required parameters', () => {
      const params = { count: 5 };
      
      expect(() => service.validateParameters(params, testSchema))
        .toThrow('Required parameter \'name\' is missing');
    });

    it('should reject invalid parameter types', () => {
      const params = { name: 123, count: 5 };
      
      expect(() => service.validateParameters(params, testSchema))
        .toThrow('Parameter \'name\' has invalid type');
    });

    it('should validate parameter constraints', () => {
      const params = { name: 'test', count: 15 };
      
      expect(() => service.validateParameters(params, testSchema))
        .toThrow('Parameter \'count\' fails validation constraints');
    });
  });

  describe('Parameter Injection', () => {
    it('should inject parameters into script content', () => {
      const scriptContent = 'Write-Host "Hello ${name}! Count: ${count}"';
      const params = { name: 'world', count: 5 };
      
      const result = service.injectParameters(scriptContent, params);
      
      expect(result).toBe('Write-Host "Hello "world"! Count: 5"');
    });

    it('should handle missing parameters gracefully', () => {
      const scriptContent = 'Write-Host "Hello ${name}!"';
      const params = {};
      
      const result = service.injectParameters(scriptContent, params);
      
      expect(result).toBe('Write-Host "Hello ${name}!"'); // Unchanged
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(() => {
      service.setProgressService(mockProgressService as any);
      service.setFileSystemService(mockFileSystemService as any);
      
      mockPath.resolve.mockReturnValue('/test/scripts/script.ps1');
      mockPath.extname.mockReturnValue('.ps1');
      mockFileSystemService.readFile.mockResolvedValue('Write-Host "Hello World"');
    });

    it('should create progress tracker when enabled', async () => {
      await service.executeScript('/test/scripts/script.ps1');
      
      expect(mockProgressService.createProgress).toHaveBeenCalled();
    });

    it('should update progress during execution', async () => {
      await service.executeScript('/test/scripts/script.ps1');
      
      expect(mockProgressTracker.setPhase).toHaveBeenCalledWith('preparation', expect.any(Object));
      expect(mockProgressTracker.setPhase).toHaveBeenCalledWith('execution', expect.any(Object));
      expect(mockProgressTracker.setPhase).toHaveBeenCalledWith('cleanup', expect.any(Object));
    });

    it('should complete progress on successful execution', async () => {
      await service.executeScript('/test/scripts/script.ps1');
      
      expect(mockProgressTracker.complete).toHaveBeenCalled();
    });

    it('should fail progress on execution error', async () => {
      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'error') {
          setTimeout(() => callback(new Error('Execution failed')), 10);
        }
        return mockChildProcess;
      });
      
      await service.executeScript('/test/scripts/script.ps1');
      
      expect(mockProgressTracker.fail).toHaveBeenCalled();
    });
  });

  describe('Script Cancellation', () => {
    beforeEach(() => {
      service.setFileSystemService(mockFileSystemService as any);
      
      mockPath.resolve.mockReturnValue('/test/scripts/script.ps1');
      mockPath.extname.mockReturnValue('.ps1');
      mockFileSystemService.readFile.mockResolvedValue('Write-Host "Hello World"');
    });

    it('should cancel running script', async () => {
      // Start script execution
      const promise = service.executeScript('/test/scripts/script.ps1');
      
      // Get the execution ID (this is a simplified test)
      const runningScripts = service.getRunningScripts();
      expect(runningScripts.length).toBeGreaterThan(0);
      
      // Cancel the script
      await service.cancelScript(runningScripts[0]);
      
      expect(mockChildProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    it('should handle cancellation of non-existent script', async () => {
      await expect(service.cancelScript('non-existent-id'))
        .resolves.not.toThrow();
    });
  });

  describe('Execution History', () => {
    beforeEach(() => {
      service.setFileSystemService(mockFileSystemService as any);
      
      mockPath.resolve.mockReturnValue('/test/scripts/script.ps1');
      mockPath.extname.mockReturnValue('.ps1');
      mockFileSystemService.readFile.mockResolvedValue('Write-Host "Hello World"');
    });

    it('should track execution history', async () => {
      await service.executeScript('/test/scripts/script.ps1');
      
      const history = service.getExecutionHistory();
      expect(history).toHaveLength(1);
      expect(history[0].scriptPath).toBe('/test/scripts/script.ps1');
    });

    it('should limit history size', async () => {
      // Execute many scripts
      for (let i = 0; i < 150; i++) {
        await service.executeScript(`/test/scripts/script${i}.ps1`);
      }
      
      const history = service.getExecutionHistory();
      expect(history.length).toBeLessThanOrEqual(100);
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        defaultTimeout: 60,
        maxConcurrentScripts: 5
      };
      
      service.updateConfig(newConfig);
      
      expect(service.getConfig()).toMatchObject(newConfig);
      expect(mockLogger.info).toHaveBeenCalledWith('ScriptExecutionService configuration updated', expect.any(Object));
    });

    it('should get current configuration', () => {
      const config = service.getConfig();
      
      expect(config).toMatchObject(testConfig);
    });
  });

  describe('Events', () => {
    beforeEach(() => {
      service.setFileSystemService(mockFileSystemService as any);
      
      mockPath.resolve.mockReturnValue('/test/scripts/script.ps1');
      mockPath.extname.mockReturnValue('.ps1');
      mockFileSystemService.readFile.mockResolvedValue('Write-Host "Hello World"');
    });

    it('should emit execution-complete event', async () => {
      const eventSpy = jest.fn();
      service.on('execution-complete', eventSpy);
      
      await service.executeScript('/test/scripts/script.ps1');
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        scriptPath: '/test/scripts/script.ps1'
      }));
    });

    it('should emit execution-failed event', async () => {
      const eventSpy = jest.fn();
      service.on('execution-failed', eventSpy);
      
      mockChildProcess.on.mockImplementation((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(1), 10); // Exit with error
        }
        return mockChildProcess;
      });
      
      await service.executeScript('/test/scripts/script.ps1');
      
      expect(eventSpy).toHaveBeenCalledWith(expect.objectContaining({
        success: false,
        scriptPath: '/test/scripts/script.ps1'
      }));
    });
  });

  describe('Cleanup', () => {
    it('should cleanup all resources', async () => {
      await service.cleanup();
      
      expect(mockLogger.info).toHaveBeenCalledWith('ScriptExecutionService cleanup completed');
    });

    it('should cancel all running scripts during cleanup', async () => {
      // Start a script
      service.executeScript('/test/scripts/script.ps1');
      
      await service.cleanup();
      
      expect(mockChildProcess.kill).toHaveBeenCalled();
    });
  });
});