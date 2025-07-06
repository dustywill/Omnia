# Service Architecture - Inter-Component Communication

This document describes the service architecture pattern used for communication between plugins and core components in Omnia.

## 🎯 Service Architecture Overview

The service architecture provides a secure, controlled way for plugins and components to share functionality while maintaining isolation and security boundaries.

## 🔧 Service Registry Pattern

### Core Concept
All inter-plugin communication flows through a central Service Registry that validates permissions and mediates access.

```typescript
interface ServiceRegistry {
  registerService(service: ServiceDefinition): void;
  getService(name: string, requiredPermissions: string[]): Service | null;
  hasPermission(pluginId: string, permission: string): boolean;
}
```

### Service Definition
```typescript
interface ServiceDefinition {
  name: string;
  version: string;
  provider: string; // Plugin ID that provides the service
  methods: ServiceMethod[];
  requiredPermissions: string[];
  implementation: ServiceImplementation;
}

interface ServiceMethod {
  name: string;
  requiredPermissions: string[];
  parameters: ParameterDefinition[];
  returnType: string;
}
```

## 🔒 Permission Model

### Permission Types
- **read**: Access to read data from the service
- **write**: Ability to modify data through the service
- **execute**: Permission to call service methods
- **admin**: Administrative access to service configuration

### Permission Validation
```typescript
const validateServiceAccess = (
  pluginId: string, 
  serviceName: string, 
  method: string
): boolean => {
  const plugin = getPlugin(pluginId);
  const service = getService(serviceName);
  const requiredPermissions = service.methods[method].requiredPermissions;
  
  return requiredPermissions.every(permission => 
    plugin.manifest.permissions.includes(permission)
  );
};
```

## 🚀 Service Implementation Examples

### Data Service Example
```typescript
// Service Provider (Plugin A)
const dataService: ServiceDefinition = {
  name: 'data-processor',
  version: '1.0.0',
  provider: 'data-plugin',
  methods: [
    {
      name: 'processData',
      requiredPermissions: ['data:write'],
      parameters: [{ name: 'data', type: 'object' }],
      returnType: 'ProcessedData'
    }
  ],
  requiredPermissions: ['data:read', 'data:write'],
  implementation: {
    processData: (data) => {
      // Implementation logic
      return processedData;
    }
  }
};

// Service Consumer (Plugin B)
const useDataProcessor = () => {
  const service = useService('data-processor', ['data:write']);
  
  return {
    processData: service?.processData || (() => {
      throw new Error('Data processor service not available');
    })
  };
};
```

### Notification Service Example
```typescript
// Core Notification Service
const notificationService: ServiceDefinition = {
  name: 'notifications',
  version: '1.0.0',
  provider: 'core',
  methods: [
    {
      name: 'showNotification',
      requiredPermissions: ['ui:notify'],
      parameters: [
        { name: 'message', type: 'string' },
        { name: 'type', type: 'info | warning | error | success' }
      ],
      returnType: 'void'
    }
  ],
  requiredPermissions: ['ui:notify'],
  implementation: {
    showNotification: (message, type) => {
      // Show notification in UI
    }
  }
};
```

## 🔗 Service Communication Flow

### 1. Service Registration
```typescript
// Plugin registers service during initialization
export const initialize = (context: PluginContext) => {
  context.serviceRegistry.registerService(myService);
};
```

### 2. Service Discovery
```typescript
// Plugin discovers and uses service
const MyComponent = () => {
  const logger = useService('logger', ['log:write']);
  
  const handleAction = () => {
    logger?.info('Action performed', { context: 'MyComponent' });
  };
  
  return <Button onClick={handleAction}>Perform Action</Button>;
};
```

### 3. Permission Enforcement
```typescript
// Registry validates permissions before allowing access
const getService = (name: string, requiredPermissions: string[]) => {
  const currentPlugin = getCurrentPlugin();
  const service = services.get(name);
  
  if (!service) return null;
  
  const hasPermission = requiredPermissions.every(permission =>
    currentPlugin.manifest.permissions.includes(permission)
  );
  
  if (!hasPermission) {
    logger.warn('Service access denied', { 
      plugin: currentPlugin.id, 
      service: name, 
      requiredPermissions 
    });
    return null;
  }
  
  return service.implementation;
};
```

## 📋 Service Categories

### Core Services (Provided by Main Application)
- **logger**: Centralized logging service
- **notifications**: User notification system
- **storage**: Persistent data storage
- **navigation**: Application navigation control
- **config**: Configuration management

### Plugin Services (Provided by Plugins)
- **data-processor**: Data transformation services
- **file-handler**: File operation services
- **external-api**: Third-party API integrations
- **automation**: Task automation services

## 🧪 Testing Service Interactions

### Mocking Services for Tests
```typescript
// Test setup with mocked services
const mockServices = {
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  notifications: {
    showNotification: jest.fn()
  }
};

const renderWithServices = (component: React.ReactElement) => {
  return render(
    <ServiceProvider services={mockServices}>
      {component}
    </ServiceProvider>
  );
};
```

### Integration Testing
```typescript
// Test actual service interactions
describe('Plugin Service Integration', () => {
  it('should allow authorized service access', async () => {
    const plugin = await loadPlugin('test-plugin', {
      permissions: ['log:write', 'ui:notify']
    });
    
    const logger = plugin.getService('logger', ['log:write']);
    expect(logger).toBeDefined();
    
    logger.info('Test message');
    expect(mockLogger.info).toHaveBeenCalledWith('Test message');
  });
  
  it('should deny unauthorized service access', async () => {
    const plugin = await loadPlugin('restricted-plugin', {
      permissions: ['ui:read'] // Missing log:write permission
    });
    
    const logger = plugin.getService('logger', ['log:write']);
    expect(logger).toBeNull();
  });
});
```

## 🔧 Service Development Guidelines

### Best Practices
1. **Principle of Least Privilege**: Only request permissions you actually need
2. **Graceful Degradation**: Handle missing services gracefully
3. **Error Boundaries**: Wrap service calls in try-catch blocks
4. **Permission Documentation**: Document required permissions clearly
5. **Versioning**: Use semantic versioning for service APIs

### Anti-Patterns to Avoid
1. **Direct Plugin Access**: Never import from other plugins directly
2. **Permission Escalation**: Don't request excessive permissions
3. **Service Monopolization**: Don't create services that only one plugin can use
4. **Stateful Services**: Avoid services that maintain internal state
5. **Synchronous Heavy Operations**: Use async patterns for expensive operations

### Service Lifecycle
```typescript
interface ServiceLifecycle {
  initialize(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  cleanup(): Promise<void>;
}
```

## 📊 Service Performance Considerations

### Service Call Overhead
- Service calls have minimal overhead (~1-2ms)
- Permission checks are cached per plugin session
- Service implementations should be optimized for frequent calls

### Service Caching
```typescript
// Cache expensive service results
const cachedService = useMemo(() => {
  const baseService = useService('expensive-service', ['compute']);
  
  return {
    ...baseService,
    expensiveOperation: memoize(baseService?.expensiveOperation)
  };
}, []);
```

## 🚨 Security Considerations

### Service Isolation
- Services cannot access each other's internal state
- All communication goes through the registry
- Permissions are validated on every call

### Data Sanitization
```typescript
const sanitizeServiceInput = (input: unknown): SafeInput => {
  // Validate and sanitize all service inputs
  return ServiceInputSchema.parse(input);
};
```

### Audit Logging
```typescript
const auditServiceCall = (
  pluginId: string,
  serviceName: string,
  method: string,
  success: boolean
) => {
  auditLogger.info('Service call', {
    plugin: pluginId,
    service: serviceName,
    method,
    success,
    timestamp: Date.now()
  });
};
```

## 🔄 Service Migration

### Breaking Changes
When making breaking changes to services:
1. Bump major version number
2. Maintain backward compatibility for one release cycle
3. Provide migration guide
4. Update all known consumers

### Deprecation Process
```typescript
// Mark deprecated methods
interface LegacyService {
  /** @deprecated Use newMethod instead */
  oldMethod(): void;
  newMethod(): void;
}
```

## 📚 Related Documentation

- **[PLUGIN_DEVELOPER_GUIDE.md](./PLUGIN_DEVELOPER_GUIDE.md)** - How to use services in plugins
- **[../security/PLUGIN_SECURITY.md](../security/PLUGIN_SECURITY.md)** - Security model for services
- **[../SYSTEMS.md](../SYSTEMS.md)** - Overall system architecture
- **[../LEARNINGS.md](../LEARNINGS.md)** - Service-related patterns and solutions

---

*Services are the backbone of plugin communication in Omnia. Use them to build powerful, secure, and maintainable plugin ecosystems.*