# Schemas

This directory contains Zod schemas for validating various data structures used throughout the Omnia application.

## Plugin Manifest Schema

The `plugin-manifest.ts` file provides comprehensive validation for plugin manifest files (`plugin.json5`).

### Usage

```typescript
import { 
  PluginManifestSchema, 
  validatePluginManifest, 
  safeValidatePluginManifest,
  type PluginManifest 
} from './plugin-manifest.js';

// Validate and throw on error
const manifest: PluginManifest = validatePluginManifest(manifestData);

// Safe validation with error handling
const result = safeValidatePluginManifest(manifestData);
if (result.success) {
  console.log('Valid manifest:', result.data);
} else {
  console.error('Validation errors:', result.error.issues);
}
```

### Schema Features

- **Plugin ID validation**: Ensures IDs follow the pattern `[a-zA-Z0-9_.-]+`
- **Semantic version validation**: Full SemVer compliance including pre-release and build metadata
- **Main file validation**: Ensures entry point is a `.js` file with proper path format
- **Engine compatibility**: Validates ttCommander and Node.js version requirements
- **Permissions array**: Extensible permission system for plugin capabilities
- **UI contributions**: Flexible object structure for plugin UI integration
- **TypeScript types**: Full type safety with inferred types
- **Utility functions**: Both throwing and safe validation functions

### Required Fields

- `id`: Unique plugin identifier
- `name`: Human-readable plugin name
- `version`: Semantic version string
- `description`: Brief description of plugin functionality
- `main`: Path to main JavaScript entry point
- `engine.ttCommanderVersion`: Compatible ttCommander version range

### Optional Fields

- `author`: Plugin author information
- `engine.nodeVersion`: Node.js version requirements
- `permissions`: Array of required permissions
- `uiContributions`: Object defining UI contributions

### Example Valid Manifest

```json
{
  "id": "com.example.my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "A sample plugin for demonstration",
  "author": "John Doe <john@example.com>",
  "main": "index.js",
  "engine": {
    "ttCommanderVersion": ">=0.1.0",
    "nodeVersion": ">=18.0.0"
  },
  "permissions": ["executeScript", "fileSystem"],
  "uiContributions": {
    "menuItems": ["myPlugin.action1", "myPlugin.action2"],
    "views": ["myPlugin.sidebar"]
  }
}
```

## Testing

The schema is thoroughly tested in `tests/lib/schemas/plugin-manifest.test.ts` with coverage for:

- Valid manifest validation
- Invalid manifest rejection
- Semantic version format testing
- Plugin ID format validation
- Main file path validation
- Engine compatibility requirements
- Partial manifest validation
- TypeScript type safety