# Plugin Loading Fixes & Patterns Documentation

## Critical Fixes Applied (✅ Working)

### 1. **Path Module Methods Missing** 
**Error**: `TypeError: this.path.basename is not a function`
**Location**: `src/ui/node-module-loader.ts` - path case
**Fix**: Added complete path module fallback with all methods:
```typescript
case "path":
  return {
    join: (...paths) => { /* path joining logic */ },
    basename: (path, ext?) => { /* extract filename */ },
    dirname: (path) => { /* extract directory */ },
    extname: (path) => { /* extract file extension */ },
    resolve: (...paths) => { /* resolve absolute path */ },
    relative: (from, to) => { /* calculate relative path */ }
  } as T;
```

### 2. **Process Global Missing in Electron Renderer**
**Error**: `ReferenceError: process is not defined`
**Location**: `src/core/enhanced-plugin-manager.ts` - plugin loading
**Fix**: Environment-safe current working directory detection:
```typescript
const cwd = typeof process !== "undefined" 
  ? process.cwd()  // Node.js environment
  : typeof window !== "undefined" && (window as any).electronAPI?.getCwd
  ? await (window as any).electronAPI.getCwd()  // Electron renderer
  : "/";  // Fallback
```

### 3. **URL Module Missing pathToFileURL**
**Error**: `TypeError: pathToFileURL.pathToFileURL is not a function`
**Location**: `src/ui/node-module-loader.ts` - url case
**Fix**: Added URL module fallback with pathToFileURL implementation:
```typescript
case "url":
  return {
    pathToFileURL: (path: string) => {
      const normalizedPath = path.replace(/\\/g, '/');
      const fileUrl = normalizedPath.startsWith('/') 
        ? `file://${normalizedPath}`
        : `file:///${normalizedPath}`;
      return { href: fileUrl };
    },
    fileURLToPath: (url) => { /* reverse conversion */ }
  } as T;
```

### 4. **JSON5 Parsing with Comments/Syntax**
**Error**: `Expected property name or '}' in JSON at position 4`
**Location**: `src/ui/node-module-loader.ts` - json5 case
**Fix**: JSON5-compatible parser fallback:
```typescript
case "json5":
  return {
    parse: (text: string) => {
      const cleaned = text
        .replace(/\/\/.*$/gm, '') // Remove single-line comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":'); // Quote unquoted keys
      return JSON.parse(cleaned);
    },
    stringify: JSON.stringify
  } as any;
```

## Current Issues Being Fixed (🔧 In Progress)

### 5. **Plugin Default Export Missing**
**Error**: `Simple plugin must export a component`
**Affected**: as-built-documenter, context-generator, test-simple
**Analysis**: TypeScript compilation not preserving `export default`
**Need to check**: `tsconfig.plugins.json` module settings and compiled output

### 6. **Plugin Module Loading Path Issues**
**Error**: `Failed to fetch dynamically imported module: file:///dist/plugins/.../index.js`
**Affected**: customer-links, script-runner
**Analysis**: Dynamic import failing for ES modules in Electron
**Need to check**: Module format, import resolution, file:// URL generation

### 7. **Manifest Discovery Inconsistency**
**Error**: Looking for `plugin.json` instead of `plugin.json5`
**Issue**: Enhanced renderer uses different manifest loading than plugin manager
**Location**: `src/ui/enhanced-renderer.tsx` line ~128
**Need to fix**: Align manifest loading paths to use `.json5` files

## Plugin Loading Architecture

### Current Flow:
1. **Discovery**: Enhanced plugin manager scans source `plugins/` directory for manifests
2. **Manifest Loading**: Reads `plugin.json5` files with JSON5 parser
3. **Module Loading**: Loads compiled `dist/plugins/*/index.js` files
4. **Type Validation**: Checks plugin exports match type (simple/configured/hybrid)
5. **Initialization**: Initializes based on plugin type and registers services

### File Structure:
```
plugins/                    # Source directory
├── customer-links/
│   ├── plugin.json5       # Manifest (type: configured)
│   └── index.tsx          # Source component
└── script-runner/
    ├── plugin.json5       # Manifest (type: hybrid)
    └── index.tsx          # Source component

dist/plugins/              # Compiled directory  
├── customer-links/
│   └── index.js          # Compiled component
└── script-runner/
    └── index.js          # Compiled component
```

## Plugin Types & Export Requirements

### Simple Plugins (v1.0.0 - not converted yet)
- **Export**: `export default ComponentName`
- **Props**: None required
- **Example**: `export default function SimplePlugin() { return <div>Hello</div>; }`

### Configured Plugins (v2.0.0 - converted)
- **Export**: `export default ComponentName`
- **Props**: `{ config: any }`
- **Manifest**: Has `configSchema` field
- **Example**: `export default function ConfiguredPlugin({ config }) { return <div>{config.title}</div>; }`

### Hybrid Plugins (v2.0.0 - converted)
- **Export**: Multiple exports including default component
- **Props**: `{ context: PluginContext }`
- **Manifest**: Has `services` array
- **Example**: 
```typescript
export async function init(context: PluginContext) { /* setup */ }
export const services = { /* service implementations */ };
export default function HybridPlugin({ context }) { return <div>Hybrid</div>; }
```

## Debugging Patterns

### Missing Node.js Module Methods:
- **Symptom**: `TypeError: moduleObject.method is not a function`
- **Solution**: Add method to appropriate case in `node-module-loader.ts`
- **Common missing**: `path.normalize()`, `fs.existsSync()`, `url.resolve()`

### Missing Globals in Electron:
- **Symptom**: `ReferenceError: globalName is not defined`
- **Solution**: Environment detection pattern with electronAPI fallback
- **Common missing**: `process`, `__dirname`, `__filename`, `Buffer`

### Plugin Export Issues:
- **Symptom**: `Plugin must export a component` or module loading errors
- **Check**: 1) TypeScript compilation settings, 2) export statements, 3) file:// URL generation

## Next Steps Checklist

1. **Fix Default Exports**: Check `tsconfig.plugins.json` module settings
2. **Fix Module Loading**: Ensure file:// URLs work for dynamic imports
3. **Align Manifest Loading**: Update enhanced renderer to use `.json5` files
4. **Test Plugin Types**: Verify simple/configured/hybrid all work
5. **Verify UI Display**: Ensure plugins show as cards in CardGrid

## Expected Working Plugins After Fixes

- ✅ **customer-links** (v2.0.0) - Configured plugin with config schema
- ✅ **script-runner** (v2.0.0) - Hybrid plugin with services
- 🔧 **as-built-documenter** (v1.0.0) - Simple plugin, needs export fix
- 🔧 **context-generator** (v1.0.0) - Simple plugin, needs export fix  
- 🔧 **test-simple** (v1.0.0) - Simple plugin, needs export fix

## Critical Files to Monitor

- `src/ui/node-module-loader.ts` - Module loading fallbacks
- `src/core/enhanced-plugin-manager.ts` - Plugin discovery & loading
- `src/ui/enhanced-renderer.tsx` - Plugin rendering & manifest loading
- `tsconfig.plugins.json` - Plugin compilation settings
- `dist/plugins/*/index.js` - Compiled plugin outputs