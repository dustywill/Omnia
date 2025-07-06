# Omnia Implementation Plan

This document outlines the priority order and dependencies for implementing the new UI architecture and component system for Omnia.

**📋 See [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) for detailed architectural decisions and rationale.**

## Architecture Overview

Based on our design decisions, Omnia will implement:

- **🔧 Zod-based configuration system** with hybrid settings management
- **🎨 Hybrid styling** using Tailwind CSS + CSS Modules
- **🧩 Three-tier plugin architecture** with service registry communication
- **🎭 Unus-inspired UI** with sidebar navigation and single-plugin focus
- **📋 Schema-driven forms** for automatic settings UI generation
- **🛠️ Reusable component library** for future applications

## Current Todo Items (Prioritized)

### **Phase 1: Foundation (High Priority)**

#### 1. **Schema System** ✅ COMPLETED
- [x] Create Zod schemas for app configuration
- [x] Create Zod schemas for plugin manifests  
- [x] Create Zod schemas for plugin configurations
- **Status**: Complete - All three sub-agents have converted the ttCommander schemas to Zod format
- **Location**: `src/lib/schemas/`

#### 2. **Settings Management Architecture** ✅ COMPLETED
- [x] Design configuration file structure (hybrid approach)
  - App config: `config/app.json5`
  - Plugin registry: `config/plugins.json5`  
  - Individual plugin configs: `config/plugins/{plugin-name}.json5`
- [x] Create configuration manager API with Zod validation
- [x] Implement config loading/saving with schema validation
- [x] Set up plugin config discovery and registration
- [x] Add permission system for plugin safety
- **Status**: Complete - SettingsManager class implemented with comprehensive test suite
- **Location**: `src/core/settings-manager.ts`
- **Documentation**: [Settings API Guide](./SETTINGS_API.md)

#### 3. **Styling System Setup** ✅ COMPLETED
- [x] Install and configure Tailwind CSS with custom theme using existing color palette
- [x] Set up CSS Modules integration (enhanced CSS loader)
- [x] Create design token system incorporating existing color palette (colors, spacing, typography)
- [x] Define hybrid styling strategy documentation and examples
- [x] Create base CSS with Tailwind imports and custom properties
- [x] Integrate comprehensive color palette from design guidelines
- **Status**: Complete - Full hybrid styling system implemented with existing color palette
- **Location**: 
  - `tailwind.config.js` - Tailwind configuration with color palette
  - `src/ui/styles/variables.css` - CSS custom properties and design tokens
  - `src/ui/styles/tailwind.css` - Tailwind base + component classes
  - `loaders/css-loader.js` - Enhanced CSS processing for both Tailwind and CSS Modules
  - `docs/STYLING_STRATEGY.md` - Comprehensive hybrid styling guide
- **Documentation**: [Styling Strategy Guide](./STYLING_STRATEGY.md)

### **Phase 2: Core Components (Medium Priority)**

#### 4. **Design System Components** ✅ COMPLETED
- [x] Build primitive components (Button, Input, Badge) - Tailwind-heavy
- [x] Create layout components (Card, Grid, Sidebar) - Hybrid approach
- [x] Implement Unus-inspired navigation (sidebar with Dashboard/Plugins/Settings)
- [x] Build complex components (PluginCard, SettingsForm) - CSS Modules-heavy
- [x] Create plugin card with status indicators and actions
- [x] Set up TypeScript declarations for CSS modules
- [x] Implement comprehensive component library with 9 production-ready components
- [x] Create complete component documentation and usage examples
- **Status**: Complete - Full component library implemented using hybrid styling approach
- **Components Built**:
  - **Primitive Components**: Button (7 variants), Input (validation support), Badge (7 color variants)
  - **Layout Components**: Card (hover effects), Grid (responsive), Sidebar (animations)
  - **Navigation Components**: AppNavigation (Unus-inspired sidebar)
  - **Complex Components**: PluginCard (status indicators, animations), SettingsForm (schema-driven)
- **Location**:
  - `src/ui/components/Button/` - Primary button component with 7 variants and 3 sizes
  - `src/ui/components/Input/` - Form input with validation states, labels, error handling
  - `src/ui/components/Badge/` - Status and category badges with 7 semantic colors
  - `src/ui/components/Card/` - Interactive card layout component with elevation and hover effects
  - `src/ui/components/Grid/` - Responsive grid layout system
  - `src/ui/components/Sidebar/` - Navigation sidebar with smooth animations
  - `src/ui/components/AppNavigation/` - Unus-inspired app navigation with Dashboard/Plugins/Settings
  - `src/ui/components/PluginCard/` - Complex plugin management card with status indicators and permissions
  - `src/ui/components/SettingsForm/` - Schema-driven settings form with Zod validation
  - `src/ui/components/index.ts` - Component library exports
  - `src/types/css-modules.d.ts` - TypeScript CSS module declarations
- **Documentation**: [Component Library Guide](./COMPONENT_LIBRARY.md)

#### 5. **Plugin System Foundation** ✅ COMPLETED
- [x] Create plugin manager with service registry
- [x] Implement three-tier plugin architecture (Simple/Configured/Advanced)
- [x] Build plugin communication system through service registry
- [x] Add plugin permission system and validation
- [x] Create plugin development hooks (usePluginConfig, useService, usePluginContext)
- **Status**: Complete - Enhanced Plugin Manager with Service Registry implemented
- **Location**: 
  - Core: `src/core/enhanced-plugin-manager.ts`, `src/core/service-registry.ts`
  - Hooks: `src/hooks/usePluginConfig.ts`, `src/hooks/useService.ts`, `src/hooks/usePluginContext.ts`
  - Examples: `examples/plugins/` (simple, configured, advanced plugin templates)
- **Features**: 
  - Service registry for secure plugin-to-plugin communication
  - Permission-based security for all operations
  - Type-safe service definitions with parameter validation
  - Complete plugin lifecycle management
  - Production-ready example plugins for all three tiers

#### 7. **UI Library Structure & Documentation**
- [ ] Create reusable component library structure for future applications
- [ ] Set up component export system and index files
- [ ] Create component documentation and usage examples
- [ ] Implement component testing framework
- [ ] Document hybrid styling patterns and best practices
- **Dependencies**: Design system components, plugin system
- **Estimated Time**: 3-4 hours
- **Priority**: MEDIUM - Supports long-term reusability

### **Phase 3: Application Features (Medium Priority)**

#### 8. **Plugin Migration & Enhancement**
- [ ] Migrate existing plugins to new three-tier architecture
- [ ] Convert script-runner to hybrid plugin with service registry
- [ ] Convert file-scanner to service plugin with background processing
- [ ] Update customer-links and as-built-documenter to configured plugins
- [ ] Test plugin communication through service registry
- **Dependencies**: Plugin system foundation
- **Estimated Time**: 3-4 hours
- **Priority**: MEDIUM - Validate architecture with real plugins

#### 6. **Schema-Driven Settings Forms** ✅ COMPLETED
- [x] Build automatic form generator from Zod schemas
- [x] Create settings UI for app configuration using generated forms
- [x] Implement plugin-specific settings forms with auto-generation
- [x] Add form validation, error handling, and success feedback
- [x] Create settings page in Unus-inspired sidebar navigation
- **Status**: Complete - Full schema-driven settings system implemented
- **Location**: 
  - `src/ui/components/SchemaForm/` - Advanced Zod schema introspection and form generation
  - `src/ui/components/AppSettings/` - Comprehensive app configuration interface
  - `src/ui/components/PluginSettings/` - Plugin-specific configuration management
  - `src/ui/components/SettingsPage/` - Main settings page with tabbed navigation
- **Features**: 
  - **Automatic Form Generator**: Advanced Zod schema introspection creates appropriate input types
  - **Multi-section Layout**: Organized into Application, Logging, Window, and Plugin settings
  - **Real-time Validation**: Live validation with error highlighting and detailed feedback
  - **Three-tier Support**: Handles Simple, Configured, and Advanced plugin configurations
  - **Dynamic Schema Generation**: Creates appropriate schemas based on plugin type
  - **Plugin State Management**: Enable/disable plugins with integrated status tracking
  - **Unus-inspired Interface**: Tabbed navigation with App Settings, Plugin Settings, and System Settings
  - **Responsive Design**: Mobile-friendly with collapsible navigation
  - **Type Safety**: Full TypeScript integration with schema-driven types
  - **Advanced Constraints**: Support for min/max values, patterns, enums, arrays, and custom validation
  - **Success Feedback**: Clear indication of save status and unsaved changes tracking

## **Recommended Implementation Order**

### **Week 1: Foundation**
1. **Day 1-2**: Settings Management Architecture
   - Hybrid config file structure (app/plugins separation)
   - Configuration manager with Zod validation
   - Plugin permission system
   - Config loading/saving with safety checks

2. **Day 2-3**: Styling System Setup  
   - Tailwind CSS installation and custom theme
   - CSS Modules verification and integration
   - Design token system (colors, spacing, typography)
   - Hybrid styling documentation and examples

### **Week 2: Core Systems**
3. **Day 4-5**: Design System Components
   - Primitive components (Tailwind-focused)
   - Layout components (hybrid approach)
   - Unus-inspired navigation with sidebar
   - Complex components (CSS Modules-focused)

4. **Day 6-7**: Plugin System Foundation
   - Plugin manager with service registry
   - Three-tier plugin architecture
   - Plugin communication system
   - Permission validation and safety

### **Week 3: Application Features**
5. **Day 8-9**: Settings Forms & UI Integration
   - Schema-driven form generation
   - Settings UI with sidebar navigation
   - Plugin configuration forms
   - Form validation and error handling

6. **Day 10-11**: Plugin Migration & Testing
   - Migrate existing plugins to new architecture
   - Test service registry communication
   - Validate permission system
   - Component library organization

7. **Day 12**: Documentation & Polish
   - Component documentation
   - Plugin development guide
   - Architecture documentation
   - Testing and validation

## **Dependencies Map**

```
Schema System (✅ Complete)
    ↓
Settings Architecture ← → Styling Setup
    ↓                        ↓
Design System Components ← ←
    ↓                        ↓
Plugin System Foundation ← ←
    ↓
Settings Forms + Plugin Migration
    ↓
UI Library Structure & Documentation
```

## **New Architecture Components**

```
Omnia Application
├── Configuration System (Zod + Hybrid Files)
├── Plugin Manager (Service Registry + Permissions)
├── UI System (Tailwind + CSS Modules + Unus Design)
├── Component Library (Reusable + Future Applications)
└── Plugin Architecture (3-Tier + Communication)
```

## **Parallel Work Opportunities**

These can be worked on simultaneously:
- **Settings Architecture** + **Styling Setup** (no dependencies between them)
- **Component Documentation** while building **Design System Components**
- **Testing Setup** while implementing **UI Library Structure**

## **Success Criteria**

### **Phase 1 Complete When:** ✅ COMPLETE
- [x] Hybrid configuration system loads and validates all configs with Zod
- [x] Plugin permission system prevents unauthorized access
- [x] Tailwind + CSS Modules hybrid styling works in build
- [x] Design tokens and styling patterns are documented
- **Status**: All Phase 1 foundation work complete - ready for Phase 2 components

### **Phase 2 Complete When:**
- [x] Unus-inspired sidebar navigation is functional ✅ COMPLETE
- [x] Core components work with hybrid styling approach ✅ COMPLETE
- [x] Component library provides reusable UI foundation ✅ COMPLETE
- [x] Plugin service registry enables inter-plugin communication ✅ COMPLETE
- [x] Three-tier plugin architecture supports all plugin types ✅ COMPLETE

### **Phase 3 Complete When:**
- [x] Settings forms auto-generate from Zod schemas ✅ COMPLETE
- [x] Schema-driven settings UI provides complete configuration management ✅ COMPLETE
- [x] App settings, plugin settings, and system settings are fully integrated ✅ COMPLETE
- [ ] Existing plugins work with new architecture
- [ ] Plugin communication through service registry is validated
- [ ] Component library is organized for reuse in future applications

## **Risk Mitigation**

**High Risk Items:**
1. **Plugin Service Registry** - Complex inter-plugin communication system
   - *Mitigation*: Start with simple service examples, build complexity gradually
2. **Permission System** - Balancing safety with functionality
   - *Mitigation*: Implement basic permissions first, enhance based on real usage
3. **Schema-Form Integration** - Auto-generating complex forms from Zod schemas
   - *Mitigation*: Build incrementally, test with simple schemas first

**Medium Risk Items:**
1. **Hybrid Styling** - Tailwind + CSS Modules integration and consistency
   - *Mitigation*: Document clear patterns, test with core components first
2. **Three-Tier Plugin Architecture** - Complexity of supporting multiple plugin types
   - *Mitigation*: Implement tiers incrementally, validate with existing plugins
3. **Component Reusability** - Making components work across future applications
   - *Mitigation*: Define clear component API contracts and design tokens early

## **Next Action**

**Immediate Next Step**: Begin implementing **Plugin Migration & Enhancement** (Phase 3, Item 8)
- Migrate existing plugins to new three-tier architecture
- Convert script-runner to hybrid plugin with service registry
- Convert file-scanner to service plugin with background processing
- Update customer-links and as-built-documenter to configured plugins
- Test plugin communication through service registry

With the foundational systems (Settings Management, Styling System), **complete Design System Components**, **complete Plugin System Foundation**, and **complete Schema-Driven Settings Forms** now finished, we have a robust foundation ready for plugin migration. The system provides:

- **12 production-ready components** following the hybrid styling approach
- **Complete TypeScript support** with exported interfaces
- **Comprehensive documentation** with usage examples
- **Unus-inspired navigation** ready for plugin integration
- **Schema-driven forms** with automatic UI generation from Zod schemas
- **Complete settings management** with app, plugin, and system configuration
- **Complex plugin cards** ready for plugin management interfaces
- **Full plugin system** with service registry and three-tier architecture
- **Production-ready plugin examples** for all complexity levels
- **Real-time validation** with detailed error messages and success feedback
- **Advanced schema introspection** for automatic form field generation
- **Multi-level configuration interface** with tabbed navigation (App/Plugin/System settings)
- **Plugin state management** with enable/disable functionality and status tracking

## **Key Architectural Decisions Implemented**

Refer to [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) for complete rationale, but key decisions include:

- **Zod schemas** for type-safe configuration with runtime validation
- **Hybrid styling** combining Tailwind CSS utilities with CSS Modules for complex components
- **Service registry pattern** for safe plugin-to-plugin communication
- **Three-tier plugin architecture** supporting simple to advanced plugin development
- **Unus-inspired UI** with sidebar navigation and single-plugin focus
- **Reusable component library** designed for use in future applications

These decisions prioritize developer experience, safety, and long-term maintainability while building a solid foundation for plugin-based application development.