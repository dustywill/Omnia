# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Omnia is an evolution of the ttCommander application, built as a plugin-based system with both web and Electron environments. The application uses a React-based UI with TypeScript and supports dynamic plugin loading.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server with TypeScript ESM loader and CSS support
- `npm run build` - Full build process (clean, compile TypeScript for main app and plugins, fix imports, copy preload.js)
- `npm start` - Run the compiled application
- `npm run electron` - Build and run in Electron mode

### Testing
- `npm test` - Run Jest unit tests (excludes e2e tests)
- `npm test:e2e` - Run Playwright end-to-end tests
- Run individual tests: `npx jest path/to/test.test.ts`

### Utilities
- `npm run clean` - Remove dist directory

## Architecture Overview

### Core System
The application follows a plugin-based architecture with these key components:

**Plugin System**: Dynamic plugin loading from `plugins/` directory
- Each plugin has its own directory with `index.tsx` (React UI) or `index.ts` (logic)
- Plugins can have `plugin.json5` manifests for configuration
- Plugin UI components are compiled to JavaScript during build process
- Plugin manager handles loading, initialization, and configuration management

**Event System**: Type-safe event bus for inter-component communication
- Located in `src/core/event-bus.ts`
- Supports subscribe/unsubscribe/publish pattern with typed payloads

**Configuration**: JSON5-based configuration system
- Main config at `config/app-config.json5`
- Per-plugin configuration support with defaults from manifests
- File watching for live configuration updates

### Application Structure
- **Entry Point**: `src/index.ts` - handles environment setup (JSDOM for Node.js, native DOM for browser/Electron)
- **Core Services**: `src/core/` - plugin management, configuration, event bus, file operations, logging
- **UI Layer**: `src/ui/` - React components, renderer, plugin UI loading
- **Electron**: `src/electron-main.ts` and `src/preload.js` for desktop functionality

### Key Files
- `src/index.ts` - Main application entry and startup logic
- `src/core/plugin-manager.ts` - Plugin discovery, loading, and lifecycle management  
- `src/ui/renderer.tsx` - React application initialization and plugin UI coordination
- `src/ui/plugin-ui-loader.ts` - Dynamic loading of plugin React components

## Development Practices

**Test-Driven Development**: All changes require tests. Write failing tests first, then implement code to pass them.

**Plugin Development**: 
- Plugins export React components or functions from their main file
- Use TypeScript with JSX for plugin UIs
- Plugin configurations merge with defaults from manifests

**Environment Compatibility**: Code runs in both Node.js (with JSDOM) and browser/Electron environments. The startup code in `src/index.ts` handles environment detection and setup.

## Build Process

The build compiles both main application code and plugin UIs to JavaScript:
1. Clean previous build artifacts
2. Compile main app with `tsconfig.build.json` 
3. Compile plugin UIs with `tsconfig.plugins.json`
4. Fix ES module imports in compiled plugins
5. Copy preload.js for Electron

## Testing Configuration

- **Jest**: Unit tests with TypeScript, ESM support, JSDOM environment
- **Playwright**: E2E tests in `tests/e2e/` 
- CSS files mocked during testing
- Setup file: `tests/setup.ts`