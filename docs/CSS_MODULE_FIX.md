# CSS Module Loading Fix

## Issue Summary

**Problem**: CSS modules in dynamically loaded plugins failed with error:
```
Card.module.css:1 Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/css"
```

**Root Cause**: Browser cannot import CSS files as ES modules. When plugins dynamically imported components that used `import styles from './Component.module.css'`, the browser tried to load CSS as JavaScript.

## Solution Implementation

### 1. CSS Module Processing Script
Created `scripts/process-css-modules.js` that:
- Scans dist/ for `.module.css` files  
- Extracts CSS class names using regex
- Generates `.module.css.js` files with JavaScript objects
- Maps class names to themselves (identity mapping)

### 2. Import Rewriting
Updated `scripts/fix-plugin-imports.js` to:
- Rewrite CSS module imports from `.module.css` to `.module.css.js`
- Apply to both plugins and main UI components
- Preserve all other import functionality

### 3. Build Pipeline Integration
Updated build process order:
1. TypeScript compilation
2. Asset copying (copies CSS files)
3. **CSS module processing** (generates JS objects)
4. Import fixing (rewrites imports)

### 4. Type System Support
Enhanced `PluginModule` type to support default exports:
```typescript
export type PluginModule = (SimplePlugin | ConfiguredPlugin | AdvancedPlugin) & {
  default?: React.ComponentType<any>;
};
```

## Generated Output Example

**Source**: `Card.module.css`
```css
.card {
  background-color: var(--tt-color-surface);
  transition: all 200ms ease-in-out;
}
.interactive {
  cursor: pointer;
}
```

**Generated**: `Card.module.css.js`
```javascript
const styles = {
  "card": "card",
  "interactive": "interactive"
};
export default styles;
```

**Rewritten Import**: 
```typescript
// Before: import styles from './Card.module.css';
// After:  import styles from './Card.module.css.js';
```

## Benefits

✅ **Preserves Architecture**: Maintains hybrid Tailwind + CSS Modules approach
✅ **No Source Changes**: Developers continue using normal CSS module syntax
✅ **Plugin Compatible**: Works in dynamically loaded plugins
✅ **Build-Time Processing**: No runtime overhead
✅ **Type Safe**: Full TypeScript support maintained

## Build Commands Updated

```json
{
  "build": "npm run clean && tsc -p tsconfig.build.json && tsc -p tsconfig.plugins.json && node scripts/copy-assets.js && node scripts/process-css-modules.js && node scripts/fix-plugin-imports.js"
}
```

## Files Modified

- `scripts/process-css-modules.js` (new)
- `scripts/fix-plugin-imports.js` (enhanced)
- `package.json` (build script)
- `src/core/enhanced-plugin-manager.ts` (plugin validation)

## Future Considerations

- CSS class name hashing for true scoping
- CSS minification and optimization  
- Sass/SCSS support
- Source map generation for debugging

## Testing

Verified resolution by:
1. Building project: `npm run build`
2. Checking generated `.module.css.js` files in dist/
3. Running Electron app: `npm run electron`
4. Confirming no CSS module loading errors in console
5. Verifying plugin components render with correct styles

This fix resolves the core issue while preserving the intended architecture and developer experience.