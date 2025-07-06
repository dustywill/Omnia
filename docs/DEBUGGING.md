# Debugging Guide

## Overview

This guide provides step-by-step debugging workflows for the Omnia application, leveraging the unified logging system and built-in monitoring tools to quickly identify and resolve issues.

## Getting Started with Debugging

### 1. Access the Logs Page

The Logs page is your primary debugging tool in Omnia:

1. **Open the Application**: Launch Omnia in development or production mode
2. **Navigate to Logs**: Click the "Logs" tab in the main navigation
3. **Enable Live Updates**: Toggle the "Live Updates" switch for real-time monitoring
4. **Configure Filters**: Set appropriate log level and component filters

### 2. Understanding the Log Interface

#### Live Indicator
- **Green Dot + "LIVE"**: Real-time log updates every 5 seconds
- **Disabled**: Manual refresh only - click to update logs

#### Filter Controls
- **Level Filters**: ERROR, WARNING, INFO, DEBUG checkboxes
- **Source Filter**: All plugins, System, or specific plugin selection
- **Search Box**: Full-text search across log messages

#### Log Entry Format
```
[Timestamp] [Component] [Level] Message
```

Example:
```
[04:19:51] [client-renderer] [INFO] [CONSOLE] Plugin loaded successfully
```

## Step-by-Step Debugging Workflow

### Step 1: Reproduce the Issue

1. **Clear Context**: Restart the application for a clean slate
2. **Enable Comprehensive Logging**: 
   - Check all log levels (ERROR, WARNING, INFO, DEBUG)
   - Set source filter to "All plugins"
3. **Document the Steps**: Note the exact sequence of actions that cause the issue
4. **Perform the Action**: Execute the problematic operation while monitoring logs

### Step 2: Initial Log Analysis

#### Quick Error Identification
1. **Filter by ERROR level**: Start with the most critical issues
2. **Look for Recent Timestamps**: Focus on logs from when the issue occurred
3. **Identify Error Patterns**: Look for repeating error messages
4. **Note Error Context**: Check surrounding INFO/WARN messages for context

#### Common Error Categories
- **Plugin Loading Errors**: Issues during plugin initialization
- **IPC Communication Failures**: Problems with main process communication
- **File System Errors**: File access, permission, or path issues
- **Configuration Errors**: Invalid JSON5 syntax or missing required fields

### Step 3: Deep Dive Analysis

#### Trace the Error Chain
1. **Find the Root Error**: Look for the first error in the sequence
2. **Follow the Timeline**: Track related messages chronologically
3. **Identify Dependencies**: Check which components are affected
4. **Map the Impact**: Understand how the error propagates

#### Example Error Chain Analysis
```
[04:19:51.732Z] [client-renderer] [ERROR] [CONSOLE] Failed to call createSchemas for plugin script-runner
[04:19:51.745Z] [client-renderer] [WARN] [CONSOLE] Plugin script-runner schema validation unavailable
[04:19:51.760Z] [client-renderer] [INFO] [CONSOLE] Plugin script-runner loaded with default configuration
```

**Analysis**: 
- Root cause: Schema creation failed
- Impact: Plugin falls back to default configuration
- Severity: Functional but not configured properly

### Step 4: Component-Specific Investigation

#### Main Process Issues (`electron-main`)
**Common Patterns**:
```
[timestamp] [electron-main] [ERROR] Error reading file: ENOENT
[timestamp] [electron-main] [ERROR] IPC handler registration failed
[timestamp] [electron-main] [ERROR] Window creation failed
```

**Investigation Steps**:
1. Check file paths and permissions
2. Verify IPC handler registration
3. Look for resource conflicts
4. Check system-level issues

#### Client-Side Issues (`client-renderer`)
**Common Patterns**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to load plugin
[timestamp] [client-renderer] [ERROR] [CONSOLE] IPC communication timeout
[timestamp] [client-renderer] [ERROR] [CONSOLE] React component error
```

**Investigation Steps**:
1. Check plugin manifest files
2. Verify IPC communication
3. Look for JavaScript runtime errors
4. Check React component lifecycle issues

#### Plugin-Specific Issues
**Filter by Plugin**: Use the source filter to focus on specific plugins

**Common Plugin Patterns**:
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] [plugin-name] Configuration invalid
[timestamp] [client-renderer] [ERROR] [CONSOLE] [plugin-name] Service unavailable
[timestamp] [client-renderer] [ERROR] [CONSOLE] [plugin-name] File operation failed
```

### Step 5: Advanced Debugging Techniques

#### Use Search for Pattern Analysis
1. **Search for Error Patterns**: Use keywords like "failed", "error", "timeout"
2. **Component Filtering**: Search for specific function names or components
3. **Configuration Issues**: Search for "config", "schema", "validation"
4. **Performance Issues**: Search for timing-related messages

#### Export Logs for Analysis
1. **Apply Filters**: Set appropriate time range and error levels
2. **Export to JSON**: Click "Export" to download filtered logs
3. **External Analysis**: Use tools like jq, grep, or custom scripts for complex analysis

```bash
# Example: Find all plugin loading errors
cat logs.json | jq '.[] | select(.message | contains("Plugin") and contains("failed"))'

# Example: Group errors by plugin
cat logs.json | jq 'group_by(.pluginId) | map({plugin: .[0].pluginId, errors: length})'
```

## Common Issue Patterns and Solutions

### Plugin Loading Issues

#### Pattern: Plugin Not Found
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to read plugin manifest: /path/to/plugin.json5
```

**Debug Steps**:
1. Verify plugin directory exists
2. Check `plugin.json5` file exists and is readable
3. Validate JSON5 syntax
4. Check file permissions

**Solution**: Fix directory structure or JSON5 syntax

#### Pattern: Invalid Plugin Manifest
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Invalid plugin manifest: required field missing
```

**Debug Steps**:
1. Check manifest against schema requirements
2. Verify all required fields are present
3. Validate field types and values
4. Check for typos in field names

**Solution**: Update manifest to match schema requirements

### IPC Communication Issues

#### Pattern: IPC Handler Not Found
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to invoke IPC handler: handler-name
```

**Debug Steps**:
1. Check if handler is registered in main process
2. Verify preload script is loaded
3. Check handler names match exactly
4. Verify Electron context is available

**Solution**: Register IPC handler or fix naming mismatch

#### Pattern: IPC Operation Timeout
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] IPC operation timed out after 5000ms
```

**Debug Steps**:
1. Check main process responsiveness
2. Look for blocking operations in main process
3. Monitor system resources
4. Check for deadlocks or infinite loops

**Solution**: Optimize main process operations or increase timeout

### File System Issues

#### Pattern: File Access Denied
```
[timestamp] [electron-main] [ERROR] Error reading file: EACCES: permission denied
```

**Debug Steps**:
1. Check file/directory permissions
2. Verify user has access rights
3. Check if file is locked
4. Validate path construction

**Solution**: Fix permissions or use alternative access method

#### Pattern: File Not Found
```
[timestamp] [electron-main] [ERROR] Error reading file: ENOENT: no such file or directory
```

**Debug Steps**:
1. Verify file exists at specified path
2. Check for typos in path
3. Validate path construction logic
4. Check if file was moved or deleted

**Solution**: Fix path construction or create missing files

### Configuration Issues

#### Pattern: Invalid JSON5 Syntax
```
[timestamp] [client-renderer] [ERROR] [CONSOLE] Failed to parse JSON5: Unexpected token
```

**Debug Steps**:
1. Validate JSON5 syntax with online validator
2. Check for missing commas, quotes, or brackets
3. Look for trailing commas in wrong places
4. Verify escape sequences

**Solution**: Fix JSON5 syntax errors

#### Pattern: Schema Validation Failed
```
[timestamp] [client-renderer] [WARN] [CONSOLE] Configuration validation failed: required field missing
```

**Debug Steps**:
1. Check configuration against schema
2. Verify all required fields are present
3. Check field types match schema
4. Look for additional properties not allowed

**Solution**: Update configuration to match schema

## Real-Time Monitoring Techniques

### Performance Monitoring

#### Watch for Slow Operations
1. **Monitor Timing**: Look for gaps between related log entries
2. **Identify Bottlenecks**: Find operations taking longer than expected
3. **Track Resource Usage**: Monitor file I/O and IPC operations

#### Example Performance Analysis
```
[04:19:51.038Z] [client-renderer] [INFO] [CONSOLE] Loading plugin: script-runner
[04:19:51.455Z] [client-renderer] [INFO] [CONSOLE] Plugin script-runner loaded successfully
```
**Analysis**: 417ms to load plugin - investigate if this is acceptable

### Error Frequency Monitoring

#### Track Error Patterns
1. **Monitor Error Rate**: Count errors per time period
2. **Identify Trending Issues**: Look for increasing error frequency
3. **Correlate with Actions**: Match errors to user actions

#### Set Up Alerts
1. **Critical Errors**: Monitor for ERROR level messages
2. **Plugin Failures**: Watch for plugin loading failures
3. **IPC Issues**: Monitor IPC communication problems

### Live Debugging Sessions

#### Interactive Debugging
1. **Open Browser DevTools**: Press F12 for client-side debugging
2. **Console Access**: Use browser console for runtime inspection
3. **Network Tab**: Monitor IPC requests and responses
4. **Performance Tab**: Profile application performance

#### Console Commands for Debugging
```javascript
// Check plugin manager state
console.log('Plugin Manager:', window.pluginManager);

// Inspect configuration
console.log('App Config:', window.appConfig);

// Check available services
console.log('Services:', window.serviceRegistry?.getAvailableServices());

// Force log refresh
window.location.reload();
```

## Log Interpretation Guide

### Timestamp Analysis
- **Sequential Timestamps**: Normal operation flow
- **Time Gaps**: Potential blocking operations or delays
- **Timestamp Clustering**: Burst of activity or error cascade

### Component Identification
- **`electron-main`**: Main Electron process operations
- **`client-renderer`**: Browser/renderer process operations
- **`client-[component]`**: Specific component operations

### Message Patterns
- **`[CONSOLE]` prefix**: Client-side console output
- **`[functionName]` prefix**: Specific function context
- **`[pluginId]` prefix**: Plugin-specific operations

### Error Severity Assessment
1. **ERROR**: Immediate action required
2. **WARN**: Monitor and plan resolution
3. **INFO**: Informational, no action needed
4. **DEBUG**: Detailed troubleshooting information

## Best Practices for Debugging

### Proactive Monitoring
1. **Regular Log Reviews**: Check logs periodically for warnings
2. **Error Trend Analysis**: Monitor error frequency over time
3. **Performance Baselines**: Establish normal operation benchmarks
4. **Configuration Validation**: Regularly validate configurations

### Systematic Approach
1. **Document Issues**: Record error messages and reproduction steps
2. **Isolate Variables**: Test with minimal configuration
3. **Verify Fixes**: Confirm resolution with clean tests
4. **Update Documentation**: Record solutions for future reference

### Environment Considerations
1. **Development vs Production**: Different log levels and verbosity
2. **System Resources**: Consider memory and CPU constraints
3. **Network Conditions**: Account for connectivity issues
4. **User Environment**: Different operating systems and configurations

## Advanced Debugging Scenarios

### Plugin Development Debugging
1. **Use Development Build**: Enable full logging and source maps
2. **Hot Reload**: Test changes without full restart
3. **Console Logging**: Add strategic console.log statements
4. **Error Boundaries**: Implement React error boundaries

### Performance Debugging
1. **Profile Startup**: Monitor application initialization time
2. **Memory Usage**: Track memory consumption patterns
3. **IPC Overhead**: Monitor IPC call frequency and timing
4. **Render Performance**: Check React rendering performance

### Integration Debugging
1. **Multi-Plugin Testing**: Test plugin interactions
2. **Configuration Conflicts**: Check for conflicting settings
3. **Service Dependencies**: Verify service availability
4. **Event Flow**: Track event propagation through system

## Getting Help

### Self-Service Debugging
1. **Follow This Guide**: Use the systematic approach outlined
2. **Check Documentation**: Review relevant architecture docs
3. **Search Logs**: Use comprehensive search and filtering
4. **Test Isolation**: Reproduce with minimal configuration

### Escalation Criteria
When to seek additional help:
1. **Critical System Failures**: Application won't start or crashes
2. **Data Loss Risk**: File system or configuration corruption
3. **Security Concerns**: Permission or access control issues
4. **Performance Degradation**: Significant slowdowns or hangs

### Information to Gather
Before seeking help, collect:
1. **Log Exports**: Filtered logs showing the issue
2. **Reproduction Steps**: Exact sequence to trigger the problem
3. **System Information**: OS, Node.js version, application version
4. **Configuration Files**: Relevant configuration that might be involved
5. **Error Messages**: Complete error text and stack traces

### Documentation Updates
After resolving issues:
1. **Update This Guide**: Add new patterns or solutions
2. **Improve Error Messages**: Make errors more descriptive
3. **Add Logging**: Enhance logging for better debugging
4. **Share Solutions**: Document fixes for common issues