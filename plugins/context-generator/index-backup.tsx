import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../src/ui/components/Button/Button.js';
import { Input } from '../../src/ui/components/Input/Input.js';
import { FileTree } from '../../src/ui/components/FileTree/FileTree.js';

// Enhanced types for comprehensive file tree
export interface FileTreeNode {
  id: string;
  name: string;
  type: 'file' | 'folder';
  data?: any;
  children?: FileTreeNode[];
}





export type FilterOptions = {
  fileRegex: string;
  fileFilterType: 'include' | 'exclude';
  folderRegex: string;
  folderFilterType: 'include' | 'exclude';
  maxDepth: number;
};

export type FilterPreset = {
  name: string;
  fileRegex: string;
  fileFilterType: 'include' | 'exclude';
  folderRegex: string;
  folderFilterType: 'include' | 'exclude';
  maxDepth: number;
};

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
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [generating, setGenerating] = useState(false);
  const pluginId = 'context-generator';

  // Filter state
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    fileRegex: '',
    fileFilterType: 'include',
    folderRegex: '',
    folderFilterType: 'include',
    maxDepth: -1
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [customPresets, setCustomPresets] = useState<FilterPreset[]>([]);

  const allPresets = useMemo(() => [
    ...defaultPresets,
    ...customPresets
  ], [customPresets]);
  
  // Output state
  const [output, setOutput] = useState('');
  const [progress, setProgress] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  // Note: FileTree component now handles filtering internally
  // This was the previous filtering logic that's no longer needed
  // const filteredFileTree = useMemo(() => {
  //   if (!fileTree || !searchTerm) return fileTree;
  //   ...\
  // }, [fileTree, searchTerm]);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Initialize with current directory and load configuration
  useEffect(() => {
    const initializePlugin = async () => {
      setLoading(true);
      try {
        const configResult = await (window as any).configAPI.getConfigAndSchema(pluginId);
        if (configResult && configResult.config) {
          const loadedConfig = configResult.config;
          setFilterOptions({
            fileRegex: loadedConfig.lastFileRegex || '',
            fileFilterType: loadedConfig.lastFileFilterType || 'include',
            folderRegex: loadedConfig.lastFolderRegex || '',
            folderFilterType: loadedConfig.lastFolderFilterType || 'include',
            maxDepth: loadedConfig.lastMaxDepth !== undefined ? loadedConfig.lastMaxDepth : -1
          });
          setRootPath(loadedConfig.lastUsedFolderPath || '');
          setCustomPresets(Object.values(loadedConfig.savedFilters || {}));
        }

        const initPath = initialPath || ((window as any).fileSystemAPI ? await (window as any).fileSystemAPI.getRootPath() : '.');
        setRootPath(prevPath => prevPath || initPath); // Only set if not loaded from config
        scanDirectory(initPath);
      } catch (error) {
        console.error('Failed to load plugin configuration:', error);
        // Fallback to defaults if config loading fails
        const initPath = initialPath || ((window as any).fileSystemAPI ? await (window as any).fileSystemAPI.getRootPath() : '.');
        setRootPath(initPath);
        scanDirectory(initPath);
      } finally {
        setLoading(false);
      }
    };
    initializePlugin();
  }, [initialPath, pluginId]);

  // Apply preset when selected
  const applyPreset = useCallback((presetName: string) => {
    const preset = [...defaultPresets, ...customPresets].find(p => p.name === presetName);
    if (preset) {
      setFilterOptions({
        fileRegex: preset.fileRegex,
        fileFilterType: preset.fileFilterType,
        folderRegex: preset.folderRegex,
        folderFilterType: preset.folderFilterType,
        maxDepth: preset.maxDepth
      });
      setSelectedPreset(presetName);
    }
  }, [customPresets]);

  useEffect(() => {
    if (selectedPreset) {
      applyPreset(selectedPreset);
    }
  }, [selectedPreset, applyPreset]);

  // Save custom filter
  const saveCustomFilter = useCallback(async (name: string) => {
    if (!name) return;
    const newPreset: FilterPreset = { name, ...filterOptions };
    const updatedPresets = [...customPresets.filter(p => p.name !== name), newPreset];
    setCustomPresets(updatedPresets);
    setSelectedPreset(name);

    try {
      const configResult = await (window as any).configAPI.getConfigAndSchema(pluginId);
      const currentConfig = configResult?.config || {};
      const updatedSavedFilters = { ...currentConfig.savedFilters, [name]: newPreset };
      await (window as any).configAPI.savePluginConfig(pluginId, { ...currentConfig, savedFilters: updatedSavedFilters });
      setProgress(`Preset '${name}' saved.`);
    } catch (error) {
      console.error('Failed to save preset:', error);
      setProgress(`Error saving preset '${name}'.`);
    }
  }, [filterOptions, customPresets, pluginId]);

  // Delete custom filter
  const deleteCustomFilter = useCallback(async (name: string) => {
    const updatedPresets = customPresets.filter(p => p.name !== name);
    setCustomPresets(updatedPresets);
    if (selectedPreset === name) {
      setSelectedPreset(''); // Clear selection if deleted preset was active
    }

    try {
      const configResult = await (window as any).configAPI.getConfigAndSchema(pluginId);
      const currentConfig = configResult?.config || {};
      const updatedSavedFilters = { ...currentConfig.savedFilters };
      delete updatedSavedFilters[name];
      await (window as any).configAPI.savePluginConfig(pluginId, { ...currentConfig, savedFilters: updatedSavedFilters });
      setProgress(`Preset '${name}' deleted.`);
    } catch (error) {
      console.error('Failed to delete preset:', error);
      setProgress(`Error deleting preset '${name}'.`);
    }
  }, [customPresets, selectedPreset, pluginId]);

  // Persist last used filter options and path
  useEffect(() => {
    const saveLastUsedSettings = async () => {
      try {
        const configResult = await (window as any).configAPI.getConfigAndSchema(pluginId);
        const currentConfig = configResult?.config || {};
        await (window as any).configAPI.savePluginConfig(pluginId, {
          ...currentConfig,
          lastUsedFolderPath: rootPath,
          lastFileRegex: filterOptions.fileRegex,
          lastFileFilterType: filterOptions.fileFilterType,
          lastFolderRegex: filterOptions.folderRegex,
          lastFolderFilterType: filterOptions.folderFilterType,
          lastMaxDepth: filterOptions.maxDepth,
        });
      } catch (error) {
        console.error('Failed to save last used settings:', error);
      }
    };
    // Debounce saving to avoid too frequent writes
    const handler = setTimeout(() => {
      saveLastUsedSettings();
    }, 1000);
    return () => clearTimeout(handler);
  }, [rootPath, filterOptions, pluginId]);

  // Directory scanning with advanced filtering
  const scanDirectory = useCallback(async (startPath: string) => {
    if (!startPath) return;
    
    setScanning(true);
    setProgress('Scanning directory...');
    
    try {
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
          const items = await (window as any).fileSystemAPI.readDirectory(dirPath);
          const children: FileTreeNode[] = [];
          
          for (const item of items) {
            const fullPath = (window as any).utilityAPI.joinPosix(dirPath, item.name);
            
            if (item.type === 'directory') {
              if (shouldIncludeFolder(item.name)) {
                const childNode = await scanDir(fullPath, depth + 1);
                if (childNode && (childNode.children?.length || 0) > 0) {
                  children.push(childNode);
                }
              }
            } else if (item.type === 'file' && shouldIncludeFile(item.name)) {
              children.push({
                id: fullPath, // Use fullPath as ID for FileTree component
                name: item.name,
                type: 'file',
                data: { // Store additional data in 'data' property
                  path: fullPath,
                  size: item.size,
                  extension: (window as any).utilityAPI.extname(item.name)
                }
              });
            }
          }
          
          return {
            id: dirPath, // Use dirPath as ID for FileTree component
            name: (window as any).utilityAPI.basename(dirPath),
            type: 'folder', // Use 'folder' for directories
            children: children.sort((a, b) => {
              // Directories first, then files, both alphabetically
              if (a.type !== b.type) {
                return a.type === 'folder' ? -1 : 1;
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

  

  // Context generation
  const generateContext = useCallback(async () => {
    if (selectedFiles.size === 0) {
      setOutput('No files selected. Please select files to generate context.');
      return;
    }

    setGenerating(true);
    setProgress('');
    
    try {
      const files = Array.from(selectedFiles);
      let contextOutput = '';
      let totalChars = 0;
      
      for (let i = 0; i < files.length; i++) {
        const filePath = files[i];
        setProgress(`Reading file ${i + 1} of ${files.length}...`);
        
        try {
          const content = await (window as any).fileSystemAPI.readFile(filePath, 'utf8');
          const relativePath = (window as any).utilityAPI.relative(rootPath, filePath);
          const fileName = (window as any).utilityAPI.basename(filePath);
          
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
      await (window as any).fileSystemAPI.copyToClipboard(output);
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
    try {
      const selected = await (window as any).fileSystemAPI.selectFolder();
      if (selected && selected.length > 0) {
        scanDirectory(selected[0]);
      }
    } catch (error) {
      console.error('Error selecting folder:', error);
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
                onChange={(e) => applyPreset(e.target.value)}
                style={{ width: '100%', padding: '5px' }}
              >
                <option value="">-- Select Preset --</option>
                {allPresets.map(preset => (
                  <option key={preset.name} value={preset.name}>{preset.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '5px' }}>Save Preset As:</label>
              <Input
                type="text"
                value={newPresetName}
                onChange={(e) => setNewPresetName(e.target.value)}
                placeholder="New preset name"
                style={{ width: '100%' }}
              />
              <Button onClick={() => saveCustomFilter(newPresetName)} disabled={!newPresetName}>Save</Button>
              {selectedPreset && customPresets.some(p => p.name === selectedPreset) && (
                <Button onClick={() => deleteCustomFilter(selectedPreset)} style={{ marginLeft: '5px' }}>Delete</Button>
              )}
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
              <FileTree
                data={[fileTree]}
                onSelectionChange={(selectedIds) => setSelectedFiles(new Set(selectedIds))}
                defaultExpandedIds={Array.from(expandedIds)}
                onNodeClick={(node) => {
                  if (node.type === 'folder') {
                    setExpandedIds(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(node.id)) {
                        newSet.delete(node.id);
                      } else {
                        newSet.add(node.id);
                      }
                      return newSet;
                    });
                  }
                }}
              />
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
