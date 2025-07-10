# Core Services Usage Examples

This document provides concrete examples of how to use each core service in plugins.

## Service Access Pattern

```typescript
import { useService } from '../../../src/core/enhanced-plugin-manager';

// In plugin component
export default function PluginComponent() {
  const fileSystemService = useService('FileSystemService');
  const httpClientService = useService('HttpClientService');
  const progressService = useService('ProgressTrackingService');
  const scriptService = useService('ScriptExecutionService');

  // Use services...
}
```

## FileSystemService Examples

### Basic File Operations
```typescript
const fileSystemService = useService('FileSystemService');

// Read file
const content = await fileSystemService.readFile('/path/to/file.txt');

// Write file
await fileSystemService.writeFile('/path/to/output.txt', 'content');

// Create directory
await fileSystemService.createDirectory('/path/to/new/dir');

// Delete file
await fileSystemService.deleteFile('/path/to/file.txt');
```

### Directory Scanning
```typescript
// Scan directory with pattern
const files = await fileSystemService.scanDirectory('/path/to/scan', '**/*.ts');

// Scan with options
const files = await fileSystemService.scanDirectory('/path/to/scan', {
  pattern: '**/*.{js,ts}',
  maxDepth: 3,
  includeHidden: false
});
```

### Batch Operations
```typescript
// Read multiple files
const files = ['/file1.txt', '/file2.txt', '/file3.txt'];
const contents = await fileSystemService.readFiles(files);

// Write multiple files
const operations = [
  { path: '/out1.txt', content: 'content1' },
  { path: '/out2.txt', content: 'content2' }
];
await fileSystemService.writeFiles(operations);
```

## HttpClientService Examples

### Basic HTTP Requests
```typescript
const httpClientService = useService('HttpClientService');

// GET request
const data = await httpClientService.get('https://api.example.com/data');

// POST request
const result = await httpClientService.post('https://api.example.com/submit', {
  key: 'value'
});
```

### Authentication
```typescript
// Bearer token
httpClientService.setAuthentication('bearer', 'your-token-here');

// Basic auth
httpClientService.setAuthentication('basic', {
  username: 'user',
  password: 'pass'
});

// Custom auth
httpClientService.setAuthentication('custom', {
  'X-API-Key': 'api-key-here'
});
```

### Progress and Cancellation
```typescript
// With progress tracking
const controller = new AbortController();
const response = await httpClientService
  .withProgress((progress) => {
    console.log(`Downloaded: ${progress.loaded}/${progress.total}`);
  })
  .withCancellation(controller.signal)
  .get('https://example.com/large-file');

// Cancel request
controller.abort();
```

## ProgressTrackingService Examples

### Basic Progress Tracking
```typescript
const progressService = useService('ProgressTrackingService');

// Create progress tracker
const progressId = 'my-operation';
const phases = ['init', 'process', 'finalize'];
const tracker = progressService.createProgress(progressId, phases);

// Update progress
progressService.updateProgress(progressId, 'init', 25);
progressService.updateProgress(progressId, 'process', 75);
progressService.updateProgress(progressId, 'finalize', 100);

// Complete
progressService.completeProgress(progressId);
```

### Progress Events
```typescript
// Listen to progress events
progressService.onProgress((event) => {
  console.log(`${event.id}: ${event.phase} - ${event.percentage}%`);
});

// Listen to completion
progressService.onComplete((id) => {
  console.log(`Operation ${id} completed`);
});

// Listen to cancellation
progressService.onCancel((id) => {
  console.log(`Operation ${id} was cancelled`);
});
```

### Hierarchical Progress
```typescript
// Create parent progress
const parentId = 'main-operation';
const parentTracker = progressService.createProgress(parentId, ['phase1', 'phase2']);

// Create child progress
const childId = 'sub-operation';
const childTracker = progressService.createProgress(childId, ['step1', 'step2'], {
  parent: parentId
});

// Child progress contributes to parent
progressService.updateProgress(childId, 'step1', 50); // Updates parent too
```

## ScriptExecutionService Examples

### Basic Script Execution
```typescript
const scriptService = useService('ScriptExecutionService');

// Execute PowerShell script
const result = await scriptService.executePowerShell('Get-Process', {
  timeout: 30000
});

// Execute CMD command
const result = await scriptService.executeScript('dir', {
  shell: 'cmd',
  workingDirectory: 'C:\\temp'
});

// Execute Bash script
const result = await scriptService.executeScript('ls -la', {
  shell: 'bash',
  timeout: 10000
});
```

### Script with Parameters
```typescript
// Script with parameters
const script = 'param($Name) Write-Host "Hello $Name"';
const params = { Name: 'World' };

// Validate parameters
const isValid = scriptService.validateParameters(params, {
  Name: { type: 'string', required: true }
});

if (isValid) {
  const result = await scriptService.executePowerShell(script, {
    parameters: params
  });
}
```

### Output Streaming
```typescript
// Stream output
scriptService.streamOutput((output) => {
  console.log('Script output:', output);
});

const result = await scriptService.executePowerShell('Get-Process');
const allOutput = scriptService.captureOutput();
```

### Security and Validation
```typescript
// Validate script before execution
const script = 'Get-Process';
const securityResult = scriptService.validateScript(script);

if (securityResult.isValid) {
  // Enable sandbox
  scriptService.setSandbox(true, {
    maxMemoryMB: 256,
    maxExecutionTime: 30000
  });
  
  const result = await scriptService.executePowerShell(script);
}
```

## Integration Examples

### File Processing with Progress
```typescript
async function processFiles(filePaths: string[]) {
  const fileSystemService = useService('FileSystemService');
  const progressService = useService('ProgressTrackingService');
  
  const progressId = 'file-processing';
  const tracker = progressService.createProgress(progressId, ['read', 'process', 'write']);
  
  try {
    // Read files
    progressService.updateProgress(progressId, 'read', 0);
    const contents = await fileSystemService.readFiles(filePaths);
    progressService.updateProgress(progressId, 'read', 100);
    
    // Process files
    progressService.updateProgress(progressId, 'process', 0);
    const processed = contents.map(processContent);
    progressService.updateProgress(progressId, 'process', 100);
    
    // Write results
    progressService.updateProgress(progressId, 'write', 0);
    await fileSystemService.writeFiles(processed.map((content, i) => ({
      path: `/output/file-${i}.txt`,
      content
    })));
    progressService.updateProgress(progressId, 'write', 100);
    
    progressService.completeProgress(progressId);
  } catch (error) {
    progressService.cancelProgress(progressId);
    throw error;
  }
}
```

### HTTP Data Fetching with File Storage
```typescript
async function fetchAndStore(url: string, outputPath: string) {
  const httpClientService = useService('HttpClientService');
  const fileSystemService = useService('FileSystemService');
  const progressService = useService('ProgressTrackingService');
  
  const progressId = 'fetch-and-store';
  const tracker = progressService.createProgress(progressId, ['fetch', 'store']);
  
  try {
    // Fetch data
    progressService.updateProgress(progressId, 'fetch', 0);
    const data = await httpClientService
      .withProgress((progress) => {
        const percentage = (progress.loaded / progress.total) * 100;
        progressService.updateProgress(progressId, 'fetch', percentage);
      })
      .get(url);
    
    // Store data
    progressService.updateProgress(progressId, 'store', 0);
    await fileSystemService.writeFile(outputPath, JSON.stringify(data, null, 2));
    progressService.updateProgress(progressId, 'store', 100);
    
    progressService.completeProgress(progressId);
    return data;
  } catch (error) {
    progressService.cancelProgress(progressId);
    throw error;
  }
}
```

### Script Execution with File Operations
```typescript
async function executeScriptWithFiles(scriptPath: string, outputDir: string) {
  const fileSystemService = useService('FileSystemService');
  const scriptService = useService('ScriptExecutionService');
  const progressService = useService('ProgressTrackingService');
  
  const progressId = 'script-with-files';
  const tracker = progressService.createProgress(progressId, ['read', 'execute', 'save']);
  
  try {
    // Read script
    progressService.updateProgress(progressId, 'read', 0);
    const scriptContent = await fileSystemService.readFile(scriptPath);
    progressService.updateProgress(progressId, 'read', 100);
    
    // Execute script
    progressService.updateProgress(progressId, 'execute', 0);
    const result = await scriptService.executePowerShell(scriptContent, {
      workingDirectory: outputDir
    });
    progressService.updateProgress(progressId, 'execute', 100);
    
    // Save output
    progressService.updateProgress(progressId, 'save', 0);
    await fileSystemService.createDirectory(outputDir);
    await fileSystemService.writeFile(
      `${outputDir}/output.txt`,
      result.stdout
    );
    progressService.updateProgress(progressId, 'save', 100);
    
    progressService.completeProgress(progressId);
    return result;
  } catch (error) {
    progressService.cancelProgress(progressId);
    throw error;
  }
}
```

## Error Handling Patterns

### Service Error Handling
```typescript
try {
  const result = await fileSystemService.readFile('/nonexistent/file.txt');
} catch (error) {
  if (error.code === 'ENOENT') {
    console.log('File not found');
  } else if (error.code === 'EACCES') {
    console.log('Permission denied');
  } else {
    console.log('Unexpected error:', error.message);
  }
}
```

### Progress Error Handling
```typescript
const progressId = 'error-prone-operation';
const tracker = progressService.createProgress(progressId, ['step1', 'step2']);

try {
  // Risky operation
  await riskyOperation();
  progressService.completeProgress(progressId);
} catch (error) {
  progressService.cancelProgress(progressId);
  // Handle error
}
```

## Performance Optimization

### Batch Operations
```typescript
// Instead of multiple individual calls
const results = [];
for (const file of files) {
  const content = await fileSystemService.readFile(file);
  results.push(content);
}

// Use batch operations
const results = await fileSystemService.readFiles(files);
```

### Caching
```typescript
// HTTP client has built-in caching
const httpClientService = useService('HttpClientService');

// First call - fetches from server
const data1 = await httpClientService.get('https://api.example.com/data');

// Second call - uses cache
const data2 = await httpClientService.get('https://api.example.com/data');
```

### Concurrent Operations
```typescript
// Run operations concurrently
const [file1, file2, file3] = await Promise.all([
  fileSystemService.readFile('/file1.txt'),
  fileSystemService.readFile('/file2.txt'),
  fileSystemService.readFile('/file3.txt')
]);
```