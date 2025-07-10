# Omnia Documentation

Welcome to the comprehensive documentation for Omnia, a modern plugin-based application with a React UI and TypeScript foundation.

## Quick Start

### Installation
```bash
npm install
```

### Development Commands
- `npm run dev` - Start development server
- `npm run build` - Build application and plugins
- `npm run electron` - Run in Electron mode
- `npm test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests

### Basic Plugin Creation
```bash
# Create a new plugin
mkdir plugins/my-plugin
cd plugins/my-plugin

# Create basic structure
echo 'export default function MyPlugin() { return <div>Hello World</div>; }' > index.tsx
echo '{"id": "my-plugin", "name": "My Plugin", "version": "1.0.0"}' > plugin.json5

# Build and test
npm run build
```

## Documentation Structure

### [Architecture](./architecture/)
- **[Overview](./architecture/ARCHITECTURE.md)** - System architecture and plugin system
- **[Plugin System](./architecture/PLUGIN_DEVELOPER_GUIDE.md)** - Complete plugin development guide
- **[Services](./architecture/SERVICES.md)** - Core service architecture
- **[Settings API](./architecture/SETTINGS_API.md)** - Configuration system
- **[Security](./architecture/PLUGIN_SECURITY.md)** - Plugin security model

### [Development](./development/)
- **[Getting Started](./development/GUIDE.md)** - Developer setup and workflow
- **[Debugging](./development/DEBUGGING.md)** - Debugging techniques and tools
- **[Troubleshooting](./development/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Logging](./development/LOGGING.md)** - Logging system usage

### [Testing](./testing/)
- **[Overview](./testing/UI_TESTING.md)** - Testing strategy and setup
- **[Plugin Testing](./testing/PLUGIN_TESTING.md)** - Plugin-specific testing
- **[UI Testing](./testing/UI_COMPONENT_TEST_PLAN.md)** - UI component testing

### [UI/UX](./ui/)
- **[Component Library](./ui/COMPONENT_LIBRARY.md)** - Available components
- **[Styling Guide](./ui/STYLING_STRATEGY.md)** - Tailwind + CSS Modules approach
- **[Asset Handling](./ui/ASSET_LOADING.md)** - CSS, images, and other assets

### [Agent System](./agents/)
- **[Overview](./agents/AGENTS.md)** - Multi-agent development system
- **[Planner](./agents/PLANNER.md)** - Problem analysis and planning
- **[Coordinator](./agents/COORDINATOR.md)** - Task coordination and execution

## Key Features

### Plugin Architecture
- **Three-tier system**: Simple, Configured, Advanced plugins
- **Service registry**: Secure inter-plugin communication
- **Permission system**: Manifest-based security
- **React hooks**: Easy plugin development with `usePluginConfig`, `useService`

### Configuration System
- **Hybrid configuration**: JSON5 files with Zod validation
- **Type safety**: Full TypeScript support with runtime validation
- **Live updates**: File watching for real-time configuration changes

### UI System
- **Component library**: 18+ production-ready components
- **Hybrid styling**: Tailwind CSS + CSS Modules
- **Responsive design**: Mobile-first approach
- **Accessibility**: WCAG compliance built-in

## Project Status

Current status: **Stable Foundation Complete**

✅ **Completed:**
- Plugin system architecture
- Settings management with validation
- Component library
- Build system with CSS modules
- Client-side logging
- IPC security for file operations

📋 **In Progress:**
- Documentation organization
- Plugin examples expansion
- Performance optimization

🔄 **Planned:**
- Enhanced plugin templates
- Advanced service features
- Extended testing coverage

## Contributing

1. **Follow Test-Driven Development**: Write failing tests first
2. **Use TypeScript**: All code must be type-safe
3. **Follow conventions**: Study existing code patterns
4. **Run tests**: `npm test` must pass before committing
5. **Update documentation**: Keep docs current with changes

## Support

- **Issues**: Check [troubleshooting guide](./development/TROUBLESHOOTING.md)
- **Debugging**: Use [debugging guide](./development/DEBUGGING.md)
- **Architecture**: Review [architecture overview](./architecture/ARCHITECTURE.md)
- **Plugin Development**: Follow [plugin guide](./architecture/PLUGIN_DEVELOPER_GUIDE.md)