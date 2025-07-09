import React from 'react';
import { Button } from '../components/ui/button.js';
import { Input } from '../components/ui/input.js';
import { Badge } from '../components/ui/badge.js';
import { type PluginInfo } from '../main-app-renderer.js';

// Simple component replacements for missing UI components
const Card = ({ children, className = '', ...props }: any) => (
  <div className={`border rounded-lg p-4 ${className}`} {...props}>{children}</div>
);
const CardHeader = ({ children, className = '', ...props }: any) => (
  <div className={`pb-2 ${className}`} {...props}>{children}</div>
);
const CardTitle = ({ children, className = '', ...props }: any) => (
  <h3 className={`font-semibold ${className}`} {...props}>{children}</h3>
);
const CardDescription = ({ children, className = '', ...props }: any) => (
  <p className={`text-sm text-gray-600 ${className}`} {...props}>{children}</p>
);
const CardContent = ({ children, className = '', ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);
const CardFooter = ({ children, className = '', ...props }: any) => (
  <div className={`pt-2 ${className}`} {...props}>{children}</div>
);
const Alert = ({ children, className = '', ...props }: any) => (
  <div className={`border border-yellow-200 bg-yellow-50 p-3 rounded ${className}`} {...props}>{children}</div>
);
const AlertDescription = ({ children, className = '', ...props }: any) => (
  <div className={`text-sm ${className}`} {...props}>{children}</div>
);
const Avatar = ({ children, className = '', ...props }: any) => (
  <div className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ${className}`} {...props}>{children}</div>
);
const AvatarFallback = ({ children, className = '', ...props }: any) => (
  <span className={`text-sm font-medium ${className}`} {...props}>{children}</span>
);
const Switch = ({ checked, onCheckedChange, disabled, className = '', ...props }: any) => (
  <input 
    type="checkbox" 
    checked={checked} 
    onChange={(e) => onCheckedChange?.(e.target.checked)} 
    disabled={disabled}
    className={`toggle ${className}`} 
    {...props} 
  />
);

export interface PluginsViewProps {
  plugins: PluginInfo[];
  onPluginSelect: (pluginId: string) => void;
  onPluginToggle: (pluginId: string) => void;
  onPluginConfigure: (pluginId: string) => void;
  onPluginRemove: (pluginId: string) => void;
  initialFilter?: 'all' | 'active' | 'inactive' | 'error';
}

function PluginManagementCard({ 
  plugin, 
  onPluginSelect,
  onPluginToggle,
  onPluginConfigure,
  onPluginRemove
}: {
  plugin: PluginInfo;
  onPluginSelect: (pluginId: string) => void;
  onPluginToggle: (pluginId: string) => void;
  onPluginConfigure: (pluginId: string) => void;
  onPluginRemove: (pluginId: string) => void;
}) {
  const { id, name, description, version, author, status } = plugin;

  const handleCardClick = () => {
    if (status === 'active') {
      onPluginSelect(id);
    }
  };
  
  return (
    <Card 
      className={`flex flex-col ${status === 'active' ? 'cursor-pointer' : ''} ${status === 'loading' ? 'animate-pulse' : ''}`}
      onClick={handleCardClick}
    >
      <CardHeader className="flex-row items-start gap-4">
        <Avatar>
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle>{name}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </div>
        <div className={`w-3 h-3 rounded-full ${
            status === 'active' ? 'bg-green-500' :
            status === 'inactive' ? 'bg-gray-400' :
            status === 'error' ? 'bg-red-500' : 'bg-yellow-400'
        }`} />
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>v{version}</span>
            {author && <span>by {author}</span>}
            <Badge variant="outline">{plugin.type}</Badge>
        </div>
        {status === 'error' && (
            <Alert variant="destructive" className="mt-4">
                <AlertDescription>Plugin failed to load</AlertDescription>
            </Alert>
        )}
      </CardContent>
      <CardFooter className="flex flex-col gap-4">
        <div className="flex items-center space-x-2 w-full">
            <Switch
                id={`status-switch-${id}`}
                checked={status === 'active'}
                onCheckedChange={() => onPluginToggle(id)}
                disabled={status === 'loading' || status === 'error'}
            />
            <label htmlFor={`status-switch-${id}`} className="text-sm font-medium">
                {status === 'active' ? 'Active' : 'Inactive'}
            </label>
        </div>
        <div className="flex w-full gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPluginConfigure(id); }}
                disabled={status === 'loading' || status === 'error'}
                className="flex-1"
            >
                Configure
            </Button>
            <Button
                variant="destructive"
                size="sm"
                onClick={(e) => { e.stopPropagation(); onPluginRemove(id); }}
                disabled={status === 'loading'}
                className="flex-1"
            >
                Remove
            </Button>
        </div>
        {status === 'active' && (
            <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs font-medium w-full">
                Click card to open tool
            </div>
        )}
      </CardFooter>
    </Card>
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
    <div className="h-full overflow-y-auto bg-gray-50">
      <header className="p-4 px-8 bg-white border-b">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Plugins</h1>
            <p className="text-gray-500 text-sm">Manage your plugin collection</p>
          </div>
          <Button>Add Plugin</Button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div className="w-full max-w-xs">
            <Input
              type="search"
              placeholder="Search plugins..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Button variant={filterStatus === 'all' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus('all')}>
              All ({plugins.length})
            </Button>
            <Button variant={filterStatus === 'active' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus('active')}>
              Active ({plugins.filter(p => p.status === 'active').length})
            </Button>
            <Button variant={filterStatus === 'inactive' ? 'default' : 'ghost'} size="sm" onClick={() => setFilterStatus('inactive')}>
              Inactive ({plugins.filter(p => p.status === 'inactive').length})
            </Button>
            <Button variant={filterStatus === 'error' ? 'destructive' : 'ghost'} size="sm" onClick={() => setFilterStatus('error')}>
              Issues ({plugins.filter(p => p.status === 'error').length})
            </Button>
          </div>
        </div>

        {filteredPlugins.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
          <div className="text-center py-16 text-gray-500">
            <h3 className="text-xl mb-2">
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
      </main>
    </div>
  );
}
