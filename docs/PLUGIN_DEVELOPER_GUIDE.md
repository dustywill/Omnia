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

Omnia supports three tiers of plugin complexity:

### Tier 1: Simple Plugins

Just export a React component. Perfect for static content, calculators, or simple tools.

```typescript
// plugins/calculator/index.tsx
import React, { useState } from 'react';

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
    <div style={{ padding: '20px' }}>
      <h2>Calculator</h2>
      <input 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
        placeholder="Enter calculation"
      />
      <button onClick={calculate}>Calculate</button>
      <div>Result: {result}</div>
    </div>
  );
}
```

### Tier 2: Configured Plugins (Most Common)

Components with configuration schemas. Great for plugins that need user settings.

```typescript
// plugins/weather/index.tsx
import React, { useState, useEffect } from 'react';
import { z } from 'zod';

// Define configuration schema
export const WeatherConfigSchema = z.object({
  enabled: z.boolean().default(true),
  apiKey: z.string().default(''),
  city: z.string().default('New York'),
  refreshInterval: z.number().default(300), // 5 minutes
  units: z.enum(['metric', 'imperial']).default('metric')
});

export type WeatherConfig = z.infer<typeof WeatherConfigSchema>;

// Export schema for the settings system
export { WeatherConfigSchema as configSchema };

export default function WeatherPlugin() {
  // In real implementation, this would come from usePluginConfig hook
  const [config] = useState<WeatherConfig>({
    enabled: true,
    apiKey: 'your-api-key',
    city: 'New York',
    refreshInterval: 300,
    units: 'metric'
  });

  const [weather, setWeather] = useState(null);

  useEffect(() => {
    if (!config.enabled || !config.apiKey) return;

    // Fetch weather data
    const fetchWeather = async () => {
      // Weather API call implementation
    };

    fetchWeather();
    const interval = setInterval(fetchWeather, config.refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [config]);

  if (!config.enabled) {
    return <div>Weather plugin is disabled</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2>Weather in {config.city}</h2>
      {weather ? (
        <div>
          {/* Weather display */}
        </div>
      ) : (
        <div>Loading weather...</div>
      )}
    </div>
  );
}
```

### Tier 3: Advanced Plugins

Full lifecycle plugins with background processing, service registration, and complex state management.

```typescript
// plugins/file-watcher/index.tsx
import React, { useState } from 'react';
import { z } from 'zod';

export const FileWatcherConfigSchema = z.object({
  enabled: z.boolean().default(true),
  watchDirectory: z.string().default('./'),
  filePatterns: z.array(z.string()).default(['*.txt', '*.md']),
  notifications: z.boolean().default(true)
});

export type FileWatcherConfig = z.infer<typeof FileWatcherConfigSchema>;
export { FileWatcherConfigSchema as configSchema };

// Advanced plugin class with lifecycle methods
export class FileWatcherPlugin {
  private config: FileWatcherConfig;
  private watchers: any[] = [];

  constructor(config: FileWatcherConfig) {
    this.config = config;
  }

  // Called when plugin is loaded
  async onInit() {
    if (!this.config.enabled) return;

    // Set up file watchers
    this.setupFileWatchers();
    
    // Register service for other plugins to use
    this.registerService('file-watcher', {
      getWatchedFiles: () => this.getWatchedFiles(),
      addWatch: (path: string) => this.addWatch(path)
    });
  }

  // Called when plugin is unloaded
  async onDestroy() {
    this.watchers.forEach(watcher => watcher.close());
    this.watchers = [];
  }

  // Called when configuration changes
  async onConfigChange(newConfig: FileWatcherConfig) {
    this.config = newConfig;
    await this.onDestroy();
    await this.onInit();
  }

  // React component for UI
  render() {
    return (
      <FileWatcherUI 
        config={this.config}
        watchers={this.watchers}
        onConfigChange={(config) => this.onConfigChange(config)}
      />
    );
  }

  private setupFileWatchers() {
    // File watching implementation
  }

  private getWatchedFiles() {
    // Return list of watched files
  }

  private addWatch(path: string) {
    // Add new file/directory to watch
  }

  private registerService(name: string, service: any) {
    // Register service with main application
  }
}

function FileWatcherUI({ config, watchers, onConfigChange }) {
  return (
    <div style={{ padding: '20px' }}>
      <h2>File Watcher</h2>
      <p>Watching {watchers.length} files/directories</p>
      {/* Configuration UI */}
    </div>
  );
}

// Export the plugin class as default
export default FileWatcherPlugin;
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

### Registering Services

Advanced plugins can register services for other plugins to use:

```typescript
export class MyServicePlugin {
  async onInit() {
    this.registerService('my-service', {
      processData: (data: any) => this.processData(data),
      getStatus: () => this.getStatus(),
      subscribe: (callback: Function) => this.subscribe(callback)
    });
  }

  private processData(data: any) {
    // Service implementation
    return processedData;
  }

  private getStatus() {
    return { active: true, processed: this.processedCount };
  }

  private subscribe(callback: Function) {
    // Event subscription implementation
  }
}
```

### Consuming Services

```typescript
import { useService } from '../hooks/useService';

export default function ConsumerPlugin() {
  const myService = useService('my-service');

  const handleProcess = async () => {
    if (!myService) {
      console.log('Service not available');
      return;
    }

    const result = await myService.processData({ input: 'test' });
    console.log('Processed:', result);
  };

  return (
    <div>
      <button onClick={handleProcess} disabled={!myService}>
        Process Data
      </button>
      {myService && (
        <div>Status: {JSON.stringify(myService.getStatus())}</div>
      )}
    </div>
  );
}
```

## Plugin Hooks

Omnia provides React hooks for common plugin operations:

### usePluginConfig

```typescript
import { usePluginConfig } from '../hooks/usePluginConfig';

function MyPlugin() {
  const [config, updateConfig] = usePluginConfig(MyConfigSchema);
  
  // config is type-safe and automatically persisted
  // updateConfig saves changes automatically
}
```

### useService

```typescript
import { useService } from '../hooks/useService';

function MyPlugin() {
  const fileService = useService<FileService>('file-scanner');
  
  if (fileService) {
    // Service is available
    const files = fileService.scanDirectory('./');
  }
}
```

### usePermissions

```typescript
import { usePermissions } from '../hooks/usePermissions';

function MyPlugin() {
  const permissions = usePermissions();
  
  const canReadFiles = permissions.has('filesystem:read');
  const canExecute = permissions.has('process:execute');
}
```

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

- **`plugins/test-simple/`** - Simple plugin example
- **`plugins/script-runner/`** - Configured plugin with complex schema
- **`plugins/context-generator/`** - Service-based plugin
- **`plugins/customer-links/`** - Data-driven plugin

## Getting Help

- **Documentation**: Check the [Settings API](./SETTINGS_API.md) for configuration details
- **Examples**: Look at existing plugins in the `plugins/` directory
- **Issues**: Report bugs or request features in the project repository
- **Testing**: Run `npm test` to validate your plugin

Happy plugin development! 🚀