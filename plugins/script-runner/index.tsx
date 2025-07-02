import React, { useState, useEffect } from 'react';

export type Script = {
  id: string;
  name: string;
  description: string;
  path: string;
};

export type ScriptStatus = 'idle' | 'running' | 'success' | 'error';

export const ScriptRunner: React.FC = () => {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [status, setStatus] = useState<ScriptStatus>('idle');
  const [output, setOutput] = useState<string>('');
  const [params, setParams] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadScripts = async () => {
      try {
        // For now, create some sample scripts since we can't actually scan the filesystem
        // In a real implementation, this would use fs operations
        const sampleScripts: Script[] = [
          {
            id: 'hello-world',
            name: 'Hello World',
            description: 'A simple greeting script',
            path: '/scripts/hello.ps1'
          },
          {
            id: 'system-info',
            name: 'System Information',
            description: 'Displays system information',
            path: '/scripts/sysinfo.ps1'
          },
          {
            id: 'backup-files',
            name: 'Backup Files',
            description: 'Creates backup of specified directory',
            path: '/scripts/backup.ps1'
          }
        ];
        
        setScripts(sampleScripts);
      } catch (error) {
        console.error('Failed to load scripts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadScripts();
  }, []);

  const runScript = async (script: Script, parameters: string[]) => {
    setStatus('running');
    setOutput('');
    
    try {
      // In a real implementation, this would use child_process via loadNodeModule
      // For demo purposes, we'll simulate script execution
      setOutput(`Starting script: ${script.name}\n`);
      setOutput(prev => prev + `Parameters: ${parameters.join(', ')}\n`);
      
      // Simulate some processing time
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setOutput(prev => prev + `Script completed successfully!\n`);
      setOutput(prev => prev + `Output: Hello from ${script.name}\n`);
      
      setStatus('success');
    } catch (error) {
      setOutput(prev => prev + `Error: ${error}\n`);
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
    return <div style={{ padding: '20px' }}>Loading scripts...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px' }}>
      <h2>Script Runner</h2>
      <p>Select and run PowerShell scripts with custom parameters.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="script-select" style={{ display: 'block', marginBottom: '5px' }}>
          Select Script:
        </label>
        <select
          id="script-select"
          value={selectedScript?.id || ''}
          onChange={(e) => {
            const script = scripts.find(s => s.id === e.target.value);
            setSelectedScript(script || null);
          }}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        >
          <option value="">-- Select a script --</option>
          {scripts.map(script => (
            <option key={script.id} value={script.id}>
              {script.name}
            </option>
          ))}
        </select>
        
        {selectedScript && (
          <div style={{ 
            padding: '10px', 
            backgroundColor: '#f5f5f5', 
            border: '1px solid #ddd',
            borderRadius: '4px',
            marginBottom: '10px'
          }}>
            <strong>{selectedScript.name}</strong>
            <p style={{ margin: '5px 0', color: '#666' }}>{selectedScript.description}</p>
            <small style={{ color: '#888' }}>Path: {selectedScript.path}</small>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="params-input" style={{ display: 'block', marginBottom: '5px' }}>
          Parameters (space-separated):
        </label>
        <input
          id="params-input"
          type="text"
          value={params}
          onChange={(e) => setParams(e.target.value)}
          placeholder="param1 param2 param3"
          style={{ width: '100%', padding: '8px' }}
          disabled={!selectedScript}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleRunScript}
          disabled={!selectedScript || status === 'running'}
          style={{
            padding: '10px 20px',
            backgroundColor: status === 'running' ? '#ccc' : '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: status === 'running' ? 'not-allowed' : 'pointer'
          }}
        >
          {status === 'running' ? 'Running...' : 'Run Script'}
        </button>
        
        <span style={{ 
          marginLeft: '10px', 
          padding: '5px 10px',
          borderRadius: '4px',
          backgroundColor: 
            status === 'running' ? '#fff3cd' :
            status === 'success' ? '#d4edda' :
            status === 'error' ? '#f8d7da' : 'transparent',
          color:
            status === 'running' ? '#856404' :
            status === 'success' ? '#155724' :
            status === 'error' ? '#721c24' : 'inherit'
        }}>
          {status === 'running' && 'Running...'}
          {status === 'success' && '✓ Success'}
          {status === 'error' && '✗ Error'}
        </span>
      </div>

      {output && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
            <label style={{ fontWeight: 'bold' }}>Output:</label>
            <button
              onClick={handleCopyOutput}
              style={{
                padding: '5px 10px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              Copy Output
            </button>
          </div>
          <pre style={{
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '4px',
            padding: '10px',
            maxHeight: '300px',
            overflow: 'auto',
            fontSize: '12px',
            fontFamily: 'monospace'
          }}>
            {output}
          </pre>
        </div>
      )}

      <div style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
        <p><strong>Note:</strong> This is a demo interface. In a real implementation:</p>
        <ul>
          <li>Scripts would be discovered by scanning the filesystem</li>
          <li>Script execution would use actual PowerShell via child_process</li>
          <li>Real-time output streaming would be supported</li>
          <li>Script parameters would be validated based on script metadata</li>
        </ul>
      </div>
    </div>
  );
};