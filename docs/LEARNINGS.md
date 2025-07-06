# LEARNINGS - Discovered Patterns and Solutions

This document captures patterns, solutions, and anti-patterns discovered through problem-solving cycles. It serves as the primary knowledge base for preventing duplicate work and applying proven solutions.

## 📋 How to Use This Document

### For Problem Solving
1. **Search first** - Use Ctrl+F to search for keywords related to your problem
2. **Check similar patterns** - Look for related issues that might apply
3. **Apply existing solutions** - Use proven patterns before creating new ones
4. **Document new discoveries** - Add new patterns when problems are solved

### Pattern Format
Each learning entry follows this structure:
```markdown
### [Pattern Name] Pattern ([Date])
- **Problem**: [Specific problem description]
- **Root Cause**: [Why this happens]
- **Solution**: [How to fix it]
- **Pattern**: [Reusable approach]
- **Anti-Pattern**: [What to avoid]
- **Code Example**: [Implementation details]
- **Documentation**: [Related docs and references]
```

---

## 🎯 Core System Patterns

### Plugin Loading Pattern (2024-07-06)
- **Problem**: Plugins failing to load with "module not found" errors
- **Root Cause**: Dynamic import paths not resolved correctly in build process
- **Solution**: Fixed import path resolution in plugin build pipeline
- **Pattern**: Always validate plugin manifest before attempting to load; use consistent import path structure
- **Anti-Pattern**: Don't rely on relative imports in plugin files
- **Code Example**:
```typescript
// ✅ CORRECT: Absolute imports from plugin root
import { PluginConfig } from './config-schema.js';

// ❌ WRONG: Relative imports that break in build
import { PluginConfig } from '../../../lib/schemas/plugin.js';
```
- **Documentation**: `docs/architecture/PLUGIN_DEVELOPER_GUIDE.md`, `docs/TROUBLESHOOTING.md`

### Settings Validation Pattern (2024-07-06)
- **Problem**: Configuration errors causing runtime failures
- **Root Cause**: Missing or invalid Zod schema validation
- **Solution**: Implement comprehensive schema validation with fallbacks
- **Pattern**: Always validate settings with Zod schemas; provide sensible defaults
- **Anti-Pattern**: Don't skip validation even for "simple" configuration
- **Code Example**:
```typescript
// ✅ CORRECT: Validated settings with defaults
const config = SettingsSchema.parse(userConfig);

// ❌ WRONG: Assuming config is valid
const config = userConfig as SettingsType;
```
- **Documentation**: `docs/architecture/SETTINGS_API.md`

### CSS Module Import Pattern (2024-07-06)
- **Problem**: CSS modules not loading in browser environment
- **Root Cause**: CSS modules need to be processed to JavaScript objects
- **Solution**: Build process converts CSS modules to JS imports
- **Pattern**: Import CSS modules normally; build process handles conversion
- **Anti-Pattern**: Don't manually convert CSS modules or use require()
- **Code Example**:
```typescript
// ✅ CORRECT: Standard CSS module import
import styles from './Component.module.css';

// ❌ WRONG: Manual require or conversion
const styles = require('./Component.module.css.js');
```
- **Documentation**: `docs/ui-ux/CSS_MODULE_FIX.md`, `docs/ui-ux/ASSET_LOADING.md`

---

## 🏗 Architecture Patterns

### Service Registry Pattern (2024-07-06)
- **Problem**: Plugins need to communicate with each other safely
- **Root Cause**: Direct plugin-to-plugin communication creates security risks
- **Solution**: Central service registry with permission validation
- **Pattern**: All inter-plugin communication goes through main application service registry
- **Anti-Pattern**: Don't allow direct plugin-to-plugin communication
- **Code Example**:
```typescript
// ✅ CORRECT: Through service registry
const service = useService('data-processor', ['read', 'write']);

// ❌ WRONG: Direct plugin access
import { processData } from '../other-plugin/processor';
```
- **Documentation**: `docs/architecture/PLUGIN_SYSTEM.md`

### Configuration Hierarchy Pattern (2024-07-06)
- **Problem**: Configuration scattered across multiple files without clear precedence
- **Root Cause**: No defined configuration loading order
- **Solution**: Hierarchical config system with clear override rules
- **Pattern**: app.json5 → plugins.json5 → plugin-specific configs
- **Anti-Pattern**: Don't create circular configuration dependencies
- **Documentation**: `docs/architecture/SETTINGS_API.md`

---

## 🎨 UI/UX Patterns

### Component Library Pattern (2024-07-06)
- **Problem**: Inconsistent UI components across the application
- **Root Cause**: Each component implementing its own styling and behavior
- **Solution**: Centralized component library with standardized props
- **Pattern**: Use shared components from `src/ui/components/`; follow design system
- **Anti-Pattern**: Don't create custom components for standard UI elements
- **Code Example**:
```typescript
// ✅ CORRECT: Using shared component
import { Button } from '@/ui/components';
<Button variant="primary" onClick={handleClick}>Save</Button>

// ❌ WRONG: Custom button implementation
<div className="custom-button" onClick={handleClick}>Save</div>
```
- **Documentation**: `docs/ui-ux/COMPONENT_LIBRARY.md`

### Hybrid Styling Pattern (2024-07-06)
- **Problem**: Choosing between Tailwind and CSS Modules for different use cases
- **Root Cause**: Different styling approaches work better for different component types
- **Solution**: Hybrid approach - Tailwind for simple components, CSS Modules for complex ones
- **Pattern**: Tailwind for primitives (Button, Input), CSS Modules for complex components (Dashboard, Settings)
- **Anti-Pattern**: Don't mix Tailwind and CSS Modules within the same component
- **Documentation**: `docs/ui-ux/STYLING_STRATEGY.md`

---

## 🔒 Security Patterns

### RLS Performance Pattern (Placeholder)
- **Problem**: Row Level Security policies causing slow queries
- **Root Cause**: auth.uid() called multiple times per query
- **Solution**: Wrap auth.uid() in SELECT statements
- **Pattern**: Use (SELECT auth.uid()) in RLS policies for caching
- **Anti-Pattern**: Don't call auth.uid() directly in RLS without SELECT wrapper
- **Documentation**: `docs/security/RLS_SECURITY_ANALYSIS.md`

### Plugin Permission Pattern (2024-07-06)
- **Problem**: Plugins requesting excessive or inappropriate permissions
- **Root Cause**: No granular permission system for plugin capabilities
- **Solution**: Manifest-based permission system with runtime validation
- **Pattern**: Declare required permissions in plugin.json5; validate at runtime
- **Anti-Pattern**: Don't grant blanket permissions to plugins
- **Documentation**: `docs/security/PLUGIN_SECURITY.md`

---

## 🗄 Database Patterns

### Migration Pattern (Placeholder)
- **Problem**: Database schema changes breaking existing functionality
- **Root Cause**: No systematic approach to schema evolution
- **Solution**: Version-controlled migrations with rollback capability
- **Pattern**: Create reversible migrations; test rollback procedures
- **Anti-Pattern**: Don't make breaking schema changes without migration path
- **Documentation**: `docs/database/MIGRATION_PATTERNS.md`

---

## 🧪 Testing Patterns

### Plugin Testing Pattern (2024-07-06)
- **Problem**: Plugins difficult to test in isolation
- **Root Cause**: Plugins depend on main application context
- **Solution**: Mock plugin context and service registry for testing
- **Pattern**: Test plugins with mocked usePluginContext and useService hooks
- **Anti-Pattern**: Don't test plugins by loading the entire application
- **Code Example**:
```typescript
// ✅ CORRECT: Mock plugin context
const mockContext = {
  pluginId: 'test-plugin',
  config: { setting: 'value' }
};
render(<PluginComponent />, { context: mockContext });
```
- **Documentation**: `docs/testing/PLUGIN_TESTING.md`

---

## 🔧 Development Patterns

### Error Handling Pattern (2024-07-06)
- **Problem**: Inconsistent error handling across components
- **Root Cause**: No standardized error handling approach
- **Solution**: Centralized error boundary with logging and user feedback
- **Pattern**: Use Error Boundaries for React components; log errors with context
- **Anti-Pattern**: Don't silently catch and ignore errors
- **Code Example**:
```typescript
// ✅ CORRECT: Proper error handling
try {
  await operation();
} catch (error) {
  logger.error('Operation failed', { context, error });
  showUserError('Operation failed. Please try again.');
}

// ❌ WRONG: Silent failure
try {
  await operation();
} catch (error) {
  // Ignoring error
}
```
- **Documentation**: `docs/development/DEBUGGING.md`

### Logging Pattern (2024-07-06)
- **Problem**: Debugging difficult due to inconsistent logging
- **Root Cause**: Console.log statements scattered throughout code
- **Solution**: Structured logging with proper levels and context
- **Pattern**: Use centralized logger with appropriate log levels
- **Anti-Pattern**: Don't use console.log in production code
- **Code Example**:
```typescript
// ✅ CORRECT: Structured logging
logger.info('Plugin loaded', { pluginId, version, loadTime });

// ❌ WRONG: Console logging
console.log('Plugin loaded:', pluginId);
```
- **Documentation**: `docs/development/LOGGING.md`

---

## 📝 Documentation Patterns

### Pattern Documentation Pattern (Meta!)
- **Problem**: Solved problems being forgotten and re-solved
- **Root Cause**: Solutions not captured in searchable format
- **Solution**: Systematic pattern documentation in LEARNINGS.md
- **Pattern**: Document every solved problem with reusable pattern format
- **Anti-Pattern**: Don't leave problem solutions undocumented
- **Documentation**: This document serves as the example

---

## 🔍 Search Keywords

For quick searching, here are common keywords and their related patterns:

- **Plugin**: Plugin Loading, Service Registry, Plugin Permission, Plugin Testing
- **CSS**: CSS Module Import, Hybrid Styling, Component Library
- **Performance**: RLS Performance, Database optimization patterns
- **Error**: Error Handling, Logging patterns
- **Security**: RLS Performance, Plugin Permission
- **Configuration**: Settings Validation, Configuration Hierarchy
- **Testing**: Plugin Testing, Error Handling patterns
- **Database**: Migration, RLS Performance patterns

---

## 📊 Pattern Metrics

### Most Referenced Patterns
1. Plugin Loading Pattern (referenced in 5+ solutions)
2. Settings Validation Pattern (referenced in 3+ solutions)
3. Component Library Pattern (referenced in 4+ solutions)

### Recently Added Patterns
- CSS Module Import Pattern (2024-07-06)
- Service Registry Pattern (2024-07-06)
- Error Handling Pattern (2024-07-06)

### Pattern Categories
- Architecture: 6 patterns
- UI/UX: 4 patterns  
- Security: 2 patterns (placeholders)
- Database: 1 pattern (placeholder)
- Testing: 2 patterns
- Development: 2 patterns

---

*Remember: This is a living document. Every problem solved should contribute a new pattern or validate an existing one. The goal is to never solve the same problem twice.*