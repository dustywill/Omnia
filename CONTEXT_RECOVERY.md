# Omnia UI Architecture Context Recovery

## Current Problem Summary

### What's Broken
The Omnia application's UI is currently in a broken state where:
- Plugins are rendering **inside** cards instead of showing proper summary cards
- Cards display loading states and plugin components directly, rather than summary information
- Navigation is not functional - there's no way to switch between dashboard, plugins, and settings views
- The dashboard shows full plugin implementations instead of overview cards with "Open Tool" buttons

### Error Details from Logs
- **Zod Loading Issues**: Configuration validation errors preventing proper plugin initialization
- **configFilePath Errors**: Path resolution issues in the settings management system
- **Plugin Loading Failures**: Plugins failing to load properly due to configuration validation errors
- **CSS Module Import Issues**: Build-time CSS module processing causing runtime import failures

### Current Broken State
- Loading states appearing in cards instead of proper plugin summaries
- No functional navigation between different application views
- EnhancedPluginPanel component incorrectly embedded within cards
- Dashboard showing full plugin UIs instead of summary cards

## Target Architecture (from docs and screenshots)

### Dashboard Design
- **Summary Cards**: Each plugin shows a summary card with key information
- **"Open Tool" Buttons**: Cards have action buttons to open the full plugin view
- **Grid Layout**: Cards arranged in a responsive grid using the CardGrid component
- **Quick Actions**: Essential plugin functions accessible from card level

### Navigation Structure
- **Sidebar Navigation**: Left-side navigation with Dashboard/Plugins/Settings
- **View States**: 
  - Dashboard: Overview with all plugin cards
  - Plugins: Individual plugin management and configuration
  - Settings: Application-wide configuration
- **Unus-inspired Design**: Clean, modern interface with consistent spacing and typography

### Plugin Interaction Flow
1. **Dashboard View**: User sees all plugins as summary cards
2. **Plugin Selection**: User clicks "Open Tool" button on a card
3. **Full Plugin View**: Navigation switches to show the full plugin interface
4. **Navigation**: User can return to dashboard or switch to other views via sidebar

## Technical Implementation Plan

### Phase 1: Fix Immediate Rendering Issues
1. **Replace EnhancedPluginPanel with PluginCard in Dashboard**
   - Remove EnhancedPluginPanel from CardGrid rendering
   - Use PluginCard component for summary display
   - Implement proper plugin summary data extraction

2. **Fix Configuration Loading**
   - Resolve Zod validation errors in settings management
   - Fix configFilePath resolution issues
   - Ensure proper plugin manifest loading

### Phase 2: Implement Navigation State Management
1. **Create Navigation State System**
   - Add view state management (dashboard/plugins/settings)
   - Implement navigation context or state management
   - Wire up AppNavigation component to control views

2. **Implement View Switching**
   - Dashboard view: Show plugin cards
   - Plugin view: Show individual plugin full interface
   - Settings view: Show application configuration

### Phase 3: Create Full Plugin View System
1. **Plugin Focus View**
   - Create dedicated component for full plugin display
   - Implement plugin-specific routing/navigation
   - Add breadcrumb navigation for plugin contexts

2. **Integration Testing**
   - Test navigation flow between views
   - Verify plugin loading and rendering
   - Validate configuration persistence

## Key Components and Files

### Core UI Components
- **`src/ui/renderer.tsx`**: Main React application entry point
- **`src/ui/enhanced-renderer.tsx`**: Current broken implementation with incorrect plugin rendering
- **`src/ui/components/CardGrid.tsx`**: Grid layout component that should render PluginCard components
- **`src/ui/components/AppNavigation.tsx`**: Sidebar navigation component (exists but needs wiring)
- **`src/ui/components/PluginCard.tsx`**: Summary card component from component library

### Plugin System
- **`src/core/plugin-manager.ts`**: Plugin discovery, loading, and lifecycle management
- **`src/core/settings-manager.ts`**: Configuration system with Zod validation
- **`src/ui/plugin-ui-loader.ts`**: Dynamic plugin component loading

### Configuration Files
- **`config/app.json5`**: Main application settings
- **`config/plugins.json5`**: Plugin registry and state
- **`config/plugins/*.json5`**: Individual plugin configurations

## Code Analysis Findings

### Current Broken Flow
```
CardGrid → EnhancedPluginPanel → Loading State → Plugin Component (WRONG)
```
- CardGrid renders EnhancedPluginPanel for each plugin
- EnhancedPluginPanel shows loading states and full plugin components
- No proper summary or navigation functionality

### Target Correct Flow
```
Dashboard Cards → Navigation → Full Plugin Views (CORRECT)
```
- Dashboard shows PluginCard components with summaries
- Navigation controls view switching
- Full plugin views are separate from card display

### Missing Navigation State Management
- No centralized view state management
- AppNavigation component exists but is not connected
- No routing or view switching logic implemented
- Plugin focus/selection state not maintained

## Architecture Insights

### Plugin System Design
- **Three-tier Plugin Architecture**: Simple, Configured, Advanced
- **Service Registry**: Plugin-to-plugin communication
- **Manifest-based Permissions**: Security through plugin.json5 manifests
- **React Hooks**: usePluginConfig, useService, usePluginContext

### Component Library Structure
- **Primitive Components**: Button, Input, Badge (Tailwind-heavy)
- **Layout Components**: Card, Grid, Sidebar (Hybrid styling)
- **Navigation Components**: AppNavigation (Unus-inspired)
- **Complex Components**: PluginCard, SettingsForm (CSS Modules-heavy)

### Build System
- **TypeScript Compilation**: Separate configs for main app and plugins
- **CSS Module Processing**: Automatic conversion during build
- **Asset Copying**: Static assets handled by build scripts
- **Import Fixing**: Dynamic import path resolution

## Implementation Progress ✅

### COMPLETED: Architecture Redesign (2025-07-04)
✅ **New Main App Renderer**: Created `src/ui/main-app-renderer.tsx` with proper navigation state management
✅ **Dashboard View**: Implemented `src/ui/views/DashboardView.tsx` with PluginCard summary components
✅ **Plugin Management View**: Created `src/ui/views/PluginsView.tsx` with search/filter functionality  
✅ **Settings View**: Implemented `src/ui/views/SettingsView.tsx` for application configuration
✅ **Plugin Detail View**: Created `src/ui/views/PluginDetailView.tsx` for full plugin interfaces
✅ **Navigation Wiring**: Connected AppNavigation component to view state management
✅ **Type Safety**: Fixed all TypeScript issues with proper PluginInfo interface
✅ **Build System**: Updated index.ts to use new architecture, successful build

### Current Status
- **Architecture**: ✅ Complete redesign implemented
- **Navigation**: ✅ Sidebar navigation with dashboard/plugins/settings views
- **Plugin Cards**: ✅ Summary cards with "Open Tool" buttons instead of embedded plugins
- **Full Plugin Views**: ✅ Dedicated full-screen plugin interfaces
- **Build Process**: ✅ Successful compilation and asset processing

### Remaining Issues
- **Runtime Testing**: Need to verify the application actually runs in Electron/browser
- **Zod Loading**: Still need to resolve Zod library loading issues in Electron renderer
- **Plugin Integration**: Need to test actual plugin loading and rendering flow
- **Configuration**: May need to fix remaining settings management issues

## Next Steps Priority

1. **Runtime Testing**: Get the application running and verify dashboard displays correctly
2. **Plugin Loading**: Test actual plugin component loading in the new architecture
3. **Configuration Debugging**: Fix remaining Zod validation and path resolution errors
4. **Integration Testing**: Verify complete user flow from dashboard to plugin interaction
5. **Performance Optimization**: Ensure plugin loading is efficient and error-free

## Development Notes

- **Test-Driven Development**: All changes require tests first
- **Environment Compatibility**: Code runs in both Node.js and browser/Electron
- **CSS Modules**: Automatically processed during build, imports rewritten
- **Plugin Development**: Use TypeScript with JSX, Zod schemas for validation

This context document should serve as a comprehensive reference for understanding the current state and planned solutions for the Omnia UI architecture issues.