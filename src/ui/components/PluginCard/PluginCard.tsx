import { Badge } from '../ui/badge.js';
import { Button } from '../ui/button.js';

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
const TooltipProvider = ({ children }: any) => <>{children}</>;
const Tooltip = ({ children }: any) => <>{children}</>;
const TooltipTrigger = ({ children }: any) => <>{children}</>;
const TooltipContent = ({ children }: any) => <>{children}</>;


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


  const statusText = {
    active: 'Active',
    inactive: 'Inactive',
    error: 'Error',
    loading: 'Loading...',
  };

  return (
    <Card className={`flex flex-col ${className} ${status === 'loading' ? 'animate-pulse' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
            <CardTitle className="truncate">{name}</CardTitle>
            <TooltipProvider>
                <Tooltip>
                    <TooltipTrigger>
                        <div className={`w-3 h-3 rounded-full ${
                            status === 'active' ? 'bg-green-500' :
                            status === 'inactive' ? 'bg-gray-400' :
                            status === 'error' ? 'bg-red-500' : 'bg-yellow-400'
                        }`} />
                    </TooltipTrigger>
                    <TooltipContent>
                        <p>{statusText[status]}</p>
                    </TooltipContent>
                </Tooltip>
            </TooltipProvider>
        </div>
        <CardDescription className="line-clamp-2">{description}</CardDescription>
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
            <span>v{version}</span>
            {author && <span>by {author}</span>}
            {lastUpdated && (
            <span>Updated {lastUpdated.toLocaleDateString()}</span>
            )}
        </div>
      </CardHeader>

      <CardContent className="flex-grow">
        {permissions && permissions.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-muted-foreground mb-2">Permissions:</p>
            <div className="flex flex-wrap gap-1">
              {permissions.slice(0, 3).map((permission, index) => (
                <Badge key={index} variant="secondary">
                  {permission}
                </Badge>
              ))}
              {permissions.length > 3 && (
                <Badge variant="secondary">
                  +{permissions.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}

        {status === 'error' && (
          <Alert variant="destructive">
            <AlertDescription>
              Plugin failed to load.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-4">
        <div className="flex items-center space-x-2">
            <Switch
                id={`status-switch-${id}`}
                checked={status === 'active'}
                onCheckedChange={() => onToggle(id)}
                disabled={status === 'loading' || status === 'error'}
                aria-label={`Toggle ${name} plugin`}
            />
            <label htmlFor={`status-switch-${id}`} className="text-sm font-medium">
                {status === 'active' ? 'Active' : 'Inactive'}
            </label>
        </div>
        <div className="flex w-full items-center gap-2">
          {onConfigure && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onConfigure(id)}
              disabled={status === 'loading' || status === 'error'}
              className="flex-1"
            >
              Configure
            </Button>
          )}

          {onRemove && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => onRemove(id)}
              disabled={status === 'loading'}
              className="flex-1"
            >
              Remove
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
