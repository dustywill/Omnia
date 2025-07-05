import React from 'react';
import { Badge } from '../Badge/Badge.js';
import { type PluginInfo } from '../../main-app-renderer.js';

export interface DashboardPluginCardProps {
  plugin: PluginInfo;
  onPluginSelect: (pluginId: string) => void;
  className?: string;
}

// Plugin type to color mapping
const getPluginTypeColor = (pluginType: string) => {
  switch (pluginType) {
    case 'simple':
      return 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)'; // Cyan
    case 'configured':
      return 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)'; // Purple
    case 'hybrid':
      return 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'; // Amber
    default:
      return 'linear-gradient(135deg, #6b7280 0%, #4b5563 100%)'; // Gray
  }
};

const getPluginIcon = (pluginName: string, pluginType: string) => {
  // Create a simple icon based on plugin name/type
  const letter = pluginName.charAt(0).toUpperCase();
  const background = getPluginTypeColor(pluginType);
  
  return (
    <div style={{
      width: '48px',
      height: '48px',
      borderRadius: '12px',
      background,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '20px',
      fontWeight: 'bold',
      flexShrink: 0
    }}>
      {letter}
    </div>
  );
};

export function DashboardPluginCard({ 
  plugin, 
  onPluginSelect,
  className = '' 
}: DashboardPluginCardProps) {
  const { id, name, description, version, author, status, permissions } = plugin;
  
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

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    transition: 'all 0.2s ease-in-out',
    position: 'relative',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    height: '100%',
    display: 'flex',
    flexDirection: 'column'
  };

  const handleClick = () => {
    if (status === 'active') {
      onPluginSelect(id);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    if (status === 'active') {
      e.currentTarget.style.transform = 'translateY(-2px)';
      e.currentTarget.style.boxShadow = '0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 4px 6px 0 rgba(0, 0, 0, 0.05)';
      e.currentTarget.style.borderColor = '#d1d5db';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
    e.currentTarget.style.borderColor = '#e5e7eb';
  };
  
  return (
    <div 
      className={className}
      style={cardStyle}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Loading indicator */}
      {status === 'loading' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          background: 'linear-gradient(90deg, #3b82f6, #1e40af)',
          borderRadius: '12px 12px 0 0',
          animation: 'pulse 2s infinite'
        }} />
      )}
      
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        {getPluginIcon(name, plugin.type)}
        
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <h3 style={{ 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#1f2937',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {name}
            </h3>
            <Badge variant={badgeVariant[status]} size="sm">
              {statusText[status]}
            </Badge>
          </div>
          
          <p style={{ 
            fontSize: '0.875rem', 
            color: '#6b7280',
            margin: 0,
            lineHeight: '1.4',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden'
          }}>
            {description}
          </p>
        </div>

        {/* Status indicator dot */}
        <div style={{
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          backgroundColor: status === 'active' ? '#10b981' : status === 'error' ? '#ef4444' : '#6b7280',
          flexShrink: 0
        }} />
      </div>
      
      {/* Plugin metadata */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        fontSize: '0.75rem', 
        color: '#9ca3af',
        marginBottom: '12px'
      }}>
        <span>v{version}</span>
        {author && <span>by {author}</span>}
        <span style={{ 
          padding: '2px 6px', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '4px',
          color: '#374151',
          fontWeight: '500'
        }}>
          {plugin.type}
        </span>
      </div>
      
      {/* Permissions */}
      {permissions && permissions.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
          <p style={{ 
            fontSize: '0.75rem', 
            color: '#6b7280', 
            margin: '0 0 6px 0',
            fontWeight: '500'
          }}>
            Permissions:
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
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
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '12px'
        }}>
          <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
            ⚠ Plugin failed to load
          </span>
        </div>
      )}
      
      {/* Bottom section with click instruction */}
      <div style={{ marginTop: 'auto', paddingTop: '12px' }}>
        {status === 'active' ? (
          <div style={{
            textAlign: 'center',
            padding: '8px',
            backgroundColor: '#f0f9ff',
            border: '1px solid #bae6fd',
            borderRadius: '6px',
            color: '#0369a1',
            fontSize: '0.875rem',
            fontWeight: '500'
          }}>
            Click to open tool
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '8px',
            backgroundColor: '#f9fafb',
            border: '1px solid #e5e7eb',
            borderRadius: '6px',
            color: '#6b7280',
            fontSize: '0.875rem'
          }}>
            {status === 'inactive' ? 'Plugin is inactive' : 'Plugin has errors'}
          </div>
        )}
      </div>
    </div>
  );
}