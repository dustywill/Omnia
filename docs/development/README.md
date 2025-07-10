# Development Documentation

This folder contains guides and resources for developing with Omnia.

## Getting Started

### Prerequisites
- Node.js 18+ with npm
- TypeScript knowledge
- React experience
- Basic understanding of plugin architecture

### Setup
```bash
git clone <repository>
cd omnia
npm install
npm run dev
```

## Documents

### Core Development
- **[GUIDE.md](./GUIDE.md)** - Complete developer setup and workflow guide
- **[DEBUGGING.md](./DEBUGGING.md)** - Debugging techniques and tools
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - Common issues and solutions
- **[LOGGING.md](./LOGGING.md)** - Logging system usage and best practices

## Development Workflow

### 1. Environment Setup
```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run electron # Run Electron version
```

### 2. Plugin Development
```bash
# Create new plugin
mkdir plugins/my-plugin
cd plugins/my-plugin

# Basic plugin structure
echo 'export default function MyPlugin() { return <div>Hello</div>; }' > index.tsx
echo '{"id": "my-plugin", "name": "My Plugin", "version": "1.0.0"}' > plugin.json5

# Build and test
npm run build
npm run electron
```

### 3. Testing
```bash
npm test           # Unit tests
npm run test:e2e   # End-to-end tests
```

## Key Development Tools

### TypeScript Configuration
- **Main app**: `tsconfig.build.json`
- **Plugins**: `tsconfig.plugins.json`
- **Tests**: `tsconfig.json`

### Build System
- **Asset copying**: `scripts/copy-assets.js`
- **CSS modules**: `scripts/process-css-modules.js`
- **Import fixing**: `scripts/fix-plugin-imports.js`

### Debugging Tools
- **Client logging**: `src/ui/client-logger.ts`
- **Log viewer**: Built-in logs page
- **Browser DevTools**: Full support in development

## Best Practices

### Code Quality
- Use TypeScript for all code
- Follow existing patterns and conventions
- Write tests for new functionality
- Use Zod for schema validation

### Plugin Development
- Start with Simple tier, upgrade as needed
- Use service registry for plugin communication
- Follow security best practices
- Test in both web and Electron environments

### Performance
- Use CSS modules for component-specific styles
- Lazy load plugin components
- Optimize asset loading
- Monitor memory usage

## Common Tasks

### Adding New Component
1. Create component in `src/ui/components/`
2. Add to `componentDirs` in `scripts/copy-assets.js`
3. Export from `src/ui/components/index.ts`
4. Write tests in `tests/ui/components/`

### Adding New Service
1. Create service in `src/core/services/`
2. Register in service registry
3. Add to plugin hooks
4. Document API usage

### Updating Configuration
1. Update Zod schemas in `src/lib/schemas/`
2. Update configuration files in `config/`
3. Test validation and UI generation
4. Update documentation

## Support Resources

- **Architecture**: [../architecture/](../architecture/)
- **Testing**: [../testing/](../testing/)
- **UI Components**: [../ui/](../ui/)
- **Troubleshooting**: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)