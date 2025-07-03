/**
 * React Hook for Service Registry Communication
 * 
 * Provides plugins with easy access to call services from other plugins
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { ServiceRegistry, ServiceDefinition } from '../core/service-registry.js';
import { EventBus } from '../core/event-bus.js';

export interface UseServiceOptions {
  pluginId: string;
  permissions: string[];
  serviceRegistry: ServiceRegistry;
  eventBus: EventBus<Record<string, unknown>>;
}

export interface ServiceCall<T = any> {
  serviceName: string;
  version: string;
  methodName: string;
  parameters: any[];
  result?: T;
  error?: string;
  isLoading: boolean;
  timestamp: Date;
}

export interface UseServiceReturn {
  availableServices: ServiceDefinition[];
  callService: <T = any>(
    serviceName: string,
    version: string,
    methodName: string,
    parameters?: any[]
  ) => Promise<T>;
  getServiceCall: (callId: string) => ServiceCall | undefined;
  recentCalls: ServiceCall[];
  isLoading: boolean;
  error: string | null;
}

export function useService({
  pluginId,
  permissions,
  serviceRegistry,
  eventBus
}: UseServiceOptions): UseServiceReturn {
  const [availableServices, setAvailableServices] = useState<ServiceDefinition[]>([]);
  const [recentCalls, setRecentCalls] = useState<ServiceCall[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Store active service calls by ID
  const serviceCallsRef = useRef<Map<string, ServiceCall>>(new Map());

  // Load available services on mount and when services change
  useEffect(() => {
    const loadServices = () => {
      try {
        const services = serviceRegistry.getAvailableServices(pluginId, permissions);
        setAvailableServices(services);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load services');
      }
    };

    loadServices();

    // Listen for service registry changes
    const handleServiceRegistered = () => loadServices();
    const handleServiceUnregistered = () => loadServices();

    eventBus.subscribe('service:registered', handleServiceRegistered);
    eventBus.subscribe('service:unregistered', handleServiceUnregistered);

    return () => {
      eventBus.unsubscribe('service:registered', handleServiceRegistered);
      eventBus.unsubscribe('service:unregistered', handleServiceUnregistered);
    };
  }, [pluginId, permissions, serviceRegistry, eventBus]);

  // Generate unique call ID
  const generateCallId = useCallback(() => {
    return `${pluginId}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, [pluginId]);

  // Call a service method
  const callService = useCallback(async <T = any>(
    serviceName: string,
    version: string,
    methodName: string,
    parameters: any[] = []
  ): Promise<T> => {
    const callId = generateCallId();
    
    const serviceCall: ServiceCall<T> = {
      serviceName,
      version,
      methodName,
      parameters,
      isLoading: true,
      timestamp: new Date()
    };

    // Add to active calls
    serviceCallsRef.current.set(callId, serviceCall);
    setRecentCalls(prev => [serviceCall, ...prev.slice(0, 9)]); // Keep last 10 calls

    try {
      setIsLoading(true);
      setError(null);

      const result = await serviceRegistry.callService(
        pluginId,
        permissions,
        serviceName,
        version,
        methodName,
        parameters
      );

      // Update call with result
      serviceCall.result = result;
      serviceCall.isLoading = false;
      serviceCallsRef.current.set(callId, serviceCall);
      
      setRecentCalls(prev => 
        prev.map(call => 
          call === serviceCall 
            ? { ...call, result, isLoading: false }
            : call
        )
      );

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Update call with error
      serviceCall.error = errorMessage;
      serviceCall.isLoading = false;
      serviceCallsRef.current.set(callId, serviceCall);
      
      setRecentCalls(prev => 
        prev.map(call => 
          call === serviceCall 
            ? { ...call, error: errorMessage, isLoading: false }
            : call
        )
      );

      setError(errorMessage);
      throw err;

    } finally {
      setIsLoading(false);
    }
  }, [pluginId, permissions, serviceRegistry, generateCallId]);

  // Get a specific service call by ID
  const getServiceCall = useCallback((callId: string): ServiceCall | undefined => {
    return serviceCallsRef.current.get(callId);
  }, []);

  return {
    availableServices,
    callService,
    getServiceCall,
    recentCalls,
    isLoading,
    error
  };
}