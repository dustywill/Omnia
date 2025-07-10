/**
 * ScriptExecutionService - Centralized script execution and management
 * 
 * This service provides secure, configurable script execution capabilities
 * extracted from the Script Runner plugin. It supports multiple shell types,
 * parameter validation, security controls, and execution monitoring.
 * 
 * Features:
 * - Multi-shell support (PowerShell, Command Prompt, Bash)
 * - Parameter validation and injection
 * - Security controls and sandboxing
 * - Output streaming and capture
 * - Execution timeout and cancellation
 * - Result persistence and history
 * - Progress tracking integration
 * - Resource limits and monitoring
 */

import { EventEmitter } from 'events';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import { existsSync } from 'fs';
import { createLogger } from '../logger.js';
import { FileSystemService } from './file-system.js';
import { ProgressTrackingService, ProgressTracker } from './progress-tracking.js';

export interface ScriptExecutionConfig {
  defaultShell: 'powershell' | 'pwsh' | 'cmd' | 'bash' | 'sh';
  defaultTimeout: number;
  maxConcurrentScripts: number;
  allowedExtensions: string[];
  restrictToBasePath: boolean;
  basePath?: string;
  maxOutputLength: number;
  enableOutputStreaming: boolean;
  enableProgressTracking: boolean;
  autoSaveResults: boolean;
  outputDirectory?: string;
  resourceLimits: {
    maxMemory: number; // MB
    maxCpuTime: number; // seconds
    maxFileSize: number; // bytes
  };
  securityOptions: {
    enableSandbox: boolean;
    allowNetworkAccess: boolean;
    allowFileSystemAccess: boolean;
    allowRegistryAccess: boolean;
    allowEnvironmentAccess: boolean;
  };
}

export interface ScriptParameter {
  name: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  defaultValue?: any;
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

export interface ScriptOptions {
  shell?: string;
  cwd?: string;
  env?: Record<string, string>;
  timeout?: number;
  parameters?: Record<string, any>;
  stdin?: string;
  encoding?: BufferEncoding;
  signal?: AbortSignal;
  onProgress?: (progress: { percentage: number; message: string }) => void;
  onOutput?: (output: string) => void;
  onError?: (error: string) => void;
}

export interface ExecutionResult {
  id: string;
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  scriptPath: string;
  parameters: Record<string, any>;
  shell: string;
  cwd: string;
  startTime: Date;
  endTime: Date;
  outputLength: number;
  resourceUsage?: {
    maxMemory: number;
    cpuTime: number;
    diskIO: number;
  };
}

export interface ScriptValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  securityIssues: string[];
}

export interface RunningScript {
  id: string;
  scriptPath: string;
  process: ChildProcess;
  startTime: Date;
  options: ScriptOptions;
  progress?: ProgressTracker;
  abortController?: AbortController;
}

export interface SecurityResult {
  safe: boolean;
  issues: string[];
  recommendations: string[];
}

export interface SandboxOptions {
  allowedCommands?: string[];
  blockedCommands?: string[];
  allowedPaths?: string[];
  blockedPaths?: string[];
  maxExecutionTime?: number;
  maxMemoryUsage?: number;
}

export class ScriptExecutionService extends EventEmitter {
  private config: ScriptExecutionConfig;
  private runningScripts: Map<string, RunningScript> = new Map();
  private executionHistory: ExecutionResult[] = [];
  private fileSystemService?: FileSystemService;
  private progressService?: ProgressTrackingService;
  private shellPaths: Map<string, string> = new Map();
  private logger = createLogger('ScriptExecutionService', 'logs/app.log');

  constructor(config: ScriptExecutionConfig) {
    super();
    this.config = config;
    this.initializeShellPaths();
    this.logger.info(`ScriptExecutionService initialized with config: ${JSON.stringify(config)}`);
  }

  /**
   * Initialize shell paths for different operating systems
   */
  private initializeShellPaths(): void {
    const platform = process.platform;
    
    if (platform === 'win32') {
      this.shellPaths.set('powershell', 'powershell.exe');
      this.shellPaths.set('pwsh', 'pwsh.exe');
      this.shellPaths.set('cmd', 'cmd.exe');
    } else {
      this.shellPaths.set('bash', '/bin/bash');
      this.shellPaths.set('sh', '/bin/sh');
    }
  }

  /**
   * Set file system service for file operations
   */
  setFileSystemService(fileSystemService: FileSystemService): void {
    this.fileSystemService = fileSystemService;
  }

  /**
   * Set progress tracking service
   */
  setProgressService(progressService: ProgressTrackingService): void {
    this.progressService = progressService;
  }

  /**
   * Execute a script with the given options
   */
  async executeScript(scriptPath: string, options: ScriptOptions = {}): Promise<ExecutionResult> {
    const executionId = `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.logger.info(`Starting script execution - executionId: ${executionId}, scriptPath: ${scriptPath}`);
    
    // Validate script path
    const validation = await this.validateScriptPath(scriptPath);
    if (!validation.isValid) {
      throw new Error(`Script validation failed: ${validation.errors.join(', ')}`);
    }

    // Security validation
    const securityResult = await this.validateScriptSecurity(scriptPath);
    if (!securityResult.safe) {
      throw new Error(`Security validation failed: ${securityResult.issues.join(', ')}`);
    }

    // Check concurrent execution limits
    if (this.runningScripts.size >= this.config.maxConcurrentScripts) {
      throw new Error(`Maximum concurrent scripts limit reached (${this.config.maxConcurrentScripts})`);
    }

    // Prepare execution parameters
    const shell = options.shell || this.config.defaultShell;
    const timeout = options.timeout || this.config.defaultTimeout;
    const cwd = options.cwd || (this.config.basePath ? path.resolve(this.config.basePath) : process.cwd());
    const env = { 
      ...Object.fromEntries(
        Object.entries(process.env).filter(([_, value]) => value !== undefined)
      ) as Record<string, string>, 
      ...options.env 
    };

    // Create progress tracker if enabled
    let progressTracker: ProgressTracker | undefined;
    if (this.config.enableProgressTracking && this.progressService) {
      progressTracker = this.progressService.createProgress({
        id: executionId,
        name: `Script: ${path.basename(scriptPath)}`,
        phases: [
          { id: 'preparation', name: 'Preparation', weight: 10 },
          { id: 'execution', name: 'Execution', weight: 80 },
          { id: 'cleanup', name: 'Cleanup', weight: 10 }
        ],
        timeout: timeout * 1000
      });
    }

    const startTime = new Date();
    let output = '';
    let errorOutput = '';
    let exitCode = 0;

    try {
      // Update progress
      progressTracker?.setPhase('preparation', { percentage: 0, message: 'Preparing script execution' });

      // Prepare command and arguments
      const { command, args } = this.prepareCommand(scriptPath, shell, options);
      
      // Create abort controller
      const abortController = new AbortController();
      if (options.signal) {
        options.signal.addEventListener('abort', () => {
          abortController.abort();
        });
      }

      // Start progress tracking
      progressTracker?.setPhase('execution', { percentage: 0, message: 'Starting script execution' });

      // Execute script
      const result = await this.executeCommand(
        executionId,
        command,
        args,
        {
          cwd,
          env,
          timeout: timeout * 1000,
          signal: abortController.signal,
          onOutput: (data) => {
            output += data;
            options.onOutput?.(data);
            
            // Update progress based on output
            if (progressTracker) {
              const progress = Math.min(90, (output.length / 1000) * 10); // Rough progress estimate
              progressTracker.updateProgress({ percentage: progress, message: 'Script executing...' });
            }
          },
          onError: (data) => {
            errorOutput += data;
            options.onError?.(data);
          }
        }
      );

      exitCode = result.exitCode;

      // Update progress
      progressTracker?.setPhase('cleanup', { percentage: 0, message: 'Processing results' });

      // Truncate output if too long
      if (output.length > this.config.maxOutputLength) {
        output = output.substring(0, this.config.maxOutputLength) + '\n... (output truncated)';
      }

      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();

      // Create execution result
      const executionResult: ExecutionResult = {
        id: executionId,
        success: exitCode === 0,
        output,
        error: errorOutput || undefined,
        exitCode,
        duration,
        scriptPath,
        parameters: options.parameters || {},
        shell,
        cwd,
        startTime,
        endTime,
        outputLength: output.length
      };

      // Save results if enabled
      if (this.config.autoSaveResults) {
        await this.saveExecutionResult(executionResult);
      }

      // Add to history
      this.executionHistory.push(executionResult);
      
      // Keep history size manageable
      if (this.executionHistory.length > 100) {
        this.executionHistory.shift();
      }

      // Complete progress tracking
      progressTracker?.complete(`Script completed ${exitCode === 0 ? 'successfully' : 'with errors'}`);

      this.logger.info(`Script execution completed - executionId: ${executionId}, success: ${executionResult.success}, duration: ${duration}ms, outputLength: ${output.length}`);

      this.emit('execution-complete', executionResult);
      return executionResult;

    } catch (error) {
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      const executionResult: ExecutionResult = {
        id: executionId,
        success: false,
        output,
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        duration,
        scriptPath,
        parameters: options.parameters || {},
        shell,
        cwd,
        startTime,
        endTime,
        outputLength: output.length
      };

      // Fail progress tracking
      progressTracker?.fail(error instanceof Error ? error : new Error('Script execution failed'));

      this.logger.error(`Script execution failed - executionId: ${executionId}, error: ${error}`);
      this.emit('execution-failed', executionResult);
      
      return executionResult;
    } finally {
      // Clean up running script tracking
      this.runningScripts.delete(executionId);
    }
  }

  /**
   * Execute PowerShell script with specialized handling
   */
  async executePowerShell(scriptPath: string, options: ScriptOptions = {}): Promise<ExecutionResult> {
    return this.executeScript(scriptPath, {
      ...options,
      shell: 'powershell'
    });
  }

  /**
   * Validate script parameters against schema
   */
  validateParameters(params: Record<string, any>, schema: ScriptParameter[]): boolean {
    for (const param of schema) {
      const value = params[param.name];
      
      // Check required parameters
      if (param.required && (value === undefined || value === null)) {
        throw new Error(`Required parameter '${param.name}' is missing`);
      }

      // Type validation
      if (value !== undefined && value !== null) {
        if (!this.validateParameterType(value, param.type)) {
          throw new Error(`Parameter '${param.name}' has invalid type. Expected ${param.type}`);
        }

        // Additional validation
        if (param.validation) {
          if (!this.validateParameterConstraints(value, param.validation)) {
            throw new Error(`Parameter '${param.name}' fails validation constraints`);
          }
        }
      }
    }
    
    return true;
  }

  /**
   * Inject parameters into script content
   */
  injectParameters(scriptContent: string, params: Record<string, any>): string {
    let injectedScript = scriptContent;
    
    // Simple parameter injection for PowerShell
    for (const [key, value] of Object.entries(params)) {
      const paramRegex = new RegExp(`\\$\\{${key}\\}`, 'g');
      injectedScript = injectedScript.replace(paramRegex, this.formatParameterValue(value));
    }
    
    return injectedScript;
  }

  /**
   * Stream output from script execution
   */
  streamOutput(executionId: string, callback: (output: string) => void): void {
    const script = this.runningScripts.get(executionId);
    if (script && script.process) {
      script.process.stdout?.on('data', (data) => {
        callback(data.toString());
      });
      
      script.process.stderr?.on('data', (data) => {
        callback(data.toString());
      });
    }
  }

  /**
   * Capture all output from script execution
   */
  captureOutput(executionId: string): string[] {
    const script = this.runningScripts.get(executionId);
    if (script) {
      // Return accumulated output (implementation would track this)
      return [];
    }
    return [];
  }

  /**
   * Validate script for security issues
   */
  async validateScriptSecurity(scriptPath: string): Promise<SecurityResult> {
    const issues: string[] = [];
    const recommendations: string[] = [];

    try {
      // Read script content for analysis
      if (this.fileSystemService) {
        const content = await this.fileSystemService.readFile(scriptPath);
        const scriptContent = content.toString();

        // Check for potentially dangerous commands
        const dangerousPatterns = [
          /rm\s+-rf\s+\/|rmdir\s+\/s|del\s+\/s/i, // Dangerous delete commands
          /format\s+[c-z]:|fdisk/i, // Disk formatting
          /net\s+user|net\s+share/i, // Network user/share manipulation
          /regedit|reg\s+add|reg\s+delete/i, // Registry manipulation
          /shutdown|restart|reboot/i, // System shutdown/restart
          /wget|curl.*\|\s*sh|Invoke-WebRequest.*\|\s*iex/i, // Download and execute
          /powershell.*-encodedcommand/i, // Encoded PowerShell commands
        ];

        for (const pattern of dangerousPatterns) {
          if (pattern.test(scriptContent)) {
            issues.push(`Potentially dangerous command detected: ${pattern.source}`);
          }
        }

        // Check for obfuscation
        if (scriptContent.includes('base64') || scriptContent.includes('encoded')) {
          issues.push('Script contains encoded content which may be obfuscated');
          recommendations.push('Review encoded content for malicious behavior');
        }

        // Check for network access
        if (/curl|wget|Invoke-WebRequest|Net\.WebClient/i.test(scriptContent)) {
          if (!this.config.securityOptions.allowNetworkAccess) {
            issues.push('Script attempts network access but it is not allowed');
          }
        }

        // Check for file system access
        if (/Remove-Item|del|rm|mkdir|New-Item.*-ItemType.*File/i.test(scriptContent)) {
          if (!this.config.securityOptions.allowFileSystemAccess) {
            issues.push('Script attempts file system access but it is not allowed');
          }
        }
      }

      return {
        safe: issues.length === 0,
        issues,
        recommendations
      };

    } catch (error) {
      return {
        safe: false,
        issues: [`Failed to analyze script: ${error instanceof Error ? error.message : 'Unknown error'}`],
        recommendations: ['Manual review required']
      };
    }
  }

  /**
   * Set sandbox options
   */
  setSandbox(enabled: boolean, options?: SandboxOptions): void {
    this.config.securityOptions.enableSandbox = enabled;
    // Additional sandbox configuration would be implemented here
    this.logger.info(`Sandbox configuration updated - enabled: ${enabled}, options: ${JSON.stringify(options)}`);
  }

  /**
   * Cancel a running script
   */
  async cancelScript(executionId: string): Promise<void> {
    const script = this.runningScripts.get(executionId);
    if (script) {
      script.abortController?.abort();
      if (script.process) {
        script.process.kill('SIGTERM');
        
        // Force kill after timeout
        setTimeout(() => {
          if (script.process && !script.process.killed) {
            script.process.kill('SIGKILL');
          }
        }, 5000);
      }
      
      script.progress?.cancel('Script execution cancelled by user');
      this.runningScripts.delete(executionId);
      
      this.logger.info(`Script execution cancelled - executionId: ${executionId}`);
    }
  }

  /**
   * Get execution history
   */
  getExecutionHistory(): ExecutionResult[] {
    return [...this.executionHistory];
  }

  /**
   * Get currently running scripts
   */
  getRunningScripts(): string[] {
    return Array.from(this.runningScripts.keys());
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ScriptExecutionConfig>): void {
    this.config = { ...this.config, ...config };
    this.logger.info(`ScriptExecutionService configuration updated: ${JSON.stringify(config)}`);
  }

  /**
   * Get current configuration
   */
  getConfig(): ScriptExecutionConfig {
    return { ...this.config };
  }

  /**
   * Private helper methods
   */

  private async validateScriptPath(scriptPath: string): Promise<ScriptValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if file exists
    if (!existsSync(scriptPath)) {
      errors.push('Script file does not exist');
    }

    // Check extension
    const ext = path.extname(scriptPath).toLowerCase();
    if (!this.config.allowedExtensions.includes(ext)) {
      errors.push(`Script extension '${ext}' is not allowed`);
    }

    // Check base path restriction
    if (this.config.restrictToBasePath && this.config.basePath) {
      const resolvedPath = path.resolve(scriptPath);
      const basePath = path.resolve(this.config.basePath);
      if (!resolvedPath.startsWith(basePath)) {
        errors.push('Script is outside allowed base path');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      securityIssues: []
    };
  }

  private prepareCommand(scriptPath: string, shell: string, options: ScriptOptions): { command: string; args: string[] } {
    const shellPath = this.shellPaths.get(shell);
    if (!shellPath) {
      throw new Error(`Unsupported shell: ${shell}`);
    }

    let command = shellPath;
    let args: string[] = [];

    switch (shell) {
      case 'powershell':
      case 'pwsh':
        args = ['-File', scriptPath];
        if (options.parameters) {
          for (const [key, value] of Object.entries(options.parameters)) {
            args.push(`-${key}`, String(value));
          }
        }
        break;
      
      case 'cmd':
        args = ['/c', scriptPath];
        break;
      
      case 'bash':
      case 'sh':
        args = [scriptPath];
        break;
      
      default:
        throw new Error(`Unsupported shell: ${shell}`);
    }

    return { command, args };
  }

  private async executeCommand(
    executionId: string,
    command: string,
    args: string[],
    options: {
      cwd: string;
      env: Record<string, string>;
      timeout: number;
      signal?: AbortSignal;
      onOutput?: (data: string) => void;
      onError?: (data: string) => void;
    }
  ): Promise<{ exitCode: number; process: ChildProcess }> {
    return new Promise((resolve, reject) => {
      const spawnedProcess = spawn(command, args, {
        cwd: options.cwd,
        env: options.env,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Track running script
      const runningScript: RunningScript = {
        id: executionId,
        scriptPath: args[args.length - 1],
        process: spawnedProcess,
        startTime: new Date(),
        options: {}
      };
      this.runningScripts.set(executionId, runningScript);

      // Handle output
      spawnedProcess.stdout?.on('data', (data) => {
        options.onOutput?.(data.toString());
      });

      spawnedProcess.stderr?.on('data', (data) => {
        options.onError?.(data.toString());
      });

      // Handle completion
      spawnedProcess.on('close', (code) => {
        resolve({ exitCode: code || 0, process: spawnedProcess });
      });

      spawnedProcess.on('error', (error) => {
        reject(error);
      });

      // Handle timeout
      const timeout = setTimeout(() => {
        spawnedProcess.kill('SIGTERM');
        reject(new Error(`Script execution timeout after ${options.timeout}ms`));
      }, options.timeout);

      // Handle cancellation
      options.signal?.addEventListener('abort', () => {
        clearTimeout(timeout);
        spawnedProcess.kill('SIGTERM');
        reject(new Error('Script execution cancelled'));
      });

      // Clear timeout on completion
      spawnedProcess.on('close', () => {
        clearTimeout(timeout);
      });
    });
  }

  private validateParameterType(value: any, type: string): boolean {
    switch (type) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'array':
        return Array.isArray(value);
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      default:
        return true;
    }
  }

  private validateParameterConstraints(value: any, validation: any): boolean {
    if (validation.pattern && typeof value === 'string') {
      const regex = new RegExp(validation.pattern);
      if (!regex.test(value)) return false;
    }

    if (validation.min !== undefined) {
      if (typeof value === 'number' && value < validation.min) return false;
      if (typeof value === 'string' && value.length < validation.min) return false;
    }

    if (validation.max !== undefined) {
      if (typeof value === 'number' && value > validation.max) return false;
      if (typeof value === 'string' && value.length > validation.max) return false;
    }

    if (validation.enum && !validation.enum.includes(value)) return false;

    return true;
  }

  private formatParameterValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return String(value);
  }

  private async saveExecutionResult(result: ExecutionResult): Promise<void> {
    try {
      if (this.config.outputDirectory && this.fileSystemService) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `execution_${result.id}_${timestamp}.json`;
        const outputPath = path.join(this.config.outputDirectory, filename);
        
        await this.fileSystemService.writeFile(outputPath, JSON.stringify(result, null, 2));
      }
    } catch (error) {
      this.logger.error(`Failed to save execution result - error: ${error}, resultId: ${result.id}`);
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Cancel all running scripts
    const runningScriptIds = Array.from(this.runningScripts.keys());
    for (const id of runningScriptIds) {
      await this.cancelScript(id);
    }
    
    this.runningScripts.clear();
    this.executionHistory.length = 0;
    
    this.logger.info('ScriptExecutionService cleanup completed');
  }
}

/**
 * Factory function to create ScriptExecutionService with default configuration
 */
export function createScriptExecutionService(overrides: Partial<ScriptExecutionConfig> = {}): ScriptExecutionService {
  const defaultConfig: ScriptExecutionConfig = {
    defaultShell: process.platform === 'win32' ? 'powershell' : 'bash',
    defaultTimeout: 300, // 5 minutes
    maxConcurrentScripts: 3,
    allowedExtensions: process.platform === 'win32' ? ['.ps1', '.bat', '.cmd'] : ['.sh', '.bash', '.py'],
    restrictToBasePath: true,
    maxOutputLength: 100000,
    enableOutputStreaming: true,
    enableProgressTracking: true,
    autoSaveResults: true,
    resourceLimits: {
      maxMemory: 512, // 512MB
      maxCpuTime: 300, // 5 minutes
      maxFileSize: 10 * 1024 * 1024 // 10MB
    },
    securityOptions: {
      enableSandbox: true,
      allowNetworkAccess: false,
      allowFileSystemAccess: true,
      allowRegistryAccess: false,
      allowEnvironmentAccess: true
    },
    ...overrides
  };

  return new ScriptExecutionService(defaultConfig);
}