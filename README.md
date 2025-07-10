# Omnia

Modern plugin-based application with React UI and TypeScript foundation.

## Quick Start

```bash
npm install           # Install dependencies
npm run dev          # Start development server
npm run build        # Build application and plugins
npm run electron     # Run in Electron mode
npm test            # Run tests
```

## Key Features

- **Three-tier plugin system** (Simple/Configured/Advanced)
- **Service registry** for secure inter-plugin communication
- **Type-safe configuration** with Zod validation
- **React hooks** for plugin development
- **Hybrid styling** (Tailwind + CSS Modules)
- **18+ UI components** ready for use

## Plugin Development

Create a plugin in 3 steps:

```bash
# 1. Create plugin directory
mkdir plugins/my-plugin

# 2. Create plugin files
echo 'export default function MyPlugin() { return <div>Hello World</div>; }' > plugins/my-plugin/index.tsx
echo '{"id": "my-plugin", "name": "My Plugin", "version": "1.0.0"}' > plugins/my-plugin/plugin.json5

# 3. Build and run
npm run build && npm run electron
```

## Documentation

📚 **[Complete Documentation](./docs/README.md)** - Start here for comprehensive guides

Quick Links:
- [Architecture Overview](./docs/architecture/ARCHITECTURE.md)
- [Plugin Developer Guide](./docs/architecture/PLUGIN_DEVELOPER_GUIDE.md)
- [Component Library](./docs/ui/COMPONENT_LIBRARY.md)
- [Troubleshooting](./docs/development/TROUBLESHOOTING.md)

## Project Status

**Current**: Stable foundation complete, ready for feature development

✅ Plugin system, settings management, UI components, build system  
🔄 Documentation organization, enhanced examples, performance optimization

## Contributing

1. Follow Test-Driven Development
2. Use TypeScript for all code
3. Run `npm test` before committing
4. Update documentation with changes

See [docs/README.md](./docs/README.md) for detailed contribution guidelines.