# Plugin Migration Patterns

This document provides specific patterns for migrating plugins from custom implementations to core services.

## Migration Overview

**Goal**: Replace custom plugin implementations with core services to eliminate 60%+ code duplication.

**Core Services Available**:
- `FileSystemService` - File operations with security validation
- `HttpClientService` - HTTP requests with auth, retry, progress
- `ProgressTrackingService` - Event-driven progress updates
- `ScriptExecutionService` - Multi-shell script execution with security

## Common Migration Patterns

### 1. File System Operations Migration

**Before (Custom Implementation)**:
```typescript
import * as fs from 'fs';
import * as path from 'path';

// Custom file operations
const ensureDirectoryExists = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const readFileContent = (filePath: string): string => {
  return fs.readFileSync(filePath, 'utf8');
};
```

**After (Core Service)**:
```typescript
import { useService } from '../../../src/core/enhanced-plugin-manager';

const fileSystemService = useService('FileSystemService');

// Using core service
await fileSystemService.createDirectory(dirPath);
const content = await fileSystemService.readFile(filePath);
```

### 2. HTTP Client Migration

**Before (Custom Axios)**:
```typescript
import axios from 'axios';

const httpClient = axios.create({
  timeout: 30000,
  headers: { 'Authorization': `Bearer ${token}` }
});

const response = await httpClient.get(url);
```

**After (Core Service)**:
```typescript
const httpClientService = useService('HttpClientService');

httpClientService.setAuthentication('bearer', token);
const response = await httpClientService.get(url);
```

### 3. Progress Tracking Migration

**Before (Custom Progress)**:
```typescript
const [progress, setProgress] = useState({ phase: '', percentage: 0 });

const updateProgress = (phase: string, percentage: number) => {
  setProgress({ phase, percentage, status: 'in-progress' });
  onProgress?.({ phase, percentage });
};
```

**After (Core Service)**:
```typescript
const progressService = useService('ProgressTrackingService');

const progressId = 'plugin-operation';
const tracker = progressService.createProgress(progressId, ['phase1', 'phase2']);
progressService.updateProgress(progressId, 'phase1', 50);
```

### 4. Script Execution Migration

**Before (Custom Execution)**:
```typescript
import { exec } from 'child_process';

const executeScript = (script: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    exec(script, (error, stdout, stderr) => {
      if (error) reject(error);
      else resolve(stdout);
    });
  });
};
```

**After (Core Service)**:
```typescript
const scriptService = useService('ScriptExecutionService');

const result = await scriptService.executeScript(script, {
  shell: 'powershell',
  timeout: 30000
});
```

## Plugin-Specific Migration Guides

### Script Runner Plugin Migration

**Current Issues**:
- Custom script execution logic in `plugins/script-runner/index.tsx`
- Manual parameter handling and validation
- Custom progress tracking for script execution

**Migration Steps**:
1. Replace custom execution with `ScriptExecutionService`
2. Use `ProgressTrackingService` for execution progress
3. Update parameter handling to use service validation
4. Test all script types (PowerShell, CMD, Bash)

**Key Files**:
- `plugins/script-runner/index.tsx` - Main plugin file
- `plugins/script-runner/plugin.json5` - Add service dependencies

### As-Built Documenter Plugin Migration

**Current Issues**:
- Custom axios HTTP client implementation
- Custom file system operations
- Custom progress tracking for multi-phase operations

**Migration Steps**:
1. Replace axios with `HttpClientService`
2. Replace fs operations with `FileSystemService`
3. Use `ProgressTrackingService` for document generation progress
4. Update authentication handling to use service methods

**Key Files**:
- `plugins/as-built-documenter/index.tsx` - Main plugin file
- Look for custom HTTP client and file operations

### Context Generator Plugin Migration

**Current Issues**:
- Custom file system scanning and operations
- Custom progress tracking for file processing
- Manual directory traversal logic

**Migration Steps**:
1. Replace fs operations with `FileSystemService`
2. Use `ProgressTrackingService` for scanning progress
3. Update directory scanning to use service methods
4. Test with large directory structures

**Key Files**:
- `plugins/context-generator/index.tsx` - Main plugin file
- Focus on file scanning and processing logic

## Service Integration Requirements

### Plugin Manifest Updates

Add service dependencies to `plugin.json5`:
```json5
{
  "id": "plugin-name",
  "name": "Plugin Name",
  "version": "1.0.0",
  "permissions": {
    "services": [
      "FileSystemService",
      "HttpClientService", 
      "ProgressTrackingService",
      "ScriptExecutionService"
    ]
  }
}
```

### Service Access Pattern

```typescript
import { useService } from '../../../src/core/enhanced-plugin-manager';

// In plugin component
export default function PluginComponent() {
  const fileSystemService = useService('FileSystemService');
  const httpClientService = useService('HttpClientService');
  const progressService = useService('ProgressTrackingService');
  const scriptService = useService('ScriptExecutionService');

  // Use services in plugin logic
}
```

## Testing Migration

### Before Migration Testing
1. Document current plugin functionality
2. Create test cases for all plugin features
3. Record expected behavior and outputs

### After Migration Testing
1. Test all plugin functionality works identically
2. Verify no performance regressions
3. Test error handling and edge cases
4. Validate security improvements

### Rollback Plan
1. Keep original plugin implementation as backup
2. Use git branches for migration work
3. Have rollback procedure documented
4. Test rollback process before starting

## Common Migration Issues

### Issue 1: Async/Await Conversion
- Core services use async/await patterns
- May need to update plugin logic to handle promises
- Solution: Convert synchronous operations to async

### Issue 2: Error Handling Changes
- Core services have standardized error handling
- Plugin error handling may need updates
- Solution: Use service error patterns

### Issue 3: Progress Event Integration
- Core services use event-driven progress
- Plugin UI may need updates for new progress events
- Solution: Subscribe to progress events from services

### Issue 4: Permission Validation
- Core services have security validation
- Some operations may be restricted
- Solution: Ensure plugin has proper permissions

## Success Criteria

### Per-Plugin Migration Success
- [ ] All custom implementations replaced with core services
- [ ] No functionality regressions
- [ ] Performance maintained or improved
- [ ] Error handling works correctly
- [ ] Progress tracking integrated properly

### Overall Migration Success
- [ ] 60%+ reduction in duplicated code achieved
- [ ] All plugins using standardized service patterns
- [ ] No critical bugs introduced
- [ ] Plugin loading and execution works correctly
- [ ] Service registry integration complete

## Next Steps After Migration

1. **Code Cleanup** - Remove duplicated code and unused imports
2. **Documentation Updates** - Update plugin documentation for service usage
3. **Performance Testing** - Validate performance improvements
4. **Security Review** - Ensure security improvements are working
5. **Developer Documentation** - Update plugin development guides