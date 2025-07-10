# WORK: Plugin Loading JSX Runtime Issue

**Date**: 2025-07-10
**Status**: PLANNING

## 🎯 Problem Statement

Error: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: <div />. Did you accidentally export a JSX literal instead of a component?"

This error occurs when trying to load plugins in the Omnia application. The console shows pluginModule.default is a function that returns JSX, but the error suggests JSX is being returned directly instead of a component function.

## 🔍 Root Cause Analysis

**Symptom**: Plugin UI components fail to render with "Element type is invalid" error
**Root Cause**: JSX Runtime configuration mismatch between plugin compilation and runtime execution
**Evidence**:
- Plugin builds successfully: `dist/plugins/test-simple/index.js` contains compiled JSX using `react/jsx-runtime`
- Plugin exports default React component correctly: `export default TestSimple;`
- Plugin is registered and enabled in `config/plugins.json5`
- Plugin loading process successfully imports the module
- Runtime error occurs when React tries to render the component

**Technical Analysis**:
1. **Plugin Compilation**: Uses `tsconfig.plugins.json` with `"jsx": "react-jsx"` which generates JSX runtime imports
2. **Runtime Environment**: The plugin UI loader intercepts imports and provides JSX runtime mapping
3. **JSX Runtime Mismatch**: The plugin UI loader maps `react/jsx-runtime` to `React.createElement` but the compiled plugin expects the actual JSX runtime functions

**Affected Systems**:
- Components: Plugin UI rendering system
- Services: Plugin loading and module resolution
- Build Process: TSConfig for plugins uses modern JSX transform

## 📚 Required Documentation

### Primary Documentation (Read First)
- **Plugin Loading**: `docs/architecture/PLUGIN_DEVELOPER_GUIDE.md` - Plugin structure and loading process
- **Asset Loading**: `docs/ui-ux/ASSET_LOADING.md` - How assets and modules are processed
- **Build Process**: `CLAUDE.md` - Build process and TypeScript configuration

### Supporting Documentation
- **LEARNINGS.md**: Plugin Loading Pattern and Plugin Import Error Handling Pattern
- **SYSTEMS.md**: Module system and build process patterns
- **Previous Issues**: Pattern #46 - Plugin Import Error Handling Pattern addresses similar module loading issues

### Code References
- **Current Implementation**: `src/ui/plugin-ui-loader.ts` - JSX runtime mapping
- **Plugin Manager**: `src/core/enhanced-plugin-manager.ts` - Plugin module loading
- **Build Config**: `tsconfig.plugins.json` - Plugin compilation settings

## 🛠 Solution Design

**Strategy**: Fix JSX runtime mapping in plugin UI loader to properly handle modern JSX transform
**Patterns to Apply**: 
- Plugin Import Error Handling Pattern from LEARNINGS.md
- Modern JSX Runtime support for plugin compilation
- Proper module resolution for compiled plugins

**Root Fix**: Update plugin UI loader to correctly map JSX runtime functions instead of falling back to React.createElement

**Database Changes**: None required
**Validation Approach**: 
1. Test plugin loading with simple plugin
2. Verify JSX elements render correctly
3. Check console for runtime errors
4. Validate all plugin types (simple, configured, advanced)

**Potential Risks**: 
- Breaking changes to existing plugin loading
- Runtime performance impact from JSX mapping
- Compatibility issues with different React versions

## ⚠ Common Violations to Prevent

- **Console.log**: All debugging statements must be wrapped in `if (__DEV__)`
- **Error Handling**: All catch blocks must import and use logger
- **Type Safety**: No 'any' types, especially in catch blocks
- **Import Order**: React → Third-party → Internal → Relative

## 📋 Implementation Requirements

### Required Actions
1. **Fix JSX Runtime Mapping** - Update plugin UI loader to properly handle react/jsx-runtime imports
2. **Update JSX Transform** - Ensure plugin compilation uses correct JSX runtime configuration
3. **Add Error Handling** - Implement proper error boundaries and validation for plugin JSX
4. **Test Plugin Loading** - Verify all plugin types load and render correctly

### Success Criteria
- [ ] test-simple plugin loads without JSX runtime errors
- [ ] Plugin components render correctly in UI
- [ ] All plugin types (simple, configured, advanced) work correctly
- [ ] Build process maintains proper JSX runtime compilation
- [ ] No console errors related to JSX runtime or plugin loading

### Risk Mitigation
- **Risk**: Breaking existing plugin loading - **Mitigation**: Test all existing plugins after changes
- **Risk**: Performance degradation from JSX mapping - **Mitigation**: Benchmark plugin loading times
- **Risk**: JSX runtime compatibility issues - **Mitigation**: Use React's official JSX runtime API

## 🔬 SOLUTION VALIDATION

### Technical Feasibility
- **Complexity Assessment**: Medium - requires understanding of JSX runtime and module resolution
- **Resource Requirements**: 2-3 hours, React and TypeScript expertise
- **Technology Constraints**: Must work with existing React version and Electron environment
- **Integration Points**: Plugin UI loader, module resolution, build process

### Risk Analysis
- **Technical Risks**: JSX runtime mapping complexity, potential breaking changes
- **Performance Impact**: Minimal - only affects plugin loading performance
- **Breaking Changes**: Could affect existing plugin loading if not implemented carefully
- **Rollback Strategy**: Revert JSX runtime mapping changes, fallback to React.createElement

### Alternative Approaches
1. **Primary Solution**: Fix JSX runtime mapping in plugin UI loader (recommended)
2. **Alternative 1**: Change plugin compilation to use classic JSX transform (less modern)
3. **Alternative 2**: Create custom JSX runtime wrapper for plugins (more complex)

## 📋 HANDOFF TO COORDINATOR

### Implementation Summary
- **Core Changes Required**: Update plugin UI loader JSX runtime mapping, test plugin loading
- **Estimated Complexity**: 2-3 hours
- **Skill Requirements**: React JSX runtime, TypeScript module resolution, plugin architecture
- **External Dependencies**: React JSX runtime API, TypeScript compilation

### Quality Requirements
- **Testing Strategy**: Test all plugin types, verify JSX rendering, check console for errors
- **Performance Benchmarks**: Plugin loading time should remain under 500ms
- **Security Considerations**: Maintain plugin sandboxing and permission validation
- **Documentation Updates**: Update plugin developer guide if JSX usage changes

## 🎨 SOLUTION DETAILS

### JSX Runtime Issue Analysis
The problem is in `src/ui/plugin-ui-loader.ts` line 65-71:
```typescript
if (specifier === 'react/jsx-runtime') {
  return { 
    jsx: React.createElement,  // ❌ WRONG - jsx expects (type, props, key) signature
    jsxs: React.createElement, // ❌ WRONG - jsxs expects (type, props, key) signature
    Fragment: React.Fragment
  };
}
```

**The Fix**: JSX runtime functions have different signatures than React.createElement:
- `jsx(type, props, key)` vs `React.createElement(type, props, ...children)`
- `jsxs(type, props, key)` vs `React.createElement(type, props, ...children)`

### Correct Implementation
```typescript
if (specifier === 'react/jsx-runtime') {
  return {
    jsx: (type: any, props: any, key?: any) => {
      const { children, ...otherProps } = props || {};
      return React.createElement(type, key ? { ...otherProps, key } : otherProps, children);
    },
    jsxs: (type: any, props: any, key?: any) => {
      const { children, ...otherProps } = props || {};
      return React.createElement(type, key ? { ...otherProps, key } : otherProps, children);
    },
    Fragment: React.Fragment
  };
}
```

### Testing Plan
1. Test simple plugin loading (test-simple)
2. Test configured plugin loading (customer-links)
3. Test advanced plugin loading (script-runner)
4. Verify JSX elements render correctly
5. Check for console errors during plugin loading
6. Test plugin interaction (button clicks, etc.)

This root cause analysis identifies the exact issue and provides a clear solution path for the COORDINATOR to implement.