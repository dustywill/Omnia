# Logging System Documentation

## Overview

Omnia implements a comprehensive unified logging system that captures logs from both the main Electron process and the client-side renderer process. The system provides real-time log monitoring, filtering, and debugging capabilities through the built-in Logs page.

## Architecture

### Unified Log File System

All logs are written to a single unified log file located at `logs/app.log`. This approach provides:

- **Centralized Logging**: All application activity in one file
- **Chronological Ordering**: Time-based log sequencing across processes
- **Simplified Debugging**: Single source of truth for application behavior
- **Real-time Monitoring**: Live log updates in the UI

### Two-Process Logging Architecture

#### Main Process Logging (`electron-main`)
- **Location**: `src/core/logger.ts`
- **Usage**: Direct logging for Electron main process operations
- **Format**: `[timestamp] [electron-main] [LEVEL] message`
- **Covers**: File operations, IPC handling, window management, startup/shutdown

#### Client-Side Logging (`client-renderer`)
- **Location**: `src/ui/client-logger.ts`
- **Usage**: Captures all console output from renderer process
- **Format**: `[timestamp] [client-renderer] [LEVEL] [CONSOLE] message`
- **Covers**: React rendering, plugin loading, UI interactions, JavaScript errors

## Log Format Specification

### Standard Log Entry Format
```
[2025-07-06T04:19:51.038Z] [component] [LEVEL] message
```

### Component Identifiers
- `electron-main`: Main Electron process
- `client-renderer`: Client-side renderer process  
- `client-[component]`: Component-specific client logs

### Log Levels
- **ERROR**: Critical errors requiring immediate attention
- **WARN/WARNING**: Warning conditions that should be monitored
- **INFO**: General informational messages
- **DEBUG**: Detailed debugging information

### Example Log Entries
```
[2025-07-06T04:19:50.579Z] [electron-main] [INFO] Electron app ready
[2025-07-06T04:19:51.038Z] [client-renderer] [INFO] [CONSOLE] [start] Client-side console logging initialized
[2025-07-06T04:19:51.063Z] [client-renderer] [INFO] [CONSOLE] [loadNodeModule] JSON5 loaded successfully via IPC
[2025-07-06T04:19:51.732Z] [client-renderer] [WARN] [CONSOLE] Failed to call createSchemas for plugin script-runner
```

## Client-Side Logger Implementation

### Automatic Console Capture
The client-side logger automatically intercepts all console methods:

```typescript
// src/ui/client-logger.ts
console.log = (...args: any[]) => {
  const message = this.formatArgs(...args);
  this.sendLog('info', `[CONSOLE] ${message}`);
  this.originalConsole.log(...args);
};
```

### Features
- **Console Interception**: Captures `console.log`, `console.warn`, `console.error`, `console.debug`
- **Error Handling**: Captures uncaught errors and unhandled promise rejections
- **IPC Integration**: Sends logs to main process via `electronAPI.logMessage`
- **Fallback Support**: Maintains original console behavior if IPC fails

### Usage
```typescript
// Automatic initialization in src/index.ts
await import("./ui/client-logger.js");

// Manual component-specific logger
import { createClientLogger } from './ui/client-logger.js';
const logger = createClientLogger('my-component');
```

## IPC Logging Architecture

### Main Process IPC Handler
```typescript
// src/electron-main.ts
ipcMain.handle("log-message", async (_event, level: string, component: string, message: string) => {
  const logPath = path.join(process.cwd(), "logs", "app.log");
  const rendererLogger = createLogger(`client-${component}`, logPath);
  
  switch (level.toLowerCase()) {
    case 'info': await rendererLogger.info(message); break;
    case 'warn': await rendererLogger.warn(message); break;
    case 'error': await rendererLogger.error(message); break;
    case 'debug': await rendererLogger.debug(message); break;
  }
});
```

### Client-Side IPC Usage
```typescript
// src/ui/client-logger.ts
private async sendLog(level: string, message: string): Promise<void> {
  if (window.electronAPI?.logMessage) {
    await window.electronAPI.logMessage(level, this.component, message);
  }
}
```

## Real-Time Log Monitoring

### Logs View Component
The `LogsView` component (`src/ui/views/LogsView.tsx`) provides:

- **Live Updates**: Automatic log refresh every 5 seconds
- **Level Filtering**: Filter by ERROR, WARNING, INFO, DEBUG
- **Plugin Filtering**: Filter by specific plugins or system logs
- **Search Functionality**: Full-text search across log messages
- **Export Capability**: Export filtered logs as JSON
- **Auto-scroll**: Automatically scroll to newest entries

### Log Parsing
```typescript
// Enhanced log parsing with client-side detection
const match = line.match(/^\[(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z)\]\s+\[([^\]]+)\]\s+\[(ERROR|WARN|WARNING|INFO|DEBUG)\]\s+(.+)$/);
```

## Plugin File System Operations

### IPC File Operations
Plugins should use IPC for file system operations instead of direct Node.js calls:

```typescript
// ✅ CORRECT - Using IPC
const stats = await window.electronAPI.stat(filePath);

// ❌ INCORRECT - Direct Node.js (causes errors)
const stats = await fs.stat(filePath);
```

### Available IPC Operations
- `electronAPI.readFile(filePath, options)`
- `electronAPI.writeFile(filePath, data)`
- `electronAPI.mkdir(dirPath, options)`
- `electronAPI.readdir(dirPath, options)`
- `electronAPI.stat(filePath)`
- `electronAPI.join(...paths)`

### ScriptRunner Example
```typescript
// plugins/script-runner/index.tsx
const checkFileExists = async (filePath: string): Promise<boolean> => {
  try {
    await window.electronAPI.stat(filePath);
    return true;
  } catch (error) {
    return false;
  }
};
```

## Log File Management

### Location
- **Development**: `logs/app.log`
- **Production**: `logs/app.log`

### Rotation
Currently, logs are appended to a single file. For production deployments, consider implementing log rotation to prevent excessive file growth.

### Reading Logs
```typescript
// Via IPC
const logContent = await window.electronAPI.readLogFile();

// Direct file access (main process only)
const content = await fs.readFile(path.join(process.cwd(), "logs", "app.log"), 'utf8');
```

## Best Practices

### For Plugin Developers
1. **Use IPC for File Operations**: Always use `electronAPI` methods
2. **Log Important Events**: Log plugin initialization, errors, and significant operations
3. **Use Appropriate Log Levels**: ERROR for failures, INFO for normal operations
4. **Avoid Excessive Logging**: Don't log in tight loops or for trivial operations

### For Core Development
1. **Structured Logging**: Use consistent log message formats
2. **Error Context**: Include sufficient context in error messages
3. **Performance Monitoring**: Log timing for expensive operations
4. **Component Identification**: Use clear component names in log messages

### Example Good Logging
```typescript
// ✅ Good - Structured with context
console.log(`[${pluginId}] Plugin loaded successfully`);
console.error(`[${pluginId}] Failed to load config: ${error.message}`);

// ❌ Bad - Vague or excessive
console.log('done');
console.log('x:', x, 'y:', y, 'z:', z); // in a loop
```

## Debugging Workflow

### Step 1: Access Logs
1. Navigate to the **Logs** page in the application
2. Enable **Live Updates** for real-time monitoring
3. Adjust log level filters as needed

### Step 2: Filter Logs
1. Use **Level Filters** to focus on errors or warnings
2. Use **Plugin Filter** to isolate specific plugin issues
3. Use **Search** to find specific error messages or patterns

### Step 3: Analyze Patterns
1. Look for error sequences leading to failures
2. Check timestamps for performance issues
3. Verify plugin initialization order
4. Monitor IPC operation success/failure

### Step 4: Export for Analysis
1. Apply appropriate filters
2. Click **Export** to save logs as JSON
3. Use external tools for deeper analysis if needed

## Performance Considerations

### Log Volume
- Client-side logging captures all console output
- Can generate significant log volume during development
- Consider log level filtering for production

### IPC Overhead
- Each client log requires an IPC call
- Batching is not currently implemented
- Monitor for performance impact in high-traffic scenarios

### File I/O
- All logs write to the same file
- File locking ensures consistency
- Consider async logging for better performance

## Configuration

### Enable/Disable Client Logging
```typescript
// Disable console capture
const logger = new ClientLogger({
  component: 'my-component',
  enableConsoleCapture: false
});
```

### Log Level Configuration
Currently, log levels are handled at the UI filtering level. Core logging configuration may be added in future versions.

## Troubleshooting

### Common Issues

**"Failed to send log to main process"**
- Indicates IPC communication failure
- Check if Electron context is available
- Verify preload script is loaded

**"Log file not found"**
- Logs directory may not exist
- Check file permissions
- Verify application startup completed

**"Failed to parse log line"**
- Indicates log format changes
- Check LogsView parsing regex
- Update log format constants

### Debug Steps
1. Check browser console for client-side errors
2. Verify IPC handlers are registered
3. Confirm log file permissions
4. Test with minimal logging first

## Future Enhancements

- **Log Rotation**: Implement automatic log file rotation
- **Log Levels**: Add configurable log level filtering
- **Structured Logging**: Add JSON structured logging option
- **Performance Monitoring**: Add performance metrics logging
- **Remote Logging**: Add capability to send logs to external systems