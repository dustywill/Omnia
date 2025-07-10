# WORK: Plugin Loading Error - React JSX Runtime Import Issue

**Date**: 2025-01-10
**Status**: PLANNING

## 🎯 Problem Statement

Plugins are not loading correctly in the UI, showing the error: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: <div />." The test-simple plugin appears to load but returns something that's not a valid React component.

## 🔍 Root Cause Analysis

- **Symptom**: When loading plugins, React throws an error saying the element type is invalid, suggesting it received a JSX literal instead of a component
- **Root Cause**: The compiled plugins are importing from `react/jsx-runtime` which is not being resolved in the browser environment. When this import fails, the module likely returns an empty object or invalid value instead of the actual component.
- **Evidence**: 
  - In `dist/plugins/test-simple/index.js`, the compiled code imports: `import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";`
  - The plugin-ui-loader.ts doesn't handle `react/jsx-runtime` imports
  - The EnhancedPluginManager shows module validation but the empty module check might not catch this specific failure pattern
- **Affected Systems**:
  - Components: All plugin components that use JSX
  - Services: Plugin loading system (EnhancedPluginManager, plugin-ui-loader)
  - Build Process: TypeScript compilation and import fixing scripts

## 📚 Required Documentation

### Primary Documentation (Read First)

- **For Plugin Loading**: `docs/architecture/PLUGIN_DEVELOPER_GUIDE.md` - Understanding plugin architecture
- **Architecture Pattern**: `docs/architecture/PLUGIN_SYSTEM.md` - Plugin loading lifecycle
- **Asset Loading**: `docs/ui-ux/ASSET_LOADING.md` - How assets and modules are loaded

### Supporting Documentation

- **LEARNINGS.md**: Entry on "Plugin Import Error Handling Pattern" - Shows how empty modules indicate import errors
- **CLAUDE.md**: Build process section explains CSS module processing but not React runtime handling

### Code References

- **Plugin Loading**: `src/core/enhanced-plugin-manager.ts` - Lines 256-275 show module loading and validation
- **UI Loading**: `src/ui/plugin-ui-loader.ts` - Lines 21-60 show import interception but missing react/jsx-runtime
- **Component Extraction**: `src/ui/views/PluginDetailView.tsx` - Lines 47-127 show component extraction strategies

## 🛠 Solution Design

- **Strategy**: Add support for `react/jsx-runtime` imports in the plugin loading system
- **Patterns to Apply**: 
  - Import interception pattern from plugin-ui-loader.ts
  - Module validation pattern from EnhancedPluginManager
- **Build Process Changes**: Update fix-plugin-imports.js to rewrite react/jsx-runtime imports
- **Validation Approach**: Test with test-simple plugin and verify all plugins load correctly
- **Potential Risks**: 
  - Other React runtime imports might also need handling
  - Build process changes could affect existing plugins

## ⚠ Common Violations to Prevent

- **Error Handling**: Ensure all import failures are caught and logged with clear messages
- **Type Safety**: Maintain proper typing for React runtime imports
- **Import Order**: React runtime must be available before plugin code executes

## 📋 Implementation Requirements

### Required Actions
1. **Update plugin-ui-loader.ts** - Add import interception for 'react/jsx-runtime' that maps to React's JSX functions
2. **Enhance fix-plugin-imports.js** - Rewrite react/jsx-runtime imports to use a browser-compatible approach
3. **Update build configuration** - Ensure TypeScript compiles JSX in a way that's compatible with browser loading
4. **Add validation** - Enhance module validation to catch JSX runtime import failures explicitly

### Success Criteria
- [ ] test-simple plugin loads and displays correctly
- [ ] All existing plugins continue to work
- [ ] Clear error messages when JSX runtime imports fail
- [ ] No React element type errors in the console

### Risk Mitigation
- **Risk**: Other React 18+ runtime imports might fail - **Mitigation**: Audit all compiled plugin code for import patterns
- **Risk**: Build process changes break existing functionality - **Mitigation**: Test all plugins after implementation
- **Risk**: Performance impact from import interception - **Mitigation**: Only intercept known problematic imports

## 📋 HANDOFF TO COORDINATOR

### Implementation Summary
- **Core Changes Required**: Update import interception in plugin-ui-loader.ts, enhance fix-plugin-imports.js script
- **Estimated Complexity**: 2-3 hours (Medium - affects critical plugin loading path)
- **Skill Requirements**: React JSX internals, ES module loading, build tooling
- **External Dependencies**: None - uses existing React installation

### Quality Requirements
- **Testing Strategy**: Load all plugins and verify they render correctly, check console for errors
- **Performance Benchmarks**: Plugin loading should not be slower than before
- **Security Considerations**: Only intercept known safe imports, don't expose internal React APIs
- **Documentation Updates**: Update LEARNINGS.md with JSX runtime pattern, update plugin developer guide

## 🔬 SOLUTION VALIDATION

### Technical Feasibility
- **Complexity Assessment**: Medium - requires understanding of React's JSX transform
- **Resource Requirements**: 2-3 hours, React and build system expertise
- **Technology Constraints**: Must work in both browser and Electron environments
- **Integration Points**: Plugin loading system, build process, all plugin components

### Risk Analysis
- **Technical Risks**: JSX runtime handling might vary between React versions
- **Performance Impact**: Minimal - only affects initial plugin load
- **Breaking Changes**: None if implemented correctly
- **Rollback Strategy**: Revert changes to plugin-ui-loader.ts and fix-plugin-imports.js

### Alternative Approaches
1. **Primary Solution**: Add react/jsx-runtime to import interception (recommended - least invasive)
2. **Alternative 1**: Change TypeScript JSX compilation to classic mode (requires all plugins rebuild)
3. **Alternative 2**: Bundle React runtime with each plugin (increases plugin size significantly)