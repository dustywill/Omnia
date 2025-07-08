# Phase 2: Plugin System Unification - Step-by-Step Task List

## Overview

This document provides a detailed, actionable task list for completing Phase 2 of the Node-ttCommander to Omnia migration. Phase 2 focuses on creating a unified plugin architecture that supports both HTML-based and React-based plugins while maintaining backward compatibility and establishing the foundation for future plugin ecosystem growth.

## Prerequisites

### Phase 1 Completion Validation
- [ ] **Design System Integration Complete**
  - ttCommander theme fully integrated and functional
  - All components using ttCommander variables
  - Theme switching working correctly

- [ ] **Configuration System Working**
  - JSONEditor React wrapper functional
  - Schema compatibility layer operational
  - Configuration state management implemented

- [ ] **Basic Plugin Compatibility**
  - HTML plugin loader implemented
  - Legacy plugin manifest support working
  - Plugin migration scripts functional

- [ ] **Testing Infrastructure Ready**
  - Test suite consolidated and passing
  - Visual regression testing working
  - Performance benchmarks established

## Week 1-2: Unified Plugin Architecture

### Task 2.1: Enhanced Plugin Manager Implementation

#### Step 2.1.1: Create Unified Plugin Manager Class
- [ ] **Implement Core Plugin Manager**
  ```typescript
  // src/core/unified-plugin-manager.ts
  export enum PluginType {
    LEGACY_HTML = 'legacy-html',
    REACT_SIMPLE = 'simple',
    REACT_CONFIGURED = 'configured', 
    REACT_ADVANCED = 'advanced',
    HYBRID = 'hybrid'
  }

  export interface UnifiedPluginManifest {
    id: string;
    name: string;
    version: string;
    type: PluginType;
    main?: string;           // JavaScript entry point
    ui?: string;             // HTML UI file (legacy)
    component?: string;      // React component (modern)
    permissions?: string[];  // Required permissions
    services?: string[];     // Required services
    dependencies?: string[]; // Plugin dependencies
    schema?: any;           // Configuration schema
    description?: string;
    author?: string;
    keywords?: string[];
    repository?: string;
  }

  export interface LoadedPlugin {
    id: string;
    manifest: UnifiedPluginManifest;
    component?: React.ComponentType<any>;
    module?: any;
    status: PluginStatus;
    loadedAt?: Date;
    error?: string;
    services: Map<string, any>;
  }

  export enum PluginStatus {
    DISCOVERED = 'discovered',
    LOADING = 'loading',
    LOADED = 'loaded',
    ACTIVE = 'active',
    ERROR = 'error',
    DISABLED = 'disabled'
  }

  export class UnifiedPluginManager extends EnhancedPluginManager {
    private plugins = new Map<string, LoadedPlugin>();
    private serviceRegistry: ServiceRegistry;
    private permissionManager: PermissionManager;
    private dependencyResolver: DependencyResolver;
    
    constructor(options: PluginManagerOptions) {
      super(options);
      this.serviceRegistry = new ServiceRegistry();
      this.permissionManager = new PermissionManager();
      this.dependencyResolver = new DependencyResolver();
    }

    async loadPlugin(manifest: UnifiedPluginManifest): Promise<LoadedPlugin> {
      try {
        // Validate manifest
        this.validateManifest(manifest);
        
        // Check dependencies
        await this.dependencyResolver.resolveDependencies(manifest);
        
        // Validate permissions
        await this.permissionManager.validatePermissions(manifest);
        
        // Get appropriate loader
        const loader = this.getLoaderForType(manifest.type);
        
        // Load plugin
        const plugin = await loader.load(manifest);
        
        // Apply security sandbox
        const sandboxedPlugin = await this.applySandbox(plugin, manifest);
        
        // Register plugin services
        await this.registerPluginServices(sandboxedPlugin, manifest);
        
        // Update plugin status
        sandboxedPlugin.status = PluginStatus.LOADED;
        sandboxedPlugin.loadedAt = new Date();
        
        this.plugins.set(manifest.id, sandboxedPlugin);
        
        // Emit load event
        this.eventBus.publish('plugin:loaded', { 
          pluginId: manifest.id, 
          plugin: sandboxedPlugin 
        });
        
        return sandboxedPlugin;
        
      } catch (error) {
        const failedPlugin: LoadedPlugin = {
          id: manifest.id,
          manifest,
          status: PluginStatus.ERROR,
          error: error instanceof Error ? error.message : String(error),
          services: new Map(),
        };
        
        this.plugins.set(manifest.id, failedPlugin);
        
        this.eventBus.publish('plugin:error', { 
          pluginId: manifest.id, 
          error: failedPlugin.error 
        });
        
        throw error;
      }
    }
    
    private getLoaderForType(type: PluginType): PluginLoader {
      const loaders = {
        [PluginType.LEGACY_HTML]: new HTMLPluginLoader(this.serviceRegistry),
        [PluginType.REACT_SIMPLE]: new ReactSimpleLoader(this.serviceRegistry),
        [PluginType.REACT_CONFIGURED]: new ReactConfiguredLoader(this.serviceRegistry),
        [PluginType.REACT_ADVANCED]: new ReactAdvancedLoader(this.serviceRegistry),
        [PluginType.HYBRID]: new HybridPluginLoader(this.serviceRegistry),
      };
      
      const loader = loaders[type];
      if (!loader) {
        throw new Error(`No loader available for plugin type: ${type}`);
      }
      
      return loader;
    }
  }
  ```

**Acceptance Criteria:**
- UnifiedPluginManager class implemented with all plugin types
- Plugin loading with error handling and status tracking
- Event-driven plugin lifecycle management
- Security sandbox and permission validation

#### Step 2.1.2: Implement Plugin Type System
- [ ] **Create Type-Specific Loaders**

  **HTML Plugin Loader Enhancement:**
  ```typescript
  // src/core/loaders/html-plugin-loader.ts
  export class HTMLPluginLoader implements PluginLoader {
    constructor(private serviceRegistry: ServiceRegistry) {}

    async load(manifest: UnifiedPluginManifest): Promise<LoadedPlugin> {
      if (!manifest.ui) {
        throw new Error('HTML plugin requires ui field in manifest');
      }

      const htmlContent = await this.loadHTMLContent(manifest.ui);
      const scriptModule = manifest.main ? await this.loadScriptModule(manifest.main) : null;
      
      // Create React wrapper with enhanced security
      const ReactWrapper = this.createSecureReactWrapper(htmlContent, scriptModule, manifest);
      
      return {
        id: manifest.id,
        manifest,
        component: ReactWrapper,
        module: scriptModule,
        status: PluginStatus.LOADED,
        services: new Map(),
      };
    }

    private createSecureReactWrapper(
      htmlContent: string,
      scriptModule: any,
      manifest: UnifiedPluginManifest
    ): React.ComponentType<any> {
      return function HTMLPluginWrapper(props: any) {
        const containerRef = useRef<HTMLDivElement>(null);
        const [isInitialized, setIsInitialized] = useState(false);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          if (containerRef.current && !isInitialized) {
            try {
              // Sanitize HTML content with strict security
              const sanitizedHTML = DOMPurify.sanitize(htmlContent, {
                ALLOWED_TAGS: [
                  'div', 'span', 'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
                  'button', 'input', 'select', 'textarea', 'form', 'label',
                  'table', 'thead', 'tbody', 'tr', 'td', 'th',
                  'ul', 'ol', 'li', 'a', 'img', 'br', 'hr'
                ],
                ALLOWED_ATTR: [
                  'class', 'id', 'data-*', 'type', 'value', 'placeholder',
                  'disabled', 'readonly', 'href', 'src', 'alt', 'title'
                ],
                FORBID_ATTR: ['onclick', 'onload', 'onerror', 'onmouseover'],
              });

              containerRef.current.innerHTML = sanitizedHTML;

              // Create secure plugin context
              const pluginContext = {
                container: containerRef.current,
                config: props.config,
                pluginId: manifest.id,
                services: this.createServiceProxy(manifest.permissions || []),
                events: this.createEventProxy(manifest.id),
              };

              // Initialize plugin with error boundary
              if (scriptModule?.activate) {
                scriptModule.activate(pluginContext);
              }

              setIsInitialized(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Plugin initialization failed');
            }
          }

          return () => {
            if (scriptModule?.deactivate) {
              try {
                scriptModule.deactivate();
              } catch (err) {
                console.error(`Plugin deactivation failed for ${manifest.id}:`, err);
              }
            }
          };
        }, [isInitialized]);

        if (error) {
          return (
            <div className="plugin-error">
              <h3>Plugin Error</h3>
              <p>{error}</p>
            </div>
          );
        }

        return (
          <div 
            ref={containerRef} 
            className="html-plugin-wrapper"
            data-plugin-id={manifest.id}
            data-plugin-type="legacy-html"
          />
        );
      };
    }
  }
  ```

  **React Plugin Loaders:**
  ```typescript
  // src/core/loaders/react-plugin-loader.ts
  export class ReactSimpleLoader implements PluginLoader {
    async load(manifest: UnifiedPluginManifest): Promise<LoadedPlugin> {
      const componentPath = manifest.component || manifest.main;
      if (!componentPath) {
        throw new Error('React plugin requires component or main field');
      }

      // Dynamic import with error handling
      const module = await this.loadReactModule(componentPath);
      const Component = module.default || module[manifest.name];
      
      if (!Component || typeof Component !== 'function') {
        throw new Error('Invalid React component export');
      }

      return {
        id: manifest.id,
        manifest,
        component: Component,
        module,
        status: PluginStatus.LOADED,
        services: new Map(),
      };
    }

    private async loadReactModule(componentPath: string): Promise<any> {
      try {
        // Try compiled JS first (production)
        return await import(`../../../dist/plugins/${componentPath}`);
      } catch {
        try {
          // Fall back to TypeScript source (development)
          return await import(`../../plugins/${componentPath}`);
        } catch (error) {
          throw new Error(`Failed to load React component: ${componentPath}`);
        }
      }
    }
  }
  ```

**Acceptance Criteria:**
- HTML plugin loader with enhanced security implemented
- React plugin loaders for all React plugin types
- Error handling and recovery for plugin loading failures
- Secure plugin context creation with permission validation

#### Step 2.1.3: Create Plugin Registry System
- [ ] **Implement Centralized Plugin Registry**
  ```typescript
  // src/core/plugin-registry.ts
  export interface PluginRegistryEntry {
    manifest: UnifiedPluginManifest;
    discoveredAt: Date;
    lastUpdated: Date;
    status: PluginStatus;
    dependencies: string[];
    dependents: string[];
    compatibilityInfo: CompatibilityInfo;
  }

  export interface CompatibilityInfo {
    minimumVersion: string;
    maximumVersion: string;
    engineVersion: string;
    tested: boolean;
    issues: string[];
  }

  export class PluginRegistry {
    private registry = new Map<string, PluginRegistryEntry>();
    private dependencyGraph = new Map<string, Set<string>>();
    private eventBus: EventBus;

    constructor(eventBus: EventBus) {
      this.eventBus = eventBus;
    }

    registerPlugin(manifest: UnifiedPluginManifest): PluginRegistryEntry {
      const entry: PluginRegistryEntry = {
        manifest,
        discoveredAt: new Date(),
        lastUpdated: new Date(),
        status: PluginStatus.DISCOVERED,
        dependencies: manifest.dependencies || [],
        dependents: [],
        compatibilityInfo: this.checkCompatibility(manifest),
      };

      this.registry.set(manifest.id, entry);
      this.updateDependencyGraph(manifest);
      
      this.eventBus.publish('plugin:registered', { 
        pluginId: manifest.id, 
        entry 
      });

      return entry;
    }

    getPlugin(pluginId: string): PluginRegistryEntry | undefined {
      return this.registry.get(pluginId);
    }

    getAllPlugins(): PluginRegistryEntry[] {
      return Array.from(this.registry.values());
    }

    getPluginsByType(type: PluginType): PluginRegistryEntry[] {
      return Array.from(this.registry.values())
        .filter(entry => entry.manifest.type === type);
    }

    resolveDependencies(pluginId: string): string[] {
      const resolved: string[] = [];
      const visited = new Set<string>();
      
      this.resolveDependenciesRecursive(pluginId, resolved, visited);
      
      return resolved;
    }

    private resolveDependenciesRecursive(
      pluginId: string, 
      resolved: string[], 
      visited: Set<string>
    ): void {
      if (visited.has(pluginId)) {
        throw new Error(`Circular dependency detected: ${pluginId}`);
      }

      visited.add(pluginId);
      const entry = this.registry.get(pluginId);
      
      if (entry) {
        for (const dep of entry.dependencies) {
          this.resolveDependenciesRecursive(dep, resolved, visited);
        }
        
        if (!resolved.includes(pluginId)) {
          resolved.push(pluginId);
        }
      }

      visited.delete(pluginId);
    }

    checkVersionCompatibility(pluginId: string, version: string): boolean {
      const entry = this.registry.get(pluginId);
      if (!entry) return false;

      const { minimumVersion, maximumVersion } = entry.compatibilityInfo;
      
      return this.compareVersions(version, minimumVersion) >= 0 &&
             this.compareVersions(version, maximumVersion) <= 0;
    }

    private compareVersions(a: string, b: string): number {
      const partsA = a.split('.').map(Number);
      const partsB = b.split('.').map(Number);
      
      for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
        const partA = partsA[i] || 0;
        const partB = partsB[i] || 0;
        
        if (partA < partB) return -1;
        if (partA > partB) return 1;
      }
      
      return 0;
    }
  }
  ```

**Acceptance Criteria:**
- Centralized plugin registry with dependency tracking
- Version compatibility checking system
- Dependency resolution with circular dependency detection
- Plugin metadata management and indexing

### Task 2.2: Plugin Manifest Evolution

#### Step 2.2.1: Enhanced Manifest Schema
- [ ] **Create Extended Manifest Schema**
  ```typescript
  // src/lib/schemas/unified-plugin-manifest.ts
  import { z } from 'zod';

  export const PluginTypeSchema = z.enum([
    'legacy-html',
    'simple', 
    'configured',
    'advanced',
    'hybrid'
  ]);

  export const PermissionSchema = z.enum([
    'ui:render',
    'config:read',
    'config:write',
    'file:read',
    'file:write',
    'network:request',
    'system:execute',
    'plugin:communicate',
    'service:access'
  ]);

  export const UnifiedPluginManifestSchema = z.object({
    // Core identification
    id: z.string().min(1).regex(/^[a-z0-9-_.]+$/),
    name: z.string().min(1),
    version: z.string().regex(/^\d+\.\d+\.\d+(-[a-zA-Z0-9-]+)?$/),
    type: PluginTypeSchema,
    
    // Entry points
    main: z.string().optional(),
    ui: z.string().optional(),
    component: z.string().optional(),
    
    // Metadata
    description: z.string().optional(),
    author: z.string().optional(),
    license: z.string().optional(),
    repository: z.string().url().optional(),
    homepage: z.string().url().optional(),
    keywords: z.array(z.string()).optional(),
    
    // Dependencies and compatibility
    dependencies: z.array(z.string()).optional(),
    peerDependencies: z.array(z.string()).optional(),
    engineVersion: z.string().optional(),
    
    // Security and permissions
    permissions: z.array(PermissionSchema).optional(),
    sandbox: z.object({
      isolated: z.boolean().default(true),
      allowedDomains: z.array(z.string()).optional(),
      maxMemory: z.number().optional(),
      maxCpuTime: z.number().optional(),
    }).optional(),
    
    // Configuration
    schema: z.any().optional(),
    defaultConfig: z.any().optional(),
    
    // Services
    services: z.object({
      provides: z.array(z.string()).optional(),
      requires: z.array(z.string()).optional(),
    }).optional(),
    
    // UI Integration
    ui_integration: z.object({
      menu: z.object({
        label: z.string(),
        icon: z.string().optional(),
        category: z.string().optional(),
      }).optional(),
      toolbar: z.object({
        position: z.enum(['left', 'right', 'center']),
        priority: z.number().optional(),
      }).optional(),
    }).optional(),
    
    // Development
    development: z.object({
      hot_reload: z.boolean().default(false),
      debug: z.boolean().default(false),
    }).optional(),
  });

  export type UnifiedPluginManifest = z.infer<typeof UnifiedPluginManifestSchema>;
  ```

- [ ] **Implement Manifest Validation and Migration**
  ```typescript
  // src/core/manifest-validator.ts
  export class ManifestValidator {
    private schema = UnifiedPluginManifestSchema;

    validateManifest(manifest: any): ValidationResult {
      try {
        const validatedManifest = this.schema.parse(manifest);
        return {
          isValid: true,
          manifest: validatedManifest,
          errors: [],
          warnings: this.generateWarnings(validatedManifest),
        };
      } catch (error) {
        if (error instanceof z.ZodError) {
          return {
            isValid: false,
            errors: error.errors.map(err => ({
              path: err.path.join('.'),
              message: err.message,
              code: err.code,
            })),
            warnings: [],
          };
        }
        throw error;
      }
    }

    migrateLegacyManifest(legacyManifest: any): UnifiedPluginManifest {
      const migratedManifest: any = {
        id: legacyManifest.id,
        name: legacyManifest.name,
        version: legacyManifest.version || '1.0.0',
        type: this.detectPluginType(legacyManifest),
        description: legacyManifest.description,
        author: legacyManifest.author,
      };

      // Copy entry points
      if (legacyManifest.main) migratedManifest.main = legacyManifest.main;
      if (legacyManifest.ui) migratedManifest.ui = legacyManifest.ui;

      // Migrate permissions
      migratedManifest.permissions = this.migratePermissions(legacyManifest);

      // Set default sandbox for legacy plugins
      migratedManifest.sandbox = {
        isolated: true,
        maxMemory: 50 * 1024 * 1024, // 50MB
        maxCpuTime: 5000, // 5 seconds
      };

      return this.schema.parse(migratedManifest);
    }

    private detectPluginType(manifest: any): PluginType {
      if (manifest.type) return manifest.type;
      
      if (manifest.ui && !manifest.component) {
        return PluginType.LEGACY_HTML;
      }
      
      if (manifest.component && manifest.schema) {
        return PluginType.REACT_CONFIGURED;
      }
      
      if (manifest.component) {
        return PluginType.REACT_SIMPLE;
      }
      
      return PluginType.LEGACY_HTML;
    }
  }
  ```

**Acceptance Criteria:**
- Extended manifest schema with all required fields
- Manifest validation with detailed error reporting
- Legacy manifest migration functionality
- Plugin type detection and classification

#### Step 2.2.2: Plugin Permissions System
- [ ] **Implement Granular Permission System**
  ```typescript
  // src/core/permission-manager.ts
  export interface PermissionDescriptor {
    name: string;
    description: string;
    category: 'ui' | 'data' | 'system' | 'network' | 'plugin';
    risk: 'low' | 'medium' | 'high' | 'critical';
    dependencies: string[];
  }

  export class PermissionManager {
    private permissions = new Map<string, PermissionDescriptor>();
    private pluginPermissions = new Map<string, Set<string>>();

    constructor() {
      this.initializeStandardPermissions();
    }

    private initializeStandardPermissions(): void {
      const standardPermissions: PermissionDescriptor[] = [
        {
          name: 'ui:render',
          description: 'Render UI components',
          category: 'ui',
          risk: 'low',
          dependencies: [],
        },
        {
          name: 'config:read',
          description: 'Read configuration data',
          category: 'data',
          risk: 'low',
          dependencies: [],
        },
        {
          name: 'config:write',
          description: 'Modify configuration data',
          category: 'data',
          risk: 'medium',
          dependencies: ['config:read'],
        },
        {
          name: 'file:read',
          description: 'Read files from disk',
          category: 'system',
          risk: 'medium',
          dependencies: [],
        },
        {
          name: 'file:write',
          description: 'Write files to disk',
          category: 'system',
          risk: 'high',
          dependencies: ['file:read'],
        },
        {
          name: 'network:request',
          description: 'Make network requests',
          category: 'network',
          risk: 'medium',
          dependencies: [],
        },
        {
          name: 'system:execute',
          description: 'Execute system commands',
          category: 'system',
          risk: 'critical',
          dependencies: [],
        },
        {
          name: 'plugin:communicate',
          description: 'Communicate with other plugins',
          category: 'plugin',
          risk: 'medium',
          dependencies: [],
        },
        {
          name: 'service:access',
          description: 'Access system services',
          category: 'system',
          risk: 'medium',
          dependencies: [],
        },
      ];

      standardPermissions.forEach(perm => {
        this.permissions.set(perm.name, perm);
      });
    }

    async validatePermissions(manifest: UnifiedPluginManifest): Promise<void> {
      const requestedPermissions = manifest.permissions || [];
      const errors: string[] = [];

      for (const permission of requestedPermissions) {
        if (!this.permissions.has(permission)) {
          errors.push(`Unknown permission: ${permission}`);
          continue;
        }

        const permDescriptor = this.permissions.get(permission)!;
        
        // Check if plugin has required dependencies
        for (const dependency of permDescriptor.dependencies) {
          if (!requestedPermissions.includes(dependency)) {
            errors.push(`Permission ${permission} requires ${dependency}`);
          }
        }
      }

      if (errors.length > 0) {
        throw new Error(`Permission validation failed: ${errors.join(', ')}`);
      }

      this.pluginPermissions.set(manifest.id, new Set(requestedPermissions));
    }

    hasPermission(pluginId: string, permission: string): boolean {
      const pluginPerms = this.pluginPermissions.get(pluginId);
      return pluginPerms ? pluginPerms.has(permission) : false;
    }

    createPermissionProxy<T>(
      pluginId: string, 
      target: T, 
      requiredPermission: string
    ): T {
      return new Proxy(target as any, {
        get: (obj, prop) => {
          if (!this.hasPermission(pluginId, requiredPermission)) {
            throw new Error(
              `Plugin ${pluginId} lacks permission: ${requiredPermission}`
            );
          }
          return obj[prop];
        },
      });
    }
  }
  ```

**Acceptance Criteria:**
- Granular permission system with standard permissions
- Permission validation during plugin loading
- Permission proxy for secure API access
- Risk-based permission categorization

## Week 3-4: Plugin Loading and Execution

### Task 2.3: Multi-Type Plugin Loader Enhancement

#### Step 2.3.1: Enhance HTML Plugin Loader
- [ ] **Implement Advanced HTML Plugin Security**
  ```typescript
  // src/core/loaders/enhanced-html-plugin-loader.ts
  export class EnhancedHTMLPluginLoader extends HTMLPluginLoader {
    private securityValidator: SecurityValidator;
    private styleIsolator: StyleIsolator;

    constructor(
      serviceRegistry: ServiceRegistry,
      permissionManager: PermissionManager
    ) {
      super(serviceRegistry);
      this.securityValidator = new SecurityValidator();
      this.styleIsolator = new StyleIsolator();
    }

    async load(manifest: UnifiedPluginManifest): Promise<LoadedPlugin> {
      // Enhanced security validation
      await this.validatePluginSecurity(manifest);
      
      const htmlContent = await this.loadHTMLContent(manifest.ui!);
      const scriptModule = manifest.main ? await this.loadScriptModule(manifest.main) : null;
      
      // Validate HTML content for security
      const securityReport = this.securityValidator.validateHTML(htmlContent);
      if (!securityReport.isSecure) {
        throw new Error(`Security validation failed: ${securityReport.issues.join(', ')}`);
      }
      
      // Create isolated React wrapper
      const ReactWrapper = this.createIsolatedReactWrapper(
        htmlContent, 
        scriptModule, 
        manifest
      );
      
      return {
        id: manifest.id,
        manifest,
        component: ReactWrapper,
        module: scriptModule,
        status: PluginStatus.LOADED,
        services: new Map(),
      };
    }

    private createIsolatedReactWrapper(
      htmlContent: string,
      scriptModule: any,
      manifest: UnifiedPluginManifest
    ): React.ComponentType<any> {
      return function IsolatedHTMLPlugin(props: any) {
        const shadowRef = useRef<HTMLDivElement>(null);
        const [isInitialized, setIsInitialized] = useState(false);
        const [error, setError] = useState<string | null>(null);

        useEffect(() => {
          if (shadowRef.current && !isInitialized) {
            try {
              // Create Shadow DOM for true isolation
              const shadowRoot = shadowRef.current.attachShadow({ mode: 'closed' });
              
              // Inject isolated styles
              const styleElement = document.createElement('style');
              styleElement.textContent = this.styleIsolator.isolateStyles(
                this.extractStyles(htmlContent),
                manifest.id
              );
              shadowRoot.appendChild(styleElement);
              
              // Create container in shadow DOM
              const container = document.createElement('div');
              container.className = 'plugin-container';
              shadowRoot.appendChild(container);
              
              // Sanitize and inject HTML
              const sanitizedHTML = DOMPurify.sanitize(htmlContent, {
                ALLOWED_TAGS: this.getAllowedTags(manifest.permissions),
                ALLOWED_ATTR: this.getAllowedAttributes(manifest.permissions),
                FORBID_ATTR: ['onclick', 'onload', 'onerror'],
              });
              
              container.innerHTML = sanitizedHTML;
              
              // Create secure context
              const secureContext = this.createSecureContext(container, manifest, props);
              
              // Initialize plugin
              if (scriptModule?.activate) {
                scriptModule.activate(secureContext);
              }
              
              setIsInitialized(true);
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Plugin initialization failed');
            }
          }

          return () => {
            if (scriptModule?.deactivate) {
              try {
                scriptModule.deactivate();
              } catch (err) {
                console.error(`Plugin cleanup failed for ${manifest.id}:`, err);
              }
            }
          };
        }, [isInitialized]);

        if (error) {
          return <div className="plugin-error">Error: {error}</div>;
        }

        return (
          <div 
            ref={shadowRef}
            className="isolated-html-plugin"
            data-plugin-id={manifest.id}
          />
        );
      };
    }
  }
  ```

#### Step 2.3.2: Optimize React Plugin Loading
- [ ] **Implement Lazy Loading and Code Splitting**
  ```typescript
  // src/core/loaders/optimized-react-loader.ts
  export class OptimizedReactLoader {
    private componentCache = new Map<string, React.ComponentType<any>>();
    private loadingPromises = new Map<string, Promise<React.ComponentType<any>>>();

    async loadComponent(
      pluginId: string,
      componentPath: string
    ): Promise<React.ComponentType<any>> {
      // Check cache first
      if (this.componentCache.has(pluginId)) {
        return this.componentCache.get(pluginId)!;
      }

      // Check if already loading
      if (this.loadingPromises.has(pluginId)) {
        return this.loadingPromises.get(pluginId)!;
      }

      // Start loading
      const loadingPromise = this.performLazyLoad(pluginId, componentPath);
      this.loadingPromises.set(pluginId, loadingPromise);

      try {
        const component = await loadingPromise;
        this.componentCache.set(pluginId, component);
        this.loadingPromises.delete(pluginId);
        return component;
      } catch (error) {
        this.loadingPromises.delete(pluginId);
        throw error;
      }
    }

    private async performLazyLoad(
      pluginId: string,
      componentPath: string
    ): Promise<React.ComponentType<any>> {
      // Create lazy-loaded component with suspense support
      const LazyComponent = React.lazy(async () => {
        try {
          // Try compiled version first
          const module = await import(`../../../dist/plugins/${componentPath}`);
          return { default: module.default || module[pluginId] };
        } catch {
          // Fall back to source version
          const module = await import(`../../plugins/${componentPath}`);
          return { default: module.default || module[pluginId] };
        }
      });

      // Wrap with error boundary and loading state
      return function WrappedLazyComponent(props: any) {
        return (
          <Suspense 
            fallback={
              <div className="plugin-loading">
                Loading {pluginId}...
              </div>
            }
          >
            <ErrorBoundary
              fallback={
                <div className="plugin-error">
                  Failed to load plugin: {pluginId}
                </div>
              }
            >
              <LazyComponent {...props} />
            </ErrorBoundary>
          </Suspense>
        );
      };
    }

    preloadComponent(pluginId: string, componentPath: string): void {
      // Pre-load component in the background
      this.loadComponent(pluginId, componentPath).catch(err => {
        console.warn(`Pre-loading failed for ${pluginId}:`, err);
      });
    }

    invalidateCache(pluginId?: string): void {
      if (pluginId) {
        this.componentCache.delete(pluginId);
        this.loadingPromises.delete(pluginId);
      } else {
        this.componentCache.clear();
        this.loadingPromises.clear();
      }
    }
  }
  ```

**Acceptance Criteria:**
- Enhanced HTML plugin loader with Shadow DOM isolation
- Optimized React component loading with caching
- Lazy loading and code splitting implementation
- Error boundaries and loading states

### Task 2.4: Plugin Runtime Environment

#### Step 2.4.1: Sandboxed Execution Environment
- [ ] **Implement Plugin Sandbox**
  ```typescript
  // src/core/plugin-sandbox.ts
  export interface SandboxConfig {
    isolated: boolean;
    maxMemory: number;
    maxCpuTime: number;
    allowedDomains: string[];
    allowedAPIs: string[];
  }

  export class PluginSandbox {
    private memoryMonitor: MemoryMonitor;
    private cpuMonitor: CPUMonitor;
    private networkFilter: NetworkFilter;

    constructor() {
      this.memoryMonitor = new MemoryMonitor();
      this.cpuMonitor = new CPUMonitor();
      this.networkFilter = new NetworkFilter();
    }

    createSandboxedContext(
      pluginId: string,
      config: SandboxConfig
    ): SandboxedContext {
      const context = {
        // Sandboxed console
        console: this.createSandboxedConsole(pluginId),
        
        // Restricted fetch
        fetch: this.createSandboxedFetch(pluginId, config.allowedDomains),
        
        // Memory-monitored storage
        localStorage: this.createSandboxedStorage(pluginId, config.maxMemory),
        
        // Performance monitoring
        performance: this.createSandboxedPerformance(pluginId),
        
        // Plugin utilities
        utils: {
          setTimeout: this.createSandboxedTimeout(pluginId, config.maxCpuTime),
          setInterval: this.createSandboxedInterval(pluginId, config.maxCpuTime),
        },
      };

      // Start monitoring
      this.memoryMonitor.startMonitoring(pluginId, config.maxMemory);
      this.cpuMonitor.startMonitoring(pluginId, config.maxCpuTime);

      return context;
    }

    private createSandboxedConsole(pluginId: string): Console {
      return {
        log: (...args) => console.log(`[${pluginId}]`, ...args),
        warn: (...args) => console.warn(`[${pluginId}]`, ...args),
        error: (...args) => console.error(`[${pluginId}]`, ...args),
        info: (...args) => console.info(`[${pluginId}]`, ...args),
        debug: (...args) => console.debug(`[${pluginId}]`, ...args),
      } as Console;
    }

    private createSandboxedFetch(
      pluginId: string,
      allowedDomains: string[]
    ): typeof fetch {
      return async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string' ? input : input.toString();
        
        if (!this.networkFilter.isAllowed(url, allowedDomains)) {
          throw new Error(`Network request blocked: ${url}`);
        }

        // Add plugin identification headers
        const headers = new Headers(init?.headers);
        headers.set('X-Plugin-ID', pluginId);
        
        return fetch(input, { ...init, headers });
      };
    }

    cleanup(pluginId: string): void {
      this.memoryMonitor.stopMonitoring(pluginId);
      this.cpuMonitor.stopMonitoring(pluginId);
    }
  }
  ```

**Acceptance Criteria:**
- Plugin sandbox with resource monitoring
- Memory and CPU usage limits enforcement
- Network request filtering and monitoring
- Secure API access with permission checks

## Week 5-6: Plugin Development Tools

### Task 2.5: Plugin Development Kit (PDK)

#### Step 2.5.1: Create Comprehensive PDK
- [ ] **Implement Plugin Development CLI**
  ```bash
  # scripts/plugin-cli.js
  #!/usr/bin/env node

  const { program } = require('commander');
  const fs = require('fs').promises;
  const path = require('path');

  program
    .name('omnia-plugin')
    .description('Omnia Plugin Development Kit')
    .version('1.0.0');

  program
    .command('create <plugin-name>')
    .description('Create a new plugin from template')
    .option('-t, --type <type>', 'Plugin type (simple|configured|advanced)', 'simple')
    .option('-d, --directory <dir>', 'Output directory', './plugins')
    .action(async (pluginName, options) => {
      await createPlugin(pluginName, options);
    });

  program
    .command('validate <plugin-path>')
    .description('Validate plugin structure and manifest')
    .action(async (pluginPath) => {
      await validatePlugin(pluginPath);
    });

  program
    .command('migrate <legacy-plugin-path>')
    .description('Migrate legacy plugin to modern format')
    .option('-o, --output <path>', 'Output directory')
    .action(async (legacyPath, options) => {
      await migratePlugin(legacyPath, options);
    });

  program
    .command('test <plugin-path>')
    .description('Run plugin tests')
    .option('--watch', 'Watch mode for development')
    .action(async (pluginPath, options) => {
      await testPlugin(pluginPath, options);
    });

  program
    .command('build <plugin-path>')
    .description('Build plugin for production')
    .option('--dev', 'Development build')
    .action(async (pluginPath, options) => {
      await buildPlugin(pluginPath, options);
    });

  async function createPlugin(pluginName, options) {
    console.log(`📦 Creating ${options.type} plugin: ${pluginName}`);
    
    const pluginDir = path.join(options.directory, pluginName);
    await fs.mkdir(pluginDir, { recursive: true });

    // Generate plugin files based on type
    await generatePluginFiles(pluginDir, pluginName, options.type);
    
    console.log(`✅ Plugin created at: ${pluginDir}`);
    console.log('\nNext steps:');
    console.log(`  cd ${pluginDir}`);
    console.log('  npm install');
    console.log('  npm run dev');
  }

  async function generatePluginFiles(pluginDir, pluginName, type) {
    // Generate manifest
    const manifest = {
      id: pluginName,
      name: pluginName.charAt(0).toUpperCase() + pluginName.slice(1),
      version: '1.0.0',
      type: type,
      component: 'index.tsx',
      permissions: ['ui:render'],
      description: `A ${type} plugin for Omnia`,
      author: 'Developer',
    };

    await fs.writeFile(
      path.join(pluginDir, 'plugin.json5'),
      JSON.stringify(manifest, null, 2)
    );

    // Generate TypeScript component
    const componentTemplate = getComponentTemplate(type, pluginName);
    await fs.writeFile(
      path.join(pluginDir, 'index.tsx'),
      componentTemplate
    );

    // Generate package.json
    const packageJson = {
      name: `omnia-plugin-${pluginName}`,
      version: '1.0.0',
      scripts: {
        dev: 'tsc --watch',
        build: 'tsc',
        test: 'jest',
      },
      devDependencies: {
        '@types/react': '^19.1.0',
        'typescript': '^5.2.0',
        'jest': '^29.7.0',
      },
    };

    await fs.writeFile(
      path.join(pluginDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Generate test file
    const testTemplate = getTestTemplate(pluginName);
    await fs.writeFile(
      path.join(pluginDir, 'index.test.tsx'),
      testTemplate
    );
  }

  program.parse();
  ```

**Acceptance Criteria:**
- Complete CLI tool for plugin development
- Plugin templates for all plugin types
- Plugin validation and testing utilities
- Migration tools for legacy plugins

#### Step 2.5.2: Plugin Testing Framework
- [ ] **Implement Plugin Testing Utilities**
  ```typescript
  // src/testing/plugin-test-utils.ts
  export class PluginTestUtils {
    static createMockPluginContext(overrides: Partial<PluginContext> = {}): PluginContext {
      return {
        pluginId: 'test-plugin',
        config: {},
        services: new Map(),
        events: {
          emit: jest.fn(),
          on: jest.fn(),
          off: jest.fn(),
        },
        ...overrides,
      };
    }

    static createMockServiceRegistry(): ServiceRegistry {
      const registry = new ServiceRegistry();
      
      // Mock common services
      registry.registerService('test', {
        name: 'config',
        version: '1.0.0',
        methods: {},
        permissions: [],
      }, {
        get: jest.fn(),
        set: jest.fn(),
      });

      return registry;
    }

    static async renderPlugin(
      PluginComponent: React.ComponentType<any>,
      props: any = {}
    ): Promise<RenderResult> {
      const context = this.createMockPluginContext();
      
      return render(
        <PluginComponent {...props} context={context} />
      );
    }

    static async loadAndTestPlugin(pluginPath: string): Promise<PluginTestResult> {
      const manifest = await this.loadPluginManifest(pluginPath);
      const component = await this.loadPluginComponent(pluginPath, manifest);
      
      // Run component tests
      const componentTests = await this.runComponentTests(component);
      
      // Run security tests
      const securityTests = await this.runSecurityTests(pluginPath, manifest);
      
      // Run performance tests
      const performanceTests = await this.runPerformanceTests(component);
      
      return {
        manifest,
        componentTests,
        securityTests,
        performanceTests,
        overall: this.calculateOverallScore([
          componentTests,
          securityTests,
          performanceTests,
        ]),
      };
    }
  }
  ```

**Acceptance Criteria:**
- Plugin testing utilities and mocks
- Automated security testing for plugins
- Performance testing framework
- Component testing helpers

## Week 7-8: Service Registry and Communication

### Task 2.7: Inter-Plugin Communication

#### Step 2.7.1: Service Registry Implementation
- [ ] **Complete Service Registry System**
  ```typescript
  // src/core/enhanced-service-registry.ts
  export class EnhancedServiceRegistry extends ServiceRegistry {
    private serviceHealthMonitor: ServiceHealthMonitor;
    private serviceMetrics: ServiceMetrics;
    private serviceCache = new Map<string, CachedService>();

    constructor(eventBus: EventBus, permissionManager: PermissionManager) {
      super();
      this.serviceHealthMonitor = new ServiceHealthMonitor(eventBus);
      this.serviceMetrics = new ServiceMetrics();
    }

    async registerService(
      pluginId: string,
      contract: ServiceContract,
      implementation: any
    ): Promise<void> {
      // Validate service contract
      this.validateServiceContract(contract);
      
      // Create secure proxy
      const secureImplementation = this.createSecureServiceProxy(
        pluginId,
        contract,
        implementation
      );
      
      // Register with health monitoring
      const serviceKey = `${contract.name}@${contract.version}`;
      const registeredService: RegisteredService = {
        pluginId,
        contract,
        implementation: secureImplementation,
        registeredAt: new Date(),
        health: 'healthy',
      };
      
      this.services.set(serviceKey, registeredService);
      
      // Start health monitoring
      await this.serviceHealthMonitor.startMonitoring(serviceKey, registeredService);
      
      // Emit registration event
      this.eventBus.publish('service:registered', {
        serviceKey,
        pluginId,
        contract,
      });
    }

    async getService<T>(
      serviceName: string,
      version: string,
      requesterPluginId: string
    ): Promise<T | null> {
      const serviceKey = `${serviceName}@${version}`;
      
      // Check cache first
      const cached = this.serviceCache.get(serviceKey);
      if (cached && !this.isCacheExpired(cached)) {
        await this.validateServiceAccess(serviceKey, requesterPluginId);
        this.serviceMetrics.recordAccess(serviceKey, requesterPluginId);
        return cached.implementation as T;
      }
      
      // Get service from registry
      const service = this.services.get(serviceKey);
      if (!service) {
        throw new Error(`Service not found: ${serviceKey}`);
      }
      
      // Validate access permissions
      await this.validateServiceAccess(serviceKey, requesterPluginId);
      
      // Check service health
      if (service.health !== 'healthy') {
        throw new Error(`Service unavailable: ${serviceKey} (${service.health})`);
      }
      
      // Cache service
      this.serviceCache.set(serviceKey, {
        implementation: service.implementation,
        cachedAt: new Date(),
        ttl: 5 * 60 * 1000, // 5 minutes
      });
      
      // Record metrics
      this.serviceMetrics.recordAccess(serviceKey, requesterPluginId);
      
      return service.implementation as T;
    }

    private createSecureServiceProxy(
      pluginId: string,
      contract: ServiceContract,
      implementation: any
    ): any {
      return new Proxy(implementation, {
        get: (target, prop, receiver) => {
          // Log service method calls
          this.serviceMetrics.recordMethodCall(
            contract.name,
            prop.toString(),
            pluginId
          );
          
          const method = Reflect.get(target, prop, receiver);
          
          if (typeof method === 'function') {
            return async (...args: any[]) => {
              const startTime = Date.now();
              
              try {
                const result = await method.apply(target, args);
                
                this.serviceMetrics.recordMethodSuccess(
                  contract.name,
                  prop.toString(),
                  Date.now() - startTime
                );
                
                return result;
              } catch (error) {
                this.serviceMetrics.recordMethodError(
                  contract.name,
                  prop.toString(),
                  error
                );
                
                throw error;
              }
            };
          }
          
          return method;
        },
      });
    }
  }
  ```

**Acceptance Criteria:**
- Enhanced service registry with health monitoring
- Service caching and performance optimization
- Secure service proxy with access control
- Service metrics and usage analytics

### Task 2.8: Plugin Ecosystem Services

#### Step 2.8.1: Core Services Implementation
- [ ] **Implement Essential Plugin Services**
  ```typescript
  // src/services/core-services.ts
  export class CorePluginServices {
    static async initializeServices(
      serviceRegistry: ServiceRegistry,
      permissionManager: PermissionManager
    ): Promise<void> {
      // File System Service
      await serviceRegistry.registerService('core', {
        name: 'filesystem',
        version: '1.0.0',
        methods: {
          readFile: 'string',
          writeFile: 'void',
          listFiles: 'string[]',
        },
        permissions: ['file:read', 'file:write'],
      }, new FileSystemService());

      // Configuration Service
      await serviceRegistry.registerService('core', {
        name: 'config',
        version: '1.0.0',
        methods: {
          get: 'any',
          set: 'void',
          watch: 'void',
        },
        permissions: ['config:read', 'config:write'],
      }, new ConfigurationService());

      // Logging Service
      await serviceRegistry.registerService('core', {
        name: 'logger',
        version: '1.0.0',
        methods: {
          log: 'void',
          warn: 'void',
          error: 'void',
        },
        permissions: [],
      }, new LoggingService());

      // UI Integration Service
      await serviceRegistry.registerService('core', {
        name: 'ui',
        version: '1.0.0',
        methods: {
          showNotification: 'void',
          showDialog: 'Promise<any>',
          registerMenuItem: 'void',
        },
        permissions: ['ui:render'],
      }, new UIIntegrationService());

      // Theme Service
      await serviceRegistry.registerService('core', {
        name: 'theme',
        version: '1.0.0',
        methods: {
          getCurrentTheme: 'string',
          setTheme: 'void',
          watchThemeChanges: 'void',
        },
        permissions: ['ui:render'],
      }, new ThemeService());
    }
  }

  export class FileSystemService {
    async readFile(path: string): Promise<string> {
      // Implementation with security checks
      if (!this.isPathAllowed(path)) {
        throw new Error('File access denied');
      }
      
      return await fs.readFile(path, 'utf8');
    }

    async writeFile(path: string, content: string): Promise<void> {
      if (!this.isPathAllowed(path)) {
        throw new Error('File write denied');
      }
      
      await fs.writeFile(path, content, 'utf8');
    }

    private isPathAllowed(path: string): boolean {
      // Implement path security validation
      const allowedPaths = ['/plugins/', '/config/', '/temp/'];
      return allowedPaths.some(allowed => path.startsWith(allowed));
    }
  }
  ```

**Acceptance Criteria:**
- Core services implemented (filesystem, config, logging, UI, theme)
- Security validation for all service operations
- Performance monitoring for service calls
- Service documentation and examples

## Phase 2 Completion Validation

### Final Validation Checklist

#### Plugin System Validation
- [ ] **Unified Plugin Manager**
  - All plugin types supported (HTML, React Simple/Configured/Advanced, Hybrid)
  - Plugin lifecycle management working correctly
  - Error handling and recovery functional
  - Plugin status tracking accurate

- [ ] **Plugin Loading Performance**
  ```bash
  # Performance tests
  npm run test:plugin-performance
  
  # Expected results:
  # - Plugin loading: <500ms per plugin
  # - Memory usage: <50MB per plugin
  # - No memory leaks after plugin unload
  ```

#### Security Validation
- [ ] **Permission System**
  - All plugins run with appropriate permissions
  - Permission violations properly blocked
  - Audit logging functional
  - Security sandbox working correctly

- [ ] **Plugin Isolation**
  - HTML plugins properly isolated
  - No cross-plugin data leakage
  - Service access properly controlled
  - Network requests filtered correctly

#### Development Tools Validation
- [ ] **Plugin Development Kit**
  - CLI tool creates functional plugins
  - Plugin templates work correctly
  - Migration tools convert legacy plugins
  - Testing framework validates plugins

#### Service Registry Validation
- [ ] **Inter-Plugin Communication**
  - Service registration and discovery working
  - Plugin-to-plugin communication functional
  - Service health monitoring active
  - Performance metrics being collected

### Success Criteria Met

- [ ] **All existing plugins work through unified system**
- [ ] **Automated migration for 90%+ of plugin patterns**
- [ ] **Plugin loading time <500ms per plugin**
- [ ] **Complete plugin sandboxing and permission system**
- [ ] **Comprehensive plugin development kit**
- [ ] **Complete plugin development and migration guides**

### Performance Benchmarks
- [ ] **Plugin Loading**: Average <500ms, 95th percentile <1000ms
- [ ] **Memory Usage**: <50MB per plugin baseline
- [ ] **Service Calls**: <10ms average response time
- [ ] **System Startup**: All plugins loaded in <5 seconds

### Next Steps

Upon successful completion of Phase 2:

1. **Plugin Ecosystem Validation**: Test all existing plugins in unified system
2. **Developer Beta Program**: Early access for plugin developers
3. **Performance Optimization**: Fine-tune plugin loading and execution
4. **Security Audit**: Third-party security review of plugin system
5. **Phase 3 Preparation**: Build system optimization planning

---

*Phase 2 Task List - Created: January 2025*