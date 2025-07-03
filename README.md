# Omnia

Omnia is an evolution of the ttCommander application, built as a modern plugin-based system with both web and Electron environments. The application uses a React-based UI with TypeScript and supports dynamic plugin loading with a comprehensive configuration management system.

## Architecture Overview

Omnia features a modern plugin-based architecture with:
- **Enhanced Plugin Manager** with service registry for secure inter-plugin communication
- **Three-tier plugin system** (Simple/Configured/Advanced) supporting all development needs
- **Permission-based security** for plugin operations and service access
- **Zod-based schemas** for type-safe configuration with runtime validation
- **Schema-driven settings forms** with automatic UI generation from Zod schemas
- **Hybrid styling** combining Tailwind CSS utilities with CSS Modules 
- **React hooks** for plugin development (usePluginConfig, useService, usePluginContext)
- **Unus-inspired UI** with sidebar navigation and single-plugin focus
- **Complete component library** with 16 production-ready components

### Key Components

- **Enhanced Plugin Manager**: Complete plugin lifecycle management with service registry
- **Service Registry**: Secure, permission-based inter-plugin communication system
- **Settings Management**: Hybrid configuration system with `config/app.json5`, `config/plugins.json5`, and `config/plugins/*.json5`
- **Schema-driven Settings Forms**: Automatic UI generation from Zod schemas with real-time validation
- **Plugin Hooks**: React hooks for configuration, services, and context access
- **Permission System**: Manifest-based security for plugin operations
- **Configuration System**: Type-safe validation using Zod schemas
- **UI System**: React components with hybrid Tailwind CSS + CSS Modules styling
- **Component Library**: 16 reusable components following design system patterns

## Quick Start

1. **Install dependencies**: `npm install`
2. **Development mode**: `npm run dev` - Start with TypeScript ESM loader
3. **Build application**: `npm run build` - Compile TypeScript and plugins  
4. **Run Electron app**: `npm run electron` - Launch in Electron mode
5. **Run tests**: `npm test` - Execute Jest unit tests

## Documentation

- **[Plugin Developer Guide](./docs/PLUGIN_DEVELOPER_GUIDE.md)** - Complete plugin development guide with hooks and examples
- **[Architecture Guide](./docs/ARCHITECTURE.md)** - System architecture and plugin system overview
- **[Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)** - Development roadmap and current status
- **[Settings Management API](./docs/SETTINGS_API.md)** - Configuration system usage
- **[Component Library](./docs/COMPONENT_LIBRARY.md)** - Complete component documentation and usage
- **[Design Decisions](./docs/DESIGN_DECISIONS.md)** - Architectural choices and rationale
- **[Styling Strategy](./docs/STYLING_STRATEGY.md)** - Hybrid Tailwind + CSS Modules approach
- **[Asset Loading](./docs/ASSET_LOADING.md)** - Handling CSS, images, and other assets

## Contributing

- **Follow Test-Driven Development** for all changes
- **Write failing tests first**, then implement the code to make them pass
- **Run `npm test`** to ensure all tests pass before pushing
- **Reference the [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)** for current priorities

## Plugin Development

Omnia supports three tiers of plugin complexity with full development toolkit:

1. **Simple Plugins**: Just export a React component - perfect for static content
2. **Configured Plugins**: Component + Zod schema validation - most common pattern
3. **Advanced Plugins**: Full lifecycle hooks + service registration - for complex functionality

### Plugin Features
- **Service Registry**: Secure plugin-to-plugin communication
- **Permission System**: Manifest-based security for all operations
- **React Hooks**: `usePluginConfig`, `useService`, `usePluginContext` for easy development
- **Type Safety**: Full TypeScript support with Zod validation
- **Live Configuration**: Real-time config updates with validation
- **Event System**: Plugin lifecycle and custom events

### Quick Start
```bash
# Create plugin directory
mkdir plugins/my-plugin

# Copy template
cp -r examples/plugins/simple-plugin/* plugins/my-plugin/

# Build and test
npm run build && npm run electron
```

See the [Plugin Developer Guide](./docs/PLUGIN_DEVELOPER_GUIDE.md) for comprehensive instructions and examples.
