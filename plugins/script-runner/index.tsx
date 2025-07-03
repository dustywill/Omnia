import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { Card } from '../../src/ui/components/Card/Card.js';
import { Button } from '../../src/ui/components/Button/Button.js';
import { Input } from '../../src/ui/components/Input/Input.js';
import { Badge } from '../../src/ui/components/Badge/Badge.js';
import { Grid } from '../../src/ui/components/Grid/Grid.js';
// @ts-ignore
import { ScriptRunnerConfigSchema, type ScriptRunnerConfig, type Script } from './config-schema.js';

export type ScriptStatus = 'idle' | 'running' | 'success' | 'error';

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
export { ScriptRunnerConfigSchema as configSchema };

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
      if (!this.validateScriptPath(scriptPath)) {
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

  async getAvailableScripts(): Promise<Script[]> {
    try {
      const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
      const path = await loadNodeModule<typeof import('path')>('path');
      
      const files = await fs.readdir(this.config.scriptsDirectory, { withFileTypes: true });
      const scripts: Script[] = [];
      
      for (const file of files) {
        if (file.isFile() && this.config.allowedExtensions.some((ext: string) => file.name.endsWith(ext))) {
          const scriptPath = path.join(this.config.scriptsDirectory, file.name);
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
      }
      
      return scripts;
    } catch (error) {
      console.error('Failed to scan scripts directory:', error);
      return this.getFallbackScripts();
    }
  }

  validateScriptPath(scriptPath: string): boolean {
    if (this.config.restrictToScriptsDirectory) {
      const path = require('path');
      const normalizedPath = path.normalize(scriptPath);
      const scriptsDir = path.normalize(this.config.scriptsDirectory);
      return normalizedPath.startsWith(scriptsDir);
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
      const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
      const path = await loadNodeModule<typeof import('path')>('path');
      
      await fs.mkdir(this.config.outputDirectory, { recursive: true });
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const scriptName = path.basename(scriptPath, path.extname(scriptPath));
      const outputFile = path.join(this.config.outputDirectory, `${scriptName}_${timestamp}.log`);
      
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
      
      await fs.writeFile(outputFile, logContent);
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
  config: ScriptRunnerConfig;
}

const ScriptRunnerPlugin: React.FC<ScriptRunnerPluginProps> = ({ config }) => {
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
      <Card className="max-w-4xl mx-auto">
        <div className="text-center py-8">
          <p className="text-theme-secondary">Loading scripts...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-theme-primary">Script Runner</h2>
            <p className="text-theme-secondary">
              Execute PowerShell scripts with parameters and view real-time output.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              Shell: {config.defaultShell}
            </Badge>
            <Badge variant="neutral" size="sm">
              {scripts.length} scripts
            </Badge>
            {config.enableService && (
              <Badge variant="success" size="sm">
                Service Active
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            onClick={loadScripts}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Reloading...' : 'Reload Scripts'}
          </Button>
        </div>
      </Card>

      {/* Script Selection */}
      <Card>
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Select Script</h3>
        
        {scripts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-theme-secondary">No scripts found.</p>
            <p className="text-sm text-theme-secondary mt-2">
              Check the scripts directory: {config.scriptsDirectory}
            </p>
          </div>
        ) : (
          <Grid cols={2} gap="md">
            {scripts.map((script) => (
              <div
                key={script.id}
                className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  selectedScript?.id === script.id
                    ? 'border-action bg-action/10'
                    : 'border-theme hover:bg-theme-background'
                }`}
                onClick={() => setSelectedScript(script)}
              >
                <h4 className="font-medium text-theme-primary mb-1">{script.name}</h4>
                <p className="text-sm text-theme-secondary mb-2">{script.description}</p>
                <div className="flex items-center gap-2">
                  <Badge variant="neutral" size="sm">{script.category}</Badge>
                  {script.parameters.length > 0 && (
                    <Badge variant="info" size="sm">
                      {script.parameters.length} params
                    </Badge>
                  )}
                </div>
                <code className="text-xs text-theme-secondary mt-2 block truncate">
                  {script.path}
                </code>
              </div>
            ))}
          </Grid>
        )}
      </Card>

      {/* Script Execution */}
      {selectedScript && (
        <Card>
          <h3 className="text-lg font-semibold text-theme-primary mb-4">
            Execute: {selectedScript.name}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-theme-primary mb-2">
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
                  <p className="text-xs text-theme-secondary mb-1">Expected parameters:</p>
                  <div className="space-y-1">
                    {selectedScript.parameters.map((param: any, index: number) => (
                      <div key={index} className="text-xs">
                        <code className="text-action">{param.name}</code>
                        {param.required && <span className="text-danger ml-1">*</span>}
                        <span className="text-theme-secondary ml-2">({param.type})</span>
                        {param.description && (
                          <span className="text-theme-secondary ml-2">- {param.description}</span>
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
                variant="primary"
                disabled={status === 'running'}
              >
                {status === 'running' ? 'Running...' : 'Execute Script'}
              </Button>
              
              <div className="flex items-center gap-2">
                {status === 'running' && (
                  <Badge variant="warning" size="sm">Running...</Badge>
                )}
                {status === 'success' && (
                  <Badge variant="success" size="sm">✓ Success</Badge>
                )}
                {status === 'error' && (
                  <Badge variant="danger" size="sm">✗ Error</Badge>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Output */}
      {output && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-theme-primary">Output</h3>
            <Button
              onClick={handleCopyOutput}
              variant="secondary"
              size="sm"
            >
              Copy Output
            </Button>
          </div>
          <pre className="bg-theme-background border border-theme rounded-lg p-4 max-h-80 overflow-auto text-xs font-mono whitespace-pre-wrap">
            {output}
          </pre>
        </Card>
      )}

      {/* Execution History */}
      {config.showExecutionHistory && executionHistory.length > 0 && (
        <Card>
          <h3 className="text-lg font-semibold text-theme-primary mb-4">Execution History</h3>
          <div className="space-y-3">
            {executionHistory.slice(0, 5).map((execution, index) => (
              <div key={index} className="p-3 border border-theme rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-theme-primary">
                    {execution.scriptName}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={execution.success ? 'success' : 'danger'}
                      size="sm"
                    >
                      {execution.success ? 'Success' : 'Failed'}
                    </Badge>
                    <span className="text-xs text-theme-secondary">
                      {execution.duration}ms
                    </span>
                  </div>
                </div>
                <div className="text-xs text-theme-secondary">
                  {execution.timestamp ? new Date(execution.timestamp).toLocaleString() : 'Unknown time'}
                </div>
                {execution.parameters && execution.parameters.length > 0 && (
                  <div className="text-xs text-theme-secondary mt-1">
                    Params: {execution.parameters.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Configuration Info */}
      <Card>
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Configuration</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-theme-secondary">Scripts Directory:</span>
            <div className="font-mono text-theme-primary">{config.scriptsDirectory}</div>
          </div>
          <div>
            <span className="text-theme-secondary">Output Directory:</span>
            <div className="font-mono text-theme-primary">{config.outputDirectory}</div>
          </div>
          <div>
            <span className="text-theme-secondary">Default Shell:</span>
            <div className="text-theme-primary">{config.defaultShell}</div>
          </div>
          <div>
            <span className="text-theme-secondary">Timeout:</span>
            <div className="text-theme-primary">{config.timeout}s</div>
          </div>
          <div>
            <span className="text-theme-secondary">Max Concurrent:</span>
            <div className="text-theme-primary">{config.maxConcurrentScripts}</div>
          </div>
          <div>
            <span className="text-theme-secondary">Service:</span>
            <div className="text-theme-primary">
              {config.enableService ? 'Enabled' : 'Disabled'}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ScriptRunnerPlugin;