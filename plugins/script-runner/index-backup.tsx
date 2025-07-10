import React, { useState, useEffect, useCallback } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { Card } from '../../src/ui/components/Card/Card.js';
import { Button } from '../../src/ui/components/Button/Button.js';
import { Input } from '../../src/ui/components/Input/Input.js';
import { Badge } from '../../src/ui/components/Badge/Badge.js';
import { Grid } from '../../src/ui/components/Grid/Grid.js';
import { SchemaForm } from '../../src/ui/components/SchemaForm/SchemaForm.js';
import { configPersistence } from '../../src/core/config-persistence.js';
import { useService } from '../../src/hooks/index.js';
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

export type ConfiguredScript = {
  id: string;
  name: string;
  description: string;
  scriptPath: string;
  group: string;
  parameters: Record<string, any>;
  customParameters: Array<{
    name: string;
    description: string;
    required: boolean;
    type: 'string' | 'number' | 'boolean';
    defaultValue?: any;
  }>;
  shell?: 'powershell' | 'pwsh' | 'cmd';
  timeout?: number;
  enabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type ExecutionResult = {
  id: string;
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  duration: number;
  scriptPath: string;
  parameters: Record<string, any>;
  shell: string;
  cwd: string;
  startTime: Date;
  endTime: Date;
  outputLength: number;
  resourceUsage?: {
    maxMemory: number;
    cpuTime: number;
    diskIO: number;
  };
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

// Service utility functions for backward compatibility
export class ScriptServiceHelper {
  private config: ScriptRunnerConfig;
  private serviceCall: any;

  constructor(config: ScriptRunnerConfig, serviceCall: any) {
    this.config = config;
    this.serviceCall = serviceCall;
  }

  async executeScript(scriptPath: string, parameters: string[] = []): Promise<ExecutionResult> {
    try {
      // Convert array parameters to object format expected by core service
      const parameterObject: Record<string, any> = {};
      
      // Simple parameter handling - if parameters are provided as array, use them positionally
      parameters.forEach((param, index) => {
        parameterObject[`param${index + 1}`] = param;
      });

      // Call the core ScriptExecutionService through service registry
      const result = await this.serviceCall(
        'script-execution',
        '1.0.0',
        'executeScript',
        [
          scriptPath,
          {
            shell: this.config.defaultShell,
            cwd: this.config.scriptsDirectory,
            timeout: this.config.timeout,
            parameters: parameterObject
          }
        ]
      );
      
      return result as ExecutionResult;
    } catch (error) {
      // Return error result in expected format
      return {
        id: `error_${Date.now()}`,
        success: false,
        output: '',
        error: error instanceof Error ? error.message : 'Unknown error',
        exitCode: -1,
        duration: 0,
        scriptPath,
        parameters: {},
        shell: this.config.defaultShell,
        cwd: this.config.scriptsDirectory || '',
        startTime: new Date(),
        endTime: new Date(),
        outputLength: 0
      };
    }
  }

  // Helper function to access Electron API
  public getElectronAPI(): any {
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
        const electronAPI = this.getElectronAPI();
        
        if (!electronAPI) {
          console.warn('[ScriptRunner] Electron API not available, using simple extension check');
          return this.config.allowedExtensions.some((ext: string) => scriptPath.endsWith(ext));
        }
        
        // Use Electron API to validate path
        const isValid = await electronAPI.validateScriptPath(scriptPath, this.config.scriptsDirectory);
        return isValid;
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
  serviceRegistry?: any;
  settingsManager?: any;
}

const ScriptRunnerPlugin: React.FC<ScriptRunnerPluginProps> = (props) => {
  // Use provided config or fall back to default
  const config = props?.config || defaultConfig;
  
  // Use service registry to access core ScriptExecutionService
  const serviceHook = useService({
    pluginId: 'script-runner',
    permissions: ['system:exec', 'filesystem:read', 'filesystem:write'],
    serviceRegistry: props?.serviceRegistry || { 
      getAvailableServices: () => [], 
      callService: async () => { 
        throw new Error('Service registry not available'); 
      } 
    },
    eventBus: { 
      subscribe: () => {}, 
      unsubscribe: () => {}, 
      publish: () => {} 
    }
  });
  
  // All useState hooks called at the top level, in the same order every time
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [status, setStatus] = useState<ScriptStatus>('idle');
  const [output, setOutput] = useState<string>('');
  const [params, setParams] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [serviceInstance] = useState(() => new ScriptServiceHelper(config, serviceHook?.callService || (async () => { throw new Error('Service not available'); })));
  const [activeTab, setActiveTab] = useState<'overview' | 'configured' | 'unconfigured' | 'scriptEditor' | 'execute'>('overview');
  const [configuredScripts, setConfiguredScripts] = useState<Record<string, ConfiguredScript>>({});
  const [configsLoaded, setConfigsLoaded] = useState(false);
  const [selectedConfiguredScript, setSelectedConfiguredScript] = useState<ConfiguredScript | null>(null);
  const [scriptEditorContent, setScriptEditorContentRaw] = useState<string>('');
  const [selectedScriptForEdit, setSelectedScriptForEdit] = useState<string>('');
  const [isLoadingScript, setIsLoadingScript] = useState(false);
  const [isSavingScript, setIsSavingScript] = useState(false);
  const [isConfigureModalOpen, setIsConfigureModalOpen] = useState(false);
  const [scriptToConfig, setScriptToConfig] = useState<Script | null>(null);
  const [configSchemas, setConfigSchemas] = useState<any>(null);
  const [schemasLoaded, setSchemasLoaded] = useState(false);
  const [CodeMirrorComponent, setCodeMirrorComponent] = useState<any>(null);

  // Helper function to ensure content is always a string
  const setScriptEditorContent = (content: any) => {
    setScriptEditorContentRaw(typeof content === 'string' ? content : '');
  };

  // Load configured scripts from persistence
  const loadConfiguredScripts = useCallback(async () => {
    try {
      const savedConfigs = await configPersistence.loadAllConfigs('script-runner', 'plugin-config');
      if (savedConfigs && Object.keys(savedConfigs).length > 0) {
        setConfiguredScripts(savedConfigs);
      }
    } catch (error) {
      console.error('Failed to load configured scripts:', error);
    } finally {
      setConfigsLoaded(true);
    }
  }, []);

  const loadScripts = useCallback(async () => {
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
  }, [serviceInstance]);

  // All useEffect hooks called at the top level, in the same order every time
  useEffect(() => {
    loadScripts();
    loadConfiguredScripts();
  }, [config.scriptsDirectory, loadScripts, loadConfiguredScripts]);

  useEffect(() => {
    const loadCodeMirror = async () => {
      try {
        const CodeMirror = await loadNodeModule('@uiw/react-codemirror');
        setCodeMirrorComponent(CodeMirror);
      } catch (err) {
        console.warn('CodeMirror not available, using textarea fallback');
        const TextareaFallback = (props: any) => (
          <textarea
            value={typeof props.value === 'string' ? props.value : ''}
            onChange={(e) => props.onChange?.(e.target.value)}
            style={{ width: '100%', height: props.height || '400px', fontFamily: 'monospace', padding: '12px' }}
            aria-label={props['aria-label']}
            placeholder={props.placeholder || ''}
          />
        );
        setCodeMirrorComponent(TextareaFallback);
      }
    };

    const loadSchemas = async () => {
      try {
        console.log('Loading script runner schemas...');
        const schemas = await createSchemas();
        console.log('Script runner schemas loaded:', schemas);
        setConfigSchemas(schemas);
        setSchemasLoaded(true);
      } catch (err) {
        console.error('Could not load script runner schemas:', err);
        setSchemasLoaded(false);
      }
    };

    loadCodeMirror();
    loadSchemas();
  }, []);


  const runScript = async (script: Script, parameters: string[]) => {
    setStatus('running');
    setOutput('Starting script execution...\n');
    
    try {
      const result = await serviceInstance.executeScript(script.path, parameters);
      
      setOutput(result.output);
      setStatus(result.success ? 'success' : 'error');
      
      // Script execution completed
      
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

  // Enhanced functionality handlers
  const handleConfigureScript = (script: Script) => {
    if (!schemasLoaded || !configSchemas) {
      console.warn('Schemas not loaded yet, cannot configure script');
      alert('Configuration system is still loading. Please try again in a moment.');
      return;
    }
    setScriptToConfig(script);
    setIsConfigureModalOpen(true);
  };

  const handleSaveScriptConfig = async (configData: any) => {
    if (!scriptToConfig) return;

    try {
      console.log('Saving script configuration:', configData);
      
      // Create configured script object
      const configuredScript: ConfiguredScript = {
        id: configData.id,
        name: configData.name,
        description: configData.description,
        scriptPath: configData.scriptPath,
        group: configData.group,
        parameters: configData.defaultShellParameters || {},
        customParameters: configData.parameters || [],
        shell: 'powershell', // Default shell
        timeout: 300, // Default timeout
        enabled: configData.enabled,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Add to configured scripts state
      const updatedConfigs = {
        ...configuredScripts,
        [configuredScript.id]: configuredScript
      };
      setConfiguredScripts(updatedConfigs);

      // Save to configuration persistence
      await configPersistence.saveAllConfigs('script-runner', 'plugin-config', updatedConfigs);
      console.log('Script configuration saved successfully:', configuredScript);
      
      setIsConfigureModalOpen(false);
      setScriptToConfig(null);
      
      // Switch to configured scripts tab to show the result
      setActiveTab('configured');
      
    } catch (error) {
      console.error('Error saving script configuration:', error);
      alert('Failed to save script configuration. Please try again.');
    }
  };

  const handleEditConfiguredScript = (script: ConfiguredScript) => {
    console.log('Edit configured script:', script.name);
    setScriptToConfig({
      id: script.id,
      name: script.name,
      description: script.description,
      path: script.scriptPath,
      category: script.group,
      parameters: script.customParameters
    });
    setIsConfigureModalOpen(true);
  };

  const handleDeleteConfiguredScript = async (scriptId: string) => {
    if (!confirm('Are you sure you want to delete this script configuration?')) {
      return;
    }
    
    try {
      const updatedConfigs = { ...configuredScripts };
      delete updatedConfigs[scriptId];
      setConfiguredScripts(updatedConfigs);
      
      await configPersistence.saveAllConfigs('script-runner', 'plugin-config', updatedConfigs);
      console.log('Script configuration deleted successfully');
    } catch (error) {
      console.error('Failed to delete script configuration:', error);
      alert('Failed to delete script configuration. Please try again.');
    }
  };

  const handleLoadScriptForEdit = async (scriptPath: string) => {
    setSelectedScriptForEdit(scriptPath);
    setIsLoadingScript(true);
    
    try {
      // If script path is empty or just whitespace, clear the content
      if (!scriptPath || !scriptPath.trim()) {
        setScriptEditorContent('');
        setIsLoadingScript(false);
        return;
      }
      
      const electronAPI = serviceInstance.getElectronAPI();
      
      if (electronAPI) {
        // Try to read the actual script file
        try {
          const content = await electronAPI.readFile(scriptPath, { encoding: 'utf8' });
          setScriptEditorContent(typeof content === 'string' ? content : '');
        } catch (fileError) {
          console.warn('Could not read script file, checking persistence:', fileError);
          
          // Try to load from persistence
          try {
            const persistedScript = await configPersistence.loadConfig(
              { pluginId: 'script-runner', configType: 'script-editor' },
              scriptPath
            );
            
            if (persistedScript?.content) {
              setScriptEditorContent(persistedScript.content);
            } else {
              // Fall back to template content
              const templateContent = getTemplateContent(scriptPath);
              setScriptEditorContent(templateContent);
            }
          } catch (persistenceError) {
            console.warn('Could not load from persistence, using template:', persistenceError);
            const templateContent = getTemplateContent(scriptPath);
            setScriptEditorContent(templateContent);
          }
        }
      } else {
        // No Electron API available, try persistence first
        try {
          const persistedScript = await configPersistence.loadConfig(
            { pluginId: 'script-runner', configType: 'script-editor' },
            scriptPath
          );
          
          if (persistedScript?.content) {
            setScriptEditorContent(persistedScript.content);
          } else {
            const templateContent = getTemplateContent(scriptPath);
            setScriptEditorContent(templateContent);
          }
        } catch (error) {
          const templateContent = getTemplateContent(scriptPath);
          setScriptEditorContent(templateContent);
        }
      }
    } catch (error) {
      console.error('Error loading script content:', error);
      setScriptEditorContent('# Error loading script content');
    } finally {
      setIsLoadingScript(false);
    }
  };

  const getTemplateContent = (scriptPath: string): string => {
    if (scriptPath.includes('hello')) {
      return `# Hello World Script
Write-Host "Hello, World!"
Write-Host "Current Date: $(Get-Date)"
Write-Host "User: $env:USERNAME"`;
    } else if (scriptPath.includes('sysinfo')) {
      return `# System Information Script
Write-Host "=== System Information ==="
Write-Host "Computer Name: $env:COMPUTERNAME"
Write-Host "OS Version: $(Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Caption)"
Write-Host "Total Memory: $((Get-WmiObject -Class Win32_ComputerSystem).TotalPhysicalMemory / 1GB) GB"
Write-Host "Processor: $(Get-WmiObject -Class Win32_Processor | Select-Object -ExpandProperty Name)"`;
    } else {
      return `# PowerShell Script
# Add your script content here
Write-Host "Script execution started"

# Your code here

Write-Host "Script execution completed"`;
    }
  };

  const handleSaveScript = async () => {
    if (!selectedScriptForEdit && !(typeof scriptEditorContent === 'string' && scriptEditorContent.trim())) return;
    
    setIsSavingScript(true);
    try {
      let scriptPath = selectedScriptForEdit;
      
      // If no script is selected, prompt for a new filename
      if (!scriptPath) {
        const filename = prompt('Enter a filename for the new script (without extension):');
        if (!filename) {
          setIsSavingScript(false);
          return;
        }
        scriptPath = `${config.scriptsDirectory}/${filename}.ps1`;
      }
      
      console.log('Saving script:', scriptPath);
      console.log('Script content:', scriptEditorContent);
      
      const electronAPI = serviceInstance.getElectronAPI();
      
      // Always save to persistence first
      await configPersistence.saveConfig(
        { pluginId: 'script-runner', configType: 'script-editor', autoSave: true },
        scriptPath,
        { content: scriptEditorContent, lastModified: new Date().toISOString() }
      );
      
      if (electronAPI) {
        // Ensure the scripts directory exists
        await electronAPI.mkdir(config.scriptsDirectory, { recursive: true });
        
        // Save to the actual file system
        await electronAPI.writeFile(scriptPath, scriptEditorContent);
        console.log('Script saved successfully to file system and persistence');
        alert('Script saved successfully!');
        
        // If it was a new script, set it as the selected script
        if (!selectedScriptForEdit) {
          setSelectedScriptForEdit(scriptPath);
          // Reload scripts to show the new script
          loadScripts();
        }
      } else {
        // No Electron API available, but we still saved to persistence
        console.warn('Electron API not available, saved to persistence only');
        alert('Script saved to persistence (file system not available in this environment)');
      }
    } catch (error) {
      console.error('Error saving script:', error);
      alert('Error saving script: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setIsSavingScript(false);
    }
  };

  // Render navigation tabs
  const renderTabs = () => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
      {[
        { key: 'overview', label: 'Overview' },
        { key: 'configured', label: 'Configured Scripts' },
        { key: 'unconfigured', label: 'Unconfigured Scripts' },
        { key: 'scriptEditor', label: 'Script Editor' },
        { key: 'execute', label: 'Execute' }
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key as any)}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === key ? '2px solid #007bff' : '2px solid transparent',
            background: activeTab === key ? '#f8f9fa' : 'transparent',
            color: activeTab === key ? '#007bff' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === key ? 'bold' : 'normal'
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

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
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>Script Runner</h2>
      
      {renderTabs()}
      
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'overview' && (
          <Card>
            <h3>Script Runner Overview</h3>
            <div style={{ lineHeight: '1.6' }}>
              <p><strong>Enhanced Script Runner with Configuration Management</strong></p>
              <ul>
                <li><strong>Configured Scripts</strong> - Scripts with saved configurations and parameters</li>
                <li><strong>Unconfigured Scripts</strong> - Discovered scripts that can be configured</li>
                <li><strong>Script Editor</strong> - Edit script content directly in the interface</li>
                <li><strong>Enhanced Execution</strong> - Run scripts with saved or custom parameters</li>
              </ul>
              
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                <h4>Current Status</h4>
                <p><strong>Shell:</strong> {config.defaultShell}</p>
                <p><strong>Scripts Directory:</strong> {config.scriptsDirectory}</p>
                <p><strong>Discovered Scripts:</strong> {scripts.length}</p>
                <p><strong>Configured Scripts:</strong> {Object.keys(configuredScripts).length}</p>
                <p><strong>Service:</strong> {config.enableService ? 'Active' : 'Inactive'}</p>
                <p><strong>Persistence:</strong> {configsLoaded ? 'Loaded' : 'Loading...'}</p>
              </div>
            </div>
          </Card>
        )}

        
        {activeTab === 'configured' && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Configured Scripts</h3>
                <p style={{ margin: 0 }}>Scripts with saved configurations and parameters:</p>
              </div>
              <Button variant="primary" size="sm">
                Refresh
              </Button>
            </div>
            
            {Object.keys(configuredScripts).length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>No configured scripts yet.</p>
                <p>Go to Unconfigured Scripts to set up your first script.</p>
              </div>
            ) : (
              Object.values(configuredScripts).map((script) => (
                <div key={script.id} style={{ 
                  padding: '16px', 
                  border: '1px solid #e0e0e0', 
                  borderRadius: '4px', 
                  marginBottom: '12px',
                  backgroundColor: script.enabled ? 'white' : '#f5f5f5'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <strong>{script.name}</strong>
                        <Badge variant={script.enabled ? 'success' : 'neutral'} size="sm">
                          {script.enabled ? 'Enabled' : 'Disabled'}
                        </Badge>
                        <Badge variant="info" size="sm">{script.group}</Badge>
                      </div>
                      <p style={{ margin: '8px 0', color: '#666' }}>{script.description}</p>
                      <code style={{ fontSize: '12px', color: '#007bff' }}>{script.scriptPath}</code>
                    </div>
                    <div style={{ marginLeft: '16px', display: 'flex', gap: '8px' }}>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => {
                          setSelectedConfiguredScript(script);
                          setActiveTab('execute');
                        }}
                      >
                        Run
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleEditConfiguredScript(script)}
                      >
                        Edit
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm"
                        onClick={() => handleDeleteConfiguredScript(script.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </Card>
        )}

        {activeTab === 'unconfigured' && (
          <Card>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 8px 0' }}>Unconfigured Scripts</h3>
                <p style={{ margin: 0 }}>Discovered scripts that can be configured:</p>
              </div>
              <Button 
                onClick={loadScripts}
                variant="secondary"
                size="sm"
                disabled={loading}
              >
                {loading ? 'Reloading...' : 'Reload Scripts'}
              </Button>
            </div>
            
            {scripts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <p>No scripts found.</p>
                <p>Check the scripts directory: {config.scriptsDirectory}</p>
              </div>
            ) : (
              <Grid cols={2} gap="md">
                {scripts.map((script) => (
                  <div
                    key={script.id}
                    style={{
                      padding: '16px',
                      border: '1px solid #e0e0e0',
                      borderRadius: '4px',
                      backgroundColor: 'white'
                    }}
                  >
                    <h4 style={{ margin: '0 0 8px 0' }}>{script.name}</h4>
                    <p style={{ margin: '0 0 12px 0', color: '#666', fontSize: '14px' }}>{script.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                      <Badge variant="neutral" size="sm">{script.category}</Badge>
                      {script.parameters.length > 0 && (
                        <Badge variant="info" size="sm">
                          {script.parameters.length} params
                        </Badge>
                      )}
                    </div>
                    <code style={{ fontSize: '12px', color: '#007bff', display: 'block', marginBottom: '12px' }}>
                      {script.path}
                    </code>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <Button 
                        variant="primary" 
                        size="sm"
                        onClick={() => handleConfigureScript(script)}
                      >
                        Configure
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => {
                          handleLoadScriptForEdit(script.path);
                          setActiveTab('scriptEditor');
                        }}
                      >
                        View/Edit
                      </Button>
                    </div>
                  </div>
                ))}
              </Grid>
            )}
          </Card>
        )}

        {activeTab === 'scriptEditor' && (
          <Card>
            <h3>Script Editor</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left Panel - Script Selection and Editor */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Script</label>
                  <select
                    value={selectedScriptForEdit}
                    onChange={(e) => {
                      const scriptPath = e.target.value;
                      handleLoadScriptForEdit(scriptPath);
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px'
                    }}
                  >
                    <option value="">Select a script...</option>
                    {scripts.map((script) => (
                      <option key={script.id} value={script.path}>
                        {script.name} ({script.path})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Script Content</label>
                  {isLoadingScript ? (
                    <div style={{
                      width: '100%',
                      height: '400px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: '#f9f9f9'
                    }}>
                      Loading script content...
                    </div>
                  ) : (
                    <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
                      {CodeMirrorComponent && typeof CodeMirrorComponent === 'function' ? (
                        <CodeMirrorComponent
                          value={typeof scriptEditorContent === 'string' ? scriptEditorContent : ''}
                          onChange={(value: string) => setScriptEditorContent(value)}
                          height="400px"
                          aria-label="Script content editor"
                          placeholder={selectedScriptForEdit ? "Loading script content..." : "Select a script to edit its content..."}
                        />
                      ) : (
                        <textarea
                          value={typeof scriptEditorContent === 'string' ? scriptEditorContent : ''}
                          onChange={(e) => setScriptEditorContent(e.target.value)}
                          style={{ width: '100%', height: '400px', fontFamily: 'monospace', padding: '12px' }}
                          aria-label="Script content editor"
                          placeholder={selectedScriptForEdit ? "Loading script content..." : "Select a script to edit its content..."}
                        />
                      )}
                    </div>
                  )}
                </div>
                
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button
                    onClick={handleSaveScript}
                    disabled={isSavingScript || (!selectedScriptForEdit && !(typeof scriptEditorContent === 'string' && scriptEditorContent.trim()))}
                    variant="primary"
                  >
                    {isSavingScript ? 'Saving...' : (selectedScriptForEdit ? 'Save Script' : 'Save as New Script')}
                  </Button>
                  <Button
                    onClick={() => {
                      setSelectedScriptForEdit('');
                      setScriptEditorContent('');
                    }}
                    variant="secondary"
                  >
                    Clear
                  </Button>
                  <Button
                    onClick={() => {
                      setScriptEditorContent(`# PowerShell Script
# Add your script content here
Write-Host "Script execution started"

# Your code here

Write-Host "Script execution completed"`);
                    }}
                    variant="secondary"
                  >
                    New Script Template
                  </Button>
                </div>
              </div>
              
              {/* Right Panel - Script Information */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <h4 style={{ margin: '0 0 12px 0' }}>PowerShell Guidelines</h4>
                  <div style={{ fontSize: '14px', lineHeight: '1.6' }}>
                    <ul>
                      <li>Use <code>Write-Host</code> for output messages</li>
                      <li>Use <code>param()</code> block for parameters</li>
                      <li>Add error handling with try/catch</li>
                      <li>Use <code>$env:VARIABLE</code> for environment variables</li>
                      <li>Test scripts before saving</li>
                    </ul>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 12px 0' }}>Script Templates</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <Button
                      onClick={() => setScriptEditorContent(`# PowerShell Script Template
param(
    [string]$Parameter1 = "default",
    [switch]$Verbose
)

try {
    Write-Host "Script execution started"
    
    # Your code here
    
    Write-Host "Script execution completed successfully"
}
catch {
    Write-Error "Script failed: $($_.Exception.Message)"
    exit 1
}`)}
                      variant="secondary"
                      size="sm"
                    >
                      Basic Template
                    </Button>
                    
                    <Button
                      onClick={() => setScriptEditorContent(`# System Information Script
Write-Host "=== System Information ==="
Write-Host "Computer Name: $env:COMPUTERNAME"
Write-Host "User: $env:USERNAME"
Write-Host "Date: $(Get-Date)"
Write-Host "PowerShell Version: $($PSVersionTable.PSVersion)"
Write-Host "OS: $(Get-WmiObject -Class Win32_OperatingSystem | Select-Object -ExpandProperty Caption)"`)}
                      variant="secondary"
                      size="sm"
                    >
                      System Info Template
                    </Button>
                  </div>
                </div>
                
                <div>
                  <h4 style={{ margin: '0 0 12px 0' }}>Script Information</h4>
                  {selectedScriptForEdit ? (
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '12px', 
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      <div><strong>Path:</strong> {selectedScriptForEdit}</div>
                      <div><strong>Lines:</strong> {typeof scriptEditorContent === 'string' ? scriptEditorContent.split('\n').length : 0}</div>
                      <div><strong>Characters:</strong> {typeof scriptEditorContent === 'string' ? scriptEditorContent.length : 0}</div>
                    </div>
                  ) : (
                    <div style={{ 
                      backgroundColor: '#e3f2fd', 
                      padding: '12px', 
                      borderRadius: '4px',
                      fontSize: '14px',
                      lineHeight: '1.4'
                    }}>
                      <div style={{ marginBottom: '8px' }}>
                        <strong>💡 No script selected</strong>
                      </div>
                      <div style={{ color: '#666' }}>
                        • Select a script from the dropdown above to edit existing scripts<br/>
                        • Or click "New Script Template" to start creating a new script<br/>
                        • You can type directly in the editor and save as a new script
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {activeTab === 'execute' && (
          <Card>
            <h3>Execute Scripts</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              {/* Left Panel - Script Selection */}
              <div>
                <h4>Select Script to Execute</h4>
                
                {/* Configured Scripts */}
                {Object.keys(configuredScripts).length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h5>Configured Scripts</h5>
                    {Object.values(configuredScripts).filter(s => s.enabled).map((script) => (
                      <div
                        key={script.id}
                        style={{
                          padding: '12px',
                          border: selectedConfiguredScript?.id === script.id ? '2px solid #007bff' : '1px solid #e0e0e0',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedConfiguredScript(script)}
                      >
                        <strong>{script.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>{script.description}</div>
                        <Badge variant="info" size="sm">{script.group}</Badge>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Unconfigured Scripts */}
                {scripts.length > 0 && (
                  <div>
                    <h5>Unconfigured Scripts</h5>
                    {scripts.map((script) => (
                      <div
                        key={script.id}
                        style={{
                          padding: '12px',
                          border: selectedScript?.id === script.id ? '2px solid #007bff' : '1px solid #e0e0e0',
                          borderRadius: '4px',
                          marginBottom: '8px',
                          cursor: 'pointer'
                        }}
                        onClick={() => setSelectedScript(script)}
                      >
                        <strong>{script.name}</strong>
                        <div style={{ fontSize: '12px', color: '#666' }}>{script.description}</div>
                        <Badge variant="neutral" size="sm">{script.category}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Right Panel - Execution Controls */}
              <div>
                <h4>Execution Controls</h4>
                
                {(selectedConfiguredScript || selectedScript) && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                      <strong>Selected Script:</strong>
                      <div>{selectedConfiguredScript?.name || selectedScript?.name}</div>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px' }}>Parameters:</label>
                      <Input
                        value={params}
                        onChange={(e) => setParams(e.target.value)}
                        placeholder="param1 param2 param3"
                        disabled={status === 'running'}
                      />
                    </div>
                    
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <Button
                        onClick={handleRunScript}
                        variant="primary"
                        disabled={status === 'running'}
                      >
                        {status === 'running' ? 'Running...' : 'Execute Script'}
                      </Button>
                      
                      {status === 'running' && <Badge variant="warning" size="sm">Running...</Badge>}
                      {status === 'success' && <Badge variant="success" size="sm">✓ Success</Badge>}
                      {status === 'error' && <Badge variant="danger" size="sm">✗ Error</Badge>}
                    </div>
                    
                    {output && (
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong>Output:</strong>
                          <Button onClick={handleCopyOutput} variant="secondary" size="sm">
                            Copy
                          </Button>
                        </div>
                        <pre style={{
                          backgroundColor: '#f8f9fa',
                          border: '1px solid #e0e0e0',
                          borderRadius: '4px',
                          padding: '12px',
                          maxHeight: '200px',
                          overflow: 'auto',
                          fontSize: '12px',
                          fontFamily: 'monospace',
                          whiteSpace: 'pre-wrap'
                        }}>
                          {output}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

      </div>
      
      {/* Configuration Modal */}
      {isConfigureModalOpen && scriptToConfig && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setIsConfigureModalOpen(false);
                  setScriptToConfig(null);
                }}
              >
                ✕
              </Button>
            </div>
            
            {schemasLoaded && configSchemas ? (
              <SchemaForm
                title={`Configure Script: ${scriptToConfig.name}`}
                schema={configSchemas.ScriptConfigurationSchema}
                initialValues={{
                  id: `script-${Date.now()}`,
                  name: scriptToConfig.name,
                  description: scriptToConfig.description,
                  group: scriptToConfig.category,
                  scriptPath: scriptToConfig.path,
                  defaultShellParameters: {},
                  elevated: false,
                  parameters: [],
                  enabled: true
                }}
                onSubmit={(values, isValid) => {
                  if (isValid) {
                    handleSaveScriptConfig(values);
                  }
                }}
                onCancel={() => {
                  setIsConfigureModalOpen(false);
                  setScriptToConfig(null);
                }}
                submitLabel="Save Configuration"
                showCancelButton={true}
                realTimeValidation={true}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h3>Loading Configuration Form...</h3>
                <p>Please wait while the form schema is being loaded.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScriptRunnerPlugin;