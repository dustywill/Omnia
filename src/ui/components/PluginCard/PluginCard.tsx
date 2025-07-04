import React from 'react';
import { Badge } from '../Badge/Badge.js';
import { Button } from '../Button/Button.js';
import styles from './PluginCard.module.css';

export interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  permissions?: string[];
  lastUpdated?: Date;
}

export interface PluginCardProps {
  plugin: Plugin;
  onToggle: (pluginId: string) => void;
  onConfigure?: (pluginId: string) => void;
  onRemove?: (pluginId: string) => void;
  className?: string;
}

export function PluginCard({ 
  plugin, 
  onToggle, 
  onConfigure, 
  onRemove, 
  className = '' 
}: PluginCardProps) {
  const { id, name, description, version, author, status, permissions, lastUpdated } = plugin;
  
  const badgeVariant = {
    active: 'success' as const,
    inactive: 'secondary' as const,
    error: 'danger' as const,
    loading: 'info' as const,
  };
  
  const statusText = {
    active: 'Active',
    inactive: 'Inactive',
    error: 'Error',
    loading: 'Loading...',
  };
  
  return (
    <div className={`${styles.pluginCard} ${styles[status]} ${className}`}>
      {/* Loading indicator */}
      {status === 'loading' && <div className={styles.loadingBar} />}
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold text-theme-primary truncate">
                {name}
              </h3>
              <Badge variant={badgeVariant[status]} size="sm">
                {statusText[status]}
              </Badge>
            </div>
            
            <p className="text-sm text-theme-secondary mb-2 line-clamp-2">
              {description}
            </p>
            
            <div className="flex items-center gap-4 text-xs text-theme-secondary">
              <span>v{version}</span>
              {author && <span>by {author}</span>}
              {lastUpdated && (
                <span>Updated {lastUpdated.toLocaleDateString()}</span>
              )}
            </div>
          </div>
          
          <div className={styles.statusIndicator}>
            <div className={`${styles.statusDot} ${styles[`${status}Dot`]}`} />
          </div>
        </div>
        
        {/* Permissions */}
        {permissions && permissions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-theme-secondary mb-2">Permissions:</p>
            <div className="flex flex-wrap gap-1">
              {permissions.slice(0, 3).map((permission, index) => (
                <Badge key={index} variant="neutral" size="sm">
                  {permission}
                </Badge>
              ))}
              {permissions.length > 3 && (
                <Badge variant="neutral" size="sm">
                  +{permissions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {/* Error message */}
        {status === 'error' && (
          <div className={styles.errorBanner}>
            <span className="text-danger text-sm font-medium">
              ⚠ Plugin failed to load
            </span>
          </div>
        )}
        
        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t border-theme">
          <Button
            variant={status === 'active' ? 'secondary' : 'action'}
            size="sm"
            onClick={() => onToggle(id)}
            disabled={status === 'loading'}
            className="flex-1"
          >
            {status === 'active' ? 'Deactivate' : 'Activate'}
          </Button>
          
          {onConfigure && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConfigure(id)}
              disabled={status === 'loading' || status === 'error'}
            >
              Configure
            </Button>
          )}
          
          {onRemove && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onRemove(id)}
              disabled={status === 'loading'}
              className={styles.removeButton}
            >
              Remove
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}