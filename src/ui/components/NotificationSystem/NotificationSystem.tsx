import React, { useState, useEffect, useCallback } from 'react';
import styles from './NotificationSystem.module.css';

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
}

export interface NotificationSystemProps {
  notifications: Notification[];
  onRemove: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  maxNotifications?: number;
}

const NotificationItem: React.FC<{
  notification: Notification;
  onRemove: (id: string) => void;
}> = ({ notification, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    // Trigger slide-in animation
    const timer = setTimeout(() => setIsVisible(true), 10);
    
    // Auto-remove after duration (if specified)
    let autoRemoveTimer: NodeJS.Timeout;
    if (notification.duration && notification.duration > 0) {
      autoRemoveTimer = setTimeout(() => {
        handleRemove();
      }, notification.duration);
    }

    return () => {
      clearTimeout(timer);
      if (autoRemoveTimer) clearTimeout(autoRemoveTimer);
    };
  }, [notification.duration]);

  const handleRemove = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // Match exit animation duration
  }, [notification.id, onRemove]);

  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'success':
        return {
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          color: '#ffffff',
          icon: '✓'
        };
      case 'error':
        return {
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          color: '#ffffff',
          icon: '✗'
        };
      case 'warning':
        return {
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          color: '#ffffff',
          icon: '⚠'
        };
      case 'debug':
        return {
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: '#ffffff',
          icon: '🐛'
        };
      case 'info':
      default:
        return {
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: '#ffffff',
          icon: 'ℹ'
        };
    }
  };

  const typeStyles = getTypeStyles(notification.type);

  return (
    <div
      className={`${styles.notification} ${isVisible ? styles.visible : ''} ${isRemoving ? styles.removing : ''}`}
      style={{
        background: typeStyles.background,
        color: typeStyles.color
      }}
    >
      <div className={styles.content}>
        <div className={styles.iconContainer}>
          <span className={styles.icon}>{typeStyles.icon}</span>
        </div>
        
        <div className={styles.textContainer}>
          {notification.title && (
            <div className={styles.title}>{notification.title}</div>
          )}
          <div className={styles.message}>{notification.message}</div>
        </div>

        <div className={styles.actions}>
          {notification.action && (
            <button
              className={styles.actionButton}
              onClick={notification.action.onClick}
              style={{ color: typeStyles.color }}
            >
              {notification.action.label}
            </button>
          )}
          <button
            className={styles.closeButton}
            onClick={handleRemove}
            style={{ color: typeStyles.color }}
            aria-label="Close notification"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export const NotificationSystem: React.FC<NotificationSystemProps> = ({
  notifications,
  onRemove,
  position = 'top-right',
  maxNotifications = 5
}) => {
  // Limit number of visible notifications
  const visibleNotifications = notifications.slice(0, maxNotifications);

  return (
    <div className={`${styles.notificationSystem} ${styles[position]}`}>
      {visibleNotifications.map((notification) => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onRemove={onRemove}
        />
      ))}
    </div>
  );
};

// Hook for managing notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notification: Omit<Notification, 'id'>) => {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      id,
      duration: 5000, // 5 seconds default
      ...notification
    };

    setNotifications(prev => [newNotification, ...prev]);
    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Convenience methods
  const notify = {
    info: (message: string, title?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'info', message, title, ...options }),
    
    success: (message: string, title?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'success', message, title, ...options }),
    
    warning: (message: string, title?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'warning', message, title, ...options }),
    
    error: (message: string, title?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'error', message, title, ...options }),
    
    debug: (message: string, title?: string, options?: Partial<Notification>) =>
      addNotification({ type: 'debug', message, title, ...options })
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    clearNotifications,
    notify
  };
};