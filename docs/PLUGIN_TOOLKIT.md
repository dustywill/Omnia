# Plugin Development Toolkit

This document outlines the tools and utilities available for plugin developers in Omnia.

## Current Tools

### 1. Settings Manager Integration Test

**Location**: `scripts/test-settings-manager.mjs`

A comprehensive integration test that demonstrates all Settings Manager functionality:

```bash
node scripts/test-settings-manager.mjs
```

**What it tests**:
- App configuration loading/saving
- Plugin registry management
- Plugin configuration with schema validation
- Permission system validation
- File watching capabilities
- Directory structure creation

**Use for plugin development**:
- Understand configuration patterns
- Test schema validation
- Verify permission declarations

### 2. Schema Validation Utilities

**Location**: `src/lib/schemas/`

Pre-built schemas for common plugin needs:

```typescript
// Import existing schemas
import { AppConfigSchema } from '../lib/schemas/app-config.js';
import { PluginManifestSchema } from '../lib/schemas/plugin-manifest.js';

// Use in your plugin
const MyPluginSchema = z.object({
  enabled: z.boolean().default(true),
  // ... other config
});
```

### 3. Test Setup

**Location**: `tests/setup.ts`

Configured Jest environment with:
- TypeScript support
- ES modules
- React Testing Library
- JSDOM environment

**Example plugin test**:
```typescript
// tests/plugins/my-plugin.test.tsx
import { render, screen } from '@testing-library/react';
import MyPlugin from '../../plugins/my-plugin/index';

describe('MyPlugin', () => {
  it('renders correctly', () => {
    render(<MyPlugin />);
    expect(screen.getByText('My Plugin')).toBeInTheDocument();
  });
});
```

## Future Tools (Planned)

### 1. Plugin CLI Generator

**Planned**: `npx omnia-plugin create my-plugin`

Will generate:
- Plugin directory structure
- Manifest file template
- TypeScript component template
- Configuration schema template
- Test files
- Documentation template

### 2. Plugin Development Server

**Planned**: `npm run plugin:dev my-plugin`

Features:
- Hot reload for plugin changes
- Isolated plugin testing
- Configuration UI preview
- Permission testing
- Live schema validation

### 3. Plugin Validation Tool

**Planned**: `npm run plugin:validate my-plugin`

Will check:
- Manifest file validity
- TypeScript compilation
- Schema validation
- Permission declarations
- Test coverage
- Documentation completeness

### 4. Plugin Packaging Tool

**Planned**: `npm run plugin:package my-plugin`

Will create:
- Compiled JavaScript bundle
- Optimized assets
- Dependency checking
- Version validation
- Distribution package

## Development Workflow

### Current Workflow

1. **Create Plugin Structure**:
   ```bash
   mkdir plugins/my-plugin
   cd plugins/my-plugin
   ```

2. **Create Manifest**:
   ```json5
   // plugin.json5
   {
     id: "my-plugin",
     name: "My Plugin",
     version: "1.0.0",
     description: "Plugin description",
     main: "index.js",
     engine: {
       ttCommanderVersion: ">=1.0.0"
     }
   }
   ```

3. **Create Component**:
   ```typescript
   // index.tsx
   import React from 'react';
   
   export default function MyPlugin() {
     return <div>Hello from My Plugin!</div>;
   }
   ```

4. **Build and Test**:
   ```bash
   npm run build
   npm run electron
   ```

### Future Workflow (With Tools)

1. **Generate Plugin**:
   ```bash
   npx omnia-plugin create my-awesome-plugin
   cd plugins/my-awesome-plugin
   ```

2. **Develop with Hot Reload**:
   ```bash
   npm run plugin:dev my-awesome-plugin
   ```

3. **Validate and Test**:
   ```bash
   npm run plugin:validate my-awesome-plugin
   npm run plugin:test my-awesome-plugin
   ```

4. **Package for Distribution**:
   ```bash
   npm run plugin:package my-awesome-plugin
   ```

## Testing Utilities

### Configuration Testing

```typescript
// tests/utils/config-testing.ts
import { SettingsManager } from '../../src/core/settings-manager.js';

export class MockSettingsManager extends SettingsManager {
  private mockConfigs = new Map();

  constructor() {
    super('/mock-config');
  }

  async loadPluginConfig(pluginId: string, schema: any, defaultConfig?: any) {
    const config = this.mockConfigs.get(pluginId) || defaultConfig;
    return schema.parse(config);
  }

  async savePluginConfig(pluginId: string, config: any) {
    this.mockConfigs.set(pluginId, config);
  }

  setMockConfig(pluginId: string, config: any) {
    this.mockConfigs.set(pluginId, config);
  }
}
```

### Permission Testing

```typescript
// tests/utils/permission-testing.ts
export const createMockManifest = (permissions: string[] = []) => ({
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  description: 'Test plugin',
  main: 'index.js',
  engine: {
    ttCommanderVersion: '>=1.0.0'
  },
  permissions
});

export const testPermissions = (plugin: any, requiredPermissions: string[]) => {
  const manifest = createMockManifest(requiredPermissions);
  const settingsManager = new SettingsManager('/test');
  
  const result = settingsManager.validatePermissions(
    'test-plugin', 
    requiredPermissions, 
    manifest
  );
  
  expect(result.denied).toHaveLength(0);
  expect(result.allowed).toEqual(requiredPermissions);
};
```

### Component Testing

```typescript
// tests/utils/component-testing.tsx
import React from 'react';
import { render } from '@testing-library/react';
import { MockSettingsManager } from './config-testing';

export const renderPluginWithConfig = (
  Component: React.ComponentType,
  config: any = {}
) => {
  const mockSettingsManager = new MockSettingsManager();
  mockSettingsManager.setMockConfig('test-plugin', config);

  return render(
    <PluginProvider settingsManager={mockSettingsManager}>
      <Component />
    </PluginProvider>
  );
};
```

## Plugin Examples by Complexity

### Simple Plugin Example

```typescript
// plugins/hello-world/index.tsx
import React from 'react';

export default function HelloWorld() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Hello, World!</h1>
      <p>This is a simple plugin with no configuration.</p>
    </div>
  );
}
```

### Configured Plugin Example

```typescript
// plugins/note-taker/index.tsx
import React, { useState } from 'react';
import { z } from 'zod';

export const NoteTakerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  autoSave: z.boolean().default(true),
  theme: z.enum(['light', 'dark']).default('light')
});

export { NoteTakerConfigSchema as configSchema };

export default function NoteTaker() {
  const [notes, setNotes] = useState('');
  // In real implementation, config would come from usePluginConfig hook
  
  return (
    <div style={{ padding: '20px' }}>
      <h2>Note Taker</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        style={{ width: '100%', height: '200px' }}
        placeholder="Start typing your notes..."
      />
    </div>
  );
}
```

### Advanced Plugin Example

```typescript
// plugins/system-monitor/index.tsx
import React, { useState, useEffect } from 'react';
import { z } from 'zod';

export const SystemMonitorConfigSchema = z.object({
  enabled: z.boolean().default(true),
  refreshInterval: z.number().default(5000),
  showCPU: z.boolean().default(true),
  showMemory: z.boolean().default(true),
  showDisk: z.boolean().default(false)
});

export { SystemMonitorConfigSchema as configSchema };

export class SystemMonitorPlugin {
  private config: any;
  private intervals: NodeJS.Timeout[] = [];

  constructor(config: any) {
    this.config = config;
  }

  async onInit() {
    // Register system monitoring service
    this.registerService('system-monitor', {
      getCPUUsage: () => this.getCPUUsage(),
      getMemoryUsage: () => this.getMemoryUsage(),
      getDiskUsage: () => this.getDiskUsage()
    });

    // Start monitoring
    this.startMonitoring();
  }

  async onDestroy() {
    this.intervals.forEach(clearInterval);
    this.intervals = [];
  }

  render() {
    return <SystemMonitorUI config={this.config} />;
  }

  private startMonitoring() {
    // Background monitoring implementation
  }

  private getCPUUsage() {
    // CPU usage implementation
  }

  private getMemoryUsage() {
    // Memory usage implementation
  }

  private getDiskUsage() {
    // Disk usage implementation
  }
}

function SystemMonitorUI({ config }) {
  const [stats, setStats] = useState(null);

  return (
    <div style={{ padding: '20px' }}>
      <h2>System Monitor</h2>
      {/* System stats display */}
    </div>
  );
}

export default SystemMonitorPlugin;
```

## Common Patterns

### Configuration Updates

```typescript
const handleConfigChange = useCallback(async (key: string, value: any) => {
  const newConfig = { ...config, [key]: value };
  await updateConfig(newConfig);
}, [config, updateConfig]);
```

### Error Handling

```typescript
const [error, setError] = useState<string | null>(null);

const handleAsyncAction = async () => {
  try {
    setError(null);
    await performAction();
  } catch (err) {
    setError(err.message);
    console.error('Plugin error:', err);
  }
};
```

### Loading States

```typescript
const [loading, setLoading] = useState(false);
const [data, setData] = useState(null);

const loadData = async () => {
  setLoading(true);
  try {
    const result = await fetchData();
    setData(result);
  } finally {
    setLoading(false);
  }
};
```

## Resources

### Documentation
- [Plugin Developer Guide](./PLUGIN_DEVELOPER_GUIDE.md)
- [Settings API Reference](./SETTINGS_API.md)
- [Design Decisions](./DESIGN_DECISIONS.md)

### Examples
- **Simple**: `plugins/test-simple/`
- **Configured**: `plugins/customer-links/`
- **Advanced**: `plugins/script-runner/`

### Testing
- Run all tests: `npm test`
- Run plugin tests: `npm test plugins/`
- Integration test: `node scripts/test-settings-manager.mjs`

This toolkit will continue to evolve as we implement more of the plugin development infrastructure outlined in the Implementation Plan.