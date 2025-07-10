/**
 * Core Services Registry Integration
 * 
 * This module registers all core services with the service registry,
 * making them available to plugins through the standardized service
 * communication pattern.
 * 
 * Services registered:
 * - FileSystemService
 * - HttpClientService  
 * - ProgressTrackingService
 * - ScriptExecutionService
 * - DocumentGeneratorService
 * - TemplateEngineService
 */

import { ServiceRegistry, ServiceDefinition } from './service-registry.js';
import { Logger } from './logger.js';
import { 
  FileSystemService, 
  HttpClientService, 
  ProgressTrackingService, 
  ScriptExecutionService,
  DocumentGenerationService,
  TemplateEngineService
} from './services/index.js';

export interface CoreServicesConfig {
  fileSystem: {
    maxFileSize: number;
    allowedExtensions: string[];
    restrictToBasePath: boolean;
    basePath?: string;
  };
  httpClient: {
    timeout: number;
    retries: number;
    retryDelay: number;
  };
  progressTracking: {
    enablePersistence: boolean;
    maxConcurrentTasks: number;
    enableRealTimeUpdates: boolean;
  };
  scriptExecution: {
    defaultShell: 'powershell' | 'pwsh' | 'cmd' | 'bash' | 'sh';
    defaultTimeout: number;
    maxConcurrentScripts: number;
    enableSandbox: boolean;
  };
}

export class CoreServicesRegistry {
  private serviceRegistry: ServiceRegistry;
  private logger: Logger;
  private services: Map<string, any> = new Map();
  private initialized = false;

  constructor(serviceRegistry: ServiceRegistry, logger: Logger) {
    this.serviceRegistry = serviceRegistry;
    this.logger = logger;
  }

  /**
   * Initialize and register all core services
   */
  async initialize(config: CoreServicesConfig): Promise<void> {
    if (this.initialized) {
      this.logger.warn('Core services already initialized');
      return;
    }

    this.logger.info('Initializing core services registry');

    try {
      // Initialize FileSystemService
      const fileSystemService = new FileSystemService({
        maxFileSize: config.fileSystem.maxFileSize,
        allowedExtensions: config.fileSystem.allowedExtensions,
        blockedExtensions: ['.exe', '.bat', '.cmd', '.com', '.scr', '.vbs'],
        maxDirectoryDepth: 10,
        basePath: config.fileSystem.basePath,
        enableSandbox: config.fileSystem.restrictToBasePath
      });

      await this.registerFileSystemService(fileSystemService);

      // Initialize HttpClientService
      const httpClientService = new HttpClientService({
        timeout: config.httpClient.timeout,
        retries: config.httpClient.retries,
        retryDelay: config.httpClient.retryDelay
      });

      await this.registerHttpClientService(httpClientService);

      // Initialize ProgressTrackingService
      const progressTrackingService = new ProgressTrackingService({
        enablePersistence: config.progressTracking.enablePersistence,
        maxConcurrentTasks: config.progressTracking.maxConcurrentTasks,
        defaultTimeout: 300000,
        enableRealTimeUpdates: config.progressTracking.enableRealTimeUpdates
      });

      await this.registerProgressTrackingService(progressTrackingService);

      // Initialize ScriptExecutionService
      const scriptExecutionService = new ScriptExecutionService({
        defaultShell: config.scriptExecution.defaultShell,
        defaultTimeout: config.scriptExecution.defaultTimeout,
        maxConcurrentScripts: config.scriptExecution.maxConcurrentScripts,
        allowedExtensions: process.platform === 'win32' ? ['.ps1', '.bat', '.cmd'] : ['.sh', '.bash', '.py'],
        restrictToBasePath: true,
        maxOutputLength: 100000,
        enableOutputStreaming: true,
        enableProgressTracking: true,
        autoSaveResults: true,
        resourceLimits: {
          maxMemory: 512,
          maxCpuTime: 300,
          maxFileSize: 10 * 1024 * 1024
        },
        securityOptions: {
          enableSandbox: config.scriptExecution.enableSandbox,
          allowNetworkAccess: false,
          allowFileSystemAccess: true,
          allowRegistryAccess: false,
          allowEnvironmentAccess: true
        }
      });

      // Set up service dependencies
      scriptExecutionService.setFileSystemService(fileSystemService);
      scriptExecutionService.setProgressService(progressTrackingService);

      await this.registerScriptExecutionService(scriptExecutionService);

      // Initialize TemplateEngineService
      const templateEngineService = new TemplateEngineService();
      await this.registerTemplateEngineService(templateEngineService);

      // Initialize DocumentGeneratorService
      const documentGeneratorService = new DocumentGenerationService(httpClientService, templateEngineService);
      await this.registerDocumentGeneratorService(documentGeneratorService);

      this.initialized = true;
      this.logger.info('Core services registry initialized successfully');

    } catch (error) {
      this.logger.error(`Failed to initialize core services: ${error}`);
      throw error;
    }
  }

  /**
   * Register FileSystemService
   */
  private async registerFileSystemService(service: FileSystemService): Promise<void> {
    const serviceDefinition: ServiceDefinition = {
      name: 'filesystem',
      version: '1.0.0',
      description: 'Core file system operations with security validation',
      methods: {
        readFile: {
          description: 'Read file contents',
          parameters: {
            path: 'string',
            options: 'object?'
          },
          returnType: 'string | Buffer',
          requiresPermission: 'filesystem:read'
        },
        writeFile: {
          description: 'Write file contents',
          parameters: {
            path: 'string',
            content: 'string | Buffer',
            options: 'object?'
          },
          returnType: 'void',
          requiresPermission: 'filesystem:write'
        },
        deleteFile: {
          description: 'Delete a file',
          parameters: {
            path: 'string'
          },
          returnType: 'void',
          requiresPermission: 'filesystem:write'
        },
        createDirectory: {
          description: 'Create directory',
          parameters: {
            path: 'string',
            options: 'object?'
          },
          returnType: 'void',
          requiresPermission: 'filesystem:write'
        },
        readDirectory: {
          description: 'Read directory contents',
          parameters: {
            path: 'string',
            options: 'object?'
          },
          returnType: 'DirectoryEntry[]',
          requiresPermission: 'filesystem:read'
        },
        scanDirectory: {
          description: 'Scan directory tree',
          parameters: {
            path: 'string',
            filter: 'object?'
          },
          returnType: 'FileTreeNode',
          requiresPermission: 'filesystem:read'
        },
        exists: {
          description: 'Check if path exists',
          parameters: {
            path: 'string'
          },
          returnType: 'boolean',
          requiresPermission: 'filesystem:read'
        },
        stat: {
          description: 'Get file/directory statistics',
          parameters: {
            path: 'string'
          },
          returnType: 'FileStats',
          requiresPermission: 'filesystem:read'
        },
        readFiles: {
          description: 'Read multiple files',
          parameters: {
            paths: 'string[]',
            options: 'object?',
            progressCallback: 'function?'
          },
          returnType: 'FileResult[]',
          requiresPermission: 'filesystem:read'
        },
        writeFiles: {
          description: 'Write multiple files',
          parameters: {
            files: 'object[]',
            progressCallback: 'function?'
          },
          returnType: 'void',
          requiresPermission: 'filesystem:write'
        }
      },
      permissions: ['filesystem:read', 'filesystem:write']
    };

    await this.serviceRegistry.registerService(
      'core',
      serviceDefinition,
      service,
      ['filesystem:read', 'filesystem:write']
    );

    this.services.set('filesystem', service);
    this.logger.info('FileSystemService registered');
  }

  /**
   * Register HttpClientService
   */
  private async registerHttpClientService(service: HttpClientService): Promise<void> {
    const serviceDefinition: ServiceDefinition = {
      name: 'http-client',
      version: '1.0.0',
      description: 'HTTP client with authentication, retry logic, and progress tracking',
      methods: {
        get: {
          description: 'HTTP GET request',
          parameters: {
            url: 'string',
            config: 'object?'
          },
          returnType: 'any',
          requiresPermission: 'network:http'
        },
        post: {
          description: 'HTTP POST request',
          parameters: {
            url: 'string',
            data: 'any?',
            config: 'object?'
          },
          returnType: 'any',
          requiresPermission: 'network:http'
        },
        put: {
          description: 'HTTP PUT request',
          parameters: {
            url: 'string',
            data: 'any?',
            config: 'object?'
          },
          returnType: 'any',
          requiresPermission: 'network:http'
        },
        delete: {
          description: 'HTTP DELETE request',
          parameters: {
            url: 'string',
            config: 'object?'
          },
          returnType: 'any',
          requiresPermission: 'network:http'
        },
        patch: {
          description: 'HTTP PATCH request',
          parameters: {
            url: 'string',
            data: 'any?',
            config: 'object?'
          },
          returnType: 'any',
          requiresPermission: 'network:http'
        },
        head: {
          description: 'HTTP HEAD request',
          parameters: {
            url: 'string',
            config: 'object?'
          },
          returnType: 'Response',
          requiresPermission: 'network:http'
        },
        options: {
          description: 'HTTP OPTIONS request',
          parameters: {
            url: 'string',
            config: 'object?'
          },
          returnType: 'Response',
          requiresPermission: 'network:http'
        },
        setAuthentication: {
          description: 'Set authentication configuration',
          parameters: {
            type: 'string',
            credentials: 'any'
          },
          returnType: 'void'
        },
        setDefaults: {
          description: 'Set default configuration',
          parameters: {
            config: 'object'
          },
          returnType: 'void'
        },
        configureCaching: {
          description: 'Configure response caching',
          parameters: {
            config: 'object'
          },
          returnType: 'void'
        },
        clearCache: {
          description: 'Clear response cache',
          parameters: {},
          returnType: 'void'
        }
      },
      permissions: ['network:http']
    };

    await this.serviceRegistry.registerService(
      'core',
      serviceDefinition,
      service,
      ['network:http']
    );

    this.services.set('http-client', service);
    this.logger.info('HttpClientService registered');
  }

  /**
   * Register ProgressTrackingService
   */
  private async registerProgressTrackingService(service: ProgressTrackingService): Promise<void> {
    const serviceDefinition: ServiceDefinition = {
      name: 'progress-tracking',
      version: '1.0.0',
      description: 'Unified progress tracking and reporting system',
      methods: {
        createProgress: {
          description: 'Create a new progress tracker',
          parameters: {
            task: 'object'
          },
          returnType: 'ProgressTracker'
        },
        getProgress: {
          description: 'Get progress state for a task',
          parameters: {
            taskId: 'string'
          },
          returnType: 'ProgressState | null'
        },
        getAllProgress: {
          description: 'Get all active progress states',
          parameters: {},
          returnType: 'ProgressState[]'
        },
        getProgressHistory: {
          description: 'Get progress history',
          parameters: {},
          returnType: 'ProgressState[]'
        },
        cancelProgress: {
          description: 'Cancel a task',
          parameters: {
            taskId: 'string',
            reason: 'string?'
          },
          returnType: 'void'
        },
        cancelAllProgress: {
          description: 'Cancel all active tasks',
          parameters: {
            reason: 'string?'
          },
          returnType: 'void'
        },
        onProgress: {
          description: 'Register progress callback',
          parameters: {
            taskId: 'string',
            callback: 'function'
          },
          returnType: 'void'
        },
        onAnyProgress: {
          description: 'Register global progress callback',
          parameters: {
            callback: 'function'
          },
          returnType: 'void'
        }
      },
      permissions: []
    };

    await this.serviceRegistry.registerService(
      'core',
      serviceDefinition,
      service,
      []
    );

    this.services.set('progress-tracking', service);
    this.logger.info('ProgressTrackingService registered');
  }

  /**
   * Register ScriptExecutionService
   */
  private async registerScriptExecutionService(service: ScriptExecutionService): Promise<void> {
    const serviceDefinition: ServiceDefinition = {
      name: 'script-execution',
      version: '1.0.0',
      description: 'Secure script execution with progress tracking and sandboxing',
      methods: {
        executeScript: {
          description: 'Execute a script file',
          parameters: {
            scriptPath: 'string',
            options: 'object?'
          },
          returnType: 'ExecutionResult',
          requiresPermission: 'system:exec'
        },
        executePowerShell: {
          description: 'Execute PowerShell script',
          parameters: {
            scriptPath: 'string',
            options: 'object?'
          },
          returnType: 'ExecutionResult',
          requiresPermission: 'system:exec'
        },
        validateParameters: {
          description: 'Validate script parameters',
          parameters: {
            params: 'object',
            schema: 'object[]'
          },
          returnType: 'boolean'
        },
        injectParameters: {
          description: 'Inject parameters into script content',
          parameters: {
            scriptContent: 'string',
            params: 'object'
          },
          returnType: 'string'
        },
        validateScriptSecurity: {
          description: 'Validate script for security issues',
          parameters: {
            scriptPath: 'string'
          },
          returnType: 'SecurityResult'
        },
        cancelScript: {
          description: 'Cancel a running script',
          parameters: {
            executionId: 'string'
          },
          returnType: 'void',
          requiresPermission: 'system:exec'
        },
        getExecutionHistory: {
          description: 'Get script execution history',
          parameters: {},
          returnType: 'ExecutionResult[]'
        },
        getRunningScripts: {
          description: 'Get currently running scripts',
          parameters: {},
          returnType: 'string[]'
        },
        setSandbox: {
          description: 'Configure script sandbox',
          parameters: {
            enabled: 'boolean',
            options: 'object?'
          },
          returnType: 'void',
          requiresPermission: 'system:exec'
        }
      },
      permissions: ['system:exec', 'filesystem:read', 'filesystem:write']
    };

    await this.serviceRegistry.registerService(
      'core',
      serviceDefinition,
      service,
      ['system:exec', 'filesystem:read', 'filesystem:write']
    );

    this.services.set('script-execution', service);
    this.logger.info('ScriptExecutionService registered');
  }

  /**
   * Register DocumentGeneratorService
   */
  private async registerDocumentGeneratorService(service: DocumentGenerationService): Promise<void> {
    const serviceDefinition: ServiceDefinition = {
      name: 'document-generator',
      version: '1.0.0',
      description: 'Document generation from templates and data',
      methods: {
        generateDocument: {
          description: 'Generate document from template',
          parameters: {
            templateContent: 'string',
            data: 'object',
            options: 'object?'
          },
          returnType: 'string'
        },
        generateFromFile: {
          description: 'Generate document from template file',
          parameters: {
            templatePath: 'string',
            data: 'object',
            outputPath: 'string?',
            options: 'object?'
          },
          returnType: 'string'
        },
        validateTemplate: {
          description: 'Validate template syntax',
          parameters: {
            templateContent: 'string'
          },
          returnType: 'boolean'
        },
        getTemplateVariables: {
          description: 'Extract variables from template',
          parameters: {
            templateContent: 'string'
          },
          returnType: 'string[]'
        }
      },
      permissions: ['filesystem:read', 'filesystem:write']
    };

    await this.serviceRegistry.registerService(
      'core',
      serviceDefinition,
      service,
      ['filesystem:read', 'filesystem:write']
    );

    this.services.set('document-generator', service);
    this.logger.info('DocumentGeneratorService registered');
  }

  /**
   * Register TemplateEngineService
   */
  private async registerTemplateEngineService(service: TemplateEngineService): Promise<void> {
    const serviceDefinition: ServiceDefinition = {
      name: 'template-engine',
      version: '1.0.0',
      description: 'Template processing and rendering engine',
      methods: {
        compile: {
          description: 'Compile template to function',
          parameters: {
            template: 'string',
            options: 'object?'
          },
          returnType: 'function'
        },
        render: {
          description: 'Render template with data',
          parameters: {
            template: 'string',
            data: 'object',
            options: 'object?'
          },
          returnType: 'string'
        },
        registerHelper: {
          description: 'Register template helper',
          parameters: {
            name: 'string',
            helper: 'function'
          },
          returnType: 'void'
        },
        registerPartial: {
          description: 'Register template partial',
          parameters: {
            name: 'string',
            partial: 'string'
          },
          returnType: 'void'
        },
        unregisterHelper: {
          description: 'Unregister template helper',
          parameters: {
            name: 'string'
          },
          returnType: 'void'
        },
        unregisterPartial: {
          description: 'Unregister template partial',
          parameters: {
            name: 'string'
          },
          returnType: 'void'
        },
        validate: {
          description: 'Validate template syntax',
          parameters: {
            template: 'string'
          },
          returnType: 'boolean'
        }
      },
      permissions: []
    };

    await this.serviceRegistry.registerService(
      'core',
      serviceDefinition,
      service,
      []
    );

    this.services.set('template-engine', service);
    this.logger.info('TemplateEngineService registered');
  }

  /**
   * Get a registered service instance
   */
  getService(serviceName: string): any {
    return this.services.get(serviceName);
  }

  /**
   * Get all registered services
   */
  getAllServices(): Map<string, any> {
    return new Map(this.services);
  }

  /**
   * Check if services are initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Cleanup all services
   */
  async cleanup(): Promise<void> {
    this.logger.info('Cleaning up core services');

    // Cleanup services that support it
    for (const [name, service] of this.services) {
      if (service && typeof service.cleanup === 'function') {
        try {
          await service.cleanup();
          this.logger.info(`Cleaned up ${name} service`);
        } catch (error) {
          this.logger.error(`Error cleaning up ${name} service: ${error}`);
        }
      }
    }

    this.services.clear();
    this.initialized = false;
    this.logger.info('Core services cleanup completed');
  }

  /**
   * Update service configuration
   */
  async updateServiceConfig(serviceName: string, config: any): Promise<void> {
    const service = this.services.get(serviceName);
    if (service && typeof service.updateConfig === 'function') {
      service.updateConfig(config);
      this.logger.info(`Updated configuration for ${serviceName} service`);
    } else {
      throw new Error(`Service ${serviceName} not found or does not support configuration updates`);
    }
  }
}

/**
 * Factory function to create default core services configuration
 */
export function createDefaultCoreServicesConfig(): CoreServicesConfig {
  return {
    fileSystem: {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedExtensions: [], // Empty means all allowed
      restrictToBasePath: true,
      basePath: undefined // Will be set by application
    },
    httpClient: {
      timeout: 30000, // 30 seconds
      retries: 3,
      retryDelay: 1000 // 1 second
    },
    progressTracking: {
      enablePersistence: true,
      maxConcurrentTasks: 50,
      enableRealTimeUpdates: true
    },
    scriptExecution: {
      defaultShell: process.platform === 'win32' ? 'powershell' : 'bash',
      defaultTimeout: 300, // 5 minutes
      maxConcurrentScripts: 3,
      enableSandbox: true
    }
  };
}