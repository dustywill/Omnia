# Plugin Developer Guide

This guide covers everything you need to know to develop plugins for Omnia, from simple UI components to advanced plugins with background services.

## Quick Start

### 1. Create Plugin Directory

```bash
mkdir plugins/my-awesome-plugin
cd plugins/my-awesome-plugin
```

### 2. Create Manifest File

Create `plugin.json5`:

```json5
{
  id: "my-awesome-plugin",
  name: "My Awesome Plugin", 
  version: "1.0.0",
  description: "A plugin that does awesome things",
  author: "Your Name <your.email@example.com>",
  main: "index.js",
  engine: {
    ttCommanderVersion: ">=1.0.0",
    nodeVersion: ">=18.0.0"
  },
  permissions: [
    "filesystem:read"
  ]
}
```

### 3. Create Plugin Component

Create `index.tsx`:

```typescript
import React from 'react';

export default function MyAwesomePlugin() {
  return (
    <div>
      <h1>My Awesome Plugin</h1>
      <p>Hello from my plugin!</p>
    </div>
  );
}
```

### 4. Build and Test

```bash
npm run build
npm run electron
```

Your plugin should now appear in the Omnia interface!

## Plugin Architecture

Omnia supports three tiers of plugin complexity, managed by the Enhanced Plugin Manager with Service Registry:

### Tier 1: Simple Plugins

Just export a React component. Perfect for static content, calculators, or simple tools.

```typescript
// plugins/calculator/index.tsx
import React, { useState } from 'react';
import { Card, Button, Input } from '../../../src/ui/components/index.js';

export default function Calculator() {
  const [result, setResult] = useState(0);
  const [input, setInput] = useState('');

  const calculate = () => {
    try {
      setResult(eval(input)); // Don't use eval in production!
    } catch {
      setResult(NaN);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-theme-primary mb-4">Calculator</h2>
      <div className="space-y-4">
        <Input 
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter calculation"
        />
        <Button onClick={calculate} variant="action" className="w-full">
          Calculate
        </Button>
        <div className="text-lg text-theme-secondary">
          Result: {result}
        </div>
      </div>
    </Card>
  );
}
```

### Tier 2: Configured Plugins (Most Common)

Components with configuration schemas. Great for plugins that need user settings.

```typescript
// plugins/weather/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Badge } from '../../../src/ui/components/index.js';
import { z } from 'zod';

// Define configuration schema
export const configSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().default(''),
  city: z.string().default('New York'),
  refreshInterval: z.number().default(300), // 5 minutes
  units: z.enum(['metric', 'imperial']).default('metric')
});

export type WeatherConfig = z.infer<typeof configSchema>;

// Default configuration
export const defaultConfig: WeatherConfig = {
  enabled: true,
  apiKey: '',
  city: 'New York',
  refreshInterval: 300,
  units: 'metric'
};

interface WeatherPluginProps {
  config: WeatherConfig;
}

export default function WeatherPlugin({ config }: WeatherPluginProps) {
  const currentConfig = { ...defaultConfig, ...config };
  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!currentConfig.enabled || !currentConfig.apiKey) return;

    // Fetch weather data
    const fetchWeather = async () => {
      // Weather API call implementation
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, currentConfig.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [currentConfig]);

  if (!currentConfig.enabled) {
    return (
      <Card className="max-w-md mx-auto">
        <div className="text-center text-theme-secondary">
          Weather plugin is disabled
        </div>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-theme-primary">
          Weather in {currentConfig.city}
        </h2>
        <Badge variant="success" size="sm">
          {currentConfig.units}
        </Badge>
      </div>
      {weather ? (
        <div className="text-theme-secondary">
          {/* Weather display */}
        </div>
      ) : (
        <div className="text-theme-secondary">Loading weather...</div>
      )}
    </Card>
  );
}
```

### Tier 3: Advanced Plugins

Full lifecycle plugins with background processing, service registration, and complex state management.

```typescript
// plugins/file-watcher/index.tsx
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../../src/ui/components/index.js';
import { PluginContext } from '../../../src/core/enhanced-plugin-manager.js';
import { z } from 'zod';

export const configSchema = z.object({
  enabled: z.boolean().default(true),
  watchDirectory: z.string().default('./'),
  filePatterns: z.array(z.string()).default(['*.txt', '*.md']),
  notifications: z.boolean().default(true)
});

export type FileWatcherConfig = z.infer<typeof configSchema>;

// Plugin state management
let pluginState = {
  watchers: [] as any[],
  watchedFiles: [] as string[]
};

// Service implementations
export const services = {
  'file-watcher': {
    getWatchedFiles(): string[] {
      return pluginState.watchedFiles;
    },
    addWatch(path: string): boolean {
      // Add file/directory to watch list
      if (!pluginState.watchedFiles.includes(path)) {
        pluginState.watchedFiles.push(path);
        return true;
      }
      return false;
    },
    removeWatch(path: string): boolean {
      const index = pluginState.watchedFiles.indexOf(path);
      if (index > -1) {
        pluginState.watchedFiles.splice(index, 1);
        return true;
      }
      return false;
    }
  }
};

// Lifecycle hooks
export async function init(context: PluginContext): Promise<void> {
  context.logger.info('File Watcher plugin initialized');
  
  // Set up file watchers based on config
  if (context.config.enabled) {
    setupFileWatchers(context);
  }
  
  // Listen for config changes
  context.eventBus.subscribe('plugin:config-updated', (event: any) => {
    if (event.pluginId === context.pluginId) {
      // Restart watchers with new config
      setupFileWatchers(context);
    }
  });
}

export async function stop(context: PluginContext): Promise<void> {
  context.logger.info('File Watcher plugin stopping');
  
  // Clean up watchers
  pluginState.watchers.forEach((watcher: any) => {
    if (watcher.close) watcher.close();
  });
  
  pluginState.watchers = [];
  pluginState.watchedFiles = [];
}

function setupFileWatchers(context: PluginContext) {
  // Implementation would set up actual file system watchers
  // This is a simplified example
  const { watchDirectory, filePatterns } = context.config;
  context.logger.info(`Setting up file watchers for ${watchDirectory} with patterns: ${filePatterns.join(', ')}`);
}

interface FileWatcherPluginProps {
  context: PluginContext;
}

export default function FileWatcherPlugin({ context }: FileWatcherPluginProps) {
  const [stats, setStats] = useState({ watchedFiles: 0, activeWatchers: 0 });
  const [recentFiles, setRecentFiles] = useState<string[]>([]);

  useEffect(() => {
    const updateStats = () => {
      setStats({
        watchedFiles: pluginState.watchedFiles.length,
        activeWatchers: pluginState.watchers.length
      });
    };

    updateStats();
    const interval = setInterval(updateStats, 1000);
    
    return () => clearInterval(interval);
  }, []);

  const handleTestService = async () => {
    try {
      const files = await context.serviceRegistry.callService(
        context.pluginId,
        context.permissions,
        'file-watcher',
        '1.0.0',
        'getWatchedFiles',
        []
      );
      setRecentFiles(files);
    } catch (error) {
      context.logger.error('Service call failed', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-theme-primary mb-4">
          File Watcher
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-theme-primary mb-2">Statistics</h3>
            <div className="space-y-1 text-sm">
              <div>Watched Files: {stats.watchedFiles}</div>
              <div>Active Watchers: {stats.activeWatchers}</div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-theme-primary mb-2">Status</h3>
            <Badge variant={context.config.enabled ? 'success' : 'neutral'}>
              {context.config.enabled ? 'Enabled' : 'Disabled'}
            </Badge>
          </div>
        </div>
        
        <Button onClick={handleTestService} variant="action" size="sm">
          Get Watched Files
        </Button>
        
        {recentFiles.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold text-theme-primary mb-2">Recent Files:</h4>
            <div className="space-y-1">
              {recentFiles.map((file, index) => (
                <div key={index} className="text-sm text-theme-secondary font-mono">
                  {file}
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
```

## Plugin Manifest

The `plugin.json5` file defines your plugin's metadata and requirements.

### Required Fields

```json5
{
  // Unique identifier (lowercase, alphanumeric, hyphens, dots)
  id: "com.example.my-plugin",
  
  // Human-readable name
  name: "My Plugin",
  
  // Semantic version
  version: "1.0.0",
  
  // Brief description
  description: "What this plugin does",
  
  // Entry point (compiled JavaScript file)
  main: "index.js",
  
  // Compatibility requirements
  engine: {
    ttCommanderVersion: ">=1.0.0"
  }
}
```

### Optional Fields

```json5
{
  // Author information
  author: "John Doe <john@example.com>",
  
  // Node.js version requirement
  engine: {
    nodeVersion: ">=18.0.0"
  },
  
  // Required permissions
  permissions: [
    "filesystem:read",
    "filesystem:write",
    "process:execute",
    "network:access",
    "service:file-scanner"
  ],
  
  // UI contributions (future feature)
  uiContributions: {
    menuItems: ["myPlugin.action1"],
    views: ["myPlugin.sidebar"]
  }
}
```

## Configuration System

### Defining Configuration Schema

Use Zod schemas for type-safe configuration:

```typescript
import { z } from 'zod';

export const MyPluginConfigSchema = z.object({
  // Basic types
  enabled: z.boolean().default(true),
  name: z.string().default('Default Name'),
  count: z.number().default(0),
  
  // Enums
  mode: z.enum(['auto', 'manual']).default('auto'),
  
  // Arrays
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
  email: z.string().email().optional(),
  url: z.string().url().optional(),
  
  // Descriptions for UI generation
  timeout: z.number()
    .min(1)
    .max(3600)
    .default(30)
    .describe('Request timeout in seconds')
});

export type MyPluginConfig = z.infer<typeof MyPluginConfigSchema>;
```

### Using Configuration in Components

```typescript
import { usePluginConfig } from '../hooks/usePluginConfig';

export default function MyPlugin() {
  const [config, updateConfig] = usePluginConfig(MyPluginConfigSchema);

  const handleSettingChange = (key: string, value: any) => {
    updateConfig({ ...config, [key]: value });
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={config.enabled}
          onChange={(e) => handleSettingChange('enabled', e.target.checked)}
        />
        Enable Plugin
      </label>
      
      <input
        type="text"
        value={config.name}
        onChange={(e) => handleSettingChange('name', e.target.value)}
        placeholder="Plugin name"
      />
      
      <select
        value={config.mode}
        onChange={(e) => handleSettingChange('mode', e.target.value)}
      >
        <option value="auto">Automatic</option>
        <option value="manual">Manual</option>
      </select>
    </div>
  );
}
```

## Permission System

### Understanding Permissions

Permissions control what your plugin can access:

- **filesystem:read** - Read files and directories
- **filesystem:write** - Create, modify, delete files
- **process:execute** - Run external commands
- **network:access** - Make HTTP requests
- **system:clipboard** - Access clipboard
- **system:notifications** - Show system notifications
- **service:name** - Access specific services

### Declaring Permissions

In your `plugin.json5`:

```json5
{
  "permissions": [
    "filesystem:read",
    "filesystem:write", 
    "process:execute"
  ]
}
```

### Using Permissions in Code

```typescript
import { usePermissions } from '../hooks/usePermissions';

export default function MyPlugin() {
  const permissions = usePermissions();

  const readFile = async (path: string) => {
    if (!permissions.has('filesystem:read')) {
      throw new Error('No permission to read files');
    }
    
    // Safe to read file
    const content = await fs.readFile(path, 'utf8');
    return content;
  };

  return (
    <div>
      {permissions.has('filesystem:read') ? (
        <button onClick={() => readFile('example.txt')}>
          Read File
        </button>
      ) : (
        <p>File reading not permitted</p>
      )}
    </div>
  );
}
```

## Service Registry

The Service Registry enables secure, permission-based inter-plugin communication.

### Registering Services

Advanced plugins can register services for other plugins to use:

```typescript
// In your plugin manifest (plugin.json5)
{
  "services": [
    {
      "name": "my-service",
      "version": "1.0.0",
      "description": "My custom service",
      "methods": {
        "processData": {
          "description": "Process input data",
          "parameters": {
            "data": "object"
          },
          "returnType": "object"
        },
        "getStatus": {
          "description": "Get service status",
          "parameters": {},
          "returnType": "object",
          "requiresPermission": "settings:read"
        }
      },
      "permissions": ["plugins:communicate"]
    }
  ]
}

// In your plugin implementation
export const services = {
  'my-service': {
    processData(data: any): any {
      // Service implementation
      return { processed: true, result: data };
    },
    
    getStatus(): object {
      return { 
        active: true, 
        processed: this.processedCount,
        timestamp: new Date().toISOString()
      };
    }
  }
};

export async function init(context: PluginContext): Promise<void> {
  context.logger.info('Service plugin initialized');
  // Services are automatically registered by the plugin manager
}
```

### Consuming Services

```typescript
import { useService } from '../hooks/useService';

export default function ConsumerPlugin() {
  const {
    availableServices,
    callService,
    recentCalls,
    isLoading,
    error
  } = useService({
    pluginId: 'consumer-plugin',
    permissions: ['plugins:communicate'],
    serviceRegistry,
    eventBus
  });

  const handleProcess = async () => {
    try {
      const result = await callService(
        'my-service',
        '1.0.0',
        'processData',
        [{ input: 'test' }]
      );
      console.log('Processed:', result);
    } catch (err) {
      console.error('Service call failed:', err);
    }
  };

  const handleGetStatus = async () => {
    try {
      const status = await callService(
        'my-service',
        '1.0.0', 
        'getStatus',
        []
      );
      console.log('Status:', status);
    } catch (err) {
      console.error('Status call failed:', err);
    }
  };

  return (
    <div>
      <h3>Available Services:</h3>
      <ul>
        {availableServices.map(service => (
          <li key={service.name}>
            {service.name} v{service.version}
            <ul>
              {Object.keys(service.methods).map(method => (
                <li key={method}>{method}</li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
      
      <button onClick={handleProcess} disabled={isLoading}>
        Process Data
      </button>
      
      <button onClick={handleGetStatus} disabled={isLoading}>
        Get Status
      </button>
      
      {error && <div>Error: {error}</div>}
      
      <h4>Recent Service Calls:</h4>
      <ul>
        {recentCalls.map((call, index) => (
          <li key={index}>
            {call.serviceName}:{call.methodName} - 
            {call.isLoading ? 'Loading...' : 
             call.error ? `Error: ${call.error}` : 
             'Success'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## Plugin Hooks

Omnia provides React hooks for common plugin operations:

### usePluginConfig

Reactive configuration management with validation and real-time updates:

```typescript
import { usePluginConfig } from '../hooks/usePluginConfig';
import { z } from 'zod';

const configSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().default(''),
  refreshInterval: z.number().default(300)
});

function MyPlugin() {
  const {
    config,
    updateConfig,
    resetConfig,
    isLoading,
    error,
    hasUnsavedChanges,
    validationErrors
  } = usePluginConfig({
    pluginId: 'my-plugin',
    settingsManager,
    eventBus,
    schema: configSchema
  });
  
  const handleUpdate = async () => {
    try {
      await updateConfig({ apiKey: 'new-key' });
      console.log('Config updated successfully');
    } catch (err) {
      console.error('Failed to update config:', err);
    }
  };
  
  if (isLoading) return <div>Loading configuration...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <p>Enabled: {config.enabled}</p>
      <p>API Key: {config.apiKey}</p>
      {hasUnsavedChanges && <p>You have unsaved changes</p>}
      <button onClick={handleUpdate}>Update Config</button>
      <button onClick={resetConfig}>Reset Config</button>
    </div>
  );
}
```

### useService

Easy service calling with error handling and call tracking:

```typescript
import { useService } from '../hooks/useService';

function MyPlugin() {
  const {
    availableServices,
    callService,
    recentCalls,
    isLoading,
    error
  } = useService({
    pluginId: 'my-plugin',
    permissions: ['filesystem:read'],
    serviceRegistry,
    eventBus
  });
  
  const handleServiceCall = async () => {
    try {
      const result = await callService(
        'file-scanner',
        '1.0.0',
        'scanDirectory',
        ['./src']
      );
      console.log('Service result:', result);
    } catch (err) {
      console.error('Service call failed:', err);
    }
  };
  
  return (
    <div>
      <h3>Available Services ({availableServices.length}):</h3>
      <ul>
        {availableServices.map(service => (
          <li key={service.name}>{service.name} v{service.version}</li>
        ))}
      </ul>
      
      <button onClick={handleServiceCall} disabled={isLoading}>
        {isLoading ? 'Calling...' : 'Call Service'}
      </button>
      
      {error && <p>Error: {error}</p>}
      
      <h4>Recent Calls:</h4>
      <ul>
        {recentCalls.map((call, index) => (
          <li key={index}>
            {call.serviceName}:{call.methodName} - 
            {call.isLoading ? 'Loading...' : call.error ? 'Error' : 'Success'}
          </li>
        ))}
      </ul>
    </div>
  );
}
```

### usePluginContext

Complete plugin context access with utilities:

```typescript
import { usePluginContext } from '../hooks/usePluginContext';

function MyPlugin({ context }) {
  const {
    pluginId,
    permissions,
    config,
    services,
    hasPermission,
    log,
    emit,
    subscribe
  } = usePluginContext({ context });
  
  useEffect(() => {
    log.info('Plugin initialized');
    
    const unsubscribe = subscribe('app:ready', (data) => {
      log.info('App is ready', data);
    });
    
    return unsubscribe;
  }, []);
  
  const handleAction = () => {
    if (hasPermission('filesystem:read')) {
      log.info('Reading files...');
      emit('plugin:action', { action: 'read-files' });
    } else {
      log.warn('No permission to read files');
    }
  };
  
  return (
    <div>
      <h2>Plugin: {pluginId}</h2>
      <p>Permissions: {permissions.join(', ')}</p>
      <button onClick={handleAction}>Perform Action</button>
    </div>
  );
}

## Schema-Driven Settings Integration

Omnia provides powerful schema-driven settings forms that automatically generate UI from your plugin's Zod configuration schema. This provides a consistent, type-safe way to handle plugin configuration.

### Automatic Settings Forms

When you define a `configSchema` in your plugin, Omnia can automatically generate a settings form:

```typescript
// plugins/my-plugin/index.tsx
import React from 'react';
import { SchemaForm } from '../../../src/ui/components';
import { usePluginConfig } from '../../../src/hooks';
import { z } from 'zod';

// Define your plugin's configuration schema
export const configSchema = z.object({
  enabled: z.boolean().default(true),
  apiEndpoint: z.string()
    .url('Must be a valid URL')
    .default('https://api.example.com')
    .describe('The API endpoint for your service'),
  
  refreshInterval: z.number()
    .min(30, 'Minimum 30 seconds')
    .max(3600, 'Maximum 1 hour')
    .default(300)
    .describe('How often to refresh data (in seconds)'),
  
  features: z.object({
    notifications: z.boolean()
      .default(true)
      .describe('Show desktop notifications'),
    autoSync: z.boolean()
      .default(false)
      .describe('Automatically sync data in background'),
    maxRetries: z.number()
      .min(0)
      .max(10)
      .default(3)
      .describe('Number of retry attempts for failed requests')
  }).describe('Feature configuration'),
  
  tags: z.array(z.string())
    .default([])
    .describe('Tags to filter content'),
  
  theme: z.enum(['light', 'dark', 'auto'])
    .default('auto')
    .describe('Plugin theme preference')
});

export type MyPluginConfig = z.infer<typeof configSchema>;

export const defaultConfig: MyPluginConfig = {
  enabled: true,
  apiEndpoint: 'https://api.example.com',
  refreshInterval: 300,
  features: {
    notifications: true,
    autoSync: false,
    maxRetries: 3
  },
  tags: [],
  theme: 'auto'
};

export default function MyPlugin() {
  const { 
    config, 
    updateConfig, 
    isLoading, 
    hasUnsavedChanges,
    validationErrors 
  } = usePluginConfig({
    pluginId: 'my-plugin',
    schema: configSchema,
    defaultConfig
  });

  if (isLoading) {
    return <div className="p-4">Loading plugin configuration...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Plugin Settings Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Configuration</h2>
        
        <SchemaForm
          schema={configSchema}
          data={config}
          onChange={updateConfig}
          className="space-y-4"
        />
        
        {hasUnsavedChanges && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded">
            <p className="font-medium">Unsaved Changes</p>
            <p className="text-sm">Your configuration changes will be saved automatically.</p>
          </div>
        )}
        
        {validationErrors && Object.keys(validationErrors).length > 0 && (
          <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-800 rounded">
            <p className="font-medium">Configuration Errors</p>
            <ul className="text-sm mt-1">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>• {field}: {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
      
      {/* Plugin Content Section */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium mb-4">Plugin Status</h3>
        
        {config.enabled ? (
          <div className="space-y-2">
            <div className="flex items-center text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
              Plugin is active
            </div>
            <div className="text-sm text-gray-600">
              <p>API Endpoint: {config.apiEndpoint}</p>
              <p>Refresh Interval: {config.refreshInterval}s</p>
              <p>Theme: {config.theme}</p>
              {config.tags.length > 0 && (
                <p>Tags: {config.tags.join(', ')}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center text-gray-500">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-2"></span>
            Plugin is disabled
          </div>
        )}
      </div>
    </div>
  );
}
```

### Advanced Schema Features

#### Field Descriptions and Help Text

Use `.describe()` to add helpful descriptions that appear in the generated forms:

```typescript
export const configSchema = z.object({
  apiKey: z.string()
    .min(32, 'API key must be at least 32 characters')
    .describe('Your secret API key from the service provider. Keep this secure!'),
    
  timeout: z.number()
    .min(1000)
    .max(30000)
    .default(5000)
    .describe('Request timeout in milliseconds. Higher values may improve reliability but reduce responsiveness.'),
    
  advanced: z.object({
    retryStrategy: z.enum(['exponential', 'linear', 'fixed'])
      .default('exponential')
      .describe('How to handle retry delays between failed requests'),
      
    batchSize: z.number()
      .min(1)
      .max(100)
      .default(10)
      .describe('Number of items to process in each batch operation')
  }).describe('Advanced configuration options for power users')
});
```

#### Custom Validation Rules

Create complex validation logic with custom refinements:

```typescript
export const configSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  
  database: z.object({
    host: z.string().default('localhost'),
    port: z.number().min(1).max(65535).default(5432),
    ssl: z.boolean().default(false)
  })
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"]
}).refine((data) => {
  // Custom validation: if SSL is enabled, port should be secure
  if (data.database.ssl && data.database.port < 1000) {
    return false;
  }
  return true;
}, {
  message: "SSL connections should use secure ports (≥ 1000)",
  path: ["database", "port"]
});
```

#### Dynamic Configuration Updates

React to configuration changes in real-time:

```typescript
export default function MyPlugin() {
  const { config, updateConfig } = usePluginConfig({
    pluginId: 'my-plugin',
    schema: configSchema
  });
  
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  // React to configuration changes
  useEffect(() => {
    if (!config.enabled) {
      setConnectionStatus('disabled');
      return;
    }
    
    // Reconnect when API endpoint changes
    const connectToAPI = async () => {
      setConnectionStatus('connecting');
      try {
        // Your connection logic here
        const response = await fetch(config.apiEndpoint);
        if (response.ok) {
          setConnectionStatus('connected');
        } else {
          setConnectionStatus('error');
        }
      } catch (error) {
        setConnectionStatus('error');
      }
    };
    
    connectToAPI();
  }, [config.enabled, config.apiEndpoint]);
  
  // Update configuration based on user actions
  const handleQuickToggle = (feature: string, enabled: boolean) => {
    updateConfig({
      ...config,
      features: {
        ...config.features,
        [feature]: enabled
      }
    });
  };
  
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">My Plugin</h2>
        <div className={`px-2 py-1 rounded text-sm ${
          connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
          connectionStatus === 'connecting' ? 'bg-yellow-100 text-yellow-800' :
          connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'
        }`}>
          {connectionStatus}
        </div>
      </div>
      
      {/* Quick toggles for common features */}
      <div className="flex gap-2">
        <button
          onClick={() => handleQuickToggle('notifications', !config.features.notifications)}
          className={`px-3 py-1 rounded text-sm ${
            config.features.notifications 
              ? 'bg-blue-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Notifications {config.features.notifications ? 'On' : 'Off'}
        </button>
        
        <button
          onClick={() => handleQuickToggle('autoSync', !config.features.autoSync)}
          className={`px-3 py-1 rounded text-sm ${
            config.features.autoSync 
              ? 'bg-green-500 text-white' 
              : 'bg-gray-200 text-gray-700'
          }`}
        >
          Auto Sync {config.features.autoSync ? 'On' : 'Off'}
        </button>
      </div>
      
      {/* Your plugin content here */}
    </div>
  );
}
```

### Integration with Plugin Settings Page

Your plugin's settings automatically appear in the main settings interface:

1. **App Settings Tab**: Application-level configuration
2. **Plugin Settings Tab**: Your plugin appears here with automatic form generation
3. **System Settings Tab**: System-level information and settings

The PluginSettings component automatically:
- Detects your plugin type (Simple/Configured/Advanced)
- Generates appropriate forms from your schema
- Handles enable/disable functionality
- Validates permissions and manifest requirements
- Provides real-time validation and feedback

### Best Practices for Schema-Driven Settings

#### 1. Provide Sensible Defaults

```typescript
const schema = z.object({
  // Always provide defaults for a better user experience
  enabled: z.boolean().default(true),
  apiUrl: z.string().url().default('https://api.example.com'),
  refreshInterval: z.number().min(30).max(3600).default(300)
});
```

#### 2. Use Descriptive Field Names and Help Text

```typescript
const schema = z.object({
  maxConcurrentRequests: z.number()
    .min(1)
    .max(50)
    .default(5)
    .describe('Maximum number of simultaneous API requests. Higher values may improve performance but could overwhelm the server.'),
    
  enableCaching: z.boolean()
    .default(true)
    .describe('Cache API responses to improve performance and reduce server load')
});
```

#### 3. Group Related Settings

```typescript
const schema = z.object({
  general: z.object({
    enabled: z.boolean().default(true),
    theme: z.enum(['light', 'dark']).default('light')
  }).describe('General plugin settings'),
  
  api: z.object({
    endpoint: z.string().url().default('https://api.example.com'),
    timeout: z.number().default(5000),
    retries: z.number().min(0).max(5).default(3)
  }).describe('API connection settings'),
  
  ui: z.object({
    showNotifications: z.boolean().default(true),
    animationsEnabled: z.boolean().default(true)
  }).describe('User interface preferences')
});
```

#### 4. Validate Input Thoroughly

```typescript
const schema = z.object({
  serverUrl: z.string()
    .url('Must be a valid URL')
    .refine((url) => !url.endsWith('/'), {
      message: 'URL should not end with a slash'
    }),
    
  port: z.number()
    .min(1, 'Port must be at least 1')
    .max(65535, 'Port must be less than 65536')
    .refine((port) => port !== 22, {
      message: 'Port 22 is reserved for SSH'
    })
});
```

This schema-driven approach provides a consistent, type-safe way to handle plugin configuration while automatically generating beautiful, functional settings interfaces.

## Styling Your Plugin

### Inline Styles (Recommended)

Use React inline styles for simple styling:

```typescript
const styles = {
  container: {
    padding: '20px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px'
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px'
  }
};

export default function MyPlugin() {
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>My Plugin</h1>
    </div>
  );
}
```

### CSS Modules (Advanced)

For complex styling, use CSS Modules:

```css
/* styles.module.css */
.container {
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
}

.title {
  font-size: 24px;
  color: white;
  text-shadow: 0 2px 4px rgba(0,0,0,0.3);
}
```

```typescript
import styles from './styles.module.css';

export default function MyPlugin() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>My Plugin</h1>
    </div>
  );
}
```

### Tailwind CSS (Future)

When Tailwind is set up, you can use utility classes:

```typescript
export default function MyPlugin() {
  return (
    <div className="p-6 bg-gray-100 rounded-lg">
      <h1 className="text-2xl font-bold mb-4">My Plugin</h1>
    </div>
  );
}
```

## Testing Your Plugin

### Unit Testing

```typescript
// __tests__/MyPlugin.test.tsx
import { render, screen } from '@testing-library/react';
import MyPlugin from '../index';

describe('MyPlugin', () => {
  it('renders plugin title', () => {
    render(<MyPlugin />);
    expect(screen.getByText('My Plugin')).toBeInTheDocument();
  });

  it('handles configuration changes', () => {
    // Test configuration updates
  });
});
```

### Integration Testing

```typescript
// __tests__/integration.test.ts
import { SettingsManager } from '../../../src/core/settings-manager';
import { MyPluginConfigSchema } from '../index';

describe('MyPlugin Integration', () => {
  let settingsManager: SettingsManager;

  beforeEach(() => {
    settingsManager = new SettingsManager('./test-config');
  });

  afterEach(() => {
    settingsManager.destroy();
  });

  it('saves and loads configuration correctly', async () => {
    const config = { enabled: true, name: 'Test Plugin' };
    
    await settingsManager.savePluginConfig('my-plugin', config, MyPluginConfigSchema);
    const loaded = await settingsManager.loadPluginConfig('my-plugin', MyPluginConfigSchema);
    
    expect(loaded).toEqual(config);
  });
});
```

## Best Practices

### 1. Use TypeScript

Always use TypeScript for better development experience:

```typescript
// ✅ Good - Type-safe
interface Props {
  title: string;
  onSave: (data: PluginData) => void;
}

export default function MyPlugin({ title, onSave }: Props) {
  // ...
}

// ❌ Bad - No type safety
export default function MyPlugin(props) {
  // ...
}
```

### 2. Handle Errors Gracefully

```typescript
export default function MyPlugin() {
  const [error, setError] = useState<string | null>(null);

  const handleAction = async () => {
    try {
      await riskyOperation();
      setError(null);
    } catch (err) {
      setError(err.message);
      console.error('Plugin error:', err);
    }
  };

  if (error) {
    return (
      <div style={{ color: 'red', padding: '20px' }}>
        Error: {error}
        <button onClick={() => setError(null)}>Dismiss</button>
      </div>
    );
  }

  // Normal plugin UI
}
```

### 3. Provide Good UX

```typescript
export default function MyPlugin() {
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

  return (
    <div>
      <button onClick={loadData} disabled={loading}>
        {loading ? 'Loading...' : 'Load Data'}
      </button>
      
      {data && (
        <div>
          {/* Display data */}
        </div>
      )}
    </div>
  );
}
```

### 4. Clean Up Resources

```typescript
export default function MyPlugin() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Periodic task
    }, 1000);

    const subscription = subscribe((data) => {
      // Handle events
    });

    return () => {
      clearInterval(interval);
      subscription.unsubscribe();
    };
  }, []);

  // Component JSX
}
```

### 5. Use Semantic Versioning

Follow semantic versioning for your plugin versions:

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features
- **Patch** (1.0.0 → 1.0.1): Bug fixes

## Debugging Plugins

### Console Logging

```typescript
export default function MyPlugin() {
  console.log('[MyPlugin] Component rendered');
  
  const handleClick = () => {
    console.log('[MyPlugin] Button clicked');
  };

  // Use app debug mode
  if (window.appConfig?.debugMode) {
    console.debug('[MyPlugin] Debug info:', { config, state });
  }
}
```

### Error Boundaries

Wrap your plugin in an error boundary:

```typescript
class PluginErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Plugin error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong in the plugin.</div>;
    }

    return this.props.children;
  }
}

export default function MyPlugin() {
  return (
    <PluginErrorBoundary>
      {/* Plugin content */}
    </PluginErrorBoundary>
  );
}
```

## Plugin Examples

Check the existing plugins for examples:

### Production Examples
- **`plugins/test-simple/`** - Simple plugin example
- **`plugins/script-runner/`** - Configured plugin with complex schema
- **`plugins/context-generator/`** - Service-based plugin
- **`plugins/customer-links/`** - Data-driven plugin
- **`plugins/as-built-documenter/`** - Advanced plugin with file operations

### Template Examples
- **`examples/plugins/simple-plugin/`** - Complete simple plugin template
- **`examples/plugins/configured-plugin/`** - Configured plugin with schema validation
- **`examples/plugins/advanced-plugin/`** - Advanced plugin with services and lifecycle hooks

### Key Features Demonstrated

**Simple Plugin Template:**
- Basic React component export
- Tailwind CSS styling with theme colors
- Minimal manifest configuration

**Configured Plugin Template:**
- Zod schema validation
- Default configuration handling
- Props-based configuration access
- Dynamic UI based on configuration

**Advanced Plugin Template:**
- Complete lifecycle management (init/stop)
- Service registration and implementation
- Event bus integration
- Permission-based operations
- Real-time statistics and monitoring
- Plugin-to-plugin communication examples

## Troubleshooting

### Common Plugin Loading Issues

#### 1. CSS Module Import Errors (RESOLVED)
```
Card.module.css:1 Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of "text/css"
```
**Solution**: This is automatically handled by the build system. CSS modules are processed into JavaScript objects during build. Just use normal CSS module imports:
```tsx
import styles from './MyComponent.module.css'; // ✅ Works correctly
```

#### 2. Plugin Export Validation Errors
```
Simple plugin must export a component
```
**Causes & Solutions**:
- **Missing export**: Ensure your plugin exports either a named `component` or a default export
- **Incorrect export pattern**: 
  ```tsx
  // ✅ Option 1: Named export
  export const component = MyPluginComponent;
  
  // ✅ Option 2: Default export
  export default MyPluginComponent;
  ```

#### 3. Manifest File Not Found
```
Could not load manifest for plugin my-plugin: Error: ENOENT: no such file or directory
```
**Solution**: Ensure `plugin.json5` exists in your plugin directory with required fields:
```json5
{
  id: "my-plugin",
  name: "My Plugin",
  version: "1.0.0",
  type: "simple", // or "configured" or "advanced"
  main: "index.tsx",
  permissions: []
}
```

#### 4. Plugin Module Loading Failures
```
Failed to fetch dynamically imported module: file:///path/to/plugin/index.js
```
**Solutions**:
- Run `npm run build` to ensure plugin is compiled
- Check that `dist/plugins/my-plugin/index.js` exists
- Verify import paths are correct in compiled plugin

#### 5. Configuration Schema Errors
```
Failed to load config schema for plugin: Error loading config-schema.js
```
**For Configured Plugins**:
- Ensure `config-schema.js` file exists in plugin directory
- Export schema correctly:
  ```typescript
  import { z } from 'zod';
  export const configSchema = z.object({
    myField: z.string().default('default value')
  });
  ```

### Plugin Development Debugging

#### Console Debugging
Enable detailed plugin loading logs:
1. Open browser developer tools
2. Look for `[EnhancedPluginPanel]` and `[initEnhancedRenderer]` log messages
3. Check for specific plugin loading errors

#### Build Verification
```bash
# 1. Clean build
npm run clean
npm run build

# 2. Check generated files
ls dist/plugins/my-plugin/
# Should contain: index.js and any .module.css.js files

# 3. Test in Electron
npm run electron
```

#### Plugin Registry Issues
If plugins aren't appearing:
1. Check `config/plugins.json5` for plugin entries
2. Ensure plugin is enabled: `"enabled": true`
3. Verify plugin ID matches directory name

### CSS and Styling Issues

#### CSS Modules Not Working
- CSS modules are automatically processed during build
- Check that `.module.css.js` files are generated in dist/
- Verify imports in compiled JS point to `.css.js` files

#### Tailwind Classes Not Working
- Ensure global CSS is loaded
- Use theme variables: `bg-theme-surface`, `text-theme-primary`
- Combine with CSS modules for complex behavior

### Performance Issues

#### Slow Plugin Loading
- Check for large dependencies in plugin code
- Use dynamic imports for heavy libraries
- Implement proper error boundaries

#### Memory Leaks
- Clean up event listeners in plugin cleanup
- Unsubscribe from services when plugin unloads
- Avoid circular references in plugin context

### Advanced Plugin Issues

#### Service Registration Failures
```
Failed to initialize service my-service for plugin my-plugin
```
**Solutions**:
- Ensure service is exported correctly in plugin module
- Check service manifest matches implementation
- Verify required permissions are granted

#### Permission Denied Errors
```
Plugin my-plugin requests invalid permissions: some-permission
```
**Valid permissions**:
- `filesystem:read`, `filesystem:write`
- `network:http`
- `system:exec`
- `plugins:communicate`
- `settings:read`, `settings:write`

## Getting Help

- **Documentation**: 
  - [Asset Loading Guide](./ASSET_LOADING.md) for CSS module details
  - [Settings API](./SETTINGS_API.md) for configuration details
  - [Architecture Guide](./ARCHITECTURE.md) for system overview
  - [Implementation Plan](./IMPLEMENTATION_PLAN.md) for development status
- **Examples**: 
  - Look at existing plugins in the `plugins/` directory
  - Check template examples in `examples/plugins/`
- **Testing**: 
  - Run `npm test` to validate your plugin
  - Use the Enhanced Plugin Manager for debugging
- **Issues**: Report bugs or request features in the project repository

## Plugin Development Workflow

1. **Choose Plugin Type**: Start with Simple, upgrade to Configured or Advanced as needed
2. **Create Directory**: `mkdir plugins/my-plugin`
3. **Create Manifest**: Define `plugin.json5` with proper type and permissions
4. **Implement Plugin**: Use appropriate pattern for your chosen type
5. **Test Integration**: Use `npm run build && npm run electron` to test
6. **Use Hooks**: Leverage `usePluginConfig`, `useService`, and `usePluginContext` for functionality
7. **Register Services**: For Advanced plugins, define services in manifest and implement in code
8. **Handle Permissions**: Always check permissions before sensitive operations

Happy plugin development! 🚀