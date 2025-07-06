import React from "react";
import { createRoot, type Root } from "react-dom/client";
import { AppNavigation } from "./components/AppNavigation/AppNavigation.js";
import { StatusBar } from "./components/StatusBar/StatusBar.js";
import { DashboardView } from "./views/DashboardView.js";
import { PluginsView } from "./views/PluginsView.js";
import { SettingsView } from "./views/SettingsView.js";
import { LogsView } from "./views/LogsView.js";
import { PluginDetailView } from "./views/PluginDetailView.js";
import { EnhancedPluginManager } from "../core/enhanced-plugin-manager.js";
import { ServiceRegistry } from "../core/service-registry.js";
import { SettingsManager } from "../core/settings-manager.js";
import { NavigationService } from "../core/navigation-service.js";
import { createEventBus } from "../core/event-bus.js";
import { loadNodeModule } from "./node-module-loader.js";
// Client logger is imported to initialize console capture
import "./client-logger.js";

export type MainAppRendererOptions = {
  container: HTMLElement;
  pluginsPath: string;
  configPath?: string;
};

export type AppView =
  | "dashboard"
  | "plugins"
  | "settings"
  | "logs"
  | "plugin-detail"
  | string; // Allow plugin-specific views

export type PluginInfo = {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  type: "simple" | "configured" | "hybrid";
  enabled: boolean;
  manifest: any;
  config?: any;
  status: "active" | "inactive" | "error" | "loading";
  permissions?: string[];
  lastUpdated?: Date;
};

const MainApp: React.FC<{
  pluginInfos: PluginInfo[];
  pluginManager: EnhancedPluginManager;
  serviceRegistry: ServiceRegistry;
  settingsManager: SettingsManager;
  navigationService: NavigationService;
}> = ({
  pluginInfos,
  pluginManager,
  serviceRegistry,
  settingsManager,
  navigationService,
}) => {
  const [currentView, setCurrentView] = React.useState<AppView>("dashboard");
  const [currentPluginSettingsId, setCurrentPluginSettingsId] = React.useState<
    string | null
  >(null);
  const [selectedPluginId, setSelectedPluginId] = React.useState<string | null>(
    null,
  );
  const [settingsTarget, setSettingsTarget] = React.useState<{
    pluginId: string;
    focusEditor?: boolean;
  } | null>(null);
  const [pluginFilter, setPluginFilter] = React.useState<
    "all" | "active" | "inactive" | "error"
  >("all");

  // Subscribe to navigation changes
  React.useEffect(() => {
    const unsubscribe = navigationService.on("navigation:change", (state) => {
      setCurrentView(state.currentView);
      setSelectedPluginId(state.selectedPluginId || null);
      setSettingsTarget(state.settingsTarget || null);
    });

    return unsubscribe;
  }, [navigationService]);

  // Initialize navigation from URL on mount
  React.useEffect(() => {
    navigationService.setupBrowserNavigation();
  }, [navigationService]);

  const handleViewChange = (
    view: "dashboard" | "plugins" | "settings" | "logs" | string,
  ) => {
    // Check if this is a plugin settings view
    if (view.startsWith("plugin-")) {
      const pluginId = view.replace("plugin-", "");
      setCurrentView(view);
      setCurrentPluginSettingsId(pluginId);
      // Set settings target for the specific plugin
      setSettingsTarget({ pluginId });
      return;
    }

    // Reset plugin settings when navigating away
    setCurrentPluginSettingsId(null);
    setSettingsTarget(null);

    // Reset filter when navigating to plugins view normally
    if (view === "plugins") {
      setPluginFilter("all");
    }
    navigationService.navigateTo(
      view as "dashboard" | "plugins" | "settings" | "logs",
    );
  };

  const handlePluginSelect = (pluginId: string) => {
    navigationService.navigateToPluginDetail(pluginId);
  };

  const handlePluginConfigure = (
    pluginId: string,
    source: "plugins" | "plugin-detail" | "dashboard" = "plugins",
  ) => {
    navigationService.navigateToPluginConfig(pluginId, source);
  };

  const handleBackToPlugins = () => {
    if (!navigationService.navigateBack()) {
      // Fallback to dashboard view if no history
      navigationService.navigateTo("dashboard");
    }
  };

  const handleStatusClick = (filter: "active" | "inactive" | "error") => {
    setPluginFilter(filter);
    navigationService.navigateTo("plugins");
  };

  const selectedPlugin = selectedPluginId
    ? pluginInfos.find((p) => p.id === selectedPluginId)
    : null;

  const activePlugins = pluginInfos.filter((p) => p.status === "active").length;
  const errorPlugins = pluginInfos.filter((p) => p.status === "error").length;

  const mainStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    fontFamily: "'Nunito Sans', sans-serif",
    backgroundColor: "#f8fafc",
  };

  const appBodyStyle: React.CSSProperties = {
    display: "flex",
    flex: 1,
    overflow: "hidden",
    marginBottom: "33px", // Account for StatusBar height (32px) + border (1px)
  };

  const contentStyle: React.CSSProperties = {
    flex: 1,
    overflowY: "auto",
  };

  return (
    <div style={mainStyle}>
      <div style={appBodyStyle}>
        <AppNavigation
          currentView={
            currentView === "plugin-detail" ? "plugins" : currentView
          }
          onViewChange={handleViewChange}
          plugins={pluginInfos.map((p) => ({
            id: p.id,
            name: p.name,
            enabled: p.enabled,
          }))}
        />

        <main style={contentStyle}>
          {currentView === "dashboard" && (
            <DashboardView
              plugins={pluginInfos}
              onPluginSelect={handlePluginSelect}
              onViewChange={handleViewChange}
              onStatusClick={handleStatusClick}
            />
          )}

          {currentView === "plugins" && (
            <PluginsView
              plugins={pluginInfos}
              onPluginSelect={handlePluginSelect}
              onPluginToggle={(pluginId) => {
                // TODO: Implement plugin toggle
                console.log("Toggle plugin:", pluginId);
              }}
              onPluginConfigure={(pluginId) =>
                handlePluginConfigure(pluginId, "plugins")
              }
              onPluginRemove={(pluginId) => {
                // TODO: Implement plugin removal
                console.log("Remove plugin:", pluginId);
              }}
              initialFilter={pluginFilter}
            />
          )}

          {(currentView === "settings" ||
            currentView.startsWith("plugin-")) && (
            <SettingsView
              settingsManager={settingsManager}
              plugins={pluginInfos}
              pluginManager={pluginManager}
              navigationTarget={settingsTarget}
              viewMode={
                currentView.startsWith("plugin-") ? "plugin-only" : "full"
              }
              targetPluginId={currentPluginSettingsId}
            />
          )}

          {currentView === "logs" && (
            <LogsView
              plugins={pluginInfos.map((p) => ({ id: p.id, name: p.name }))}
            />
          )}

          {currentView === "plugin-detail" && selectedPlugin && (
            <PluginDetailView
              plugin={selectedPlugin}
              pluginManager={pluginManager}
              serviceRegistry={serviceRegistry}
              settingsManager={settingsManager}
              onBack={handleBackToPlugins}
              onConfigure={(pluginId) =>
                handlePluginConfigure(pluginId, "plugin-detail")
              }
            />
          )}
        </main>
      </div>

      <StatusBar
        activePlugins={activePlugins}
        totalPlugins={pluginInfos.length}
        errorPlugins={errorPlugins}
        currentView={currentView}
        onStatusClick={handleStatusClick}
        selectedPlugin={
          selectedPlugin
            ? {
                version: selectedPlugin.version,
                author: selectedPlugin.author,
                type: selectedPlugin.type,
                permissions: selectedPlugin.permissions,
              }
            : null
        }
      />
    </div>
  );
};

export const initMainAppRenderer = async (
  opts: MainAppRendererOptions,
): Promise<Root> => {
  // Initialize client-side logging first - this will start capturing all console logs
  console.log("[initMainAppRenderer] Initializing client-side console logging");

  console.log(
    "[initMainAppRenderer] Starting main application renderer initialization",
  );

  const path = await loadNodeModule<typeof import("path")>("path");
  const configPath =
    opts.configPath || (await path.join(process.cwd(), "config"));

  // Initialize core systems
  console.log("[initMainAppRenderer] Initializing settings manager");
  const settingsManager = new SettingsManager(configPath);
  await settingsManager.init();

  console.log("[initMainAppRenderer] Initializing service registry");
  const serviceRegistry = new ServiceRegistry(createEventBus(), {
    info: async (message: string) => console.log(message),
    warn: async (message: string) => console.warn(message),
    error: async (message: string) => console.error(message),
    debug: async (message: string) => console.debug(message),
  });

  console.log("[initMainAppRenderer] Initializing navigation service");
  const navigationService = new NavigationService();

  console.log("[initMainAppRenderer] Initializing plugin manager");
  const pluginManager = new EnhancedPluginManager({
    pluginsDirectory: opts.pluginsPath,
    configDirectory: configPath,
    settingsManager,
    serviceRegistry,
  });
  await pluginManager.init();

  // Discover and load plugin information
  console.log("[initMainAppRenderer] Discovering plugins");
  await pluginManager.discoverPlugins();

  console.log("[initMainAppRenderer] Loading plugin registry");
  const registry = await settingsManager.loadPluginRegistry();

  // Get plugin information for rendering
  const pluginInfos: PluginInfo[] = [];

  for (const [pluginId, registryEntry] of Object.entries(registry.plugins)) {
    try {
      const manifest = await pluginManager.loadManifest(pluginId);
      if (!manifest) {
        console.warn(
          `[initMainAppRenderer] No manifest found for plugin: ${pluginId}`,
        );
        continue;
      }

      let config = undefined;
      let status: "active" | "inactive" | "error" | "loading" =
        registryEntry.enabled ? "active" : "inactive";

      // Load configuration for configured and hybrid plugins
      if (manifest.type === "configured" || manifest.type === "hybrid") {
        try {
          // First try to load the default config from the plugin
          const pluginModule = await pluginManager.loadPluginModule(pluginId);
          config = pluginModule?.defaultConfig;

          // Then try to load and merge any saved configuration
          const configSchema = await pluginManager.loadConfigSchema(pluginId);
          if (configSchema) {
            const savedConfig = await settingsManager.loadPluginConfig(
              pluginId,
              configSchema,
            );
            // Merge saved config with defaults if available
            if (savedConfig && config) {
              config = { ...config, ...savedConfig };
            } else if (savedConfig) {
              config = savedConfig;
            }
          }
        } catch (err) {
          console.warn(
            `[initMainAppRenderer] Failed to load config for ${pluginId}:`,
            err,
          );
          // Keep status as active but use default config only
          try {
            const pluginModule = await pluginManager.loadPluginModule(pluginId);
            config = pluginModule?.defaultConfig;
            if (!config) {
              status = "error";
            }
          } catch (moduleErr) {
            console.error(
              `[initMainAppRenderer] Failed to load plugin module for ${pluginId}:`,
              moduleErr,
            );
            status = "error";
          }
        }
      }

      pluginInfos.push({
        id: pluginId,
        name: manifest.name || pluginId,
        description: manifest.description || `${manifest.type} plugin`,
        version: manifest.version || "1.0.0",
        author: manifest.author,
        type: (manifest.type as "simple" | "configured" | "hybrid") || "simple",
        enabled: registryEntry.enabled !== false,
        manifest,
        config,
        status,
        permissions: manifest.permissions,
        lastUpdated: new Date(), // TODO: Get from file system
      });
    } catch (err) {
      console.error(
        `[initMainAppRenderer] Failed to load plugin info for ${pluginId}:`,
        err,
      );
      // Add error plugin entry
      pluginInfos.push({
        id: pluginId,
        name: pluginId,
        description: "Failed to load plugin",
        version: "0.0.0",
        type: "simple",
        enabled: false,
        manifest: {},
        status: "error",
      });
    }
  }

  console.log(
    `[initMainAppRenderer] Found ${pluginInfos.length} plugins:`,
    pluginInfos.map((p) => `${p.id} (${p.type})`),
  );

  // Initialize services for hybrid plugins
  console.log("[initMainAppRenderer] Initializing plugin services");
  for (const pluginInfo of pluginInfos) {
    if (
      pluginInfo.enabled &&
      (pluginInfo.type === "hybrid" || pluginInfo.manifest.services)
    ) {
      try {
        await pluginManager.initializeServices(pluginInfo.id);
        console.log(
          `[initMainAppRenderer] Services initialized for ${pluginInfo.id}`,
        );
      } catch (err) {
        console.error(
          `[initMainAppRenderer] Failed to initialize services for ${pluginInfo.id}:`,
          err,
        );
        // Mark plugin as error
        const plugin = pluginInfos.find((p) => p.id === pluginInfo.id);
        if (plugin) plugin.status = "error";
      }
    }
  }

  const root = createRoot(opts.container);
  root.render(
    React.createElement(MainApp, {
      pluginInfos,
      pluginManager,
      serviceRegistry,
      settingsManager,
      navigationService,
    }),
  );

  console.log(
    "[initMainAppRenderer] Main application renderer initialized successfully",
  );
  return root;
};
