# IMPLEMENTATION PLAN: Plugin JSX Runtime Fix

**Date**: 2025-07-10
**Coordinator**: Claude Code
**Status**: READY FOR EXECUTION

## 📋 Executive Summary

**Problem**: Plugin UI components fail to render with "Element type is invalid" error due to JSX runtime mapping issues in the plugin UI loader.

**Root Cause**: The `src/ui/plugin-ui-loader.ts` incorrectly maps JSX runtime functions to `React.createElement`, but JSX runtime functions have different signatures than `React.createElement`.

**Solution**: Fix JSX runtime mapping to properly handle `jsx()` and `jsxs()` function signatures and convert them to correct `React.createElement` calls.

## 🎯 Implementation Tasks

### Task 1: Fix JSX Runtime Mapping (HIGH PRIORITY)

**File**: `/mnt/c/users/byron/documents/projects/byron/Omnia/src/ui/plugin-ui-loader.ts`
**Lines**: 65-71
**Type**: Critical Bug Fix

**Current Code (BROKEN)**:
```typescript
if (specifier === 'react/jsx-runtime') {
  return { 
    jsx: React.createElement,  // ❌ Wrong signature
    jsxs: React.createElement, // ❌ Wrong signature
    Fragment: React.Fragment
  };
}
```

**Fixed Code**:
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

**Technical Details**:
- JSX runtime functions expect `jsx(type, props, key)` signature
- `React.createElement` expects `createElement(type, props, ...children)`
- Need to extract `children` from `props` and pass separately
- Handle optional `key` parameter correctly

### Task 2: Add Debug Logging (MEDIUM PRIORITY)

**File**: `/mnt/c/users/byron/documents/projects/byron/Omnia/src/ui/plugin-ui-loader.ts`
**Lines**: Around 65-71
**Type**: Enhancement

**Code Addition**:
```typescript
if (specifier === 'react/jsx-runtime') {
  console.log(`[loadPluginUI] Providing JSX runtime mapping for ${id}`);
  return {
    jsx: (type: any, props: any, key?: any) => {
      console.log(`[loadPluginUI] JSX runtime jsx() called:`, { type, props, key });
      const { children, ...otherProps } = props || {};
      return React.createElement(type, key ? { ...otherProps, key } : otherProps, children);
    },
    jsxs: (type: any, props: any, key?: any) => {
      console.log(`[loadPluginUI] JSX runtime jsxs() called:`, { type, props, key });
      const { children, ...otherProps } = props || {};
      return React.createElement(type, key ? { ...otherProps, key } : otherProps, children);
    },
    Fragment: React.Fragment
  };
}
```

**Purpose**: Help troubleshoot JSX runtime issues during development

### Task 3: Create Unit Tests (MEDIUM PRIORITY)

**File**: `/mnt/c/users/byron/documents/projects/byron/Omnia/tests/ui/plugin-ui-loader.test.tsx`
**Type**: Test Enhancement

**Test Cases to Add**:
```typescript
describe('JSX Runtime Mapping', () => {
  it('should map jsx function correctly', () => {
    // Test jsx function signature and behavior
  });
  
  it('should map jsxs function correctly', () => {
    // Test jsxs function signature and behavior
  });
  
  it('should handle children prop correctly', () => {
    // Test children extraction and passing
  });
  
  it('should handle key prop correctly', () => {
    // Test key handling in JSX runtime
  });
});
```

### Task 4: Test Plugin Loading (HIGH PRIORITY)

**Test Plan**:
1. **test-simple plugin**: Verify basic JSX rendering works
2. **customer-links plugin**: Test configured plugin with JSX elements
3. **script-runner plugin**: Test advanced plugin with complex JSX

**Test Commands**:
```bash
# Build and test in Electron environment
npm run electron

# Run unit tests
npm test -- plugin-ui-loader.test.tsx

# Run E2E tests
npm run test:e2e
```

**Success Criteria**:
- No "Element type is invalid" errors in console
- Plugin UI components render correctly
- Plugin interactions work (button clicks, etc.)
- No performance degradation

### Task 5: Performance Benchmarking (LOW PRIORITY)

**File**: Create `/mnt/c/users/byron/documents/projects/byron/Omnia/tests/performance/plugin-loading.test.ts`
**Type**: Performance Test

**Benchmark Requirements**:
- Plugin loading time < 500ms
- JSX runtime mapping overhead < 10ms
- Memory usage within acceptable limits

## 🔧 Technical Implementation Details

### JSX Runtime Function Signatures

**JSX Runtime** (what compiled plugins expect):
```typescript
jsx(type: ElementType, props: Props, key?: Key): ReactElement
jsxs(type: ElementType, props: Props, key?: Key): ReactElement
```

**React.createElement** (what we need to call):
```typescript
createElement(type: ElementType, props: Props, ...children: ReactNode[]): ReactElement
```

### Key Differences

1. **Children Handling**: JSX runtime puts children in `props.children`, React.createElement expects them as separate arguments
2. **Key Handling**: JSX runtime passes key as third parameter, React.createElement expects it in props
3. **Props Spreading**: Need to extract children and key from props before passing to React.createElement

### Error Handling Strategy

**Current Error**: "Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: <div />"

**Root Cause**: JSX runtime returns JSX elements instead of calling React.createElement properly

**Solution**: Proper function signature mapping ensures JSX runtime calls create valid React elements

## 🚀 Execution Order

1. **IMMEDIATE**: Fix JSX runtime mapping (Task 1)
2. **IMMEDIATE**: Test with test-simple plugin (Task 4)
3. **IMMEDIATE**: Test all plugin types (Task 4)
4. **FOLLOW-UP**: Add debug logging (Task 2)
5. **FOLLOW-UP**: Create unit tests (Task 3)
6. **OPTIONAL**: Performance benchmarking (Task 5)

## ⚠️ Risk Mitigation

### Risk 1: Breaking Existing Plugins
**Mitigation**: Test all existing plugins after implementing fix
**Rollback**: Revert to original React.createElement mapping if issues arise

### Risk 2: Performance Impact
**Mitigation**: Benchmark plugin loading times before/after changes
**Threshold**: <10ms overhead for JSX runtime mapping

### Risk 3: JSX Runtime Compatibility
**Mitigation**: Use React's official JSX runtime API patterns
**Validation**: Test with different JSX element types (div, components, fragments)

## 📊 Success Metrics

- [ ] test-simple plugin loads without errors
- [ ] All plugin types render correctly
- [ ] No console errors during plugin loading
- [ ] Plugin interactions work properly
- [ ] Build process maintains JSX compilation
- [ ] Performance within acceptable limits

## 🔍 Validation Steps

1. **Code Review**: Verify JSX runtime mapping follows React patterns
2. **Manual Testing**: Load each plugin type and verify rendering
3. **Automated Testing**: Run unit tests and E2E tests
4. **Performance Testing**: Benchmark loading times
5. **Error Handling**: Verify proper error messages for plugin failures

## 📚 Documentation Updates

**If Required**: Update `/mnt/c/users/byron/documents/projects/byron/Omnia/docs/architecture/PLUGIN_DEVELOPER_GUIDE.md` with JSX runtime handling details

**Key Points to Document**:
- JSX runtime is automatically handled by plugin loader
- Plugins should use standard React JSX syntax
- No special JSX runtime configuration needed in plugins

## 🎯 Ready for Implementation

This implementation plan provides:
- ✅ Clear root cause analysis
- ✅ Specific code changes with exact file locations
- ✅ Comprehensive testing strategy
- ✅ Risk mitigation approach
- ✅ Success criteria and validation steps
- ✅ Execution order and priorities

**COORDINATOR APPROVAL**: Ready for development team execution
**ESTIMATED TIME**: 2-3 hours for core fix + testing
**SKILL REQUIREMENTS**: React JSX runtime, TypeScript, Plugin architecture