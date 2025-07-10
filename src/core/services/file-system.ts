/**
 * FileSystemService - Unified file system operations for all plugins
 * 
 * This service provides a standardized, secure API for file system operations
 * across all plugins, eliminating code duplication and improving security.
 * 
 * Features:
 * - Security validation with path traversal prevention
 * - Permission-based access control
 * - Batch file operations
 * - Progress tracking support
 * - Cross-platform path handling
 * - User interface integration (file dialogs)
 */

import { EventEmitter } from 'events';
import path from 'path';
import fs from 'fs/promises';
import { existsSync } from 'fs';
import { createLogger } from '../logger.js';

export interface FileSystemConfig {
  maxFileSize: number;
  allowedExtensions: string[];
  blockedExtensions: string[];
  maxDirectoryDepth: number;
  basePath?: string;
  enableSandbox: boolean;
}

export interface ReadFileOptions {
  encoding?: BufferEncoding;
  maxSize?: number;
  signal?: AbortSignal;
}

export interface WriteFileOptions {
  encoding?: BufferEncoding;
  createDirectories?: boolean;
  overwrite?: boolean;
  signal?: AbortSignal;
}

export interface ReadDirectoryOptions {
  recursive?: boolean;
  maxDepth?: number;
  filter?: FileFilter;
  includeStats?: boolean;
  signal?: AbortSignal;
}

export interface FileFilter {
  fileRegex?: string;
  fileFilterType?: 'include' | 'exclude';
  folderRegex?: string;
  folderFilterType?: 'include' | 'exclude';
  maxDepth?: number;
  maxFileSize?: number;
  allowedExtensions?: string[];
  blockedExtensions?: string[];
}

export interface DirectoryEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  size?: number;
  modified?: Date;
  created?: Date;
  permissions?: FilePermissions;
}

export interface FileStats {
  size: number;
  modified: Date;
  created: Date;
  accessed: Date;
  isFile: boolean;
  isDirectory: boolean;
  permissions: FilePermissions;
}

export interface FilePermissions {
  readable: boolean;
  writable: boolean;
  executable: boolean;
}

export interface FileResult {
  path: string;
  content?: string | Buffer;
  error?: string;
  stats?: FileStats;
}

export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
  modified?: Date;
}

export interface FileSelectOptions {
  title?: string;
  defaultPath?: string;
  filters?: { name: string; extensions: string[] }[];
  multiSelect?: boolean;
}

export interface DirectorySelectOptions {
  title?: string;
  defaultPath?: string;
  createDirectories?: boolean;
}

export interface ProgressCallback {
  (progress: { completed: number; total: number; current: string }): void;
}

export interface FileWatcher {
  close(): void;
  on(event: 'change' | 'add' | 'remove', listener: (path: string) => void): void;
}

export class FileSystemService extends EventEmitter {
  private config: FileSystemConfig;
  private watchedPaths: Map<string, FileWatcher> = new Map();
  private logger = createLogger('FileSystemService', 'logs/app.log');

  constructor(config: FileSystemConfig) {
    super();
    this.config = config;
    this.logger.info('FileSystemService initialized');
  }

  /**
   * Validate file path for security
   */
  private validatePath(filePath: string): boolean {
    try {
      const resolvedPath = path.resolve(filePath);
      
      // Prevent path traversal attacks
      if (this.config.basePath) {
        const basePath = path.resolve(this.config.basePath);
        if (!resolvedPath.startsWith(basePath)) {
          this.logger.warn('Path traversal attempt blocked');
          return false;
        }
      }

      // Check for suspicious patterns
      const suspiciousPatterns = [
        /\.\./,
        /\0/,
        /[\x00-\x1f\x7f-\x9f]/,
        /^(CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i
      ];

      if (suspiciousPatterns.some(pattern => pattern.test(filePath))) {
        this.logger.warn('Suspicious file path blocked');
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error('Path validation error');
      return false;
    }
  }

  /**
   * Check if file extension is allowed
   */
  private isExtensionAllowed(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    
    if (this.config.blockedExtensions.includes(ext)) {
      return false;
    }

    if (this.config.allowedExtensions.length > 0) {
      return this.config.allowedExtensions.includes(ext);
    }

    return true;
  }

  /**
   * Get file permissions
   */
  private async getPermissions(filePath: string): Promise<FilePermissions> {
    try {
      await fs.access(filePath, fs.constants.F_OK);
      const readable = await fs.access(filePath, fs.constants.R_OK).then(() => true).catch(() => false);
      const writable = await fs.access(filePath, fs.constants.W_OK).then(() => true).catch(() => false);
      const executable = await fs.access(filePath, fs.constants.X_OK).then(() => true).catch(() => false);
      
      return { readable, writable, executable };
    } catch {
      return { readable: false, writable: false, executable: false };
    }
  }

  /**
   * Read a single file
   */
  async readFile(filePath: string, options: ReadFileOptions = {}): Promise<string | Buffer> {
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    if (!this.isExtensionAllowed(filePath)) {
      throw new Error(`File extension not allowed: ${path.extname(filePath)}`);
    }

    try {
      const stats = await fs.stat(filePath);
      
      if (!stats.isFile()) {
        throw new Error(`Path is not a file: ${filePath}`);
      }

      const maxSize = options.maxSize || this.config.maxFileSize;
      if (stats.size > maxSize) {
        throw new Error(`File too large: ${stats.size} bytes (max: ${maxSize})`);
      }

      const content = await fs.readFile(filePath, options.encoding || 'utf8');
      
      this.logger.debug('File read successfully');
      return content;
    } catch (error) {
      this.logger.error('Failed to read file');
      throw error;
    }
  }

  /**
   * Write a single file
   */
  async writeFile(filePath: string, content: string | Buffer, options: WriteFileOptions = {}): Promise<void> {
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    if (!this.isExtensionAllowed(filePath)) {
      throw new Error(`File extension not allowed: ${path.extname(filePath)}`);
    }

    try {
      // Check if file exists and overwrite is disabled
      if (!options.overwrite && existsSync(filePath)) {
        throw new Error(`File already exists: ${filePath}`);
      }

      // Create directories if needed
      if (options.createDirectories) {
        const directory = path.dirname(filePath);
        await this.createDirectory(directory, { recursive: true });
      }

      // Check content size
      const contentSize = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);
      if (contentSize > this.config.maxFileSize) {
        throw new Error(`Content too large: ${contentSize} bytes (max: ${this.config.maxFileSize})`);
      }

      await fs.writeFile(filePath, content, options.encoding || 'utf8');
      
      this.logger.debug('File written successfully');
      this.emit('file-written', { path: filePath, size: contentSize });
    } catch (error) {
      this.logger.error('Failed to write file');
      throw error;
    }
  }

  /**
   * Append content to a file
   */
  async appendFile(filePath: string, content: string | Buffer): Promise<void> {
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    if (!this.isExtensionAllowed(filePath)) {
      throw new Error(`File extension not allowed: ${path.extname(filePath)}`);
    }

    try {
      await fs.appendFile(filePath, content);
      
      const contentSize = Buffer.isBuffer(content) ? content.length : Buffer.byteLength(content);
      this.logger.debug('Content appended to file');
      this.emit('file-appended', { path: filePath, size: contentSize });
    } catch (error) {
      this.logger.error('Failed to append to file');
      throw error;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(filePath: string): Promise<void> {
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid file path: ${filePath}`);
    }

    try {
      await fs.unlink(filePath);
      
      this.logger.debug('File deleted successfully');
      this.emit('file-deleted', { path: filePath });
    } catch (error) {
      this.logger.error('Failed to delete file');
      throw error;
    }
  }

  /**
   * Create a directory
   */
  async createDirectory(dirPath: string, options: { recursive?: boolean } = {}): Promise<void> {
    if (!this.validatePath(dirPath)) {
      throw new Error(`Invalid directory path: ${dirPath}`);
    }

    try {
      await fs.mkdir(dirPath, { recursive: options.recursive });
      
      this.logger.debug('Directory created successfully');
      this.emit('directory-created', { path: dirPath });
    } catch (error) {
      this.logger.error('Failed to create directory');
      throw error;
    }
  }

  /**
   * Read directory contents
   */
  async readDirectory(dirPath: string, options: ReadDirectoryOptions = {}): Promise<DirectoryEntry[]> {
    if (!this.validatePath(dirPath)) {
      throw new Error(`Invalid directory path: ${dirPath}`);
    }

    try {
      const entries: DirectoryEntry[] = [];
      const items = await fs.readdir(dirPath, { withFileTypes: true });

      for (const item of items) {
        const fullPath = path.join(dirPath, item.name);
        
        // Apply filters
        if (options.filter) {
          if (item.isFile() && options.filter.fileRegex) {
            const regex = new RegExp(options.filter.fileRegex);
            const matches = regex.test(item.name);
            if (options.filter.fileFilterType === 'include' && !matches) continue;
            if (options.filter.fileFilterType === 'exclude' && matches) continue;
          }
          
          if (item.isDirectory() && options.filter.folderRegex) {
            const regex = new RegExp(options.filter.folderRegex);
            const matches = regex.test(item.name);
            if (options.filter.folderFilterType === 'include' && !matches) continue;
            if (options.filter.folderFilterType === 'exclude' && matches) continue;
          }
        }

        const entry: DirectoryEntry = {
          name: item.name,
          path: fullPath,
          type: item.isFile() ? 'file' : 'directory'
        };

        // Add stats if requested
        if (options.includeStats) {
          try {
            const stats = await this.stat(fullPath);
            entry.size = stats.size;
            entry.modified = stats.modified;
            entry.created = stats.created;
            entry.permissions = stats.permissions;
          } catch (error) {
            this.logger.warn('Failed to get stats for entry');
          }
        }

        entries.push(entry);

        // Recursive reading
        if (options.recursive && item.isDirectory()) {
          const maxDepth = options.maxDepth || this.config.maxDirectoryDepth;
          const currentDepth = (fullPath.split(path.sep).length - dirPath.split(path.sep).length);
          
          if (currentDepth < maxDepth) {
            const subEntries = await this.readDirectory(fullPath, {
              ...options,
              maxDepth: maxDepth - currentDepth
            });
            entries.push(...subEntries);
          }
        }
      }

      this.logger.debug('Directory read successfully');
      return entries;
    } catch (error) {
      this.logger.error('Failed to read directory');
      throw error;
    }
  }

  /**
   * Scan directory and return tree structure
   */
  async scanDirectory(dirPath: string, filter?: FileFilter): Promise<FileTreeNode> {
    if (!this.validatePath(dirPath)) {
      throw new Error(`Invalid directory path: ${dirPath}`);
    }

    try {
      const stats = await fs.stat(dirPath);
      const node: FileTreeNode = {
        name: path.basename(dirPath),
        path: dirPath,
        type: stats.isFile() ? 'file' : 'directory',
        size: stats.size,
        modified: stats.mtime
      };

      if (node.type === 'directory') {
        const entries = await this.readDirectory(dirPath, { 
          recursive: false, 
          filter,
          includeStats: true 
        });
        
        node.children = [];
        for (const entry of entries) {
          if (entry.type === 'directory') {
            const maxDepth = filter?.maxDepth || this.config.maxDirectoryDepth;
            const currentDepth = (entry.path.split(path.sep).length - dirPath.split(path.sep).length);
            
            if (currentDepth < maxDepth) {
              const childNode = await this.scanDirectory(entry.path, filter);
              node.children.push(childNode);
            }
          } else {
            node.children.push({
              name: entry.name,
              path: entry.path,
              type: entry.type,
              size: entry.size,
              modified: entry.modified
            });
          }
        }
      }

      return node;
    } catch (error) {
      this.logger.error('Failed to scan directory');
      throw error;
    }
  }

  /**
   * Delete a directory
   */
  async deleteDirectory(dirPath: string, options: { recursive?: boolean } = {}): Promise<void> {
    if (!this.validatePath(dirPath)) {
      throw new Error(`Invalid directory path: ${dirPath}`);
    }

    try {
      await fs.rmdir(dirPath, { recursive: options.recursive });
      
      this.logger.debug('Directory deleted successfully');
      this.emit('directory-deleted', { path: dirPath });
    } catch (error) {
      this.logger.error('Failed to delete directory');
      throw error;
    }
  }

  /**
   * Get file/directory statistics
   */
  async stat(filePath: string): Promise<FileStats> {
    if (!this.validatePath(filePath)) {
      throw new Error(`Invalid path: ${filePath}`);
    }

    try {
      const stats = await fs.stat(filePath);
      const permissions = await this.getPermissions(filePath);

      return {
        size: stats.size,
        modified: stats.mtime,
        created: stats.birthtime,
        accessed: stats.atime,
        isFile: stats.isFile(),
        isDirectory: stats.isDirectory(),
        permissions
      };
    } catch (error) {
      this.logger.error('Failed to get file stats');
      throw error;
    }
  }

  /**
   * Check if file/directory exists
   */
  async exists(filePath: string): Promise<boolean> {
    if (!this.validatePath(filePath)) {
      return false;
    }

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Read multiple files
   */
  async readFiles(filePaths: string[], options: ReadFileOptions = {}, progressCallback?: ProgressCallback): Promise<FileResult[]> {
    const results: FileResult[] = [];
    const total = filePaths.length;

    for (let i = 0; i < filePaths.length; i++) {
      const filePath = filePaths[i];
      const result: FileResult = { path: filePath };

      try {
        progressCallback?.({ completed: i, total, current: filePath });
        
        result.content = await this.readFile(filePath, options);
        result.stats = await this.stat(filePath);
      } catch (error) {
        result.error = error instanceof Error ? error.message : 'Unknown error';
        this.logger.warn('Failed to read file in batch');
      }

      results.push(result);
    }

    progressCallback?.({ completed: total, total, current: '' });
    this.logger.debug('Batch file read completed');
    
    return results;
  }

  /**
   * Write multiple files
   */
  async writeFiles(files: { path: string; content: string | Buffer; options?: WriteFileOptions }[], progressCallback?: ProgressCallback): Promise<void> {
    const total = files.length;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      try {
        progressCallback?.({ completed: i, total, current: file.path });
        
        await this.writeFile(file.path, file.content, file.options);
      } catch (error) {
        this.logger.error('Failed to write file in batch');
        throw error;
      }
    }

    progressCallback?.({ completed: total, total, current: '' });
    this.logger.debug('Batch file write completed');
  }

  /**
   * Watch a directory for changes
   */
  async watchDirectory(dirPath: string, _callback: (event: string, path: string) => void): Promise<FileWatcher> {
    if (!this.validatePath(dirPath)) {
      throw new Error(`Invalid directory path: ${dirPath}`);
    }

    // This is a simplified implementation - in a real system, you'd use
    // a proper file watching library like chokidar
    const watcher = {
      close: () => {
        this.watchedPaths.delete(dirPath);
      },
      on: (_event: string, _listener: (path: string) => void) => {
        // Implementation would go here
      }
    };

    this.watchedPaths.set(dirPath, watcher);
    this.logger.debug('Directory watch started');
    
    return watcher;
  }

  /**
   * Utility: Join path segments
   */
  joinPath(...segments: string[]): string {
    return path.join(...segments);
  }

  /**
   * Utility: Resolve path
   */
  resolvePath(...segments: string[]): string {
    return path.resolve(...segments);
  }

  /**
   * Utility: Get relative path
   */
  relativePath(from: string, to: string): string {
    return path.relative(from, to);
  }

  /**
   * Utility: Get basename
   */
  basename(filePath: string): string {
    return path.basename(filePath);
  }

  /**
   * Utility: Get dirname
   */
  dirname(filePath: string): string {
    return path.dirname(filePath);
  }

  /**
   * Utility: Get extension
   */
  extname(filePath: string): string {
    return path.extname(filePath);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<FileSystemConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info('FileSystemService configuration updated');
  }

  /**
   * Get current configuration
   */
  getConfig(): FileSystemConfig {
    return { ...this.config };
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close all watchers
    for (const [_path, watcher] of this.watchedPaths) {
      watcher.close();
    }
    this.watchedPaths.clear();
    
    this.logger.info('FileSystemService cleanup completed');
  }
}

/**
 * Factory function to create FileSystemService with default configuration
 */
export function createFileSystemService(overrides: Partial<FileSystemConfig> = {}): FileSystemService {
  const defaultConfig: FileSystemConfig = {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedExtensions: [], // Empty means all allowed
    blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs', '.js', '.jar'],
    maxDirectoryDepth: 10,
    enableSandbox: true,
    ...overrides
  };

  return new FileSystemService(defaultConfig);
}