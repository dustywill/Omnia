import React from 'react';
import { Button } from '../components/Button/Button.js';
import { Input } from '../components/Input/Input.js';
import { type PluginInfo } from '../main-app-renderer.js';

export interface PluginsViewProps {
  plugins: PluginInfo[];
  onPluginSelect: (pluginId: string) => void;
  onPluginToggle: (pluginId: string) => void;
  onPluginConfigure: (pluginId: string) => void;
  onPluginRemove: (pluginId: string) => void;
}

// Plugin type to color mapping (from DashboardPluginCard)
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

// Plugin Management Card with Dashboard styling and action buttons
interface PluginManagementCardProps {
  plugin: PluginInfo;
  onPluginSelect: (pluginId: string) => void;
  onPluginToggle: (pluginId: string) => void;
  onPluginConfigure: (pluginId: string) => void;
  onPluginRemove: (pluginId: string) => void;
}

function PluginManagementCard({ 
  plugin, 
  onPluginSelect,
  onPluginToggle,
  onPluginConfigure,
  onPluginRemove
}: PluginManagementCardProps) {
  const { id, name, description, version, author, status } = plugin;
  
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

  const handleCardClick = () => {
    if (status === 'active') {
      onPluginSelect(id);
    }
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(-2px)';
    e.currentTarget.style.boxShadow = '0 10px 25px 0 rgba(0, 0, 0, 0.1), 0 4px 6px 0 rgba(0, 0, 0, 0.05)';
    e.currentTarget.style.borderColor = '#d1d5db';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    e.currentTarget.style.transform = 'translateY(0)';
    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)';
    e.currentTarget.style.borderColor = '#e5e7eb';
  };
  
  return (
    <div 
      style={cardStyle}
      onClick={handleCardClick}
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

        {/* Status indicator LED */}
        <div 
          title={statusText[status]}
          style={{
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            backgroundColor: status === 'active' ? '#059669' : status === 'error' ? '#ef4444' : '#6b7280',
            flexShrink: 0,
            boxShadow: status === 'active' 
              ? '0 0 6px rgba(5, 150, 105, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)' 
              : status === 'error' 
                ? '0 0 6px rgba(239, 68, 68, 0.6), inset 0 1px 2px rgba(255, 255, 255, 0.3)'
                : '0 0 2px rgba(107, 114, 128, 0.4), inset 0 1px 2px rgba(255, 255, 255, 0.3)',
            background: status === 'active' 
              ? 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), #059669)' 
              : status === 'error' 
                ? 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), #ef4444)'
                : 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), #6b7280)',
            cursor: 'help'
          }} 
        />
      </div>
      
      {/* Plugin metadata */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: '16px', 
        fontSize: '0.75rem', 
        color: '#9ca3af',
        marginBottom: '16px'
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
      
      {/* Error message */}
      {status === 'error' && (
        <div style={{
          backgroundColor: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: '6px',
          padding: '8px 12px',
          marginBottom: '16px'
        }}>
          <span style={{ color: '#dc2626', fontSize: '0.875rem', fontWeight: '500' }}>
            ⚠ Plugin failed to load
          </span>
        </div>
      )}
      
      {/* Action buttons */}
      <div style={{ 
        marginTop: 'auto', 
        paddingTop: '16px',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        gap: '8px',
        flexWrap: 'wrap'
      }}>
        <Button
          variant={status === 'active' ? 'secondary' : 'primary'}
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPluginToggle(id);
          }}
          disabled={status === 'loading'}
          style={{ flex: 1, minWidth: '80px' }}
        >
          {status === 'active' ? 'Deactivate' : 'Activate'}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPluginConfigure(id);
          }}
          disabled={status === 'loading' || status === 'error'}
          style={{ flex: 1, minWidth: '80px' }}
        >
          Configure
        </Button>
        
        <Button
          variant="danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPluginRemove(id);
          }}
          disabled={status === 'loading'}
          style={{ minWidth: '70px' }}
        >
          Remove
        </Button>
      </div>
      
      {/* Click instruction for active plugins */}
      {status === 'active' && (
        <div style={{
          textAlign: 'center',
          padding: '8px',
          backgroundColor: '#f0f9ff',
          border: '1px solid #bae6fd',
          borderRadius: '6px',
          color: '#0369a1',
          fontSize: '0.75rem',
          fontWeight: '500',
          marginTop: '8px'
        }}>
          Click card to open tool
        </div>
      )}
    </div>
  );
}

export function PluginsView({ 
  plugins, 
  onPluginSelect, 
  onPluginToggle, 
  onPluginConfigure,
  onPluginRemove 
}: PluginsViewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'inactive' | 'error'>('all');

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || plugin.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const headerStyle: React.CSSProperties = {
    padding: '1rem 2rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '1.5rem'
  };

  const contentStyle: React.CSSProperties = {
    padding: '0 2rem 2rem 2rem',
    maxWidth: '1200px',
    margin: '0 auto'
  };

  const filtersStyle: React.CSSProperties = {
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
    marginBottom: '2rem',
    flexWrap: 'wrap'
  };

  const pluginGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '1.5rem'
  };

  return (
    <div style={{ height: '100vh', overflowY: 'auto' }}>
      {/* Header */}
      <header style={headerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.25rem' }}>
              Plugins
            </h1>
            <p style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              Manage your plugin collection
            </p>
          </div>
          
          <Button variant="action" size="md">
            Add Plugin
          </Button>
        </div>
      </header>

      <div style={contentStyle}>
        {/* Filters */}
        <div style={filtersStyle}>
          <div style={{ flex: 1, minWidth: '300px' }}>
            <Input
              type="search"
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <Button
              variant={filterStatus === 'all' ? 'action' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('all')}
            >
              All ({plugins.length})
            </Button>
            <Button
              variant={filterStatus === 'active' ? 'action' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('active')}
            >
              Active ({plugins.filter(p => p.status === 'active').length})
            </Button>
            <Button
              variant={filterStatus === 'inactive' ? 'action' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('inactive')}
            >
              Inactive ({plugins.filter(p => p.status === 'inactive').length})
            </Button>
            <Button
              variant={filterStatus === 'error' ? 'action' : 'ghost'}
              size="sm"
              onClick={() => setFilterStatus('error')}
            >
              Issues ({plugins.filter(p => p.status === 'error').length})
            </Button>
          </div>
        </div>

        {/* Plugin Grid */}
        {filteredPlugins.length > 0 ? (
          <div style={pluginGridStyle}>
            {filteredPlugins.map((plugin) => (
              <PluginManagementCard
                key={plugin.id}
                plugin={plugin}
                onPluginSelect={onPluginSelect}
                onPluginToggle={onPluginToggle}
                onPluginConfigure={onPluginConfigure}
                onPluginRemove={onPluginRemove}
              />
            ))}
          </div>
        ) : (
          <div style={{ 
            textAlign: 'center', 
            padding: '4rem 2rem',
            color: '#6b7280'
          }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
              {searchTerm || filterStatus !== 'all' 
                ? 'No plugins match your criteria' 
                : 'No Plugins Found'}
            </h3>
            <p>
              {searchTerm || filterStatus !== 'all'
                ? 'Try adjusting your search or filter criteria.'
                : 'Add some plugins to get started with Omnia.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}