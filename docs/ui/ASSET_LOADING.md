# Asset Loading in Omnia

This document explains how assets (CSS, images, etc.) are handled in the Omnia application.

## Current Build Process

The application uses TypeScript compilation with a comprehensive asset processing pipeline that handles CSS modules, regular CSS files, and other assets.

### CSS Module Processing (IMPLEMENTED)

**Problem Solved**: CSS modules in dynamically loaded plugins failed to load because browsers cannot import CSS files as ES modules.

**Current Solution**: Automated CSS module processing pipeline that converts CSS modules to JavaScript objects during build.

**How it works**:
1. CSS files are copied to dist/ during build
2. CSS modules (`.module.css`) are processed into JavaScript objects (`.module.css.js`)
3. Import statements are rewritten to point to the JS files
4. Components can use CSS modules normally in source code

**Example**:
```tsx
// ✅ This now works in production build
import styles from './MyComponent.module.css';

function MyComponent() {
  return <div className={styles.container}>Content</div>;
}
```

**Generated JavaScript**:
```javascript
// MyComponent.module.css.js (auto-generated)
const styles = {
  "container": "container",
  "interactive": "interactive"
};
export default styles;
```

### Build Pipeline Steps

The build process follows this order:

1. **TypeScript Compilation**: `tsc -p tsconfig.build.json && tsc -p tsconfig.plugins.json`
2. **Asset Copying**: `node scripts/copy-assets.js` - Copies CSS files to dist/
3. **CSS Module Processing**: `node scripts/process-css-modules.js` - Generates JS objects from CSS modules
4. **Import Fixing**: `node scripts/fix-plugin-imports.js` - Rewrites imports to point to correct files

### Supported CSS Patterns

1. **CSS Modules** (`.module.css`):
   ```tsx
   import styles from './Component.module.css';
   // Automatically processed into JS objects
   ```

2. **Regular CSS** (`.css`):
   ```tsx
   // Currently requires manual handling or global styles
   // Consider converting to CSS modules for component-specific styles
   ```

3. **Inline Styles**:
   ```tsx
   const styles: React.CSSProperties = {
     display: 'grid',
     gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
   };
   ```

## Common Asset Loading Issues (RESOLVED)

### 1. CSS Module Import Errors (FIXED)
```
Card.module.css:1 Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/css"
```
**Cause**: CSS modules being imported as ES modules in browser
**Solution**: CSS module processing pipeline automatically converts CSS to JS

### 2. Plugin Component Export Errors (FIXED)
```
Simple plugin must export a component
```
**Cause**: Plugin manager only accepted named `component` exports
**Solution**: Updated to accept both named exports and default exports

### 3. Plugin Asset Loading
**Issue**: Plugins may reference external assets that aren't available in Electron
**Solution**: Use loadNodeModule pattern or bundle assets with plugins

## Best Practices

### For Component Styling

1. **Use CSS Modules for complex components**:
   ```tsx
   // Card.tsx
   import styles from './Card.module.css';
   
   export function Card({ interactive = false }) {
     return (
       <div className={`bg-theme-surface ${styles.card} ${interactive ? styles.interactive : ''}`}>
         Content
       </div>
     );
   }
   ```

2. **Combine with Tailwind for utilities**:
   ```tsx
   // Hybrid approach: Tailwind for layout, CSS modules for behavior
   <div className={`p-4 rounded-lg ${styles.complexAnimation}`}>
   ```

3. **Use inline styles for simple dynamic styling**:
   ```tsx
   <div style={{ backgroundColor: dynamicColor }}>
   ```

### For Plugin Development

1. **CSS modules work in plugins**: Use the same pattern as main components
2. **Import UI components**: Reuse existing components like Card, Button, etc.
3. **Follow the hybrid approach**: Tailwind + CSS modules as documented

## Development vs Production

- **Development**: Source CSS files exist and are processed by dev loader
- **Production**: CSS modules are pre-processed into JS objects during build
- **Electron**: CSS module JS objects work seamlessly in file:// protocol

## Troubleshooting

### If CSS modules don't work:

1. **Check build output**: Ensure `.module.css.js` files are generated
2. **Verify import rewriting**: Check that imports point to `.css.js` files
3. **Rebuild**: CSS module processing happens during build, not at runtime

### If plugins fail to load:

1. **Check console**: Look for specific error messages
2. **Verify exports**: Ensure plugins export either `component` or default export
3. **Check manifest**: Verify `plugin.json5` files exist and are valid

## Scripts Reference

- `scripts/copy-assets.js`: Copies CSS and other assets to dist/
- `scripts/process-css-modules.js`: Converts CSS modules to JavaScript objects
- `scripts/fix-plugin-imports.js`: Rewrites import paths for dist/ structure

## Future Improvements

1. ✅ ~~Add support for CSS modules~~ (COMPLETED)
2. Add CSS minification and optimization
3. Consider Sass/SCSS support
4. Add hot reloading for CSS in development
5. Bundle optimization for production builds