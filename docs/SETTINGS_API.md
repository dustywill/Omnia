# Settings Management API

This document describes how to use Omnia's hybrid configuration system with the SettingsManager class.

## Overview

Omnia uses a hybrid configuration system that separates concerns:

- **`config/app.json5`** - Main application settings
- **`config/plugins.json5`** - Plugin registry and state
- **`config/plugins/*.json5`** - Individual plugin configurations

All configurations are validated using Zod schemas for type safety and runtime validation.

## SettingsManager Class

The `SettingsManager` class provides the main API for configuration management.

### Basic Usage

```typescript
import { SettingsManager } from '../core/settings-manager.js';

// Create instance
const settingsManager = new SettingsManager('./config');

// Load app configuration
const appConfig = await settingsManager.loadAppConfig();

// Save modified configuration
appConfig.appSettings.debugMode = true;
await settingsManager.saveAppConfig(appConfig);

// Clean up watchers when done
settingsManager.destroy();
```

## Application Configuration

### Loading App Config

```typescript
// Load with automatic defaults if file doesn't exist
const appConfig = await settingsManager.loadAppConfig();

console.log(appConfig.appSettings.theme); // 'system'
console.log(appConfig.logging.level);     // 'info'
```

### Saving App Config

```typescript
// Simple save
await settingsManager.saveAppConfig(appConfig);

// Save with automatic backup
await settingsManager.saveAppConfigWithBackup(appConfig);
```

### App Config Schema

The app configuration follows this structure:

```typescript
interface AppConfig {
  appSettings: {
    version: string;          // Application version
    debugMode: boolean;       // Enable debug features
    userName: string;         // User identification
    theme: 'light' | 'dark' | 'system';
    pluginsDirectory: string; // Path to plugins
    scriptsDirectory: string; // Path to scripts
  };
  logging: {
    level: 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';
    prettyPrint: boolean;     // Console formatting
    filePath: string;         // Log file path
  };
  window?: {
    width: number;            // Window width
    height: number;           // Window height
  };
  plugins: Record<string, any>; // Legacy plugin configs
}
```

## Plugin Registry Management

### Loading Plugin Registry

```typescript
const registry = await settingsManager.loadPluginRegistry();

console.log(Object.keys(registry.plugins)); // ['script-runner', 'file-scanner']
```

### Registering Plugins

```typescript
await settingsManager.registerPlugin('my-plugin', {
  id: 'my-plugin',
  enabled: true,
  configPath: 'plugins/my-plugin.json5'
});
```

### Unregistering Plugins

```typescript
await settingsManager.unregisterPlugin('my-plugin');
```

## Plugin Configuration

### Defining Plugin Schema

First, create a Zod schema for your plugin configuration:

```typescript
import { z } from 'zod';

const MyPluginConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().optional(),
  refreshInterval: z.number().default(30),
  features: z.object({
    notifications: z.boolean().default(true),
    autoSync: z.boolean().default(false)
  })
});

type MyPluginConfig = z.infer<typeof MyPluginConfigSchema>;
```

### Loading Plugin Config

```typescript
// Load with defaults if file doesn't exist
const defaultConfig: MyPluginConfig = {
  enabled: true,
  refreshInterval: 30,
  features: {
    notifications: true,
    autoSync: false
  }
};

const config = await settingsManager.loadPluginConfig(
  'my-plugin', 
  MyPluginConfigSchema, 
  defaultConfig
);
```

### Saving Plugin Config

```typescript
// Modify configuration
config.features.autoSync = true;
config.refreshInterval = 60;

// Save with validation
await settingsManager.savePluginConfig(
  'my-plugin', 
  config, 
  MyPluginConfigSchema
);
```

## Permission System

### Plugin Manifest Permissions

Define permissions in your plugin's manifest:

```json5
{
  "id": "my-plugin",
  "name": "My Plugin",
  "version": "1.0.0",
  "description": "Example plugin",
  "main": "index.js",
  "engine": {
    "ttCommanderVersion": ">=1.0.0"
  },
  "permissions": [
    "filesystem:read",
    "filesystem:write",
    "process:execute",
    "network:access"
  ]
}
```

### Validating Permissions

```typescript
const manifest = /* loaded plugin manifest */;

// Check multiple permissions
const result = settingsManager.validatePermissions(
  'my-plugin',
  ['filesystem:read', 'network:access', 'dangerous:operation'],
  manifest
);

console.log(result.allowed); // ['filesystem:read', 'network:access']
console.log(result.denied);  // ['dangerous:operation']

// Check single permission
const canRead = settingsManager.hasPermission(
  'my-plugin', 
  'filesystem:read', 
  manifest
);
```

### Available Permissions

Common permission patterns:

- **Filesystem**: `filesystem:read`, `filesystem:write`
- **Process**: `process:execute`, `process:spawn`
- **Network**: `network:access`, `network:server`
- **Services**: `service:file-scanner`, `service:logger`
- **System**: `system:clipboard`, `system:notifications`

## File Watching

### Watch App Configuration

```typescript
settingsManager.watchAppConfig((newConfig) => {
  console.log('App config changed:', newConfig.appSettings.theme);
  // React to configuration changes
});
```

### Watch Plugin Configuration

```typescript
settingsManager.watchPluginConfig(
  'my-plugin', 
  (newConfig) => {
    console.log('Plugin config changed:', newConfig);
    // Update plugin behavior
  },
  MyPluginConfigSchema // Optional schema for validation
);
```

### Cleanup Watchers

```typescript
// Stop all file watchers
settingsManager.destroy();
```

## Migration Support

### Migrating Old Configurations

```typescript
const oldFlatConfig = {
  theme: 'dark',
  debugMode: true,
  logLevel: 'debug',
  // ... other old settings
};

// Migrate to new hybrid format
const newConfig = await settingsManager.migrateOldConfig(oldFlatConfig);
```

## Error Handling

### Common Error Scenarios

```typescript
try {
  const config = await settingsManager.loadAppConfig();
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('Config file not found, using defaults');
  } else if (error.name === 'ZodError') {
    console.log('Configuration validation failed:', error.issues);
  } else {
    console.error('Unexpected error:', error);
  }
}
```

### Schema Validation Errors

```typescript
import { ZodError } from 'zod';

try {
  await settingsManager.savePluginConfig('my-plugin', invalidConfig, schema);
} catch (error) {
  if (error instanceof ZodError) {
    error.issues.forEach(issue => {
      console.log(`Invalid ${issue.path.join('.')}: ${issue.message}`);
    });
  }
}
```

## Best Practices

### 1. Always Use Schemas

```typescript
// ✅ Good - Schema provides validation and types
const schema = z.object({
  enabled: z.boolean().default(true)
});

// ❌ Bad - No validation or type safety
const config = JSON.parse(configText);
```

### 2. Provide Sensible Defaults

```typescript
const defaultConfig = {
  enabled: true,
  retryCount: 3,
  timeout: 5000
};

const config = await settingsManager.loadPluginConfig(
  'my-plugin', 
  schema, 
  defaultConfig
);
```

### 3. Handle Errors Gracefully

```typescript
try {
  const config = await settingsManager.loadPluginConfig(pluginId, schema);
  return config;
} catch (error) {
  console.warn(`Failed to load config for ${pluginId}, using defaults:`, error);
  return defaultConfig;
}
```

### 4. Use File Watching for Live Updates

```typescript
// React to configuration changes without restart
settingsManager.watchPluginConfig('my-plugin', (newConfig) => {
  updatePluginBehavior(newConfig);
});
```

### 5. Clean Up Resources

```typescript
class MyPlugin {
  private settingsManager: SettingsManager;

  async init() {
    this.settingsManager = new SettingsManager('./config');
    // Set up watchers...
  }

  async destroy() {
    this.settingsManager.destroy(); // Important!
  }
}
```

## Integration with React

### Using Configuration in Components

```typescript
import React, { useState, useEffect } from 'react';
import { SettingsManager } from '../core/settings-manager.js';

export function MyPluginComponent() {
  const [config, setConfig] = useState(null);
  const [settingsManager] = useState(() => new SettingsManager('./config'));

  useEffect(() => {
    // Load initial config
    settingsManager.loadPluginConfig('my-plugin', schema, defaultConfig)
      .then(setConfig);

    // Watch for changes
    settingsManager.watchPluginConfig('my-plugin', setConfig, schema);

    return () => settingsManager.destroy();
  }, []);

  const updateSetting = async (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    await settingsManager.savePluginConfig('my-plugin', newConfig, schema);
  };

  if (!config) return <div>Loading configuration...</div>;

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => updateSetting('enabled', e.target.checked)}
        />
        Enable Plugin
      </label>
    </div>
  );
}
```

## Testing Configuration

### Unit Testing with Mocks

```typescript
import { SettingsManager } from '../core/settings-manager.js';

// Mock file system operations
jest.mock('fs/promises');

describe('Plugin Configuration', () => {
  let settingsManager: SettingsManager;

  beforeEach(() => {
    settingsManager = new SettingsManager('/test-config');
  });

  afterEach(() => {
    settingsManager.destroy();
  });

  it('should load default config when file not found', async () => {
    // Test implementation...
  });
});
```

This API provides a robust foundation for managing configuration in Omnia while maintaining type safety and providing a good developer experience.