/**
 * FileSystemService Tests
 * 
 * Comprehensive test suite for the FileSystemService including:
 * - File operations (read, write, delete)
 * - Directory operations (create, read, scan)
 * - Security validation
 * - Error handling
 * - Batch operations
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { FileSystemService, createFileSystemService } from '../../../src/core/services/file-system.js';
import { EventEmitter } from 'events';

// Mock fs/promises
const mockFs = {
  readFile: jest.fn(),
  writeFile: jest.fn(),
  appendFile: jest.fn(),
  unlink: jest.fn(),
  mkdir: jest.fn(),
  rmdir: jest.fn(),
  readdir: jest.fn(),
  stat: jest.fn(),
  access: jest.fn()
};

// Mock fs constants
const mockFsConstants = {
  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1
};

// Mock path module
const mockPath = {
  resolve: jest.fn(),
  join: jest.fn(),
  basename: jest.fn(),
  dirname: jest.fn(),
  extname: jest.fn(),
  relative: jest.fn(),
  sep: '/'
};

// Mock logger
const mockLogger = {
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock node modules
jest.mock('fs/promises', () => mockFs);
jest.mock('fs', () => ({ 
  existsSync: jest.fn(),
  createReadStream: jest.fn(),
  createWriteStream: jest.fn(),
  constants: mockFsConstants
}));
jest.mock('path', () => mockPath);
jest.mock('../../../src/core/logger.js', () => ({
  logger: mockLogger
}));

// Mock existing file system check
const mockExistsSync = jest.fn();
jest.mock('fs', () => ({
  existsSync: mockExistsSync,
  constants: mockFsConstants
}));

describe('FileSystemService', () => {
  let service: FileSystemService;
  let testConfig: any;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    testConfig = {
      maxFileSize: 1000000, // 1MB
      allowedExtensions: ['.txt', '.md', '.json'],
      blockedExtensions: ['.exe', '.bat'],
      maxDirectoryDepth: 5,
      basePath: '/test/base',
      enableSandbox: true
    };

    service = new FileSystemService(testConfig);

    // Setup default mock implementations
    mockPath.resolve.mockImplementation((...args) => args.join('/'));
    mockPath.join.mockImplementation((...args) => args.join('/'));
    mockPath.basename.mockImplementation((path) => path.split('/').pop());
    mockPath.dirname.mockImplementation((path) => path.split('/').slice(0, -1).join('/'));
    mockPath.extname.mockImplementation((path) => {
      const parts = path.split('.');
      return parts.length > 1 ? '.' + parts[parts.length - 1] : '';
    });
    mockPath.relative.mockImplementation((from, to) => to);
    
    mockFs.access.mockResolvedValue(undefined);
    mockExistsSync.mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor and Configuration', () => {
    it('should create service with default configuration', () => {
      const defaultService = createFileSystemService();
      expect(defaultService).toBeInstanceOf(FileSystemService);
      expect(mockLogger.info).toHaveBeenCalledWith('FileSystemService initialized', expect.any(Object));
    });

    it('should create service with custom configuration', () => {
      const customConfig = {
        maxFileSize: 2000000,
        allowedExtensions: ['.js', '.ts'],
        enableSandbox: false
      };
      
      const customService = createFileSystemService(customConfig);
      expect(customService).toBeInstanceOf(FileSystemService);
      expect(customService.getConfig()).toMatchObject(customConfig);
    });

    it('should emit events', () => {
      expect(service).toBeInstanceOf(EventEmitter);
    });
  });

  describe('Path Validation', () => {
    it('should validate allowed paths within base path', async () => {
      const testPath = '/test/base/file.txt';
      mockPath.resolve.mockReturnValue(testPath);
      
      await expect(service.readFile(testPath)).resolves.not.toThrow();
    });

    it('should reject path traversal attempts', async () => {
      const maliciousPath = '/test/base/../../../etc/passwd';
      mockPath.resolve.mockReturnValue('/etc/passwd');
      
      await expect(service.readFile(maliciousPath)).rejects.toThrow('Invalid file path');
    });

    it('should reject blocked extensions', async () => {
      const blockedPath = '/test/base/malware.exe';
      mockPath.resolve.mockReturnValue(blockedPath);
      mockPath.extname.mockReturnValue('.exe');
      
      await expect(service.readFile(blockedPath)).rejects.toThrow('File extension not allowed');
    });

    it('should allow files with allowed extensions', async () => {
      const allowedPath = '/test/base/document.txt';
      mockPath.resolve.mockReturnValue(allowedPath);
      mockPath.extname.mockReturnValue('.txt');
      mockFs.stat.mockResolvedValue({ isFile: () => true, size: 1000 });
      mockFs.readFile.mockResolvedValue('file content');
      
      await expect(service.readFile(allowedPath)).resolves.toBe('file content');
    });

    it('should reject files with suspicious patterns', async () => {
      const suspiciousPath = '/test/base/file\x00hidden.txt';
      
      await expect(service.readFile(suspiciousPath)).rejects.toThrow('Invalid file path');
    });
  });

  describe('File Operations', () => {
    beforeEach(() => {
      mockPath.resolve.mockReturnValue('/test/base/file.txt');
      mockPath.extname.mockReturnValue('.txt');
    });

    describe('readFile', () => {
      it('should read file successfully', async () => {
        const expectedContent = 'file content';
        mockFs.stat.mockResolvedValue({ isFile: () => true, size: 1000 });
        mockFs.readFile.mockResolvedValue(expectedContent);
        
        const result = await service.readFile('/test/base/file.txt');
        
        expect(result).toBe(expectedContent);
        expect(mockFs.readFile).toHaveBeenCalledWith('/test/base/file.txt', 'utf8');
        expect(mockLogger.debug).toHaveBeenCalledWith('File read successfully', expect.any(Object));
      });

      it('should reject files that are too large', async () => {
        mockFs.stat.mockResolvedValue({ isFile: () => true, size: 2000000 });
        
        await expect(service.readFile('/test/base/file.txt')).rejects.toThrow('File too large');
      });

      it('should reject directories', async () => {
        mockFs.stat.mockResolvedValue({ isFile: () => false });
        
        await expect(service.readFile('/test/base/file.txt')).rejects.toThrow('Path is not a file');
      });

      it('should handle read errors', async () => {
        mockFs.stat.mockRejectedValue(new Error('File not found'));
        
        await expect(service.readFile('/test/base/file.txt')).rejects.toThrow('File not found');
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to read file', expect.any(Object));
      });
    });

    describe('writeFile', () => {
      it('should write file successfully', async () => {
        const content = 'test content';
        mockFs.writeFile.mockResolvedValue(undefined);
        
        await service.writeFile('/test/base/file.txt', content);
        
        expect(mockFs.writeFile).toHaveBeenCalledWith('/test/base/file.txt', content, 'utf8');
        expect(mockLogger.debug).toHaveBeenCalledWith('File written successfully', expect.any(Object));
      });

      it('should reject overwriting existing files when overwrite is false', async () => {
        mockExistsSync.mockReturnValue(true);
        
        await expect(service.writeFile('/test/base/file.txt', 'content', { overwrite: false }))
          .rejects.toThrow('File already exists');
      });

      it('should create directories when createDirectories is true', async () => {
        mockPath.dirname.mockReturnValue('/test/base/subdir');
        mockFs.writeFile.mockResolvedValue(undefined);
        
        await service.writeFile('/test/base/subdir/file.txt', 'content', { createDirectories: true });
        
        expect(mockFs.writeFile).toHaveBeenCalled();
      });

      it('should reject content that is too large', async () => {
        const largeContent = 'a'.repeat(2000000);
        
        await expect(service.writeFile('/test/base/file.txt', largeContent))
          .rejects.toThrow('Content too large');
      });

      it('should handle write errors', async () => {
        mockFs.writeFile.mockRejectedValue(new Error('Write failed'));
        
        await expect(service.writeFile('/test/base/file.txt', 'content'))
          .rejects.toThrow('Write failed');
        expect(mockLogger.error).toHaveBeenCalledWith('Failed to write file', expect.any(Object));
      });
    });

    describe('appendFile', () => {
      it('should append to file successfully', async () => {
        const content = 'appended content';
        mockFs.appendFile.mockResolvedValue(undefined);
        
        await service.appendFile('/test/base/file.txt', content);
        
        expect(mockFs.appendFile).toHaveBeenCalledWith('/test/base/file.txt', content);
        expect(mockLogger.debug).toHaveBeenCalledWith('Content appended to file', expect.any(Object));
      });

      it('should handle append errors', async () => {
        mockFs.appendFile.mockRejectedValue(new Error('Append failed'));
        
        await expect(service.appendFile('/test/base/file.txt', 'content'))
          .rejects.toThrow('Append failed');
      });
    });

    describe('deleteFile', () => {
      it('should delete file successfully', async () => {
        mockFs.unlink.mockResolvedValue(undefined);
        
        await service.deleteFile('/test/base/file.txt');
        
        expect(mockFs.unlink).toHaveBeenCalledWith('/test/base/file.txt');
        expect(mockLogger.debug).toHaveBeenCalledWith('File deleted successfully', expect.any(Object));
      });

      it('should handle delete errors', async () => {
        mockFs.unlink.mockRejectedValue(new Error('Delete failed'));
        
        await expect(service.deleteFile('/test/base/file.txt'))
          .rejects.toThrow('Delete failed');
      });
    });
  });

  describe('Directory Operations', () => {
    beforeEach(() => {
      mockPath.resolve.mockReturnValue('/test/base/dir');
    });

    describe('createDirectory', () => {
      it('should create directory successfully', async () => {
        mockFs.mkdir.mockResolvedValue(undefined);
        
        await service.createDirectory('/test/base/dir');
        
        expect(mockFs.mkdir).toHaveBeenCalledWith('/test/base/dir', { recursive: undefined });
        expect(mockLogger.debug).toHaveBeenCalledWith('Directory created successfully', expect.any(Object));
      });

      it('should create directory recursively', async () => {
        mockFs.mkdir.mockResolvedValue(undefined);
        
        await service.createDirectory('/test/base/dir', { recursive: true });
        
        expect(mockFs.mkdir).toHaveBeenCalledWith('/test/base/dir', { recursive: true });
      });

      it('should handle create errors', async () => {
        mockFs.mkdir.mockRejectedValue(new Error('Create failed'));
        
        await expect(service.createDirectory('/test/base/dir'))
          .rejects.toThrow('Create failed');
      });
    });

    describe('readDirectory', () => {
      it('should read directory successfully', async () => {
        const mockFiles = [
          { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
          { name: 'subdir', isFile: () => false, isDirectory: () => true }
        ];
        mockFs.readdir.mockResolvedValue(mockFiles);
        mockPath.join.mockImplementation((dir, name) => `${dir}/${name}`);
        
        const result = await service.readDirectory('/test/base/dir');
        
        expect(result).toHaveLength(2);
        expect(result[0]).toMatchObject({
          name: 'file1.txt',
          path: '/test/base/dir/file1.txt',
          type: 'file'
        });
        expect(result[1]).toMatchObject({
          name: 'subdir',
          path: '/test/base/dir/subdir',
          type: 'directory'
        });
      });

      it('should apply file filters', async () => {
        const mockFiles = [
          { name: 'file1.txt', isFile: () => true, isDirectory: () => false },
          { name: 'file2.js', isFile: () => true, isDirectory: () => false }
        ];
        mockFs.readdir.mockResolvedValue(mockFiles);
        mockPath.join.mockImplementation((dir, name) => `${dir}/${name}`);
        
        const result = await service.readDirectory('/test/base/dir', {
          filter: {
            fileRegex: '\\.txt$',
            fileFilterType: 'include'
          }
        });
        
        expect(result).toHaveLength(1);
        expect(result[0].name).toBe('file1.txt');
      });

      it('should handle read errors', async () => {
        mockFs.readdir.mockRejectedValue(new Error('Read failed'));
        
        await expect(service.readDirectory('/test/base/dir'))
          .rejects.toThrow('Read failed');
      });
    });

    describe('scanDirectory', () => {
      it('should scan directory tree', async () => {
        mockFs.stat.mockResolvedValue({ isFile: () => false, size: 0, mtime: new Date() });
        mockFs.readdir.mockResolvedValue([
          { name: 'file.txt', isFile: () => true, isDirectory: () => false }
        ]);
        mockPath.basename.mockReturnValue('dir');
        mockPath.join.mockImplementation((dir, name) => `${dir}/${name}`);
        
        const result = await service.scanDirectory('/test/base/dir');
        
        expect(result).toMatchObject({
          name: 'dir',
          path: '/test/base/dir',
          type: 'directory',
          children: expect.any(Array)
        });
      });

      it('should handle scan errors', async () => {
        mockFs.stat.mockRejectedValue(new Error('Scan failed'));
        
        await expect(service.scanDirectory('/test/base/dir'))
          .rejects.toThrow('Scan failed');
      });
    });
  });

  describe('Batch Operations', () => {
    beforeEach(() => {
      mockPath.resolve.mockReturnValue('/test/base/file.txt');
      mockPath.extname.mockReturnValue('.txt');
    });

    describe('readFiles', () => {
      it('should read multiple files successfully', async () => {
        const files = ['/test/base/file1.txt', '/test/base/file2.txt'];
        mockFs.stat.mockResolvedValue({ isFile: () => true, size: 1000 });
        mockFs.readFile.mockResolvedValueOnce('content1').mockResolvedValueOnce('content2');
        
        const results = await service.readFiles(files);
        
        expect(results).toHaveLength(2);
        expect(results[0]).toMatchObject({
          path: '/test/base/file1.txt',
          content: 'content1'
        });
        expect(results[1]).toMatchObject({
          path: '/test/base/file2.txt',
          content: 'content2'
        });
      });

      it('should handle individual file errors in batch', async () => {
        const files = ['/test/base/file1.txt', '/test/base/file2.txt'];
        mockFs.stat.mockResolvedValue({ isFile: () => true, size: 1000 });
        mockFs.readFile.mockResolvedValueOnce('content1').mockRejectedValueOnce(new Error('Read failed'));
        
        const results = await service.readFiles(files);
        
        expect(results).toHaveLength(2);
        expect(results[0].content).toBe('content1');
        expect(results[1].error).toBe('Read failed');
      });

      it('should call progress callback', async () => {
        const files = ['/test/base/file1.txt'];
        const progressCallback = jest.fn();
        mockFs.stat.mockResolvedValue({ isFile: () => true, size: 1000 });
        mockFs.readFile.mockResolvedValue('content');
        
        await service.readFiles(files, {}, progressCallback);
        
        expect(progressCallback).toHaveBeenCalledWith({ completed: 0, total: 1, current: '/test/base/file1.txt' });
        expect(progressCallback).toHaveBeenCalledWith({ completed: 1, total: 1, current: '' });
      });
    });

    describe('writeFiles', () => {
      it('should write multiple files successfully', async () => {
        const files = [
          { path: '/test/base/file1.txt', content: 'content1' },
          { path: '/test/base/file2.txt', content: 'content2' }
        ];
        mockFs.writeFile.mockResolvedValue(undefined);
        
        await service.writeFiles(files);
        
        expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
        expect(mockFs.writeFile).toHaveBeenCalledWith('/test/base/file1.txt', 'content1', undefined);
        expect(mockFs.writeFile).toHaveBeenCalledWith('/test/base/file2.txt', 'content2', undefined);
      });

      it('should handle write errors in batch', async () => {
        const files = [{ path: '/test/base/file1.txt', content: 'content1' }];
        mockFs.writeFile.mockRejectedValue(new Error('Write failed'));
        
        await expect(service.writeFiles(files)).rejects.toThrow('Write failed');
      });
    });
  });

  describe('Utility Methods', () => {
    it('should join paths correctly', () => {
      mockPath.join.mockReturnValue('/test/base/file.txt');
      
      const result = service.joinPath('/test/base', 'file.txt');
      
      expect(result).toBe('/test/base/file.txt');
      expect(mockPath.join).toHaveBeenCalledWith('/test/base', 'file.txt');
    });

    it('should resolve paths correctly', () => {
      mockPath.resolve.mockReturnValue('/test/base/file.txt');
      
      const result = service.resolvePath('/test/base', 'file.txt');
      
      expect(result).toBe('/test/base/file.txt');
      expect(mockPath.resolve).toHaveBeenCalledWith('/test/base', 'file.txt');
    });

    it('should get relative paths correctly', () => {
      mockPath.relative.mockReturnValue('file.txt');
      
      const result = service.relativePath('/test/base', '/test/base/file.txt');
      
      expect(result).toBe('file.txt');
      expect(mockPath.relative).toHaveBeenCalledWith('/test/base', '/test/base/file.txt');
    });

    it('should get basename correctly', () => {
      mockPath.basename.mockReturnValue('file.txt');
      
      const result = service.basename('/test/base/file.txt');
      
      expect(result).toBe('file.txt');
      expect(mockPath.basename).toHaveBeenCalledWith('/test/base/file.txt');
    });

    it('should get dirname correctly', () => {
      mockPath.dirname.mockReturnValue('/test/base');
      
      const result = service.dirname('/test/base/file.txt');
      
      expect(result).toBe('/test/base');
      expect(mockPath.dirname).toHaveBeenCalledWith('/test/base/file.txt');
    });

    it('should get extension correctly', () => {
      mockPath.extname.mockReturnValue('.txt');
      
      const result = service.extname('/test/base/file.txt');
      
      expect(result).toBe('.txt');
      expect(mockPath.extname).toHaveBeenCalledWith('/test/base/file.txt');
    });
  });

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = { maxFileSize: 2000000 };
      
      service.updateConfig(newConfig);
      
      expect(service.getConfig().maxFileSize).toBe(2000000);
      expect(mockLogger.info).toHaveBeenCalledWith('FileSystemService configuration updated', expect.any(Object));
    });

    it('should get current configuration', () => {
      const config = service.getConfig();
      
      expect(config).toMatchObject(testConfig);
    });
  });

  describe('Events', () => {
    it('should emit file-written event', async () => {
      const eventSpy = jest.fn();
      service.on('file-written', eventSpy);
      
      mockFs.writeFile.mockResolvedValue(undefined);
      mockPath.resolve.mockReturnValue('/test/base/file.txt');
      mockPath.extname.mockReturnValue('.txt');
      
      await service.writeFile('/test/base/file.txt', 'content');
      
      expect(eventSpy).toHaveBeenCalledWith({ path: '/test/base/file.txt', size: 7 });
    });

    it('should emit file-deleted event', async () => {
      const eventSpy = jest.fn();
      service.on('file-deleted', eventSpy);
      
      mockFs.unlink.mockResolvedValue(undefined);
      mockPath.resolve.mockReturnValue('/test/base/file.txt');
      mockPath.extname.mockReturnValue('.txt');
      
      await service.deleteFile('/test/base/file.txt');
      
      expect(eventSpy).toHaveBeenCalledWith({ path: '/test/base/file.txt' });
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      await service.cleanup();
      
      expect(mockLogger.info).toHaveBeenCalledWith('FileSystemService cleanup completed');
    });
  });
});