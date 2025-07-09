import { DashboardPluginCard } from '../components/DashboardPluginCard/DashboardPluginCard.js';
import { type PluginInfo } from '../main-app-renderer.js';

// Simple component replacements for missing card components
const Card = ({ children, className = '', onClick, ...props }: any) => (
  <div className={`border rounded-lg p-4 ${className}`} onClick={onClick} {...props}>{children}</div>
);
const CardHeader = ({ children, className = '', ...props }: any) => (
  <div className={`pb-2 ${className}`} {...props}>{children}</div>
);
const CardTitle = ({ children, className = '', ...props }: any) => (
  <h3 className={`font-semibold ${className}`} {...props}>{children}</h3>
);
const CardContent = ({ children, className = '', ...props }: any) => (
  <div className={className} {...props}>{children}</div>
);

export interface DashboardViewProps {
  plugins: PluginInfo[];
  onPluginSelect: (pluginId: string) => void;
  onViewChange?: (view: 'dashboard' | 'plugins' | 'settings') => void;
  onStatusClick?: (filter: 'active' | 'inactive' | 'error') => void;
}

const StatCard = ({ title, value, onClick, colorClass, hoverColorClass }: any) => (
    <Card 
        className={`text-center cursor-pointer transition-all ${hoverColorClass}`}
        onClick={onClick}
    >
        <CardHeader className="p-2">
            <CardTitle className={`text-2xl font-bold ${colorClass}`}>{value}</CardTitle>
        </CardHeader>
        <CardContent className="p-2">
            <p className="text-xs text-muted-foreground">{title}</p>
        </CardContent>
    </Card>
);

export function DashboardView({ 
  plugins, 
  onPluginSelect,
  onViewChange,
  onStatusClick
}: DashboardViewProps) {
  const activePlugins = plugins.filter(p => p.status === 'active');
  const inactivePlugins = plugins.filter(p => p.status === 'inactive');
  const errorPlugins = plugins.filter(p => p.status === 'error');

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header */}
      <header className="p-4 px-8 bg-primary text-primary-foreground">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-2xl font-bold">Dashboard</h1>
                <p className="text-sm text-primary-foreground/80">
                    Overview of your plugin ecosystem
                </p>
            </div>
            
            {/* Mini Statistics Cards */}
            <div className="grid grid-cols-2 gap-2 w-48">
                <StatCard 
                    title="Active" 
                    value={activePlugins.length} 
                    onClick={() => onStatusClick?.('active')}
                    colorClass="text-green-500"
                    hoverColorClass="hover:bg-green-50"
                />
                <StatCard 
                    title="Inactive" 
                    value={inactivePlugins.length} 
                    onClick={() => onStatusClick?.('inactive')}
                    colorClass="text-gray-500"
                    hoverColorClass="hover:bg-gray-100"
                />
                <StatCard 
                    title="Errors" 
                    value={errorPlugins.length} 
                    onClick={() => onStatusClick?.('error')}
                    colorClass="text-red-500"
                    hoverColorClass="hover:bg-red-50"
                />
                <StatCard 
                    title="Total" 
                    value={plugins.length} 
                    onClick={() => onViewChange?.('plugins')}
                    colorClass="text-blue-500"
                    hoverColorClass="hover:bg-blue-50"
                />
            </div>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto">

        {/* Active Plugins Section */}
        {activePlugins.length > 0 && (
          <section>
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Active Plugins</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activePlugins.map((plugin) => (
                <DashboardPluginCard
                  key={plugin.id}
                  plugin={plugin}
                  onPluginSelect={onPluginSelect}
                />
              ))}
            </div>
          </section>
        )}


        {/* Empty State */}
        {plugins.length === 0 && (
          <div className="text-center py-16 text-gray-500">
            <h3 className="text-xl mb-2">No Plugins Found</h3>
            <p>Add some plugins to get started with Omnia.</p>
          </div>
        )}
      </main>
    </div>
  );
}
