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

## Schema-Driven Settings UI Components

Omnia provides a complete set of React components for automatic settings form generation from Zod schemas.

### SchemaForm Component

The core component that automatically generates forms from any Zod schema.

#### Basic Usage

```typescript
import React, { useState } from 'react';
import { SchemaForm } from '../ui/components';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18'),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true),
    language: z.string().default('en')
  })
});

function UserSettingsForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: 18,
    preferences: {
      theme: 'light',
      notifications: true,
      language: 'en'
    }
  });

  const handleSubmit = (data: any) => {
    console.log('Form submitted:', data);
    // Save configuration
  };

  return (
    <SchemaForm
      schema={userSchema}
      data={formData}
      onChange={setFormData}
      onSubmit={handleSubmit}
    />
  );
}
```

#### Advanced Schema Support

```typescript
const advancedSchema = z.object({
  // String constraints
  username: z.string()
    .min(3, 'Minimum 3 characters')
    .max(20, 'Maximum 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only alphanumeric and underscore'),
  
  // Number constraints
  port: z.number()
    .min(1000, 'Port must be at least 1000')
    .max(65535, 'Port must be less than 65536'),
  
  // Arrays with dynamic items
  tags: z.array(z.string()).default([]),
  
  // Nested objects
  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().default(5432),
    ssl: z.boolean().default(false)
  }),
  
  // Optional fields
  apiKey: z.string().optional(),
  
  // Custom validation
  confirmPassword: z.string().refine((val) => val === formData.password, {
    message: "Passwords don't match"
  })
});
```

### AppSettings Component

Pre-built component for application-level configuration.

```typescript
import { AppSettings } from '../ui/components';

function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Application Settings</h1>
      <AppSettings />
    </div>
  );
}
```

**Features**:
- Multi-section layout (Application, Logging, Window)
- Real-time validation and error display
- Unsaved changes tracking
- Automatic save/load from SettingsManager
- Success/error feedback

### PluginSettings Component

Component for plugin-specific configuration management.

```typescript
import { PluginSettings } from '../ui/components';

function PluginConfigPage({ pluginId }: { pluginId: string }) {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">
        Configure {pluginId}
      </h1>
      <PluginSettings pluginId={pluginId} />
    </div>
  );
}
```

**Features**:
- Automatic schema detection based on plugin type
- Three-tier plugin support (Simple/Configured/Advanced)
- Plugin enable/disable functionality
- Permission validation
- Dynamic form generation

### SettingsPage Component

Complete settings interface with tabbed navigation.

```typescript
import { SettingsPage } from '../ui/components';

function MainSettings() {
  return <SettingsPage />;
}
```

**Features**:
- Tabbed interface (App Settings, Plugin Settings, System Settings)
- Responsive design
- Integrated navigation
- Deep linking support

## Integration with Plugin Development

### Using Schema-Driven Forms in Plugins

```typescript
// In your plugin (plugins/my-plugin/index.tsx)
import React from 'react';
import { SchemaForm } from '../../../src/ui/components';
import { usePluginConfig } from '../../../src/hooks';
import { z } from 'zod';

export const configSchema = z.object({
  enabled: z.boolean().default(true),
  apiEndpoint: z.string().url().default('https://api.example.com'),
  refreshInterval: z.number().min(30).max(3600).default(300),
  features: z.object({
    notifications: z.boolean().default(true),
    autoSync: z.boolean().default(false)
  })
});

export type MyPluginConfig = z.infer<typeof configSchema>;

export default function MyPlugin() {
  const { config, updateConfig, isLoading, hasUnsavedChanges } = 
    usePluginConfig(configSchema);

  if (isLoading) {
    return <div>Loading plugin configuration...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Plugin Configuration</h2>
        
        <SchemaForm
          schema={configSchema}
          data={config}
          onChange={updateConfig}
        />
        
        {hasUnsavedChanges && (
          <div className="mt-4 p-3 bg-yellow-100 text-yellow-800 rounded">
            You have unsaved changes
          </div>
        )}
      </div>
      
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-2">Plugin Content</h3>
        {config.enabled ? (
          <div>Plugin is running with endpoint: {config.apiEndpoint}</div>
        ) : (
          <div>Plugin is disabled</div>
        )}
      </div>
    </div>
  );
}
```

### Form Field Types

The SchemaForm component automatically generates appropriate field types:

| Zod Type | Generated Field | Features |
|----------|----------------|----------|
| `z.string()` | Text input | Min/max length, regex validation |
| `z.number()` | Number input | Min/max values, step |
| `z.boolean()` | Checkbox | Toggle switch style |
| `z.enum()` | Select dropdown | Multi-option selection |
| `z.array()` | Dynamic list | Add/remove items |
| `z.object()` | Nested fieldset | Grouped form sections |
| `z.string().email()` | Email input | Email validation |
| `z.string().url()` | URL input | URL validation |
| `z.string().optional()` | Optional field | Clear indication |

### Custom Field Descriptions

Add descriptions to schema fields for better UX:

```typescript
const schema = z.object({
  apiKey: z.string()
    .min(32, 'API key must be at least 32 characters')
    .describe('Your secret API key from the service provider'),
  
  timeout: z.number()
    .min(1)
    .max(300)
    .default(30)
    .describe('Request timeout in seconds (1-300)'),
  
  features: z.object({
    caching: z.boolean()
      .default(true)
      .describe('Enable response caching for better performance'),
    
    retries: z.number()
      .min(0)
      .max(5)
      .default(3)
      .describe('Number of retry attempts for failed requests')
  }).describe('Feature configuration options')
});
```

### Validation and Error Handling

```typescript
const schema = z.object({
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain uppercase letter')
    .regex(/[a-z]/, 'Must contain lowercase letter')
    .regex(/[0-9]/, 'Must contain number'),
  
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
});

function PasswordForm() {
  const [data, setData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const handleSubmit = (formData: any) => {
    try {
      const validated = schema.parse(formData);
      console.log('Valid data:', validated);
      setErrors({});
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMap = {};
        error.issues.forEach(issue => {
          errorMap[issue.path.join('.')] = issue.message;
        });
        setErrors(errorMap);
      }
    }
  };

  return (
    <SchemaForm
      schema={schema}
      data={data}
      onChange={setData}
      onSubmit={handleSubmit}
      errors={errors}
    />
  );
}
```

This API provides a robust foundation for managing configuration in Omnia while maintaining type safety and providing a good developer experience, now enhanced with automatic UI generation capabilities.