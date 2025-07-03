# Asset Loading in Omnia

This document explains how assets (CSS, images, etc.) are handled in the Omnia application.

## Current Build Process

The application uses TypeScript compilation which only processes `.ts` and `.tsx` files. Other assets require special handling.

### CSS Files

**Problem**: TypeScript compiler does not copy CSS files to the dist directory.

**Current Solution**: Use inline styles in React components instead of external CSS files.

**Example**:
```tsx
// ❌ This will fail in production build
import './MyComponent.css';

// ✅ This works with current build process
const styles: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
  gap: '1rem'
};
```

### Alternative CSS Solutions (Future)

1. **Add CSS copying to build script**:
   ```bash
   # Add to package.json build script
   && cp -r src/**/*.css dist/
   ```

2. **Use a bundler like Webpack or Vite**:
   - Would handle CSS imports automatically
   - Better for production deployments

3. **CSS-in-JS libraries**:
   - styled-components
   - emotion
   - stitches

## Common Asset Loading Issues

### 1. CSS Import Errors
```
Failed to load resource: net::ERR_FILE_NOT_FOUND
```
**Cause**: CSS file not copied to dist directory during build
**Solution**: Use inline styles or modify build process

### 2. Module Loading Errors
```
Failed to fetch dynamically imported module
```
**Cause**: Missing ES module files or incorrect import paths
**Solution**: Check dist directory structure and import paths

### 3. Plugin Asset Loading
**Issue**: Plugins may reference external assets that aren't available in Electron
**Solution**: Use loadNodeModule pattern or bundle assets with plugins

## Best Practices

1. **For simple styling**: Use inline styles with React.CSSProperties
2. **For complex styling**: Consider CSS-in-JS libraries
3. **For external dependencies**: Use loadNodeModule pattern
4. **For images/fonts**: Place in public assets directory (if implemented)

## Development vs Production

- **Development**: CSS files exist in src/ but may not load correctly
- **Production**: Only compiled JS files exist in dist/
- **Electron**: Additional considerations for file:// protocol loading

## Future Improvements

1. Implement proper asset pipeline in build process
2. Add support for CSS modules
3. Consider moving to a modern bundler
4. Add hot reloading for CSS in development