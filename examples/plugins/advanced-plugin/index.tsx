import React, { useState, useEffect } from 'react';
import { Card, Button, Badge } from '../../../src/ui/components/index.js';
import { PluginContext } from '../../../src/core/enhanced-plugin-manager.js';

/**
 * Advanced Plugin Example
 * 
 * This plugin demonstrates:
 * - Lifecycle hooks (init/stop)
 * - Service registration and communication
 * - Event bus usage
 * - Complex state management
 */

interface AdvancedPluginProps {
  context: PluginContext;
}

// Plugin state management
let pluginState = {
  initTime: null as Date | null,
  messageCount: 0,
  lastMessage: ''
};

// Service implementations
export const services = {
  'example-service': {
    getMessage(name: string): string {
      pluginState.messageCount++;
      const message = `Hello ${name}! This is message #${pluginState.messageCount}`;
      pluginState.lastMessage = message;
      return message;
    },

    getStats(): object {
      return {
        initTime: pluginState.initTime,
        messageCount: pluginState.messageCount,
        lastMessage: pluginState.lastMessage,
        uptime: pluginState.initTime ? Date.now() - pluginState.initTime.getTime() : 0
      };
    }
  }
};

// Lifecycle hooks
export async function init(context: PluginContext): Promise<void> {
  pluginState.initTime = new Date();
  
  context.logger.info('Advanced plugin initialized');
  
  // Subscribe to global events
  context.eventBus.subscribe('app:ready', () => {
    context.logger.info('App is ready, advanced plugin responding');
  });
  
  // Emit initialization event
  context.eventBus.publish('plugin:advanced-initialized', {
    pluginId: context.pluginId,
    initTime: pluginState.initTime
  });
}

export async function stop(context: PluginContext): Promise<void> {
  context.logger.info('Advanced plugin stopping');
  
  // Cleanup if needed
  pluginState = {
    initTime: null,
    messageCount: 0,
    lastMessage: ''
  };
  
  context.eventBus.publish('plugin:advanced-stopped', {
    pluginId: context.pluginId
  });
}

// React component
export default function AdvancedPlugin({ context }: AdvancedPluginProps) {
  const [stats, setStats] = useState<any>(null);
  const [testMessage, setTestMessage] = useState('');
  const [events, setEvents] = useState<string[]>([]);

  // Load stats
  useEffect(() => {
    const loadStats = () => {
      try {
        const currentStats = services['example-service'].getStats();
        setStats(currentStats);
      } catch (error) {
        context.logger.error('Failed to load stats', error);
      }
    };

    loadStats();
    const interval = setInterval(loadStats, 1000);

    return () => clearInterval(interval);
  }, [context.logger]);

  // Listen to events
  useEffect(() => {
    const addEvent = (eventName: string) => (data: any) => {
      const timestamp = new Date().toLocaleTimeString();
      setEvents(prev => [`${timestamp}: ${eventName}`, ...prev.slice(0, 4)]);
    };

    context.eventBus.subscribe('service:called', addEvent('Service Called'));
    context.eventBus.subscribe('plugin:config-updated', addEvent('Config Updated'));
    
    return () => {
      // Cleanup subscriptions handled by the hook
    };
  }, [context.eventBus]);

  const handleTestService = async () => {
    try {
      const message = await context.serviceRegistry.callService(
        context.pluginId,
        context.permissions,
        'example-service',
        '1.0.0',
        'getMessage',
        ['Test User']
      );
      setTestMessage(message);
    } catch (error) {
      context.logger.error('Service call failed', error);
      setTestMessage('Service call failed');
    }
  };

  const handleEmitEvent = () => {
    context.eventBus.publish('test:custom-event', {
      from: context.pluginId,
      timestamp: new Date().toISOString(),
      message: 'Hello from advanced plugin!'
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-2xl font-bold text-theme-primary mb-4">
          Advanced Plugin Dashboard
        </h2>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <h3 className="font-semibold text-theme-primary mb-2">Plugin Stats</h3>
            {stats && (
              <div className="space-y-1 text-sm">
                <div>Init Time: {stats.initTime ? new Date(stats.initTime).toLocaleString() : 'N/A'}</div>
                <div>Messages: {stats.messageCount}</div>
                <div>Uptime: {Math.floor((stats.uptime || 0) / 1000)}s</div>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="font-semibold text-theme-primary mb-2">Permissions</h3>
            <div className="flex flex-wrap gap-1">
              {context.permissions.map(permission => (
                <Badge key={permission} variant="neutral" size="sm">
                  {permission}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          <div>
            <Button onClick={handleTestService} variant="action" size="sm">
              Test Service Call
            </Button>
            {testMessage && (
              <div className="mt-2 text-sm text-theme-secondary">
                Response: {testMessage}
              </div>
            )}
          </div>
          
          <div>
            <Button onClick={handleEmitEvent} variant="secondary" size="sm">
              Emit Test Event
            </Button>
          </div>
        </div>
      </Card>
      
      <Card>
        <h3 className="font-semibold text-theme-primary mb-3">Recent Events</h3>
        <div className="space-y-1">
          {events.length === 0 ? (
            <div className="text-sm text-theme-secondary">No events yet</div>
          ) : (
            events.map((event, index) => (
              <div key={index} className="text-sm text-theme-secondary font-mono">
                {event}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}