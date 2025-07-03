# Omnia

Omnia is an evolution of the ttCommander application, built as a modern plugin-based system with both web and Electron environments. The application uses a React-based UI with TypeScript and supports dynamic plugin loading with a comprehensive configuration management system.

## Architecture Overview

Omnia features a hybrid configuration system with:
- **Zod-based schemas** for type-safe configuration with runtime validation
- **Hybrid styling** combining Tailwind CSS utilities with CSS Modules 
- **Three-tier plugin architecture** supporting simple to advanced plugin development
- **Service registry pattern** for safe plugin-to-plugin communication
- **Unus-inspired UI** with sidebar navigation and single-plugin focus

### Key Components

- **Settings Management**: Hybrid configuration system with `config/app.json5`, `config/plugins.json5`, and `config/plugins/*.json5`
- **Plugin System**: Dynamic plugin loading with manifest-based permissions
- **Configuration System**: Type-safe validation using Zod schemas
- **UI System**: React components with hybrid Tailwind CSS + CSS Modules styling

## Quick Start

1. **Install dependencies**: `npm install`
2. **Development mode**: `npm run dev` - Start with TypeScript ESM loader
3. **Build application**: `npm run build` - Compile TypeScript and plugins  
4. **Run Electron app**: `npm run electron` - Launch in Electron mode
5. **Run tests**: `npm test` - Execute Jest unit tests

## Documentation

- **[Design Decisions](./docs/DESIGN_DECISIONS.md)** - Architectural choices and rationale
- **[Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)** - Development roadmap and dependencies  
- **[Plugin Developer Guide](./docs/PLUGIN_DEVELOPER_GUIDE.md)** - How to create plugins
- **[Settings Management API](./docs/SETTINGS_API.md)** - Configuration system usage
- **[Asset Loading](./docs/ASSET_LOADING.md)** - Handling CSS, images, and other assets

## Contributing

- **Follow Test-Driven Development** for all changes
- **Write failing tests first**, then implement the code to make them pass
- **Run `npm test`** to ensure all tests pass before pushing
- **Reference the [Implementation Plan](./docs/IMPLEMENTATION_PLAN.md)** for current priorities

## Plugin Development

Omnia supports three tiers of plugin complexity:

1. **Simple Plugins**: Just export a React component
2. **Configured Plugins**: Component + configuration schema (most common)
3. **Advanced Plugins**: Full lifecycle with background processing

See the [Plugin Developer Guide](./docs/PLUGIN_DEVELOPER_GUIDE.md) for detailed instructions.
