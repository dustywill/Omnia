# WORK: Omnia Core Services Implementation Plan

**Date**: 2025-01-09
**Status**: PARTIALLY COMPLETE
**Last Updated**: 2025-01-09

## 📊 **COMPLETION STATUS**
- **Phase 1 (Core Service Extraction)**: ✅ **100% COMPLETE**
- **Phase 2 (Service Integration)**: ❌ **20% COMPLETE** (Registry done, plugins not migrated)
- **Phase 3 (Configuration Standardization)**: ❌ **0% COMPLETE**
- **Phase 4 (Advanced Services)**: ❌ **0% COMPLETE**

## 🎯 Problem Statement

Complete the implementation of remaining Omnia Core services and eliminate functionality duplication across plugins. Based on comprehensive analysis, Omnia needs a complete service ecosystem to support its manufacturing automation, development workflow, and customer management capabilities.

## 🔍 Root Cause Analysis

- **Symptom**: Plugin functionality duplication, incomplete service architecture
- **Root Cause**: Core services were designed but not fully implemented; plugins developed independently without shared service utilization
- **Evidence**: 
  - 60%+ functionality duplication across plugins (file operations, HTTP clients, progress tracking)
  - Missing critical services (authentication, monitoring, audit, workflow engine)
  - Custom implementations instead of shared services
- **Affected Systems**:
  - **Components**: All plugins, core service architecture
  - **Services**: FileSystem, HTTP Client, Progress Tracking, Script Execution, Configuration Management
  - **Architecture**: Service registry integration, plugin-to-core service migration

## 📚 Required Documentation

### Primary Documentation (Read First)

- **Architecture**: `docs/architecture/ARCHITECTURE.md` - Plugin system and service registry
- **Services**: `docs/architecture/SERVICES.md` - Service communication patterns
- **Systems**: `docs/SYSTEMS.md` - Core architecture principles
- **Plugin Development**: `docs/architecture/PLUGIN_DEVELOPER_GUIDE.md` - Service usage patterns

### Supporting Documentation

- **LEARNINGS.md**: Service Registry Pattern, Plugin Loading Pattern
- **CLAUDE.md**: Build process, service integration requirements
- **Schema**: Plugin manifest structure, service definitions

### Code References

- **Current Services**: `src/core/services/` - Existing implementations
- **Plugin Patterns**: `plugins/*/index.tsx` - Current plugin implementations
- **Service Registry**: `src/core/enhanced-plugin-manager.ts` - Service coordination

## 🛠 Solution Design

### Strategy
1. **Service Extraction**: Extract duplicated functionality from plugins into core services
2. **Service Enhancement**: Complete missing services and enhance existing ones
3. **Plugin Migration**: Gradually migrate plugins to use core services
4. **Architecture Completion**: Implement full service ecosystem

### Patterns to Apply
- **Service Registry Pattern**: All services registered and discoverable
- **Plugin Integration Pattern**: Standardized service consumption
- **Configuration Integration Pattern**: Unified configuration management
- **Security Pattern**: Permission-based service access

## 🔍 Current State Analysis

### ✅ Existing Services (Well Implemented)
- **Plugin Manager** (`src/core/enhanced-plugin-manager.ts`) - Three-tier plugin architecture
- **Settings Manager** (`src/core/settings-manager.ts`) - Hybrid configuration with Zod validation
- **Event Bus** (`src/core/event-bus.ts`) - Type-safe event system
- **Logger** (`src/core/logger.ts`) - Unified logging system
- **Notification Service** (`src/core/notification-service.ts`) - User notifications
- **Navigation Service** (`src/core/navigation-service.ts`) - App navigation
- **HTTP Client** (`src/core/services/http-client.ts`) - Basic HTTP operations
- **Document Generator** (`src/core/services/document-generator.ts`) - Template rendering
- **Template Engine** (`src/core/services/template-engine.ts`) - Handlebars processing

### ✅ **COMPLETED CORE SERVICES** (Phase 1)
- **FileSystemService** (`src/core/services/file-system.ts`) - ✅ **FULLY IMPLEMENTED**
  - Comprehensive file operations with security validation
  - Path traversal prevention and sandboxing
  - Batch operations with progress tracking
  - Directory scanning and watching capabilities
  - Permission-based access control

- **HttpClientService** (`src/core/services/http-client.ts`) - ✅ **FULLY ENHANCED**
  - Authentication support (Bearer, Basic, Custom)
  - Retry logic with exponential backoff
  - Progress callbacks and cancellation
  - Request/response interceptors
  - Caching and concurrent fetching

- **ProgressTrackingService** (`src/core/services/progress-tracking.ts`) - ✅ **FULLY IMPLEMENTED**
  - Event-driven progress updates
  - Phase-based tracking with dependencies
  - Hierarchical progress (sub-tasks)
  - Cancellation support
  - Real-time updates and persistence

- **ScriptExecutionService** (`src/core/services/script-execution.ts`) - ✅ **FULLY IMPLEMENTED**
  - Multi-shell support (PowerShell, CMD, Bash)
  - Parameter validation and injection
  - Security controls and script validation
  - Output streaming and capture
  - Resource limits and monitoring

- **Core Services Registry** (`src/core/core-services-registry.ts`) - ✅ **IMPLEMENTED**
  - All services registered with permission-based access
  - Dependency injection framework
  - Service definitions with method signatures

### ❌ **MISSING ADVANCED SERVICES** (Phase 4)
- **DataSourceService** - Multi-source data aggregation
- **AuthenticationService** - Token management, credential storage
- **MonitoringService** - Performance metrics, health checks
- **AuditService** - Action logging, compliance tracking
- **WorkflowEngine** - Multi-step automation orchestration
- **CacheService** - Performance optimization
- **QueueService** - Background task processing
- **DataTransformationService** - Format conversion, validation
- **ConfigurationBackupService** - Version control, rollback

### ❌ **CRITICAL GAP: PLUGIN MIGRATION NOT COMPLETED**
**The core services are fully implemented but plugins still use custom implementations:**
- **Script Runner**: ❌ Still uses custom script execution instead of ScriptExecutionService
- **As-Built Documenter**: ❌ Still uses custom HTTP client instead of HttpClientService
- **Context Generator**: ❌ Still uses custom file operations instead of FileSystemService

**Impact**: Original goal of 60%+ code duplication elimination not achieved

## 🔄 Plugin Duplication Analysis

### 📁 File System Operations (Duplicated Across 3 Plugins)
**Plugins**: As-Built Documenter, Context Generator, Script Runner
**Duplicated Operations**:
- Directory creation and scanning
- File reading/writing with encoding handling
- Path manipulation and validation
- File existence checking
- Metadata extraction

**Current Implementation Example** (As-Built Documenter):
```typescript
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};
```

**Proposal**: Extract to `FileSystemService` with security validation and standardized API

### 🌐 HTTP Client Usage (Custom Implementations)
**Plugins**: As-Built Documenter (custom axios wrapper)
**Duplicated Features**:
- Authentication handling (Bearer tokens, Basic auth)
- Retry logic and timeout management
- Progress callbacks and cancellation
- Error handling and logging
- Response validation

**Current Implementation Example** (As-Built Documenter):
```typescript
const httpClient = axios.create({
  timeout: 30000,
  headers: { 'Authorization': `Bearer ${token}` }
});
```

**Proposal**: Enhance existing `HttpClientService` with authentication, retry, and progress features

### 📊 Progress Tracking (60%+ Duplication)
**Plugins**: As-Built Documenter, Context Generator, Script Runner
**Duplicated Features**:
- Phase-based progress tracking
- Percentage calculations
- Cancellation support
- Status updates and notifications
- Error state management

**Current Implementation Example** (As-Built Documenter):
```typescript
const updateProgress = (phase: string, percentage: number) => {
  setProgress({ phase, percentage, status: 'in-progress' });
  onProgress?.({ phase, percentage });
};
```

**Proposal**: Create unified `ProgressTrackingService` with event-driven updates

### 🔧 Script Execution (Specialized Functionality)
**Plugins**: Script Runner
**Features**:
- PowerShell script execution
- Parameter processing and validation
- Output capture and streaming
- Security and sandbox management
- Error handling and logging

**Current Implementation**: Plugin-specific, complex logic
**Proposal**: Extract to `ScriptExecutionService` for reuse across plugins

### 🔗 Data Source Management (Complex Multi-Source)
**Plugins**: As-Built Documenter
**Features**:
- Multi-source configuration
- Concurrent data fetching
- Result aggregation and transformation
- Error handling and retries
- Progress coordination

**Current Implementation**: Complex plugin-specific logic
**Proposal**: Create `DataSourceService` for generic data source management

### ⚙️ Configuration Management (Standardization Needed)
**Plugins**: All plugins
**Duplicated Patterns**:
- Zod schema validation
- Configuration persistence
- UI form generation
- Default value handling
- Validation error presentation

**Proposal**: Create `ConfigurationService` utilities and standardize patterns

## 📋 Implementation Requirements

### Phase 1: Core Service Extraction (Priority: High)
1. **Create FileSystemService**
   - Standardized file operations API
   - Security validation and sandboxing
   - Permission-based access control
   - Path manipulation utilities

2. **Enhance HttpClientService**
   - Authentication support (Bearer, Basic, custom)
   - Retry logic with exponential backoff
   - Progress callbacks and cancellation
   - Request/response interceptors

3. **Create ProgressTrackingService**
   - Event-driven progress updates
   - Phase-based tracking
   - Cancellation support
   - UI integration hooks

4. **Create ScriptExecutionService**
   - PowerShell and shell script execution
   - Parameter validation and injection
   - Output streaming and capture
   - Security and resource limits

### Phase 2: Service Integration (Priority: High)
1. **Migrate As-Built Documenter**
   - Replace custom HTTP client with core service
   - Use FileSystemService for file operations
   - Integrate ProgressTrackingService
   - Utilize DataSourceService for multi-source fetching

2. **Migrate Context Generator**
   - Replace file system operations with core service
   - Use ProgressTrackingService for file scanning
   - Standardize configuration handling

3. **Migrate Script Runner**
   - Replace custom execution with ScriptExecutionService
   - Use ProgressTrackingService for execution updates
   - Standardize parameter handling

### Phase 3: Configuration Standardization (Priority: Medium)
1. **Create Configuration Utilities**
   - Reusable Zod schema patterns
   - Configuration persistence helpers
   - UI form generation utilities
   - Validation error handling

2. **Standardize Plugin Configurations**
   - Unified configuration schemas
   - Consistent UI patterns
   - Shared validation logic
   - Error handling standardization

### Phase 4: Advanced Services (Priority: Medium)
1. **Create DataSourceService**
   - Generic multi-source data fetching
   - Configurable data transformation
   - Result aggregation patterns
   - Error handling and retries

2. **Implement Authentication Service**
   - Token management and storage
   - Credential encryption
   - Session handling
   - Multi-factor authentication support

3. **Create Monitoring Service**
   - Performance metrics collection
   - Health check orchestration
   - Usage analytics
   - Alert management

4. **Implement Audit Service**
   - Action logging and tracking
   - Compliance reporting
   - Access control audit
   - Change history management

## 🎯 Service Specifications

### FileSystemService
```typescript
interface FileSystemService {
  // Core operations
  readFile(path: string, encoding?: string): Promise<string>;
  writeFile(path: string, content: string, encoding?: string): Promise<void>;
  deleteFile(path: string): Promise<void>;
  createDirectory(path: string): Promise<void>;
  
  // Advanced operations
  scanDirectory(path: string, pattern?: string): Promise<FileInfo[]>;
  watchDirectory(path: string, callback: (event: FileEvent) => void): FileWatcher;
  
  // Security
  validatePath(path: string): boolean;
  checkPermission(path: string, operation: 'read' | 'write' | 'delete'): boolean;
}
```

### Enhanced HttpClientService
```typescript
interface HttpClientService {
  // Request methods
  get<T>(url: string, config?: RequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: RequestConfig): Promise<T>;
  delete<T>(url: string, config?: RequestConfig): Promise<T>;
  
  // Authentication
  setAuthentication(type: 'bearer' | 'basic' | 'custom', credentials: any): void;
  
  // Progress and cancellation
  withProgress(callback: ProgressCallback): HttpClientService;
  withCancellation(signal: AbortSignal): HttpClientService;
  
  // Configuration
  setDefaults(config: RequestConfig): void;
  addInterceptor(interceptor: RequestInterceptor): void;
}
```

### ProgressTrackingService
```typescript
interface ProgressTrackingService {
  // Progress management
  createProgress(id: string, phases: string[]): ProgressTracker;
  updateProgress(id: string, phase: string, percentage: number): void;
  completeProgress(id: string): void;
  cancelProgress(id: string): void;
  
  // Event handling
  onProgress(callback: (event: ProgressEvent) => void): void;
  onComplete(callback: (id: string) => void): void;
  onCancel(callback: (id: string) => void): void;
  
  // Status queries
  getProgress(id: string): ProgressState;
  getAllProgress(): ProgressState[];
}
```

### ScriptExecutionService
```typescript
interface ScriptExecutionService {
  // Execution
  executeScript(script: string, options?: ExecutionOptions): Promise<ExecutionResult>;
  executePowerShell(script: string, options?: PowerShellOptions): Promise<ExecutionResult>;
  
  // Parameter handling
  validateParameters(params: Record<string, any>, schema: any): boolean;
  injectParameters(script: string, params: Record<string, any>): string;
  
  // Output management
  streamOutput(callback: (output: string) => void): void;
  captureOutput(): string[];
  
  // Security
  validateScript(script: string): SecurityResult;
  setSandbox(enabled: boolean, options?: SandboxOptions): void;
}
```

## 🔄 Migration Strategy

### Incremental Migration Approach
1. **Implement Core Services** - Build and test services independently
2. **Create Service Adapters** - Provide backward compatibility during migration
3. **Migrate Plugin by Plugin** - Update one plugin at a time
4. **Remove Duplicated Code** - Clean up after successful migration
5. **Update Documentation** - Reflect new service usage patterns

### Backward Compatibility
- Maintain existing plugin APIs during transition
- Provide migration utilities and helpers
- Clear deprecation warnings and timelines
- Comprehensive migration documentation

## ⚠ Common Violations to Prevent

- **Service Bypass**: Plugins must use core services, not custom implementations
- **Permission Violations**: All file/network operations must go through permissioned services
- **Configuration Inconsistency**: All plugins must use standardized configuration patterns
- **Error Handling**: Unified error handling and logging through core services
- **Performance**: Avoid blocking operations, use async patterns throughout

## 📊 Expected Benefits

### Code Quality Improvements
- **60%+ Reduction** in duplicated functionality
- **Improved Maintainability** through centralized service management
- **Enhanced Security** with unified validation and access control
- **Better Testing** through service isolation and mocking
- **Consistent UX** with standardized progress and error handling

### Development Efficiency
- **Faster Plugin Development** with rich service ecosystem
- **Reduced Debugging** through centralized logging and monitoring
- **Easier Integration** with standardized service interfaces
- **Better Documentation** with service usage examples

### System Reliability
- **Centralized Error Handling** with consistent error patterns
- **Improved Performance** through caching and optimization
- **Better Security** with unified authentication and authorization
- **Enhanced Monitoring** with comprehensive metrics and alerts

## 🛡️ Risk Mitigation

### Technical Risks
- **Risk**: Breaking existing plugins during migration
- **Mitigation**: Incremental migration with backward compatibility adapters

- **Risk**: Service performance bottlenecks
- **Mitigation**: Performance testing and optimization, caching strategies

- **Risk**: Complex service dependencies
- **Mitigation**: Clear service interfaces, dependency injection patterns

### Implementation Risks
- **Risk**: Large scope leading to incomplete implementation
- **Mitigation**: Phased approach with clear deliverables and priorities

- **Risk**: Plugin migration complexity
- **Mitigation**: Migration utilities, comprehensive documentation, plugin-by-plugin approach

## 📋 Success Criteria

### Phase 1 Success Criteria
- [x] FileSystemService implemented with security validation
- [x] HttpClientService enhanced with authentication and retry logic
- [x] ProgressTrackingService providing unified progress reporting
- [x] ScriptExecutionService extracted from Script Runner plugin
- [x] All services integrated with Service Registry
- [x] Comprehensive test coverage for all new services

### Phase 2 Success Criteria
- [ ] As-Built Documenter migrated to use core services **❌ NOT DONE**
- [ ] Context Generator migrated to use core services **❌ NOT DONE**
- [ ] Script Runner migrated to use core services **❌ NOT DONE**
- [ ] 60%+ reduction in duplicated code across plugins **❌ NOT ACHIEVED**
- [ ] All plugins using standardized progress tracking **❌ NOT DONE**
- [ ] No functionality regressions during migration **❌ NOT DONE**

### Phase 3 Success Criteria
- [ ] Configuration utilities implemented and documented **❌ NOT STARTED**
- [ ] All plugins using standardized configuration patterns **❌ NOT STARTED**
- [ ] Unified configuration UI components **❌ NOT STARTED**
- [ ] Consistent validation and error handling across plugins **❌ NOT STARTED**

### Phase 4 Success Criteria
- [ ] DataSourceService implemented for complex data scenarios **❌ NOT STARTED**
- [ ] Authentication Service providing secure credential management **❌ NOT STARTED**
- [ ] Monitoring Service providing performance metrics **❌ NOT STARTED**
- [ ] Audit Service providing compliance tracking **❌ NOT STARTED**
- [ ] Complete service ecosystem documentation **❌ NOT STARTED**

## 🎯 Implementation Timeline

### Phase 1: Core Service Extraction (Weeks 1-4)
- Week 1: FileSystemService and HttpClientService enhancement
- Week 2: ProgressTrackingService and ScriptExecutionService
- Week 3: Service Registry integration and testing
- Week 4: Documentation and migration utilities

### Phase 2: Service Integration (Weeks 5-8)
- Week 5: As-Built Documenter migration
- Week 6: Context Generator migration  
- Week 7: Script Runner migration
- Week 8: Testing and validation

### Phase 3: Configuration Standardization (Weeks 9-10)
- Week 9: Configuration utilities and patterns
- Week 10: Plugin configuration migration

### Phase 4: Advanced Services (Weeks 11-14)
- Week 11: DataSourceService and Authentication Service
- Week 12: Monitoring Service and Audit Service
- Week 13: Integration and testing
- Week 14: Documentation and final validation

## 📚 Handoff to Coordinator

### Implementation Summary
- **Core Changes Required**: 4 new services, 3 enhanced services, 3 plugin migrations
- **Estimated Complexity**: 14 weeks (3.5 months)
- **Skill Requirements**: TypeScript, Node.js, React, System Architecture
- **External Dependencies**: None (self-contained implementation)

### Quality Requirements
- **Testing Strategy**: Unit tests for all services, integration tests for plugin migrations
- **Performance Benchmarks**: <100ms service call overhead, 60%+ code reduction
- **Security Considerations**: Permission validation, secure credential storage
- **Documentation Updates**: Service API docs, migration guides, plugin examples

This comprehensive plan will complete the Omnia Core services architecture and establish a robust foundation for future plugin development while eliminating significant code duplication.

## 🎯 **CURRENT STATUS SUMMARY**

### ✅ **COMPLETED WORK (Phase 1)**
- **All 4 core services fully implemented** with comprehensive APIs
- **Service registry integration** with permission-based access
- **Comprehensive test coverage** for all services
- **Factory functions and defaults** for easy service usage
- **Security validation** throughout all services

### ❌ **CRITICAL REMAINING WORK**
1. **Plugin Migration (Phase 2)** - Most Important
   - Migrate Script Runner to use ScriptExecutionService
   - Migrate As-Built Documenter to use HttpClientService + FileSystemService
   - Migrate Context Generator to use FileSystemService
   - Update plugin manifests to declare service dependencies

2. **Configuration Standardization (Phase 3)**
   - Create reusable configuration utilities
   - Standardize plugin configuration patterns

3. **Advanced Services (Phase 4)**
   - Implement DataSourceService, AuthenticationService, MonitoringService, AuditService

### 🔥 **IMMEDIATE NEXT STEPS**
1. **Start with Script Runner migration** - Use ScriptExecutionService
2. **Update As-Built Documenter** - Replace custom HTTP client
3. **Update Context Generator** - Replace custom file operations
4. **Achieve 60%+ code reduction** through service adoption

**Note**: Core services foundation is excellent - the remaining work is primarily plugin migration to use these services.