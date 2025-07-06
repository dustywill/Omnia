# Omnia Architecture

This document provides a comprehensive overview of Omnia's architecture, focusing on the plugin system and core components that enable secure, scalable plugin development.

## System Overview

Omnia is built as a modern plugin-based application with a three-tier architecture supporting simple to advanced plugin development. The system emphasizes security, type safety, and developer experience.

```
┌─────────────────────────────────────────────────────────────────┐
│                        Omnia Application                        │
├─────────────────────────────────────────────────────────────────┤
│  UI Layer (React + Tailwind + CSS Modules)                     │
│  ├── Component Library (18 production components)              │
│  ├── Dashboard Plugin Cards (Clickable with hover effects)     │
│  ├── Status Bar (Context-aware plugin status)                  │
│  ├── Plugin UI Loader                                          │
│  └── Unus-inspired Navigation (Colorful icons, centered)       │
├─────────────────────────────────────────────────────────────────┤
│  Plugin System                                                 │
│  ├── Enhanced Plugin Manager                                   │
│  ├── Service Registry (Inter-plugin Communication)             │
│  ├── Permission System (Manifest-based Security)               │
│  └── Plugin Hooks (React Integration)                          │
├─────────────────────────────────────────────────────────────────┤
│  Core Services                                                 │
│  ├── Settings Manager (Hybrid Configuration)                   │
│  ├── Event Bus (Type-safe Events)                              │
│  ├── Logger (Structured Logging)                               │
│  └── File Operations                                           │
├─────────────────────────────────────────────────────────────────┤
│  Foundation Layer                                              │
│  ├── Zod Schemas (Type-safe Validation)                        │
│  ├── TypeScript (Full Type Safety)                             │
│  └── Node.js/Electron Runtime                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Plugin System Architecture

### Enhanced Plugin Manager

The Enhanced Plugin Manager is the core orchestrator for plugin lifecycle and communication:

**Key Responsibilities:**
- Plugin discovery and loading from `plugins/` directory
- Manifest validation and permission checking
- Plugin initialization based on type (Simple/Configured/Advanced)
- Service registration coordination
- Lifecycle management (load, init, stop, unload)
- Error handling and status tracking

**File Location:** `src/core/enhanced-plugin-manager.ts`

### Three-Tier Plugin Architecture

#### Tier 1: Simple Plugins
- **Purpose**: Static content, calculators, simple tools
- **Requirements**: Export a React component
- **Features**: No configuration, no services, minimal manifest
- **Example**: Hello World, basic calculators, static information displays

```typescript
// Simple plugin structure
export default function SimplePlugin() {
  return <div>Hello from Simple Plugin!</div>;
}
```

#### Tier 2: Configured Plugins
- **Purpose**: Customizable plugins with user settings
- **Requirements**: React component + Zod configuration schema
- **Features**: Type-safe configuration, validation, settings UI generation
- **Example**: Weather widgets, customizable dashboards, data displays

```typescript
// Configured plugin structure
export const configSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().default('')
});

export default function ConfiguredPlugin({ config }) {
  // Plugin implementation with configuration
}
```

#### Tier 3: Advanced Plugins
- **Purpose**: Complex functionality with background processing
- **Requirements**: Lifecycle hooks + service implementations + React component
- **Features**: Service registration, event handling, persistent state, inter-plugin communication
- **Example**: File watchers, background processors, API integrations

```typescript
// Advanced plugin structure
export async function init(context: PluginContext) {
  // Initialize services, set up background tasks
}

export const services = {
  'my-service': {
    processData: (data) => { /* implementation */ }
  }
};

export default function AdvancedPlugin({ context }) {
  // React component with full context access
}
```

### Service Registry

The Service Registry enables secure, permission-based communication between plugins:

**Architecture:**
- Centralized service registration and discovery
- Method-level permission requirements
- Type-safe service definitions
- Call tracking and statistics
- Event notifications for service lifecycle

**Security Features:**
- Provider permission validation
- Caller permission checking
- Method-level access control
- Parameter validation
- Service isolation

**File Location:** `src/core/service-registry.ts`

#### Service Definition Example

```typescript
// In plugin manifest (plugin.json5)
{
  "services": [
    {
      "name": "file-processor",
      "version": "1.0.0",
      "description": "Process files with various operations",
      "methods": {
        "processFile": {
          "description": "Process a single file",
          "parameters": {
            "filePath": "string",
            "operation": "string"
          },
          "returnType": "object"
        },
        "getStats": {
          "description": "Get processing statistics",
          "parameters": {},
          "returnType": "object",
          "requiresPermission": "settings:read"
        }
      },
      "permissions": ["filesystem:read", "plugins:communicate"]
    }
  ]
}
```

### Permission System

Manifest-based security system controlling plugin access:

**Permission Categories:**
- **Filesystem**: `filesystem:read`, `filesystem:write`
- **Network**: `network:http`, `network:websocket`
- **System**: `system:exec`, `system:clipboard`, `system:notifications`
- **Plugins**: `plugins:communicate`
- **Settings**: `settings:read`, `settings:write`

**Validation Points:**
- Plugin load time (manifest validation)
- Service registration (provider permissions)
- Service calls (caller permissions)
- File operations (runtime checks)

### Plugin Hooks

React hooks providing easy access to plugin functionality:

#### usePluginConfig
- Reactive configuration management
- Real-time validation with Zod schemas
- Automatic persistence
- Change tracking
- Error handling

#### useService
- Service discovery and calling
- Call history and statistics
- Error handling and retry logic
- Permission checking
- Type-safe service interfaces

#### usePluginContext
- Complete plugin context access
- Utility functions for common operations
- Event bus integration
- Logger access
- Permission checking utilities

**File Locations:** `src/hooks/usePluginConfig.ts`, `src/hooks/useService.ts`, `src/hooks/usePluginContext.ts`

## Configuration Architecture

### Hybrid Configuration System

Omnia uses a hybrid approach to configuration management:

```
config/
├── app.json5              # Main application settings
├── plugins.json5          # Plugin registry and status
└── plugins/               # Individual plugin configurations
    ├── script-runner.json5
    ├── file-watcher.json5
    └── custom-plugin.json5
```

**Benefits:**
- Separation of concerns (app vs plugin settings)
- Plugin isolation (individual config files)
- Registry management (enable/disable plugins)
- Type safety (Zod validation)
- File watching (live updates)

### Settings Manager

The Settings Manager provides a unified API for configuration access:

**Features:**
- Hybrid file structure support
- Zod schema validation
- Atomic updates with rollback
- File watching for live updates
- Permission-based access control
- Plugin config isolation

**File Location:** `src/core/settings-manager.ts`

## Event System

Type-safe event bus for application-wide communication:

**Core Events:**
- Plugin lifecycle: `plugin:loading`, `plugin:loaded`, `plugin:error`
- Configuration: `plugin:config-updated`, `plugin:config-reset`
- Services: `service:registered`, `service:unregistered`, `service:called`
- Application: `app:ready`, `plugins:discovery-complete`

**File Location:** `src/core/event-bus.ts`

## Build System

The build system handles compilation of both main application and plugin code:

**Build Process:**
1. Clean previous build artifacts (`dist/`)
2. Compile main application TypeScript (`tsconfig.build.json`)
3. Compile plugin UIs separately (`tsconfig.plugins.json`)
4. Fix ES module imports in plugins (`scripts/fix-plugin-imports.js`)
5. Copy static assets (preload.js, etc.)

**Plugin Compilation:**
- Plugins written in TypeScript with JSX
- Compiled to ES modules for dynamic import
- CSS Modules support for styling
- Import path resolution for shared components

## Security Model

### Plugin Isolation

Each plugin operates within its own security context:

**Isolation Mechanisms:**
- Permission-based access control
- Service registry mediation
- Configuration namespace isolation
- Error boundary containment
- Resource access validation

### Permission Validation

Multi-layered permission checking:

1. **Manifest Validation**: Check declared permissions at load time
2. **Runtime Validation**: Verify permissions before operations
3. **Service Access**: Method-level permission requirements
4. **Cross-Plugin**: Mediated communication through service registry

### Service Security

Service calls are secured through:

- Provider permission validation (can the plugin provide this service?)
- Caller permission checking (can the plugin call this service?)
- Method-level access control (does this method require special permissions?)
- Parameter validation (are the parameters safe and expected?)

## Development Workflow

### Plugin Development Process

1. **Choose Tier**: Start with Simple, upgrade as needed
2. **Create Structure**: Directory, manifest, implementation
3. **Define Schema**: For Configured/Advanced plugins
4. **Implement Services**: For Advanced plugins
5. **Test Integration**: Build and run in application
6. **Iterate**: Use hooks for enhanced functionality

### Testing Strategy

- **Unit Tests**: Individual plugin logic
- **Integration Tests**: Plugin manager interaction
- **Service Tests**: Inter-plugin communication
- **End-to-End**: Full application workflows

### Debugging Support

- **Enhanced Logging**: Structured logging with plugin context
- **Error Boundaries**: Plugin error isolation
- **Development Tools**: Plugin status monitoring
- **Service Tracing**: Call tracking and statistics

## Performance Considerations

### Plugin Loading

- **Lazy Loading**: Plugins loaded on demand
- **Parallel Discovery**: Multiple plugins discovered simultaneously
- **Error Isolation**: Plugin failures don't affect others
- **Resource Management**: Memory and CPU usage monitoring

### Service Registry

- **Efficient Lookup**: Map-based service storage
- **Call Caching**: Recent call history for debugging
- **Permission Caching**: Avoid repeated permission checks
- **Event Optimization**: Minimal event payload size

## Future Architecture

### Planned Enhancements

- **Plugin Marketplace**: Remote plugin discovery and installation
- **Sandboxed Execution**: Enhanced plugin isolation
- **Multi-language Support**: Plugins in languages other than TypeScript
- **Hot Reloading**: Development-time plugin reloading
- **Plugin Dependencies**: Complex dependency management
- **Service Versioning**: Multiple service versions simultaneously

### Scalability Considerations

- **Microservice Architecture**: Plugin services as separate processes
- **Database Integration**: Persistent plugin state management
- **Clustering**: Multi-instance plugin distribution
- **API Gateway**: External service integration

## Conclusion

Omnia's architecture provides a robust, secure, and scalable foundation for plugin-based application development. The three-tier plugin system, combined with the service registry and permission system, enables developers to create everything from simple UI components to complex background services while maintaining security and type safety.

The architecture emphasizes:
- **Developer Experience**: Rich tooling, hooks, and examples
- **Security**: Multi-layered permission system
- **Type Safety**: Full TypeScript with Zod validation
- **Scalability**: Modular, event-driven design
- **Maintainability**: Clear separation of concerns and well-defined interfaces