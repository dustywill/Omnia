# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omnia is an evolution of the ttCommander application, built as a modern plugin-based system with both web and Electron environments. The application uses a React-based UI with TypeScript and supports dynamic plugin loading with a comprehensive hybrid configuration management system.

### Key Architecture Components

- **Settings Management**: Hybrid configuration system with Zod validation (`src/core/settings-manager.ts`)
- **Plugin System**: Three-tier plugin architecture (Simple, Configured, Advanced)
- **Configuration System**: Type-safe validation using Zod schemas (`src/lib/schemas/`)
- **Permission System**: Manifest-based plugin permissions for security
- **Service Registry**: Plugin-to-plugin communication through main application
- **UI System**: Hybrid Tailwind CSS + CSS Modules styling (planned)

## Development Commands

### Essential Commands

- `npm run dev` - Start development server with TypeScript ESM loader and CSS support
- `npm run build` - Full build process (clean, compile TypeScript, copy assets, process CSS modules, fix imports)
- `npm start` - Run the compiled application
- `npm run electron` - Clear logs, build, and run in Electron mode (development sessions)
- `npm run clear-logs` - Clear application log file for fresh development session (development only)

### Testing

- `npm test` - Run Jest unit tests (excludes e2e tests)
- `npm test:e2e` - Run Playwright end-to-end tests
- Run individual tests: `npx jest path/to/test.test.ts`
- Settings integration test: `node scripts/test-settings-manager.mjs`

### Utilities

- `npm run clean` - Remove dist directory

### Documentation

- [Plugin Developer Guide](./docs/PLUGIN_DEVELOPER_GUIDE.md) - Comprehensive plugin development guide
- [Architecture Guide](./docs/ARCHITECTURE.md) - System architecture and plugin system overview
- [Settings API Reference](./docs/SETTINGS_API.md) - Configuration system documentation
- [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md) - Development roadmap and priorities
- [Asset Loading](./docs/ASSET_LOADING.md) - This document explains how assets (CSS, images, etc.) are handled
- [Component Library](./docs/COMPONENT_LIBRARY.md) - component library, built with a hybrid Tailwind CSS + CSS Modules approach
- [Styling Strategy](STYLING_STRATEGY.md) - hybrid Tailwind CSS + CSS Modules styling approach

## Architecture Overview

### Core System

The application follows a plugin-based architecture with these key components:

**Plugin System**: Enhanced plugin manager with service registry and three-tier architecture

- Three plugin types: Simple (React component), Configured (with schema), Advanced (full lifecycle)
- Service registry enables secure inter-plugin communication with permission validation
- Each plugin has its own directory with `index.tsx` and `plugin.json5` manifest
- Plugin UI components are compiled to JavaScript during build process
- React hooks (usePluginConfig, useService, usePluginContext) for easy development
- Complete plugin lifecycle management with error handling and status tracking

**Event System**: Type-safe event bus for inter-component communication

- Located in `src/core/event-bus.ts`
- Supports subscribe/unsubscribe/publish pattern with typed payloads

**Settings Management**: Hybrid configuration system with Zod validation

- `config/app.json5` - Main application settings
- `config/plugins.json5` - Plugin registry and state
- `config/plugins/*.json5` - Individual plugin configurations
- Type-safe schemas with runtime validation
- File watching for live configuration updates
- Permission-based security system

**Component Library**: Complete design system with 18 production-ready components

- `src/ui/components/` - Reusable UI components following hybrid styling approach
- **Primitive Components**: Button, Input, Badge (Tailwind-heavy)
- **Layout Components**: Card, Grid, Sidebar (Hybrid Tailwind + CSS Modules)
- **Navigation Components**: AppNavigation (Unus-inspired sidebar with colorful icons)
- **Complex Components**: PluginCard, DashboardPluginCard, StatusBar, SettingsForm (CSS Modules-heavy)
- **UI Enhancements**: Clickable plugin cards with hover effects, status bar with plugin counts
- TypeScript support with exported interfaces
- CSS Modules for complex animations and state management

### Application Structure

- **Entry Point**: `src/index.ts` - handles environment setup (JSDOM for Node.js, native DOM for browser/Electron)
- **Core Services**: `src/core/` - plugin management, configuration, event bus, file operations, logging
- **UI Layer**: `src/ui/` - React components, renderer, plugin UI loading
- **Electron**: `src/electron-main.ts` and `src/preload.js` for desktop functionality

### Key Files

- `src/index.ts` - Main application entry and startup logic
- `src/core/plugin-manager.ts` - Plugin discovery, loading, and lifecycle management
- `src/core/settings-manager.ts` - Hybrid configuration system with Zod validation
- `src/lib/schemas/` - Type-safe Zod schemas for configuration validation
- `src/ui/renderer.tsx` - React application initialization and plugin UI coordination
- `src/ui/plugin-ui-loader.ts` - Dynamic loading of plugin React components
- `src/ui/components/` - Complete component library with 9 production-ready components
- `src/ui/components/index.ts` - Component library exports and TypeScript interfaces

## Development Practices

**Test-Driven Development**: All changes require tests. Write failing tests first, then implement code to pass them.

**Plugin Development**:

- Three-tier architecture: Simple (React component), Configured (with schema), Advanced (full lifecycle)
- Use TypeScript with JSX for plugin UIs
- Plugin configurations use Zod schemas for type safety and validation
- Manifest-based permission system for security
- Service registry for plugin-to-plugin communication

**Environment Compatibility**: Code runs in both Node.js (with JSDOM) and browser/Electron environments. The startup code in `src/index.ts` handles environment detection and setup.

## Build Process

The build compiles both main application code and plugin UIs to JavaScript with full asset processing:

1. **Clean**: Remove previous build artifacts (`npm run clean`)
2. **TypeScript Compilation**: 
   - Compile main app with `tsconfig.build.json`
   - Compile plugin UIs with `tsconfig.plugins.json`
3. **Asset Processing**: Copy CSS files and other assets to dist/ (`scripts/copy-assets.js`)
4. **CSS Module Processing**: Convert `.module.css` files to JavaScript objects (`scripts/process-css-modules.js`)
5. **Import Fixing**: Rewrite import paths and CSS module imports (`scripts/fix-plugin-imports.js`)

**Critical Note**: CSS modules are automatically processed during build. The system converts CSS module imports like `import styles from './Card.module.css'` to JavaScript imports like `import styles from './Card.module.css.js'` to enable dynamic loading in the browser environment.

## Testing Configuration

- **Jest**: Unit tests with TypeScript, ESM support, JSDOM environment
- **Playwright**: E2E tests in `tests/e2e/`
- CSS files mocked during testing
- Setup file: `tests/setup.ts`
