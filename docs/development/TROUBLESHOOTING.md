# Troubleshooting Guide

## Overview

This guide provides systematic approaches to identifying and resolving issues in the Omnia application using the unified logging system and built-in debugging tools.

## Using Logs for Debugging

### Accessing the Logs Page

1. **Navigate to Logs**: Click on the "Logs" tab in the application navigation
2. **Enable Live Updates**: Toggle the "Live Updates" switch to see real-time log entries
3. **Set Appropriate Filters**: Use level and plugin filters to focus on relevant information

### Understanding Log Levels

#### ERROR Level
- **When to Use**: Critical failures that prevent normal operation
- **Examples**: Plugin loading failures, file access errors, IPC communication failures
- **Action Required**: Immediate investigation and resolution needed

```
[2025-07-06T04:19:51.732Z] [client-renderer] [ERROR] [CONSOLE] Failed to load Zod for demo schema
```

#### WARNING Level  
- **When to Use**: Potential issues that don't stop operation but may cause problems
- **Examples**: Deprecated API usage, missing optional configurations, performance concerns
- **Action Required**: Monitor and plan for resolution

```
[2025-07-06T04:19:51.234Z] [client-renderer] [WARN] [CONSOLE] [loadNodeModule] URL module not available, providing fallback pathToFileURL
```

#### INFO Level
- **When to Use**: Normal operational messages
- **Examples**: Plugin initialization, file operations, startup sequences
- **Action Required**: None, informational only

```
[2025-07-06T04:19:51.038Z] [client-renderer] [INFO] [CONSOLE] [start] Client-side console logging initialized
```

#### DEBUG Level
- **When to Use**: Detailed debugging information
- **Examples**: Variable values, function entry/exit, detailed execution flow
- **Action Required**: Use for troubleshooting specific issues

```
[2025-07-06T04:20:09.543Z] [client-renderer] [DEBUG] [CONSOLE] Failed to parse log line: id: "as-built-documenter",
```

### Log Pattern Analysis

#### Identifying Component Issues

**Main Process Problems** (electron-main):
- Look for patterns in `[electron-main]` logs
- Focus on file system operations, IPC setup, window management
- Check for startup sequence failures

**Client-Side Problems** (client-renderer):
- Examine `[client-renderer]` logs
- Look for React rendering issues, plugin loading problems
- Check for JavaScript errors and console output

**Plugin-Specific Issues**:
- Filter by specific plugin names
- Look for plugin initialization sequences
- Check for configuration loading errors

#### Common Error Patterns

**IPC Communication Failures**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to send log to main process
```
- **Cause**: Electron context not available or IPC handlers not registered
- **Solution**: Check preload script loading, verify IPC handler registration

**File System Access Errors**:
```
[timestamp] [electron-main] [ERROR] Error reading file /path/to/file: ENOENT
```
- **Cause**: File doesn't exist, permission issues, or incorrect path
- **Solution**: Verify file exists, check permissions, validate path construction

**Plugin Loading Failures**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to load plugin: plugin-name
```
- **Cause**: Missing plugin files, invalid manifest, or dependency issues
- **Solution**: Check plugin structure, validate manifest, verify dependencies

**JSON5 Parsing Errors**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to parse JSON5 content
```
- **Cause**: Invalid JSON5 syntax in configuration files
- **Solution**: Validate JSON5 syntax, check for trailing commas, quotes

### Debugging Workflow

#### Step 1: Reproduce the Issue
1. Clear existing logs if needed (restart application)
2. Enable live updates in the Logs page
3. Perform the action that causes the issue
4. Watch for error messages in real-time

#### Step 2: Filter and Focus
1. **Filter by Level**: Start with ERROR level to see critical failures
2. **Filter by Component**: Focus on the component showing issues
3. **Use Search**: Search for specific error messages or keywords

#### Step 3: Analyze Error Context
1. **Check Timestamps**: Look for sequences of related errors
2. **Examine Stack Traces**: Review full error messages for context
3. **Identify Root Cause**: Follow the chain of events leading to the error

#### Step 4: Verify Fix
1. Apply potential fix
2. Reproduce the original issue
3. Verify error no longer appears in logs
4. Check that normal operation messages appear

### Performance Debugging

#### Identifying Performance Issues

**Slow Plugin Loading**:
```
[timestamp] [client-renderer] [INFO] [CONSOLE] Loading plugin: plugin-name
[timestamp + 5s] [client-renderer] [INFO] [CONSOLE] Plugin plugin-name loaded successfully
```
- **Issue**: 5-second delay indicates slow loading
- **Investigation**: Check plugin size, dependencies, file I/O operations

**IPC Operation Delays**:
```
[timestamp] [client-renderer] [INFO] [CONSOLE] [loadNodeModule] Attempting to load module: json5
[timestamp + 2s] [client-renderer] [INFO] [CONSOLE] [loadNodeModule] JSON5 loaded successfully via IPC
```
- **Issue**: 2-second delay for IPC operation
- **Investigation**: Check main process load, IPC queue, file system performance

#### Performance Monitoring Techniques

1. **Use Timestamps**: Calculate time differences between related operations
2. **Monitor IPC Calls**: Track frequency and duration of IPC operations
3. **Check Console Output**: Look for excessive logging that might impact performance
4. **Review Plugin Initialization**: Ensure plugins load efficiently

## Common Issues and Solutions

### Plugin Issues

#### Plugin Not Loading
**Symptoms**:
- Plugin doesn't appear in plugin list
- Error messages about missing plugin files

**Log Patterns**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to read plugin manifest: /path/to/plugin.json5
```

**Troubleshooting Steps**:
1. Check plugin directory structure
2. Verify `plugin.json5` exists and is valid
3. Check file permissions
4. Validate JSON5 syntax

#### Plugin Configuration Errors
**Symptoms**:
- Plugin loads but doesn't function correctly
- Configuration-related error messages

**Log Patterns**:
```
[timestamp] [client-renderer] [WARN] [CONSOLE] Failed to call createSchemas for plugin script-runner
```

**Troubleshooting Steps**:
1. Check plugin configuration schema
2. Verify configuration file syntax
3. Validate required configuration fields
4. Check for missing dependencies

### File System Issues

#### File Access Denied
**Symptoms**:
- Operations fail with permission errors
- File read/write operations timeout

**Log Patterns**:
```
[timestamp] [electron-main] [ERROR] Error reading file: EACCES: permission denied
```

**Troubleshooting Steps**:
1. Check file/directory permissions
2. Verify user has access rights
3. Check if file is locked by another process
4. Validate file path construction

#### File Not Found
**Symptoms**:
- Operations fail with file not found errors
- Incorrect path references

**Log Patterns**:
```
[timestamp] [electron-main] [ERROR] Error reading file: ENOENT: no such file or directory
```

**Troubleshooting Steps**:
1. Verify file exists at specified path
2. Check for typos in file path
3. Validate path construction logic
4. Check if file was moved or deleted

### IPC Communication Issues

#### IPC Handler Not Found
**Symptoms**:
- Client-side operations fail
- IPC-related error messages

**Log Patterns**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to invoke IPC handler: handler-name
```

**Troubleshooting Steps**:
1. Check if IPC handlers are registered in main process
2. Verify preload script is loaded
3. Check handler names match between client and main process
4. Validate IPC communication setup

#### IPC Communication Timeout
**Symptoms**:
- Operations hang or timeout
- Delayed responses from main process

**Log Patterns**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] IPC operation timed out
```

**Troubleshooting Steps**:
1. Check main process responsiveness
2. Verify IPC handler implementation
3. Check for blocking operations in main process
4. Monitor system resources

### Configuration Issues

#### Invalid Configuration File
**Symptoms**:
- Configuration loading fails
- Default values used instead of configured values

**Log Patterns**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to parse configuration: Invalid JSON5
```

**Troubleshooting Steps**:
1. Validate JSON5 syntax
2. Check for missing quotes or brackets
3. Verify all required fields are present
4. Use JSON5 validator to check syntax

#### Missing Configuration
**Symptoms**:
- Features don't work as expected
- Default behavior instead of configured behavior

**Log Patterns**:
```
[timestamp] [client-renderer] [WARN] [CONSOLE] Configuration file not found, using defaults
```

**Troubleshooting Steps**:
1. Check if configuration file exists
2. Verify file location matches expected path
3. Check if configuration was properly saved
4. Validate configuration file permissions

## Advanced Debugging Techniques

### Log Export and Analysis

#### Exporting Logs
1. Apply appropriate filters in the Logs page
2. Click "Export" to download logs as JSON
3. Use external tools for detailed analysis

#### Log Analysis Tools
- **Text Editors**: For basic pattern search
- **Log Analyzers**: For structured analysis
- **Custom Scripts**: For automated pattern detection

### Console Debugging

#### Browser Developer Tools
1. Open browser developer tools (F12)
2. Check Console tab for client-side errors
3. Use Network tab to monitor IPC communications
4. Check Application tab for local storage issues

#### Console Commands
```javascript
// View current log state
console.log('Current logs:', logs);

// Check plugin status
console.log('Plugin manager:', pluginManager);

// Examine configuration
console.log('App config:', appConfig);
```

### Performance Profiling

#### Timing Analysis
1. Export logs with timestamp data
2. Calculate time differences between operations
3. Identify bottlenecks in initialization sequences
4. Monitor resource usage patterns

#### Memory Monitoring
1. Use browser developer tools Memory tab
2. Check for memory leaks in plugins
3. Monitor DOM element creation/destruction
4. Track event listener management

## Prevention Strategies

### Proactive Monitoring

#### Regular Log Review
1. Review logs regularly for warnings
2. Monitor error frequency trends
3. Check for performance degradation
4. Validate plugin health

#### Automated Monitoring
- Set up log level alerts
- Monitor file system health
- Track IPC operation success rates
- Monitor plugin initialization times

### Development Best Practices

#### Error Handling
1. Implement proper try-catch blocks
2. Log meaningful error messages
3. Provide error context and stack traces
4. Handle edge cases gracefully

#### Logging Strategy
1. Use appropriate log levels
2. Include relevant context in messages
3. Avoid excessive logging in production
4. Structure log messages consistently

#### Testing
1. Test error conditions regularly
2. Verify error handling paths
3. Check log output during testing
4. Validate error recovery mechanisms

## Getting Help

### Self-Service Resources
1. **Documentation**: Review this guide and related docs
2. **Logs**: Use the built-in logging system
3. **Code**: Examine source code for implementation details
4. **Examples**: Check plugin examples for patterns

### Escalation Process
1. Gather relevant logs and error messages
2. Document steps to reproduce the issue
3. Export logs for detailed analysis
4. Provide system information and configuration details

### Information to Provide
- Operating system and version
- Application version and build
- Relevant log entries with timestamps
- Steps to reproduce the issue
- Expected vs actual behavior
- System configuration details