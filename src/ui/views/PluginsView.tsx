import React from 'react';
import { Button } from '../components/Button/Button.js';
import { Input } from '../components/Input/Input.js';
import { ToggleSwitch } from '../components/ToggleSwitch/ToggleSwitch.js';
import { type PluginInfo } from '../main-app-renderer.js';
import styles from './PluginsView.module.css';

export interface PluginsViewProps {
  plugins: PluginInfo[];
  onPluginSelect: (pluginId: string) => void;
  onPluginToggle: (pluginId: string) => void;
  onPluginConfigure: (pluginId: string) => void;
  onPluginRemove: (pluginId: string) => void;
  initialFilter?: 'all' | 'active' | 'inactive' | 'error';
}

const getPluginIcon = (pluginName: string, pluginType: string) => {
  const letter = pluginName.charAt(0).toUpperCase();
  
  return (
    <div className={`${styles.pluginIcon} ${styles[pluginType] || styles.simple}`}>
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

  const handleCardClick = () => {
    if (status === 'active') {
      onPluginSelect(id);
    }
  };
  
  return (
    <div 
      className={`bg-white border border-gray-200 rounded-xl p-5 ${styles.pluginCard} ${status === 'loading' ? styles.loading : ''}`}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className={styles.pluginHeader}>
        {getPluginIcon(name, plugin.type)}
        
        <div className={styles.pluginInfo}>
          <h3 className={styles.pluginName}>
            {name}
          </h3>
          <p className={styles.pluginDescription}>
            {description}
          </p>
        </div>

        {/* Status indicator LED */}
        <div 
          title={statusText[status]}
          className={`${styles.statusLed} ${styles[status] || ''}`}
        />
      </div>
      
      {/* Plugin metadata */}
      <div className={styles.pluginMetadata}>
        <span>v{version}</span>
        {author && <span>by {author}</span>}
        <span className={`${styles.badge} ${styles[plugin.type] || styles.simple}`}>
          {plugin.type}
        </span>
      </div>
      
      {/* Error message */}
      {status === 'error' && (
        <div className={styles.errorAlert}>
          <span className={styles.icon}>⚠</span>
          <p className={styles.message}>Plugin failed to load</p>
        </div>
      )}
      
      {/* Action buttons */}
      <div className={`${styles.pluginActions} mt-auto pt-4 border-t border-gray-200 flex gap-3 flex-wrap items-center`}>
        {/* Toggle Switch for Active/Inactive */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-medium">
            {status === 'active' ? 'Active' : 'Inactive'}
          </span>
          <ToggleSwitch
            checked={status === 'active'}
            onChange={() => {
              onPluginToggle(id);
            }}
            disabled={status === 'loading' || status === 'error'}
            size="sm"
            aria-label={`Toggle ${name} plugin ${status === 'active' ? 'off' : 'on'}`}
          />
        </div>
        
        <div className="flex gap-2 flex-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onPluginConfigure(id);
            }}
            disabled={status === 'loading' || status === 'error'}
            className="flex-1 min-w-20"
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
            className="min-w-18"
          >
            Remove
          </Button>
        </div>
      </div>
      
      {/* Click instruction for active plugins */}
      {status === 'active' && (
        <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs font-medium mt-2">
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
  onPluginRemove,
  initialFilter = 'all'
}: PluginsViewProps) {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState<'all' | 'active' | 'inactive' | 'error'>(initialFilter);

  const filteredPlugins = plugins.filter(plugin => {
    const matchesSearch = plugin.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         plugin.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || plugin.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-screen overflow-y-auto">
      {/* Header */}
      <header className="p-4 px-8 bg-white border-b border-gray-200 mb-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 mb-1">
              Plugins
            </h1>
            <p className="text-gray-500 text-sm">
              Manage your plugin collection
            </p>
          </div>
          
          <Button variant="action" size="md">
            Add Plugin
          </Button>
        </div>
      </header>

      <div className="px-8 pb-8 max-w-7xl mx-auto">
        {/* Search and Filters */}
        <div className={styles.controlsRow}>
          {/* Search on the left */}
          <div className={styles.searchSection}>
            <Input
              type="search"
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Filter buttons in the middle */}
          <div className={styles.filterButtons}>
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
          
          {/* Spacer to push filter buttons to center */}
          <div className={styles.spacer}></div>
        </div>

        {/* Plugin Grid */}
        {filteredPlugins.length > 0 ? (
          <div className={styles.pluginGrid}>
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
          <div className={styles.emptyState}>
            <h3 className="text-xl mb-4 text-gray-700">
              {searchTerm || filterStatus !== 'all' 
                ? 'No plugins match your criteria' 
                : 'No Plugins Found'}
            </h3>
            <p className="text-gray-500">
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