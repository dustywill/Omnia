/**
 * Global Notification Service
 * 
 * Provides a centralized way to show notifications throughout the application.
 * Can be used by plugins and core application components.
 */

import { createEventBus } from './event-bus.js';

export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface Notification {
  id: string;
  type: NotificationType;
  title?: string;
  message: string;
  duration?: number; // in milliseconds, 0 for persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: Date;
}

export interface NotificationOptions {
  title?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationService {
  private eventBus = createEventBus<{
    'notification:add': Notification;
    'notification:remove': string;
    'notification:clear': void;
  }>();

  private notifications: Notification[] = [];

  /**
   * Add a notification to the system
   */
  private addNotification(type: NotificationType, message: string, options: NotificationOptions = {}): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification: Notification = {
      id,
      type,
      message,
      title: options.title,
      duration: options.duration ?? (type === 'error' ? 0 : 5000), // Errors persist by default
      action: options.action,
      timestamp: new Date()
    };

    this.notifications.unshift(notification);
    this.eventBus.publish('notification:add', notification);

    // Auto-remove if duration is set
    if (notification.duration && notification.duration > 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, notification.duration);
    }

    return id;
  }

  /**
   * Remove a specific notification
   */
  removeNotification(id: string): void {
    const index = this.notifications.findIndex(n => n.id === id);
    if (index !== -1) {
      this.notifications.splice(index, 1);
      this.eventBus.publish('notification:remove', id);
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.eventBus.publish('notification:clear', undefined);
  }

  /**
   * Get all current notifications
   */
  getNotifications(): Notification[] {
    return [...this.notifications];
  }

  /**
   * Subscribe to notification events
   */
  subscribe(
    event: 'notification:add' | 'notification:remove' | 'notification:clear',
    handler: (data: any) => void
  ): () => void {
    this.eventBus.subscribe(event as any, handler);
    return () => this.eventBus.unsubscribe(event as any, handler);
  }

  // Convenience methods for different notification types

  /**
   * Show an info notification
   */
  info(message: string, options?: NotificationOptions): string {
    return this.addNotification('info', message, options);
  }

  /**
   * Show a success notification
   */
  success(message: string, options?: NotificationOptions): string {
    return this.addNotification('success', message, options);
  }

  /**
   * Show a warning notification
   */
  warning(message: string, options?: NotificationOptions): string {
    return this.addNotification('warning', message, options);
  }

  /**
   * Show an error notification
   */
  error(message: string, options?: NotificationOptions): string {
    return this.addNotification('error', message, options);
  }

  /**
   * Show a debug notification (only in development)
   */
  debug(message: string, options?: NotificationOptions): string {
    // Only show debug notifications in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      return this.addNotification('debug', message, options);
    }
    return '';
  }

  /**
   * Show a notification for async operations with loading state
   */
  async withLoading<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error?: string;
    },
    options?: NotificationOptions
  ): Promise<T> {
    const loadingId = this.info(messages.loading, { ...options, duration: 0 });

    try {
      const result = await promise;
      this.removeNotification(loadingId);
      this.success(messages.success, options);
      return result;
    } catch (error) {
      this.removeNotification(loadingId);
      const errorMessage = messages.error || `Failed: ${error instanceof Error ? error.message : 'Unknown error'}`;
      this.error(errorMessage, options);
      throw error;
    }
  }
}

// Create global instance
export const notificationService = new NotificationService();

// Plugin-friendly API
export const createNotificationAPI = () => {
  return {
    info: notificationService.info.bind(notificationService),
    success: notificationService.success.bind(notificationService),
    warning: notificationService.warning.bind(notificationService),
    error: notificationService.error.bind(notificationService),
    debug: notificationService.debug.bind(notificationService),
    withLoading: notificationService.withLoading.bind(notificationService),
    removeNotification: notificationService.removeNotification.bind(notificationService)
  };
};

// Export types for plugins
export type NotificationAPI = ReturnType<typeof createNotificationAPI>;