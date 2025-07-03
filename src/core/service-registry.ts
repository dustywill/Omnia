/**
 * Service Registry for Plugin-to-Plugin Communication
 * 
 * Provides a secure, type-safe way for plugins to communicate with each other
 * through a centralized service registry managed by the main application.
 */

import { EventBus } from './event-bus.js';
import { Logger } from './logger.js';

export interface ServiceDefinition {
  name: string;
  version: string;
  description: string;
  methods: Record<string, ServiceMethod>;
  permissions: string[];
}

export interface ServiceMethod {
  description: string;
  parameters: Record<string, any>;
  returnType: string;
  requiresPermission?: string;
}

export interface RegisteredService {
  definition: ServiceDefinition;
  implementation: any;
  providerId: string;
  registeredAt: Date;
}

export interface ServiceCall {
  serviceName: string;
  methodName: string;
  parameters: any[];
  callerId: string;
  timestamp: Date;
}

export class ServiceRegistry {
  private services = new Map<string, RegisteredService>();
  private servicePermissions = new Map<string, Set<string>>();
  private logger: Logger;
  private eventBus: EventBus<Record<string, unknown>>;

  constructor(eventBus: EventBus<Record<string, unknown>>, logger: Logger) {
    this.eventBus = eventBus;
    this.logger = logger;
    
    this.logger.info('Service Registry initialized');
  }

  /**
   * Register a service that can be called by other plugins
   */
  async registerService(
    providerId: string,
    definition: ServiceDefinition,
    implementation: any,
    providerPermissions: string[]
  ): Promise<void> {
    const { name, version, permissions: requiredPermissions } = definition;
    const serviceKey = `${name}@${version}`;

    // Validate provider has required permissions
    const hasPermissions = requiredPermissions.every(permission => 
      providerPermissions.includes(permission)
    );

    if (!hasPermissions) {
      throw new Error(`Plugin ${providerId} lacks required permissions for service ${name}`);
    }

    // Validate implementation matches definition
    this.validateServiceImplementation(definition, implementation);

    const registeredService: RegisteredService = {
      definition,
      implementation,
      providerId,
      registeredAt: new Date()
    };

    this.services.set(serviceKey, registeredService);
    this.servicePermissions.set(serviceKey, new Set(requiredPermissions));

    this.logger.info(`Service registered: ${serviceKey} by ${providerId}`);
    
    // Emit service registration event
    this.eventBus.publish('service:registered' as any, {
      serviceName: name,
      version,
      providerId,
      permissions: requiredPermissions
    } as any);
  }

  /**
   * Unregister a service
   */
  async unregisterService(providerId: string, serviceName: string, version: string): Promise<void> {
    const serviceKey = `${serviceName}@${version}`;
    const service = this.services.get(serviceKey);

    if (!service) {
      throw new Error(`Service ${serviceKey} not found`);
    }

    if (service.providerId !== providerId) {
      throw new Error(`Plugin ${providerId} cannot unregister service owned by ${service.providerId}`);
    }

    this.services.delete(serviceKey);
    this.servicePermissions.delete(serviceKey);

    this.logger.info(`Service unregistered: ${serviceKey}`);
    
    this.eventBus.publish('service:unregistered' as any, {
      serviceName,
      version,
      providerId
    } as any);
  }

  /**
   * Call a service method
   */
  async callService(
    callerId: string,
    callerPermissions: string[],
    serviceName: string,
    version: string,
    methodName: string,
    parameters: any[] = []
  ): Promise<any> {
    const serviceKey = `${serviceName}@${version}`;
    const service = this.services.get(serviceKey);

    if (!service) {
      throw new Error(`Service ${serviceKey} not found`);
    }

    const { definition, implementation } = service;
    const method = definition.methods[methodName];

    if (!method) {
      throw new Error(`Method ${methodName} not found in service ${serviceKey}`);
    }

    // Check permissions
    if (method.requiresPermission) {
      if (!callerPermissions.includes(method.requiresPermission)) {
        throw new Error(`Plugin ${callerId} lacks permission ${method.requiresPermission} for ${serviceKey}:${methodName}`);
      }
    }

    // Validate parameters (basic validation)
    if (parameters.length !== Object.keys(method.parameters).length) {
      throw new Error(`Method ${methodName} expects ${Object.keys(method.parameters).length} parameters, got ${parameters.length}`);
    }

    // Log service call
    const serviceCall: ServiceCall = {
      serviceName,
      methodName,
      parameters,
      callerId,
      timestamp: new Date()
    };

    this.logger.info(`Service call: ${JSON.stringify(serviceCall)}`);

    try {
      // Call the actual implementation
      const result = await implementation[methodName](...parameters);
      
      this.eventBus.publish('service:called' as any, {
        ...serviceCall,
        success: true,
        result
      } as any);

      return result;
    } catch (error) {
      this.logger.error(`Service call failed: ${serviceKey}:${methodName} - ${error}`);
      
      this.eventBus.publish('service:called' as any, {
        ...serviceCall,
        success: false,
        error: error instanceof Error ? error.message : String(error)
      } as any);

      throw error;
    }
  }

  /**
   * Get available services (with permission filtering)
   */
  getAvailableServices(_requesterId: string, requesterPermissions: string[]): ServiceDefinition[] {
    const availableServices: ServiceDefinition[] = [];

    for (const [serviceKey, service] of this.services) {
      const requiredPermissions = this.servicePermissions.get(serviceKey) || new Set();
      
      // Check if requester has at least one required permission (or no permissions required)
      const hasAccess = requiredPermissions.size === 0 || 
        Array.from(requiredPermissions).some(permission => 
          requesterPermissions.includes(permission)
        );

      if (hasAccess) {
        // Filter methods based on permissions
        const filteredMethods: Record<string, ServiceMethod> = {};
        
        for (const [methodName, method] of Object.entries(service.definition.methods)) {
          if (!method.requiresPermission || requesterPermissions.includes(method.requiresPermission)) {
            filteredMethods[methodName] = method;
          }
        }

        if (Object.keys(filteredMethods).length > 0) {
          availableServices.push({
            ...service.definition,
            methods: filteredMethods
          });
        }
      }
    }

    return availableServices;
  }

  /**
   * Get service statistics
   */
  getServiceStats(): {
    totalServices: number;
    servicesByProvider: Record<string, number>;
    servicesList: Array<{
      name: string;
      version: string;
      providerId: string;
      methodCount: number;
      registeredAt: Date;
    }>;
  } {
    const servicesByProvider: Record<string, number> = {};
    const servicesList: Array<{
      name: string;
      version: string;
      providerId: string;
      methodCount: number;
      registeredAt: Date;
    }> = [];

    for (const service of this.services.values()) {
      servicesByProvider[service.providerId] = (servicesByProvider[service.providerId] || 0) + 1;
      
      servicesList.push({
        name: service.definition.name,
        version: service.definition.version,
        providerId: service.providerId,
        methodCount: Object.keys(service.definition.methods).length,
        registeredAt: service.registeredAt
      });
    }

    return {
      totalServices: this.services.size,
      servicesByProvider,
      servicesList
    };
  }

  /**
   * Validate service implementation matches definition
   */
  private validateServiceImplementation(definition: ServiceDefinition, implementation: any): void {
    for (const methodName of Object.keys(definition.methods)) {
      if (typeof implementation[methodName] !== 'function') {
        throw new Error(`Implementation missing method: ${methodName}`);
      }
    }
  }

  /**
   * Clear all services (for testing/cleanup)
   */
  clear(): void {
    this.services.clear();
    this.servicePermissions.clear();
    this.logger.info('Service Registry cleared');
  }
}