# Architecture Documentation

This folder contains comprehensive documentation about Omnia's architecture and system design.

## Overview

Omnia is built on a modern plugin-based architecture with three main layers:

1. **UI Layer**: React components with hybrid Tailwind + CSS Modules styling
2. **Plugin System**: Three-tier architecture supporting Simple, Configured, and Advanced plugins
3. **Core Services**: Settings management, event bus, logging, and service registry

## Documents

### Core Architecture
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Complete system architecture overview
- **[DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md)** - Key architectural decisions and rationale
- **[SERVICES.md](./SERVICES.md)** - Core service architecture and APIs

### Plugin System
- **[PLUGIN_DEVELOPER_GUIDE.md](./PLUGIN_DEVELOPER_GUIDE.md)** - Complete plugin development guide
- **[PLUGIN_TOOLKIT.md](./PLUGIN_TOOLKIT.md)** - Plugin development tools and utilities
- **[PLUGIN_SECURITY.md](../security/PLUGIN_SECURITY.md)** - Plugin security model and best practices

### Configuration
- **[SETTINGS_API.md](./SETTINGS_API.md)** - Settings management system API

## Key Concepts

### Plugin Tiers
1. **Simple**: Export a React component - perfect for static content
2. **Configured**: Component + Zod schema - most common pattern  
3. **Advanced**: Full lifecycle + services - for complex functionality

### Service Registry
Secure inter-plugin communication system with:
- Permission-based access control
- Type-safe service contracts
- Event-driven architecture
- Lifecycle management

### Settings Management
Hybrid configuration system featuring:
- JSON5 configuration files
- Zod schema validation
- Real-time file watching
- Type-safe access patterns

## Development Flow

1. **Design**: Review architecture documents
2. **Implement**: Follow plugin development guide
3. **Test**: Use testing frameworks and patterns
4. **Deploy**: Build and distribution process

## Quick References

- **Plugin Creation**: See [PLUGIN_DEVELOPER_GUIDE.md](./PLUGIN_DEVELOPER_GUIDE.md)
- **Service Usage**: See [SERVICES.md](./SERVICES.md)
- **Configuration**: See [SETTINGS_API.md](./SETTINGS_API.md)
- **Security**: See [PLUGIN_SECURITY.md](../security/PLUGIN_SECURITY.md)