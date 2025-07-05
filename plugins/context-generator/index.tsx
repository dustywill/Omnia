import React, { useState, useEffect, useCallback } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { Button } from '../../src/ui/components/Button/Button.js';
import { Input } from '../../src/ui/components/Input/Input.js';

// Enhanced types for comprehensive file tree
export interface FileTreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileTreeNode[];
  size?: number;
  extension?: string;
}

export interface FilterOptions {
  fileRegex: string;
  fileFilterType: 'include' | 'exclude';
  folderRegex: string;
  folderFilterType: 'include' | 'exclude';
  maxDepth: number;
}

export interface FilterPreset {
  name: string;
  fileRegex: string;
  fileFilterType: 'include' | 'exclude';
  folderRegex: string;
  folderFilterType: 'include' | 'exclude';
  maxDepth: number;
}

const defaultPresets: FilterPreset[] = [
  {
    name: 'Common Files',
    folderRegex: 'node_modules|\\.git|\\.hg|logs|dist|build|coverage',
    folderFilterType: 'exclude',
    fileRegex: '\\.(ts|tsx|js|jsx|md|json|txt|py|php|java|cpp|c|h)$',
    fileFilterType: 'include',
    maxDepth: 10
  },
  {
    name: 'JavaScript/TypeScript',
    folderRegex: 'node_modules|\\.git|dist|build',
    folderFilterType: 'exclude',
    fileRegex: '\\.(ts|tsx|js|jsx)$',
    fileFilterType: 'include',
    maxDepth: 10
  },
  {
    name: 'Documentation',
    folderRegex: 'node_modules|\\.git',
    folderFilterType: 'exclude',
    fileRegex: '\\.(md|txt|rst|adoc)$',
    fileFilterType: 'include',
    maxDepth: 10
  }
];

export type ContextGeneratorProps = {
  initialPath?: string;
};

const ContextGenerator: React.FC<ContextGeneratorProps> = ({ initialPath }) => {
  // State management
  const [rootPath, setRootPath] = useState<string>('');
  const [fileTree, setFileTree] = useState<FileTreeNode | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [loading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  
  // Filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    fileRegex: '\\.(ts|tsx|js|jsx|md|json)$',
    fileFilterType: 'include',
    folderRegex: 'node_modules|\\.git|dist|build|coverage',
    folderFilterType: 'exclude',
    maxDepth: 10
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('Common Files');
  
  // Output state
  const [output, setOutput] = useState('');
  const [progress, setProgress] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);

  // Initialize with current directory
  useEffect(() => {
    const initPath = initialPath || (typeof process !== 'undefined' ? process.cwd() : '.');
    setRootPath(initPath);
    scanDirectory(initPath);
  }, [initialPath]);

  // Apply preset when selected
  useEffect(() => {
    const preset = defaultPresets.find(p => p.name === selectedPreset);
    if (preset) {
      setFilterOptions({
        fileRegex: preset.fileRegex,
        fileFilterType: preset.fileFilterType,
        folderRegex: preset.folderRegex,
        folderFilterType: preset.folderFilterType,
        maxDepth: preset.maxDepth
      });
    }
  }, [selectedPreset]);

  // Directory scanning with advanced filtering
  const scanDirectory = useCallback(async (startPath: string) => {
    if (!startPath) return;
    
    setScanning(true);
    setProgress('Scanning directory...');
    
    try {
      const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
      const path = await loadNodeModule<typeof import('path')>('path');
      
      const shouldIncludeFile = (fileName: string): boolean => {
        if (!filterOptions.fileRegex) return true;
        
        try {
          const regex = new RegExp(filterOptions.fileRegex, 'i');
          const matches = regex.test(fileName);
          return filterOptions.fileFilterType === 'include' ? matches : !matches;
        } catch {
          return true;
        }
      };
      
      const shouldIncludeFolder = (folderName: string): boolean => {
        if (!filterOptions.folderRegex) return true;
        
        try {
          const regex = new RegExp(filterOptions.folderRegex, 'i');
          const matches = regex.test(folderName);
          return filterOptions.folderFilterType === 'include' ? matches : !matches;
        } catch {
          return true;
        }
      };
      
      const scanDir = async (dirPath: string, depth = 0): Promise<FileTreeNode | null> => {
        if (depth > filterOptions.maxDepth) return null;
        
        try {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          const children: FileTreeNode[] = [];
          
          for (const item of items) {
            const fullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
              if (shouldIncludeFolder(item.name)) {
                const childNode = await scanDir(fullPath, depth + 1);
                if (childNode && (childNode.children?.length || 0) > 0) {
                  children.push(childNode);
                }
              }
            } else if (item.isFile() && shouldIncludeFile(item.name)) {
              const stats = await fs.stat(fullPath);
              children.push({
                name: item.name,
                path: fullPath,
                type: 'file',
                size: stats.size,
                extension: path.extname(item.name)
              });
            }
          }
          
          return {
            name: path.basename(dirPath),
            path: dirPath,
            type: 'directory',
            children: children.sort((a, b) => {
              // Directories first, then files, both alphabetically
              if (a.type !== b.type) {
                return a.type === 'directory' ? -1 : 1;
              }
              return a.name.localeCompare(b.name);
            })
          };
        } catch (error) {
          console.warn(`Failed to scan directory ${dirPath}:`, error);
          return null;
        }
      };
      
      const tree = await scanDir(startPath);
      setFileTree(tree);
      setRootPath(startPath);
      
    } catch (error) {
      console.error('Failed to scan directory:', error);
      setProgress('Error scanning directory');
    } finally {
      setScanning(false);
      setProgress('');
    }
  }, [filterOptions]);

  // File selection handlers
  const handleFileToggle = useCallback((filePath: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filePath)) {
        newSet.delete(filePath);
      } else {
        newSet.add(filePath);
      }
      return newSet;
    });
  }, []);

  const handleFolderToggle = useCallback((folderPath: string) => {
    setExpandedFolders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(folderPath)) {
        newSet.delete(folderPath);
      } else {
        newSet.add(folderPath);
      }
      return newSet;
    });
  }, []);

  // Context generation
  const generateContext = useCallback(async () => {
    if (selectedFiles.size === 0) {
      setOutput('No files selected. Please select files to generate context.');
      return;
    }

    setGenerating(true);
    setProgress('');
    
    try {
      const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
      const path = await loadNodeModule<typeof import('path')>('path');
      
      const files = Array.from(selectedFiles);
      let contextOutput = '';
      let totalChars = 0;
      
      for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        setProgress(`Reading file ${i + 1} of ${files.length}...`);
        
        try {
          const content = await fs.readFile(filePath, 'utf8');
          const relativePath = path.relative(rootPath, filePath);
          const fileName = path.basename(filePath);
          
          contextOutput += `---\nFile: ${fileName}\nPath: ${relativePath.replace(/\\/g, '/')}\n---\n\n`;
          contextOutput += '```\n' + content + '\n```\n\n';
          totalChars += content.length;
          
        } catch (error) {
          contextOutput += `---\nError reading ${filePath}: ${error}\n---\n\n`;
        }
      }
      
      contextOutput += `\n---\nGenerated ${files.length} files, ${totalChars} characters total\n---\n`;
      setOutput(contextOutput);
      setCopied(false);
      
    } catch (error) {
      setOutput(`Error generating context: ${error}`);
    } finally {
      setGenerating(false);
      setProgress('');
    }
  }, [selectedFiles, rootPath]);

  // Utility functions
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  }, [output]);


  const applyFilters = () => {
    scanDirectory(rootPath);
  };

  const clearSelection = () => {
    setSelectedFiles(new Set());
  };

  const handleSelectFolder = async () => {
    // TODO: Implement folder selection dialog
    // For now, prompt for path
    const newPath = prompt('Enter directory path:');
    if (newPath) {
      scanDirectory(newPath);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Context Generator</h3>
        <p>Loading file tree...</p>
      </div>
    );
  }

  // Helper function to recursively render file tree
  const renderFileTreeNode = (node: FileTreeNode, depth: number = 0): React.ReactNode => {
    const isDirectory = node.type === 'directory';
    const isExpanded = expandedFolders.has(node.path);
    
    if (isDirectory) {
      const hasChildren = node.children && node.children.length > 0;
      const selectedChildFiles = node.children?.filter(child => 
        child.type === 'file' && selectedFiles.has(child.path)
      ) || [];
      const totalChildFiles = node.children?.filter(child => child.type === 'file').length || 0;
      
      return (
        <div key={node.path} style={{ marginLeft: `${depth * 20}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '4px 0' }}>
            {hasChildren && (
              <span 
                onClick={() => handleFolderToggle(node.path)}
                style={{ 
                  cursor: 'pointer', 
                  marginRight: '8px', 
                  fontFamily: 'monospace',
                  fontSize: '12px',
                  width: '16px',
                  textAlign: 'center'
                }}
              >
                {isExpanded ? '−' : '+'}
              </span>
            )}
            <input
              type="checkbox"
              checked={selectedChildFiles.length === totalChildFiles && totalChildFiles > 0}
              ref={ref => {
                if (ref) {
                  ref.indeterminate = selectedChildFiles.length > 0 && selectedChildFiles.length < totalChildFiles;
                }
              }}
              onChange={(e) => {
                if (node.children) {
                  node.children.forEach(child => {
                    if (child.type === 'file') {
                      if (e.target.checked) {
                        setSelectedFiles(prev => new Set([...prev, child.path]));
                      } else {
                        setSelectedFiles(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(child.path);
                          return newSet;
                        });
                      }
                    }
                  });
                }
              }}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontWeight: 'bold', color: '#666' }}>
              📁 {node.name}
            </span>
          </div>
          {isExpanded && hasChildren && (
            <div>
              {node.children!.map(child => renderFileTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={node.path} style={{ marginLeft: `${depth * 20}px` }}>
          <div style={{ display: 'flex', alignItems: 'center', padding: '2px 0' }}>
            <span style={{ width: '16px', marginRight: '8px' }}></span>
            <input
              type="checkbox"
              checked={selectedFiles.has(node.path)}
              onChange={() => handleFileToggle(node.path)}
              style={{ marginRight: '8px' }}
            />
            <span style={{ fontSize: '14px' }}>
              📄 {node.name}
            </span>
            {node.size && (
              <span style={{ marginLeft: '8px', fontSize: '12px', color: '#999' }}>
                ({(node.size / 1024).toFixed(1)}KB)
              </span>
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <div style={{ padding: '20px', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ marginBottom: '20px' }}>
        <h3>Context Generator</h3>
        <p>Select files to include in your context generation.</p>
      </div>

      {/* Controls Section */}
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <Button onClick={handleSelectFolder} disabled={scanning}>
          Select Folder
        </Button>
        <Button onClick={applyFilters} disabled={scanning}>
          Apply Filters
        </Button>
        <Button onClick={clearSelection} disabled={selectedFiles.size === 0}>
          Clear Selection ({selectedFiles.size})
        </Button>
      </div>

      {/* Filter Section */}
      <div style={{ marginBottom: '20px', border: '1px solid #ddd', padding: '15px', borderRadius: '5px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
          <button
            onClick={() => setShowFilters(!showFilters)}
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {showFilters ? '▼' : '▶'} Filter Options
          </button>
        </div>
        
        {showFilters && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Preset:</label>
              <select 
                value={selectedPreset} 
                onChange={(e) => setSelectedPreset(e.target.value)}
                style={{ width: '100%', padding: '5px' }}
              >
                {defaultPresets.map(preset => (
                  <option key={preset.name} value={preset.name}>{preset.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>File Pattern:</label>
              <Input
                type="text"
                value={filterOptions.fileRegex}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, fileRegex: e.target.value }))}
                placeholder="e.g., \\.(ts|js)$"
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>File Filter:</label>
              <select
                value={filterOptions.fileFilterType}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, fileFilterType: e.target.value as 'include' | 'exclude' }))}
                style={{ width: '100%', padding: '5px' }}
              >
                <option value="include">Include</option>
                <option value="exclude">Exclude</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Folder Pattern:</label>
              <Input
                type="text"
                value={filterOptions.folderRegex}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, folderRegex: e.target.value }))}
                placeholder="e.g., node_modules|\\.git"
                style={{ width: '100%' }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Folder Filter:</label>
              <select
                value={filterOptions.folderFilterType}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, folderFilterType: e.target.value as 'include' | 'exclude' }))}
                style={{ width: '100%', padding: '5px' }}
              >
                <option value="include">Include</option>
                <option value="exclude">Exclude</option>
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Max Depth:</label>
              <Input
                type="number"
                value={filterOptions.maxDepth}
                onChange={(e) => setFilterOptions(prev => ({ ...prev, maxDepth: parseInt(e.target.value) || 10 }))}
                min="1"
                max="20"
                style={{ width: '100%' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Search Section */}
      <div style={{ marginBottom: '20px' }}>
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search files..."
          style={{ width: '100%', maxWidth: '300px' }}
        />
      </div>

      {/* Current Path Display */}
      <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <strong>Current Path:</strong> {rootPath || 'No folder selected'}
      </div>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', gap: '20px', minHeight: '0' }}>
        {/* File Tree Panel */}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd' }}>
            <strong>File Tree</strong>
            {scanning && <span style={{ marginLeft: '10px', color: '#666' }}>Scanning...</span>}
          </div>
          <div style={{ padding: '10px', height: '300px', overflowY: 'auto' }}>
            {fileTree ? (
              <div>
                {renderFileTreeNode(fileTree)}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: '40px 0' }}>
                Select a folder to start scanning
              </div>
            )}
          </div>
        </div>

        {/* Output Panel */}
        <div style={{ flex: 1, border: '1px solid #ddd', borderRadius: '5px', overflow: 'hidden' }}>
          <div style={{ padding: '10px', backgroundColor: '#f8f9fa', borderBottom: '1px solid #ddd', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>Generated Context</strong>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button 
                onClick={generateContext} 
                disabled={selectedFiles.size === 0 || generating}
                style={{ fontSize: '12px' }}
              >
                {generating ? 'Generating...' : 'Generate Context'}
              </Button>
              <Button 
                onClick={handleCopy} 
                disabled={!output || generating}
                style={{ fontSize: '12px' }}
              >
                {copied ? 'Copied!' : 'Copy to Clipboard'}
              </Button>
            </div>
          </div>
          <div style={{ padding: '10px', height: '300px', display: 'flex', flexDirection: 'column' }}>
            {progress && (
              <div style={{ marginBottom: '10px', padding: '5px', backgroundColor: '#e3f2fd', borderRadius: '3px', fontSize: '12px' }}>
                {progress}
              </div>
            )}
            <textarea
              value={output}
              readOnly
              style={{ 
                flex: 1, 
                width: '100%', 
                border: '1px solid #ddd', 
                borderRadius: '3px', 
                padding: '10px',
                fontFamily: 'monospace',
                fontSize: '12px',
                resize: 'none'
              }}
              placeholder="Generated context will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContextGenerator;
