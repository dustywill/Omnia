# NEXT STEPS - Omnia Development Roadmap

**Current Status:** Core services foundation complete, plugin migration needed  
**Priority:** Complete core services implementation and leverage for advanced features  
**Date:** January 9, 2025  
**Last Updated:** January 9, 2025

## 📊 **CURRENT COMPLETION STATUS**

- **Phase 1 (Core Service Extraction)**: ✅ **100% COMPLETE**
- **Phase 2 (Service Integration)**: ❌ **20% COMPLETE** (Registry done, plugins not migrated)
- **Phase 3 (Configuration Standardization)**: ❌ **0% COMPLETE**
- **Phase 4 (Advanced Services)**: ❌ **0% COMPLETE**

## 🎯 **CORE SERVICES FOUNDATION**

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

### 🔧 **Available Core Services APIs:**
- `useFileSystemService()` - File operations, directory watching, security validation
- `useHttpClientService()` - HTTP requests with auth, retry logic, progress callbacks
- `useProgressTrackingService()` - Unified progress reporting across all operations
- `useScriptExecutionService()` - PowerShell and shell script execution

### ❌ **CRITICAL GAP: PLUGIN MIGRATION NOT COMPLETED**
**The core services are fully implemented but plugins still use custom implementations:**
- **Script Runner**: ❌ Still uses custom script execution instead of ScriptExecutionService
- **As-Built Documenter**: ❌ Still uses custom HTTP client instead of HttpClientService
- **Context Generator**: ❌ Still uses custom file operations instead of FileSystemService

**Impact**: Original goal of 60%+ code duplication elimination not achieved

## 🔥 **IMMEDIATE NEXT STEPS** (High Priority)

### 1. **CRITICAL: Plugin Migration** (Phase 2)
**Goal**: Migrate plugins to use core services to eliminate code duplication

#### 1.1 Migrate Script Runner Plugin
- **Task**: Replace custom script execution with ScriptExecutionService
- **Files**: `plugins/script-runner/index.tsx`
- **Dependencies**: ScriptExecutionService, ProgressTrackingService
- **Effort**: 2-3 hours
- **Impact**: Eliminate custom script execution code, use secure service
- **Success Criteria**: Script Runner uses ScriptExecutionService for all executions

#### 1.2 Migrate As-Built Documenter Plugin  
- **Task**: Replace custom HTTP client with HttpClientService
- **Files**: `plugins/as-built-documenter/index.tsx`
- **Dependencies**: HttpClientService, FileSystemService, ProgressTrackingService
- **Effort**: 3-4 hours
- **Impact**: Eliminate custom HTTP client and file operations
- **Success Criteria**: As-Built Documenter uses core services for all operations

#### 1.3 Migrate Context Generator Plugin
- **Task**: Replace custom file operations with FileSystemService
- **Files**: `plugins/context-generator/index.tsx`
- **Dependencies**: FileSystemService, ProgressTrackingService
- **Effort**: 2-3 hours
- **Impact**: Eliminate custom file system operations
- **Success Criteria**: Context Generator uses FileSystemService for all file operations

### 2. **Plugin Management UI Enhancement**
- **Task**: Implement WORK_PLUGIN_MANAGEMENT_UI.md plan
- **Files**: `src/ui/views/PluginsView.tsx`, plugin management components
- **Effort**: 1 week
- **Impact**: Safe plugin management with proper disable/enable semantics

### 3. **Individual Plugin Settings**
- **Task**: Add individual plugin settings under Plugin Settings section
- **Files**: Create new view or enhance existing PluginsView
- **Effort**: 1-2 hours
- **Impact**: Enhanced plugin configuration capabilities

## 📋 **REMAINING IMPLEMENTATION PHASES**

### Phase 3: Configuration Standardization (Medium Priority)
#### 3.1 Create Configuration Utilities
- **Task**: Implement reusable Zod schema patterns
- **Files**: `src/core/services/configuration.ts`
- **Dependencies**: Settings Manager, existing Zod schemas
- **Effort**: 1-2 weeks
- **Impact**: Standardized configuration patterns across all plugins

#### 3.2 Standardize Plugin Configurations
- **Task**: Update all plugins to use standardized configuration patterns
- **Files**: All plugin configurations
- **Dependencies**: Configuration utilities from 3.1
- **Effort**: 1 week
- **Impact**: Consistent configuration handling across system

### Phase 4: Advanced Services (Lower Priority)
#### 4.1 Missing Advanced Services
- **DataSourceService** - Multi-source data aggregation
- **AuthenticationService** - Token management, credential storage
- **MonitoringService** - Performance metrics, health checks
- **AuditService** - Action logging, compliance tracking

#### 4.2 Implementation Requirements
- **Effort**: 2-3 weeks per service
- **Dependencies**: Core services foundation (completed)
- **Impact**: Complete service ecosystem for advanced features

## 🛠 **DEVELOPMENT PATHS** (After Plugin Migration)

### Path 1: Advanced Plugin Development
**Goal**: Leverage completed core services for enhanced plugin capabilities

#### Phase 1: Enhanced Plugin Examples
- Create sophisticated plugin examples using core services
- Demonstrate FileSystemService and ScriptExecutionService usage
- Show service integration patterns
- **Effort**: 1-2 hours per plugin (reduced due to core services)

#### Phase 2: Plugin Developer Tools
- Build plugin debugging interface using service APIs
- Create plugin template generator with FileSystemService
- Add plugin hot-reload capabilities
- **Effort**: 2-4 hours

### Path 2: System Enhancement
**Goal**: Build upon completed core services for advanced system features

#### Phase 1: Advanced Logging Features
- Add log filtering and search using enhanced Logger service
- Create log export functionality with FileSystemService
- Implement log level configuration
- **Effort**: 2-3 hours

#### Phase 2: Performance Monitoring Dashboard
- Build performance dashboard using service metrics
- Create system health indicators
- Add performance metrics visualization
- **Effort**: 3-4 hours (after MonitoringService implemented)

### Path 3: User Experience Refinement
**Goal**: Polish user interface leveraging core services

#### Phase 1: Advanced UI Components
- Create components with ProgressTrackingService integration
- Add animation and transition effects for service operations
- Implement responsive design improvements
- **Effort**: 2-3 hours per component

#### Phase 2: Theme System
- Implement dark/light theme support with configuration persistence
- Add theme customization options
- Create theme persistence using standardized patterns
- **Effort**: 3-4 hours

## 🎯 **SUCCESS CRITERIA**

### Phase 2 (Plugin Migration) - CRITICAL
- [ ] Script Runner migrated to use ScriptExecutionService
- [ ] As-Built Documenter migrated to use HttpClientService + FileSystemService
- [ ] Context Generator migrated to use FileSystemService
- [ ] 60%+ reduction in duplicated code across plugins achieved
- [ ] All plugins using standardized progress tracking
- [ ] No functionality regressions during migration

### Phase 3 (Configuration Standardization)
- [ ] Configuration utilities implemented and documented
- [ ] All plugins using standardized configuration patterns
- [ ] Unified configuration UI components
- [ ] Consistent validation and error handling across plugins

### Phase 4 (Advanced Services)
- [ ] DataSourceService implemented for complex data scenarios
- [ ] AuthenticationService providing secure credential management
- [ ] MonitoringService providing performance metrics
- [ ] AuditService providing compliance tracking

## 📚 **TECHNICAL OPPORTUNITIES** (Enabled by Core Services)

### 1. Plugin System Enhancements
- Plugin dependency management using Service Registry
- Plugin versioning system with configuration services
- Cross-plugin communication using established patterns
- Plugin marketplace integration (after AuthenticationService)

### 2. System Integration Expansion
- File system watching using FileSystemService capabilities
- System integration APIs using ScriptExecutionService
- Network operations with enhanced HttpClientService
- Database operations through future DataSourceService

### 3. Build System Optimization
- Incremental builds with FileSystemService watching
- Hot module replacement using Plugin Manager enhancements
- Build caching with performance tracking
- Asset optimization with service integration

## 🔄 **MIGRATION STRATEGY**

### Incremental Migration Approach
1. **Start with Script Runner** - Most straightforward migration
2. **Migrate As-Built Documenter** - More complex but high impact
3. **Migrate Context Generator** - Complete the core plugin migration
4. **Remove Duplicated Code** - Clean up after successful migration
5. **Update Documentation** - Reflect new service usage patterns

### Backward Compatibility
- Maintain existing plugin APIs during transition
- Test thoroughly after each migration
- Provide rollback plan if issues arise
- Document migration patterns for future reference

## 🛡️ **RISK MITIGATION**

### Technical Risks
- **Risk**: Breaking existing plugins during migration
- **Mitigation**: Incremental migration with thorough testing

- **Risk**: Service performance bottlenecks
- **Mitigation**: Performance testing and optimization

- **Risk**: Complex service dependencies
- **Mitigation**: Clear service interfaces, proper testing

### Implementation Risks
- **Risk**: Large scope leading to incomplete implementation
- **Mitigation**: Focus on Phase 2 (plugin migration) first

- **Risk**: Plugin migration complexity
- **Mitigation**: Start with simplest plugin (Script Runner)

## 📈 **EXPECTED BENEFITS**

### Immediate Benefits (After Plugin Migration)
- **60%+ reduction** in duplicated functionality
- **Improved maintainability** through centralized service management
- **Enhanced security** with unified validation and access control
- **Better testing** through service isolation and mocking

### Long-term Benefits (After Full Implementation)
- **Faster plugin development** with rich service ecosystem
- **Reduced debugging** through centralized logging and monitoring
- **Easier integration** with standardized service interfaces
- **Enhanced system reliability** with comprehensive service foundation

## 🎯 **CURRENT STATUS SUMMARY**

### ✅ **COMPLETED WORK**
- **All 4 core services fully implemented** with comprehensive APIs
- **Service registry integration** with permission-based access
- **Comprehensive test coverage** for all services
- **Factory functions and defaults** for easy service usage
- **Security validation** throughout all services

### ❌ **CRITICAL REMAINING WORK**
1. **Plugin Migration (Phase 2)** - Most Important
   - This is the key blocker preventing the achievement of project goals
   - Core services exist but aren't being used
   - 60%+ code duplication still exists

2. **Configuration Standardization (Phase 3)**
   - Create reusable configuration utilities
   - Standardize plugin configuration patterns

3. **Advanced Services (Phase 4)**
   - Implement missing services for complete ecosystem

### 🔥 **IMMEDIATE NEXT ACTIONS**
1. **Start with Script Runner migration** - Use ScriptExecutionService
2. **Update As-Built Documenter** - Replace custom HTTP client
3. **Update Context Generator** - Replace custom file operations
4. **Achieve 60%+ code reduction** through service adoption

**Note**: The core services foundation is excellent and complete. The critical remaining work is primarily plugin migration to use these services. Once this is done, the system will achieve its original goals and be ready for advanced feature development.