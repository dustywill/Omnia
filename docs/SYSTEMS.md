# SYSTEMS - Architecture Patterns and Principles

This document defines the high-level system architecture patterns and principles that guide Omnia's design and evolution. It serves as the foundation for understanding how different components interact and how new features should be integrated.

## 🏗 Core Architecture Principles

### 1. Plugin-First Architecture
The entire system is built around a three-tier plugin architecture that enables extensibility while maintaining security and performance.

**Principle**: Every feature beyond core functionality should be implementable as a plugin
**Reasoning**: Enables customization, reduces core complexity, allows feature experimentation
**Implementation**: Plugin Manager + Service Registry + Permission System

### 2. Hybrid Configuration Management
Configuration uses a type-safe, hierarchical system that balances flexibility with validation.

**Principle**: All configuration must be validated at runtime with sensible defaults
**Reasoning**: Prevents runtime failures, enables safe configuration changes
**Implementation**: Zod schemas + JSON5 configuration files + file watching

### 3. Security by Design
Security is built into the architecture rather than added as an afterthought.

**Principle**: No component should have more permissions than absolutely necessary
**Reasoning**: Minimizes attack surface, prevents privilege escalation
**Implementation**: Manifest-based permissions + Service Registry mediation

### 4. Performance-First Data Flow
Data flow patterns prioritize performance and user experience.

**Principle**: Expensive operations should be cached, memoized, or moved off the critical path
**Reasoning**: Maintains responsive UI, reduces server load
**Implementation**: Memoization + Caching + Background processing

---

## 🔧 System Components

### Core System Layer

#### 1. Application Bootstrap (`src/index.ts`)
**Purpose**: Environment detection and application initialization
**Pattern**: Environment-agnostic startup with JSDOM polyfills for Node.js
**Key Responsibility**: Ensure consistent runtime environment

```typescript
// System Pattern: Environment Detection
if (typeof window === 'undefined') {
  // Node.js environment - setup JSDOM
  const { JSDOM } = require('jsdom');
  global.window = new JSDOM().window;
}
```

#### 2. Plugin Manager (`src/core/plugin-manager.ts`)
**Purpose**: Plugin lifecycle management and discovery
**Pattern**: Three-tier plugin architecture with manifest validation
**Key Responsibility**: Safe plugin loading with error isolation

```typescript
// System Pattern: Plugin Isolation
interface PluginContext {
  pluginId: string;
  permissions: string[];
  sandboxed: boolean;
}
```

#### 3. Service Registry (`src/core/service-registry.ts`)
**Purpose**: Secure inter-plugin communication
**Pattern**: Mediated service access with permission validation
**Key Responsibility**: Prevent unauthorized plugin interactions

#### 4. Settings Manager (`src/core/settings-manager.ts`)
**Purpose**: Type-safe configuration management
**Pattern**: Hierarchical configuration with runtime validation
**Key Responsibility**: Consistent configuration across all components

### UI Layer

#### 5. Component Library (`src/ui/components/`)
**Purpose**: Reusable UI components with consistent styling
**Pattern**: Hybrid Tailwind + CSS Modules approach
**Key Responsibility**: Design system consistency

#### 6. Plugin UI Loader (`src/ui/plugin-ui-loader.ts`)
**Purpose**: Dynamic loading of plugin React components
**Pattern**: Lazy loading with error boundaries
**Key Responsibility**: Plugin UI isolation and error handling

#### 7. Navigation Service (`src/core/navigation-service.ts`)
**Purpose**: Centralized navigation state management
**Pattern**: Event-driven navigation with state persistence
**Key Responsibility**: Consistent navigation experience

---

## 🔄 Data Flow Patterns

### Configuration Flow
```
app.json5 → Settings Manager → Zod Validation → Component Props
    ↓
plugins.json5 → Plugin Registry → Plugin Context
    ↓  
plugin/config.json5 → Plugin Settings → Plugin Component
```

### Plugin Loading Flow
```
Plugin Discovery → Manifest Validation → Permission Check → UI Loading
       ↓                    ↓                    ↓             ↓
   Scan Folders    Validate JSON5      Check Registry    Dynamic Import
```

### Service Communication Flow
```
Plugin A → Service Request → Registry → Permission Check → Plugin B
    ↓            ↓              ↓              ↓             ↓
  useService   Serialize     Validate      Allow/Deny    Execute
```

### UI Rendering Flow
```
App Bootstrap → Component Loading → Plugin UI → Error Boundaries
      ↓              ↓                ↓              ↓
   Start React   Load Components   Render Plugins   Catch Errors
```

---

## 🎯 Integration Patterns

### 1. Plugin Integration Pattern
**When**: Adding new functionality to the system
**How**: Create plugin with manifest, implement interface, register services
**Example**: Adding a new dashboard widget or automation tool

```typescript
// Plugin Integration Template
export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  type: 'simple' | 'configured' | 'advanced';
  permissions: string[];
  services?: ServiceDefinition[];
}
```

### 2. Service Integration Pattern
**When**: Components need to communicate or share data
**How**: Register service with registry, define permission requirements
**Example**: Data sharing between plugins, cross-plugin notifications

```typescript
// Service Integration Template
interface ServiceDefinition {
  name: string;
  methods: string[];
  requiredPermissions: string[];
  implementation: ServiceImplementation;
}
```

### 3. UI Integration Pattern
**When**: Adding new user interface components
**How**: Use component library, follow styling strategy, implement responsive design
**Example**: New settings panels, dashboard components

```typescript
// UI Integration Template
import { Card, Button } from '@/ui/components';
export const NewFeature = () => (
  <Card>
    <Button variant="primary">Action</Button>
  </Card>
);
```

### 4. Configuration Integration Pattern
**When**: Components need configurable behavior
**How**: Define Zod schema, register with settings manager, provide defaults
**Example**: Plugin configuration, user preferences

```typescript
// Configuration Integration Template
const ConfigSchema = z.object({
  enabled: z.boolean().default(true),
  options: z.record(z.string()).default({})
});
```

---

## 🔒 Security Patterns

### 1. Plugin Sandboxing
**Pattern**: Plugins run in isolated contexts with limited permissions
**Implementation**: Manifest-based permission system + Service Registry mediation
**Security Boundary**: Plugin cannot access services without explicit permission

### 2. Configuration Validation  
**Pattern**: All external input validated against schemas
**Implementation**: Zod schema validation + runtime type checking
**Security Boundary**: Invalid configuration cannot reach application logic

### 3. Service Access Control
**Pattern**: All inter-component communication goes through controlled channels
**Implementation**: Service Registry with permission validation
**Security Boundary**: Components cannot bypass permission system

---

## 📊 Performance Patterns

### 1. Lazy Loading
**Pattern**: Components and plugins loaded only when needed
**Implementation**: Dynamic imports + React.lazy + Error boundaries
**Performance Benefit**: Faster initial load, reduced memory usage

### 2. Memoization
**Pattern**: Expensive calculations cached between renders
**Implementation**: React.useMemo + React.useCallback + custom memoization
**Performance Benefit**: Reduced CPU usage, smoother UI

### 3. Background Processing
**Pattern**: Heavy operations moved off the main thread
**Implementation**: Web Workers + Service Workers + async processing
**Performance Benefit**: Responsive UI during heavy operations

---

## 🧪 Testing Patterns

### 1. Component Isolation Testing
**Pattern**: Test components in isolation with mocked dependencies
**Implementation**: React Testing Library + Jest + Mock factories
**Benefit**: Fast, reliable tests that focus on component behavior

### 2. Plugin Testing Strategy
**Pattern**: Test plugins with mocked plugin context and services
**Implementation**: Mock usePluginContext + Mock service registry
**Benefit**: Plugin tests don't require full application context

### 3. Integration Testing Approach
**Pattern**: Test full user workflows across component boundaries
**Implementation**: Playwright + Real browser environment
**Benefit**: Catch integration issues that unit tests miss

---

## 📈 Scalability Patterns

### 1. Modular Architecture
**Pattern**: System composed of loosely coupled, independently testable modules
**Benefit**: Easy to add features, refactor components, scale team
**Implementation**: Plugin system + Service registry + Component library

### 2. Configuration-Driven Behavior
**Pattern**: Behavior controlled by configuration rather than code changes
**Benefit**: Customize behavior without rebuilding, A/B testing capability
**Implementation**: Hierarchical configuration + Runtime validation

### 3. Event-Driven Communication
**Pattern**: Components communicate through events rather than direct coupling
**Benefit**: Easy to add new listeners, decouple components
**Implementation**: Event bus + Typed events + Subscription management

---

## 🔄 Evolution Patterns

### 1. Backward Compatibility
**Pattern**: Changes should not break existing plugins or configurations
**Strategy**: Versioned APIs + Migration guides + Deprecation warnings
**Implementation**: Semantic versioning + Configuration migration scripts

### 2. Progressive Enhancement
**Pattern**: New features should enhance existing functionality, not replace it
**Strategy**: Feature flags + Graceful degradation + A/B testing
**Implementation**: Configuration-driven features + Fallback implementations

### 3. Data Migration
**Pattern**: Schema changes should be accompanied by migration strategies
**Strategy**: Version tracking + Automated migration + Rollback capability
**Implementation**: Migration scripts + Version detection + Backup strategies

---

## 🎯 Decision Framework

### When to Create a Plugin vs Core Feature
**Plugin if**:
- Feature is optional or use-case specific
- Feature could be implemented multiple ways
- Feature has external dependencies
- Feature is experimental or could be removed

**Core Feature if**:
- Required for basic application functionality
- Needed by multiple plugins
- Part of security or performance critical path
- Architectural component (navigation, settings, etc.)

### When to Use Service vs Direct Import
**Service if**:
- Cross-plugin communication
- Need permission control
- Stateful operations
- Resource sharing

**Direct Import if**:
- Pure utility functions
- Within same plugin/component
- Type definitions
- Constants

### When to Use CSS Modules vs Tailwind
**CSS Modules if**:
- Complex animations or transitions
- Component-specific styling logic
- Dynamic styling based on state
- Advanced CSS features (grid, flexbox layouts)

**Tailwind if**:
- Simple, utility-based styling
- Rapid prototyping
- Consistent spacing and colors
- Simple responsive design

---

## 📚 Related Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Detailed technical architecture
- **[PLUGIN_DEVELOPER_GUIDE.md](./PLUGIN_DEVELOPER_GUIDE.md)** - How to build plugins
- **[COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)** - UI component patterns
- **[SETTINGS_API.md](./SETTINGS_API.md)** - Configuration system details
- **[LEARNINGS.md](./LEARNINGS.md)** - Specific solutions and patterns

---

*This document represents the architectural foundation of Omnia. Changes to these patterns should be carefully considered and documented with migration strategies.*