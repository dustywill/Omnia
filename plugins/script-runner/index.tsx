import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
// Using simple div wrappers instead of Card components for now
const Card = ({ children, ...props }: any) => <div className="border rounded-lg p-4" {...props}>{children}</div>;
const CardHeader = ({ children, ...props }: any) => <div className="pb-2" {...props}>{children}</div>;
const CardTitle = ({ children, ...props }: any) => <h3 className="font-semibold" {...props}>{children}</h3>;
const CardDescription = ({ children, ...props }: any) => <p className="text-sm text-gray-600" {...props}>{children}</p>;
const CardContent = ({ children, ...props }: any) => <div {...props}>{children}</div>;
import { Button } from '../../src/ui/components/ui/button.js';
import { Input } from '../../src/ui/components/ui/input.js';
import { Badge } from '../../src/ui/components/ui/badge.js';
// @ts-ignore
import { createSchemas } from './config-schema.js';

export type ScriptStatus = 'idle' | 'running' | 'success' | 'error';

// Type definitions (these will be inferred from zod schemas)
export type ScriptRunnerConfig = {
  scriptsDirectory: string;
  outputDirectory: string;
  defaultShell: 'powershell' | 'pwsh' | 'cmd';
  timeout: number;
  maxConcurrentScripts: number;
  showAdvancedOptions: boolean;
  autoSaveOutput: boolean;
  showExecutionHistory: boolean;
  allowedExtensions: string[];
  restrictToScriptsDirectory: boolean;
  maxOutputLength: number;
  preserveOutputFormatting: boolean;
  enableService: boolean;
  serviceApiKey?: string;
};

export type Script = {
  id: string;
  name: string;
  description: string;
  path: string;
  category: string;
  parameters: Array<{
    name: string;
    description: string;
    required: boolean;
    type: 'string' | 'number' | 'boolean';
    defaultValue?: string;
  }>;
};

export type ExecutionResult = {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  scriptName?: string;
  scriptPath?: string;
  parameters?: string[];
  timestamp?: string;
};

// Default configuration
export const defaultConfig: ScriptRunnerConfig = {
  scriptsDirectory: 'scripts',
  outputDirectory: 'output/script-runner',
  defaultShell: 'powershell',
  timeout: 300,
  maxConcurrentScripts: 3,
  showAdvancedOptions: false,
  autoSaveOutput: true,
  showExecutionHistory: true,
  allowedExtensions: ['.ps1', '.bat', '.cmd'],
  restrictToScriptsDirectory: true,
  maxOutputLength: 100000,
  preserveOutputFormatting: true,
  enableService: true
};

// Configuration schema export for the plugin system
// Export config schema factory function
export const configSchema = async () => {
  const { ScriptRunnerConfigSchema } = await createSchemas();
  return ScriptRunnerConfigSchema;
};

// Service implementation for script execution
export class ScriptExecutionService {
  private config: ScriptRunnerConfig;

  constructor(config: ScriptRunnerConfig) {
    this.config = config;
  }

  async executeScript(scriptPath: string, parameters: string[] = []): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      // Validate script path
      if (!(await this.validateScriptPath(scriptPath))) {
        throw new Error('Invalid script path or not allowed');
      }

      const { spawn } = await loadNodeModule<typeof import('child_process')>('child_process');
      
      const shell = this.config.defaultShell;
      const args = shell === 'powershell' || shell === 'pwsh' 
        ? ['-File', scriptPath, ...parameters]
        : ['/c', scriptPath, ...parameters];
      
      const command = shell === 'cmd' ? 'cmd' : shell;
      
      return new Promise((resolve) => {
        let output = '';
        let errorOutput = '';
        
        const child = spawn(command, args, {
          cwd: this.config.scriptsDirectory,
          timeout: this.config.timeout * 1000
        });
        
        child.stdout?.on('data', (data) => {
          output += data.toString();
        });
        
        child.stderr?.on('data', (data) => {
          errorOutput += data.toString();
        });
        
        child.on('close', (code) => {
          const duration = Date.now() - startTime;
          const result: ExecutionResult = {
            success: code === 0,
            output: output.length > this.config.maxOutputLength 
              ? output.substring(0, this.config.maxOutputLength) + '\n... (output truncated)'
              : output,
            error: errorOutput || undefined,
            exitCode: code || 0,
            duration
          };
          
          // Auto-save output if enabled
          if (this.config.autoSaveOutput) {
            this.saveExecutionResult(scriptPath, result).catch(console.error);
          }
          
          resolve(result);
        });
        
        child.on('error', (error) => {
          const duration = Date.now() - startTime;
          resolve({
            success: false,
            output: '',
            error: error.message,
            exitCode: -1,
            duration
          });
        });
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      return {
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        duration
      };
    }
  }

  // Helper function to access Electron API
  private getElectronAPI(): any {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      return (window as any).electronAPI;
    }
    return null;
  }

  async getAvailableScripts(): Promise<Script[]> {
    try {
      const electronAPI = this.getElectronAPI();
      
      if (!electronAPI) {
        console.warn('[ScriptRunner] Electron API not available, using fallback scripts');
        return this.getFallbackScripts();
      }
      
      const path = await loadNodeModule<typeof import('path')>('path');
      
      // Try to create scripts directory if it doesn't exist
      try {
        await electronAPI.mkdir(this.config.scriptsDirectory, { recursive: true });
      } catch (mkdirError) {
        // Directory might already exist, continue
      }
      
      const files = await electronAPI.readdir(this.config.scriptsDirectory, { withFileTypes: true });
      const scripts: Script[] = [];
      
      for (const file of files) {
        try {
          // Use the isFile property from the enhanced readdir response
          const isFile = file.isFile;
            
          if (isFile && this.config.allowedExtensions.some((ext: string) => file.name.endsWith(ext))) {
            const scriptPath = await electronAPI.join(this.config.scriptsDirectory, file.name);
            const id = path.basename(file.name, path.extname(file.name));
            
            scripts.push({
              id,
              name: this.formatScriptName(id),
              description: `Script: ${file.name}`,
              path: scriptPath,
              category: 'discovered',
              parameters: []
            });
          }
        } catch (fileError) {
          console.warn(`[ScriptRunner] Error processing file ${file.name}:`, fileError);
          continue;
        }
      }
      
      // If no scripts found, add some sample scripts
      if (scripts.length === 0) {
        return this.getFallbackScripts();
      }
      
      return scripts;
    } catch (error) {
      console.error('Failed to scan scripts directory:', error);
      return this.getFallbackScripts();
    }
  }

  async validateScriptPath(scriptPath: string): Promise<boolean> {
    if (this.config.restrictToScriptsDirectory) {
      try {
        const path = await loadNodeModule<typeof import('path')>('path');
        const normalizedPath = path.normalize(scriptPath);
        const scriptsDir = path.normalize(this.config.scriptsDirectory);
        return normalizedPath.startsWith(scriptsDir);
      } catch (error) {
        console.warn('[ScriptRunner] Failed to validate script path, allowing:', error);
        return this.config.allowedExtensions.some((ext: string) => scriptPath.endsWith(ext));
      }
    }
    
    return this.config.allowedExtensions.some((ext: string) => scriptPath.endsWith(ext));
  }

  private formatScriptName(id: string): string {
    return id.split(/[-_]/).map(word => 
      word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
  }

  private async saveExecutionResult(scriptPath: string, result: ExecutionResult): Promise<void> {
    try {
      const electronAPI = this.getElectronAPI();
      
      if (!electronAPI) {
        console.warn('[ScriptRunner] Electron API not available, skipping save execution result');
        return;
      }
      
      const path = await loadNodeModule<typeof import('path')>('path');
      
      await electronAPI.mkdir(this.config.outputDirectory, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const scriptName = path.basename(scriptPath, path.extname(scriptPath));
      const outputFile = await electronAPI.join(this.config.outputDirectory, `${scriptName}_${timestamp}.log`);
      
      const logContent = [
        `Script: ${scriptPath}`,
        `Executed: ${new Date().toISOString()}`,
        `Duration: ${result.duration}ms`,
        `Exit Code: ${result.exitCode}`,
        `Success: ${result.success}`,
        `\n--- OUTPUT ---`,
        result.output,
        result.error ? `\n--- ERROR ---\n${result.error}` : ''
      ].join('\n');
      
      await electronAPI.writeFile(outputFile, logContent);
    } catch (error) {
      console.error('Failed to save execution result:', error);
    }
  }

  getFallbackScripts(): Script[] {
    return [
      {
        id: 'hello-world',
        name: 'Hello World',
        description: 'A simple greeting script',
        path: 'scripts/hello.ps1',
        category: 'sample',
        parameters: []
      },
      {
        id: 'system-info',
        name: 'System Information',
        description: 'Displays system information',
        path: 'scripts/sysinfo.ps1',
        category: 'system',
        parameters: []
      },
      {
        id: 'backup-files',
        name: 'Backup Files',
        description: 'Creates backup of specified directory',
        path: 'scripts/backup.ps1',
        category: 'utility',
        parameters: [
          { name: 'source', description: 'Source directory', required: true, type: 'string' },
          { name: 'destination', description: 'Backup destination', required: true, type: 'string' }
        ]
      }
    ];
  }
}

// Main configured plugin component
interface ScriptRunnerPluginProps {
  config?: ScriptRunnerConfig;
}

const ScriptRunnerPlugin: React.FC<ScriptRunnerPluginProps> = ({ config: providedConfig }) => {
  // Use provided config or fall back to default
  const config = providedConfig || defaultConfig;
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [status, setStatus] = useState<ScriptStatus>('idle');
  const [output, setOutput] = useState<string>('');
  const [params, setParams] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [serviceInstance] = useState(() => new ScriptExecutionService(config));

  useEffect(() => {
    loadScripts();
  }, [config.scriptsDirectory]);

  const loadScripts = async () => {
    try {
      setLoading(true);
      const discoveredScripts = await serviceInstance.getAvailableScripts();
      setScripts(discoveredScripts);
    } catch (error) {
      console.error('Failed to load scripts:', error);
      setScripts(serviceInstance.getFallbackScripts());
    } finally {
      setLoading(false);
    }
  };

  const runScript = async (script: Script, parameters: string[]) => {
    setStatus('running');
    setOutput('Starting script execution...\n');
    
    try {
      const result = await serviceInstance.executeScript(script.path, parameters);
      
      setOutput(result.output);
      setStatus(result.success ? 'success' : 'error');
      
      // Add to execution history if enabled
      if (config.showExecutionHistory) {
        setExecutionHistory(prev => [{
          ...result,
          scriptName: script.name,
          scriptPath: script.path,
          parameters,
          timestamp: new Date().toISOString()
        }, ...prev.slice(0, 9)]);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setOutput(`Error: ${errorMessage}\n`);
      setStatus('error');
    }
  };

  const handleRunScript = () => {
    if (!selectedScript) return;
    
    const parameters = params.trim() ? params.split(' ') : [];
    runScript(selectedScript, parameters);
  };

  const handleCopyOutput = async () => {
    try {
      await navigator.clipboard.writeText(output);
      alert('Output copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Loading scripts...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Script Runner</CardTitle>
              <CardDescription>
                Execute PowerShell scripts with parameters and view real-time output.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                Shell: {config.defaultShell}
              </Badge>
              <Badge variant="outline">
                {scripts.length} scripts
              </Badge>
              {config.enableService && (
                <Badge variant="default">
                  Service Active
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Button
            onClick={loadScripts}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Reloading...' : 'Reload Scripts'}
          </Button>
        </CardContent>
      </Card>

      {/* Script Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Script</CardTitle>
        </CardHeader>
        <CardContent>
          {scripts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No scripts found.</p>
              <p className="text-sm text-muted-foreground mt-2">
                Check the scripts directory: {config.scriptsDirectory}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {scripts.map((script) => (
                <div
                  key={script.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedScript?.id === script.id
                      ? 'border-primary bg-muted'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSelectedScript(script)}
                >
                  <h4 className="font-medium mb-1">{script.name}</h4>
                  <p className="text-sm text-muted-foreground mb-2">{script.description}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{script.category}</Badge>
                    {script.parameters.length > 0 && (
                      <Badge variant="outline">
                        {script.parameters.length} params
                      </Badge>
                    )}
                  </div>
                  <code className="text-xs text-muted-foreground mt-2 block truncate">
                    {script.path}
                  </code>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Script Execution */}
      {selectedScript && (
        <Card>
          <CardHeader>
            <CardTitle>Execute: {selectedScript.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Parameters (space-separated):
              </label>
              <Input
                value={params}
                onChange={(e) => setParams(e.target.value)}
                placeholder="param1 param2 param3"
                disabled={status === 'running'}
              />
              {selectedScript.parameters.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-muted-foreground mb-1">Expected parameters:</p>
                  <div className="space-y-1">
                    {selectedScript.parameters.map((param: any, index: number) => (
                      <div key={index} className="text-xs">
                        <code className="text-primary">{param.name}</code>
                        {param.required && <span className="text-destructive ml-1">*</span>}
                        <span className="text-muted-foreground ml-2">({param.type})</span>
                        {param.description && (
                          <span className="text-muted-foreground ml-2">- {param.description}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={handleRunScript}
                disabled={status === 'running'}
              >
                {status === 'running' ? 'Running...' : 'Execute Script'}
              </Button>
              
              <div className="flex items-center gap-2">
                {status === 'running' && (
                  <Badge variant="secondary">Running...</Badge>
                )}
                {status === 'success' && (
                  <Badge variant="default">✓ Success</Badge>
                )}
                {status === 'error' && (
                  <Badge variant="destructive">✗ Error</Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Output */}
      {output && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Output</CardTitle>
              <Button
                onClick={handleCopyOutput}
                variant="secondary"
                size="sm"
              >
                Copy Output
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <pre className="bg-muted border rounded-lg p-4 max-h-80 overflow-auto text-xs font-mono whitespace-pre-wrap">
              {output}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Execution History */}
      {config.showExecutionHistory && executionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {executionHistory.slice(0, 5).map((execution, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {execution.scriptName}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={execution.success ? 'default' : 'destructive'}
                    >
                      {execution.success ? 'Success' : 'Failed'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {execution.duration}ms
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  {execution.timestamp ? new Date(execution.timestamp).toLocaleString() : 'Unknown time'}
                </div>
                {execution.parameters && execution.parameters.length > 0 && (
                  <div className="text-xs text-muted-foreground mt-1">
                    Params: {execution.parameters.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Scripts Directory:</span>
            <div className="font-mono">{config.scriptsDirectory}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Output Directory:</span>
            <div className="font-mono">{config.outputDirectory}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Default Shell:</span>
            <div>{config.defaultShell}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Timeout:</span>
            <div>{config.timeout}s</div>
          </div>
          <div>
            <span className="text-muted-foreground">Max Concurrent:</span>
            <div>{config.maxConcurrentScripts}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Service:</span>
            <div>
              {config.enableService ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ScriptRunnerPlugin;
