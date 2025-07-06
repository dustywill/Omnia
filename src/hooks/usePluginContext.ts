/**
 * React Hook for Plugin Context Access
 * 
 * Provides plugins with access to their full execution context including
 * configuration, services, event bus, and logger
 */

import { useMemo } from 'react';
import { PluginContext } from '../core/enhanced-plugin-manager.js';
import { UsePluginConfigReturn } from './usePluginConfig.js';
import { useService, UseServiceReturn } from './useService.js';

export interface UsePluginContextOptions {
  context: PluginContext;
  configSchema?: any; // Zod schema for configuration validation
}

export interface UsePluginContextReturn<T = any> {
  // Core context
  pluginId: string;
  permissions: string[];
  logger: any;
  eventBus: any;
  
  // Configuration management
  config: UsePluginConfigReturn<T>;
  
  // Service communication
  services: UseServiceReturn;
  
  // Utility functions
  hasPermission: (permission: string) => boolean;
  log: {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };
  
  // Event helpers
  emit: (event: string, data?: any) => void;
  subscribe: (event: string, handler: (data: any) => void) => () => void;
}

export function usePluginContext<T = any>({
  context
}: UsePluginContextOptions): UsePluginContextReturn<T> {
  const { pluginId, permissions, logger, eventBus, serviceRegistry } = context;

  // Configuration management - simplified for now
  // const config = usePluginConfig<T>({
  //   pluginId,
  //   settingsManager: // Would need to be passed in
  //   eventBus,
  //   schema: configSchema
  // });
  
  // For now, return a mock config object
  const config = {
    config: context.config as T,
    updateConfig: async () => {},
    resetConfig: async () => {},
    isLoading: false,
    error: null,
    hasUnsavedChanges: false,
    validationErrors: {}
  } as UsePluginConfigReturn<T>;

  // Service communication
  const services = useService({
    pluginId,
    permissions,
    serviceRegistry,
    eventBus
  });

  // Utility functions
  const hasPermission = useMemo(() => 
    (permission: string) => permissions.includes(permission),
    [permissions]
  );

  const log = useMemo(() => ({
    info: (message: string, ...args: any[]) => logger.info(`${message} ${JSON.stringify(args)}`),
    error: (message: string, ...args: any[]) => logger.error(`${message} ${JSON.stringify(args)}`),
    warn: (message: string, ...args: any[]) => logger.warn(`${message} ${JSON.stringify(args)}`),
    debug: (message: string, ...args: any[]) => logger.info(`${message} ${JSON.stringify(args)}`), // Use info instead of debug
  }), [logger]);

  const emit = useMemo(() => 
    (event: string, data?: any) => eventBus.publish(event, data),
    [eventBus]
  );

  const subscribe = useMemo(() => 
    (event: string, handler: (data: any) => void) => {
      eventBus.subscribe(event, handler);
      return () => eventBus.unsubscribe(event, handler);
    },
    [eventBus]
  );

  return {
    pluginId,
    permissions,
    logger,
    eventBus,
    config,
    services,
    hasPermission,
    log,
    emit,
    subscribe
  };
}