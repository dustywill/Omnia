import React from 'react';
import { PluginCard } from '../components/PluginCard/PluginCard.js';
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
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    marginBottom: '2rem'
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
            <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>
              Plugins
            </h1>
            <p style={{ color: '#6b7280', fontSize: '1.1rem' }}>
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
              <div key={plugin.id} style={{ position: 'relative' }}>
                <PluginCard
                  plugin={plugin}
                  onToggle={onPluginToggle}
                  onConfigure={onPluginConfigure}
                  onRemove={onPluginRemove}
                />
                {plugin.status === 'active' && (
                  <div style={{ 
                    position: 'absolute', 
                    top: '1rem', 
                    right: '1rem',
                    zIndex: 10
                  }}>
                    <Button
                      variant="action"
                      size="sm"
                      onClick={() => onPluginSelect(plugin.id)}
                    >
                      Open
                    </Button>
                  </div>
                )}
              </div>
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