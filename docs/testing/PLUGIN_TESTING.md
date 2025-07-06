# Plugin Testing Strategies

This document outlines comprehensive testing approaches for Omnia's plugin system, ensuring plugins work correctly in isolation and integration.

## 🎯 Testing Philosophy

Plugin testing follows these principles:
- **Isolation** - Test plugins independently of the full application
- **Mocking** - Mock plugin context and service dependencies  
- **Behavior-focused** - Test what plugins do, not how they do it
- **Integration** - Verify plugins work within the full system

## 🧪 Testing Architecture

### Test Environment Setup
```typescript
// test-setup.ts
import { render } from '@testing-library/react';
import { PluginContext, ServiceRegistry } from '@/core/types';

// Mock plugin context
export const createMockPluginContext = (overrides?: Partial<PluginContext>): PluginContext => ({
  pluginId: 'test-plugin',
  version: '1.0.0',
  permissions: ['ui:read', 'ui:write'],
  config: {},
  serviceRegistry: createMockServiceRegistry(),
  ...overrides
});

// Mock service registry
export const createMockServiceRegistry = (): ServiceRegistry => ({
  getService: jest.fn(),
  hasPermission: jest.fn().mockReturnValue(true),
  registerService: jest.fn(),
  unregisterService: jest.fn()
});

// Plugin test wrapper
export const renderWithPluginContext = (
  component: React.ReactElement,
  context?: Partial<PluginContext>
) => {
  const mockContext = createMockPluginContext(context);
  
  return render(
    <PluginContextProvider value={mockContext}>
      {component}
    </PluginContextProvider>
  );
};
```

## 🔧 Unit Testing Patterns

### 1. Testing Simple Plugins
```typescript
// SimplePlugin.test.tsx
import { render, screen } from '@testing-library/react';
import { SimplePlugin } from './SimplePlugin';

describe('SimplePlugin', () => {
  it('should render plugin content', () => {
    renderWithPluginContext(<SimplePlugin />);
    
    expect(screen.getByText('Simple Plugin Content')).toBeInTheDocument();
  });
  
  it('should handle missing permissions gracefully', () => {
    renderWithPluginContext(<SimplePlugin />, {
      permissions: [] // No permissions
    });
    
    expect(screen.getByText('Insufficient permissions')).toBeInTheDocument();
  });
});
```

### 2. Testing Configured Plugins
```typescript
// ConfiguredPlugin.test.tsx
import userEvent from '@testing-library/user-event';
import { ConfiguredPlugin } from './ConfiguredPlugin';

describe('ConfiguredPlugin', () => {
  const mockConfig = {
    title: 'Test Title',
    enabled: true,
    options: { theme: 'dark' }
  };
  
  it('should render with provided configuration', () => {
    renderWithPluginContext(<ConfiguredPlugin />, {
      config: mockConfig
    });
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByTestId('theme-indicator')).toHaveClass('dark-theme');
  });
  
  it('should handle configuration updates', async () => {
    const user = userEvent.setup();
    const mockUpdateConfig = jest.fn();
    
    renderWithPluginContext(<ConfiguredPlugin />, {
      config: mockConfig,
      updateConfig: mockUpdateConfig
    });
    
    await user.click(screen.getByRole('button', { name: 'Toggle Theme' }));
    
    expect(mockUpdateConfig).toHaveBeenCalledWith({
      ...mockConfig,
      options: { theme: 'light' }
    });
  });
});
```

### 3. Testing Advanced Plugins
```typescript
// AdvancedPlugin.test.tsx
import { AdvancedPlugin } from './AdvancedPlugin';

describe('AdvancedPlugin', () => {
  it('should initialize plugin lifecycle correctly', async () => {
    const mockOnInitialize = jest.fn();
    const mockOnStart = jest.fn();
    
    renderWithPluginContext(<AdvancedPlugin />, {
      lifecycle: {
        onInitialize: mockOnInitialize,
        onStart: mockOnStart,
        onStop: jest.fn(),
        onDestroy: jest.fn()
      }
    });
    
    // Verify lifecycle methods called
    expect(mockOnInitialize).toHaveBeenCalled();
    await waitFor(() => {
      expect(mockOnStart).toHaveBeenCalled();
    });
  });
});
```

## 🔗 Service Integration Testing

### Mocking Services
```typescript
// Mock service implementations
const mockServices = {
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  notifications: {
    showNotification: jest.fn()
  },
  storage: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
};

// Test service usage
describe('Plugin Service Integration', () => {
  it('should use logger service correctly', () => {
    const mockGetService = jest.fn()
      .mockReturnValue(mockServices.logger);
      
    renderWithPluginContext(<TestPlugin />, {
      serviceRegistry: { getService: mockGetService }
    });
    
    // Trigger action that uses logger
    fireEvent.click(screen.getByRole('button', { name: 'Log Action' }));
    
    expect(mockGetService).toHaveBeenCalledWith('logger', ['log:write']);
    expect(mockServices.logger.info).toHaveBeenCalledWith(
      'Action performed',
      expect.any(Object)
    );
  });
  
  it('should handle service unavailability', () => {
    const mockGetService = jest.fn().mockReturnValue(null);
    
    renderWithPluginContext(<TestPlugin />, {
      serviceRegistry: { getService: mockGetService }
    });
    
    // Should handle gracefully when service not available
    fireEvent.click(screen.getByRole('button', { name: 'Log Action' }));
    
    expect(screen.getByText('Service unavailable')).toBeInTheDocument();
  });
});
```

### Permission Testing
```typescript
describe('Plugin Permissions', () => {
  it('should respect permission boundaries', () => {
    const mockGetService = jest.fn();
    const mockHasPermission = jest.fn()
      .mockImplementation((permission) => permission === 'ui:read');
    
    renderWithPluginContext(<PermissionTestPlugin />, {
      permissions: ['ui:read'], // Missing ui:write
      serviceRegistry: { 
        getService: mockGetService,
        hasPermission: mockHasPermission 
      }
    });
    
    // Should show read-only mode
    expect(screen.getByText('Read-only mode')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Edit' })).not.toBeInTheDocument();
  });
});
```

## 🌐 Integration Testing

### Full Plugin Loading
```typescript
// integration.test.ts
import { loadPlugin, PluginManager } from '@/core/plugin-manager';

describe('Plugin Integration', () => {
  let pluginManager: PluginManager;
  
  beforeEach(() => {
    pluginManager = new PluginManager();
  });
  
  it('should load and initialize plugin correctly', async () => {
    const plugin = await pluginManager.loadPlugin('test-plugin', {
      permissions: ['ui:read', 'ui:write', 'data:read']
    });
    
    expect(plugin).toBeDefined();
    expect(plugin.status).toBe('loaded');
    expect(plugin.manifest.id).toBe('test-plugin');
  });
  
  it('should handle plugin loading failures', async () => {
    await expect(
      pluginManager.loadPlugin('non-existent-plugin')
    ).rejects.toThrow('Plugin not found');
  });
  
  it('should enforce permission requirements', async () => {
    const plugin = await pluginManager.loadPlugin('test-plugin', {
      permissions: ['ui:read'] // Missing required permissions
    });
    
    const service = plugin.getService('data-processor', ['data:write']);
    expect(service).toBeNull();
  });
});
```

### End-to-End Plugin Workflows
```typescript
// e2e-plugin.test.ts (Playwright)
import { test, expect } from '@playwright/test';

test.describe('Plugin E2E Workflows', () => {
  test('should enable and configure plugin', async ({ page }) => {
    await page.goto('/plugins');
    
    // Enable plugin
    await page.click('[data-testid="plugin-card-test-plugin"] button');
    await expect(page.locator('.notification')).toContainText('Plugin enabled');
    
    // Configure plugin
    await page.click('[data-testid="plugin-card-test-plugin"] [data-testid="configure"]');
    await page.fill('[data-testid="plugin-title-input"]', 'My Test Plugin');
    await page.click('[data-testid="save-config"]');
    
    // Verify configuration saved
    await expect(page.locator('[data-testid="plugin-title"]')).toContainText('My Test Plugin');
  });
  
  test('should handle plugin errors gracefully', async ({ page }) => {
    // Mock plugin that throws error
    await page.route('**/plugins/error-plugin/index.js', route => {
      route.fulfill({
        status: 200,
        body: 'throw new Error("Test plugin error");'
      });
    });
    
    await page.goto('/plugins/error-plugin');
    
    // Should show error boundary
    await expect(page.locator('[data-testid="error-boundary"]')).toBeVisible();
    await expect(page.locator('.error-message')).toContainText('Plugin failed to load');
  });
});
```

## 📊 Performance Testing

### Plugin Load Time Testing
```typescript
describe('Plugin Performance', () => {
  it('should load plugin within acceptable time', async () => {
    const startTime = performance.now();
    
    await pluginManager.loadPlugin('performance-test-plugin');
    
    const loadTime = performance.now() - startTime;
    expect(loadTime).toBeLessThan(1000); // Should load within 1 second
  });
  
  it('should not leak memory on plugin unload', async () => {
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Load and unload plugin multiple times
    for (let i = 0; i < 10; i++) {
      const plugin = await pluginManager.loadPlugin('test-plugin');
      await pluginManager.unloadPlugin(plugin.id);
    }
    
    // Force garbage collection
    global.gc?.();
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Should not increase memory significantly
    expect(memoryIncrease).toBeLessThan(1024 * 1024); // Less than 1MB increase
  });
});
```

## 🔧 Test Utilities

### Plugin Test Factory
```typescript
// test-utils/plugin-factory.ts
export const createTestPlugin = (overrides?: Partial<PluginManifest>) => ({
  id: 'test-plugin',
  name: 'Test Plugin',
  version: '1.0.0',
  type: 'simple' as const,
  permissions: ['ui:read', 'ui:write'],
  component: () => <div>Test Plugin</div>,
  ...overrides
});

export const createConfiguredTestPlugin = (config?: any) => ({
  ...createTestPlugin(),
  type: 'configured' as const,
  configSchema: z.object({
    title: z.string().default('Default Title'),
    enabled: z.boolean().default(true)
  }),
  config: config || { title: 'Test Title', enabled: true }
});
```

### Mock Data Generators
```typescript
// test-utils/mock-data.ts
export const generateMockUserData = (count: number = 10) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `user-${i}`,
    email: `user${i}@example.com`,
    modules: [
      { name: 'dashboard', enabled: true },
      { name: 'analytics', enabled: i % 2 === 0 }
    ]
  }));
};

export const generateMockPluginConfig = (pluginId: string) => ({
  pluginId,
  config: {
    title: `${pluginId} Plugin`,
    theme: 'light',
    features: ['feature1', 'feature2']
  },
  isActive: true
});
```

## 📋 Testing Checklist

### Plugin Development Testing
- [ ] Unit tests for all plugin components
- [ ] Permission boundary testing
- [ ] Service integration testing  
- [ ] Configuration validation testing
- [ ] Error handling testing
- [ ] Performance benchmarking

### Plugin Review Testing
- [ ] Load plugin in isolation
- [ ] Test with different permission sets
- [ ] Verify service usage patterns
- [ ] Test configuration edge cases
- [ ] Validate error boundaries
- [ ] Check memory usage patterns

### Integration Testing
- [ ] Plugin loads correctly in full application
- [ ] Inter-plugin communication works
- [ ] Real-time updates function properly
- [ ] Database interactions are correct
- [ ] UI integration is seamless

## 🐛 Common Testing Pitfalls

### 1. Testing Implementation Instead of Behavior
```typescript
// ❌ BAD: Testing internal implementation
expect(plugin.internalState.counter).toBe(5);

// ✅ GOOD: Testing observable behavior
expect(screen.getByText('Count: 5')).toBeInTheDocument();
```

### 2. Not Mocking External Dependencies
```typescript
// ❌ BAD: Real service calls in tests
const realService = useService('external-api');

// ✅ GOOD: Mocked service
const mockService = jest.fn().mockResolvedValue(mockData);
```

### 3. Insufficient Permission Testing
```typescript
// ❌ BAD: Only testing happy path
renderWithPluginContext(<Plugin />, { permissions: ['all'] });

// ✅ GOOD: Test different permission scenarios
const permissionScenarios = [
  { permissions: [], expectedBehavior: 'shows permission error' },
  { permissions: ['ui:read'], expectedBehavior: 'shows read-only view' },
  { permissions: ['ui:read', 'ui:write'], expectedBehavior: 'shows full functionality' }
];
```

## 📚 Related Documentation

- **[../architecture/PLUGIN_DEVELOPER_GUIDE.md](../architecture/PLUGIN_DEVELOPER_GUIDE.md)** - Plugin development guide
- **[../security/PLUGIN_SECURITY.md](../security/PLUGIN_SECURITY.md)** - Plugin security model
- **[UI_TESTING.md](./UI_TESTING.md)** - UI component testing
- **[../LEARNINGS.md](../LEARNINGS.md)** - Testing-related patterns

---

*Comprehensive testing ensures plugins are reliable, secure, and performant. Test in isolation first, then integration, always thinking about the user experience.*