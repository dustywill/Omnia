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

#### 2. **Settings Management Architecture** 🔄 NEXT
- [ ] Design configuration file structure (hybrid approach)
  - App config: `config/app.json5`
  - Plugin registry: `config/plugins.json5`  
  - Individual plugin configs: `config/plugins/{plugin-name}.json5`
- [ ] Create configuration manager API with Zod validation
- [ ] Implement config loading/saving with schema validation
- [ ] Set up plugin config discovery and registration
- [ ] Add permission system for plugin safety
- **Dependencies**: Schema system (completed)
- **Estimated Time**: 3-4 hours (increased due to permission system)
- **Priority**: CRITICAL - Foundation for everything else

#### 3. **Styling System Setup** 🔄 AFTER SETTINGS
- [ ] Install and configure Tailwind CSS with custom theme
- [ ] Set up CSS Modules integration (verify existing setup)
- [ ] Create design token system (colors, spacing, typography)
- [ ] Define hybrid styling strategy documentation and examples
- [ ] Create base CSS with Tailwind imports and custom properties
- **Dependencies**: None (can run parallel with settings)
- **Estimated Time**: 2-3 hours (increased for design tokens)
- **Priority**: HIGH - Needed before building components

### **Phase 2: Core Components (Medium Priority)**

#### 4. **Design System Components** 
- [ ] Build primitive components (Button, Input, Badge) - Tailwind-heavy
- [ ] Create layout components (Card, Grid, Sidebar) - Hybrid approach
- [ ] Implement Unus-inspired navigation (sidebar with Dashboard/Plugins/Settings)
- [ ] Build complex components (PluginCard, SettingsForm) - CSS Modules-heavy
- [ ] Create plugin card with status indicators and actions
- **Dependencies**: Styling system setup
- **Estimated Time**: 5-7 hours (increased for Unus-inspired design)
- **Priority**: HIGH - Core UI foundation

#### 5. **Plugin System Foundation**
- [ ] Create plugin manager with service registry
- [ ] Implement three-tier plugin architecture (Simple/Configured/Advanced)
- [ ] Build plugin communication system through service registry
- [ ] Add plugin permission system and validation
- [ ] Create plugin development hooks (usePluginConfig, useService)
- **Dependencies**: Settings architecture, design system
- **Estimated Time**: 4-5 hours
- **Priority**: HIGH - Core plugin functionality

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

#### 6. **Schema-Driven Settings Forms**
- [ ] Build automatic form generator from Zod schemas
- [ ] Create settings UI for app configuration using generated forms
- [ ] Implement plugin-specific settings forms with auto-generation
- [ ] Add form validation, error handling, and success feedback
- [ ] Create settings page in Unus-inspired sidebar navigation
- **Dependencies**: Settings architecture, design system, plugin system
- **Estimated Time**: 4-5 hours (increased for auto-generation complexity)
- **Priority**: HIGH - Essential for plugin configuration

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

### **Phase 1 Complete When:**
- [ ] Hybrid configuration system loads and validates all configs with Zod
- [ ] Plugin permission system prevents unauthorized access
- [ ] Tailwind + CSS Modules hybrid styling works in build
- [ ] Design tokens and styling patterns are documented

### **Phase 2 Complete When:**
- [ ] Unus-inspired sidebar navigation is functional
- [ ] Plugin service registry enables inter-plugin communication
- [ ] Three-tier plugin architecture supports all plugin types
- [ ] Core components work with hybrid styling approach

### **Phase 3 Complete When:**
- [ ] Settings forms auto-generate from Zod schemas
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

**Immediate Next Step**: Begin implementing **Settings Management Architecture**
- Design hybrid configuration file structure (app.json5, plugins.json5, plugins/*.json5)
- Create configuration manager with Zod validation and error handling
- Implement plugin permission system for safety
- Add config loading/saving with schema validation

This forms the foundation that the entire new architecture will build upon.

## **Key Architectural Decisions Implemented**

Refer to [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) for complete rationale, but key decisions include:

- **Zod schemas** for type-safe configuration with runtime validation
- **Hybrid styling** combining Tailwind CSS utilities with CSS Modules for complex components
- **Service registry pattern** for safe plugin-to-plugin communication
- **Three-tier plugin architecture** supporting simple to advanced plugin development
- **Unus-inspired UI** with sidebar navigation and single-plugin focus
- **Reusable component library** designed for use in future applications

These decisions prioritize developer experience, safety, and long-term maintainability while building a solid foundation for plugin-based application development.