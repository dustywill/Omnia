import { type PluginInfo } from '../../main-app-renderer.js';
import { Badge } from '../ui/badge.js';

// Simple component replacements for missing card and avatar components
const Card = ({ children, className = '', onClick, ...props }: any) => (
  <div className={`border rounded-lg p-4 ${className}`} onClick={onClick} {...props}>{children}</div>
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
const Avatar = ({ children, className = '', ...props }: any) => (
  <div className={`w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center ${className}`} {...props}>{children}</div>
);
const AvatarFallback = ({ children, className = '', ...props }: any) => (
  <span className={`text-sm font-medium ${className}`} {...props}>{children}</span>
);

export interface DashboardPluginCardProps {
  plugin: PluginInfo;
  onPluginSelect: (pluginId: string) => void;
  className?: string;
}

const getPluginTypeVariant = (pluginType: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (pluginType) {
        case 'simple':
            return 'secondary';
        case 'configured':
            return 'default';
        case 'hybrid':
            return 'outline';
        default:
            return 'secondary';
    }
}

export function DashboardPluginCard({
  plugin,
  onPluginSelect,
  className = ''
}: DashboardPluginCardProps) {
  const { id, name, description, version, author } = plugin;

  const handleClick = () => {
    onPluginSelect(id);
  };

  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-1 flex flex-col ${className}`}
      onClick={handleClick}
    >
      <CardHeader className="flex flex-row items-start gap-4 space-y-0">
        <Avatar>
          <AvatarFallback>{name.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <CardTitle>{name}</CardTitle>
          <CardDescription className="line-clamp-2">{description}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <div className="text-center p-2 bg-blue-50 border border-blue-200 rounded-md text-blue-700 text-xs font-medium">
          Click card to open tool
        </div>
      </CardContent>
      <CardFooter className="flex justify-between text-xs text-muted-foreground">
        <span className="truncate max-w-[33%]">{author ? `by ${author}` : ''}</span>
        <Badge variant={getPluginTypeVariant(plugin.type)}>{plugin.type}</Badge>
        <span>v{version}</span>
      </CardFooter>
    </Card>
  );
}
