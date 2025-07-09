import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '../../src/ui/components/Button/Button.js';
import { Input } from '../../src/ui/components/Input/Input.js';
import { FileTree, FileTreeNode } from '../../inspiration/components/FileTree.js';

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
    name: 'Common',
    folderRegex: 'node_modules|\\.git|\\.hg|logs|\\.qodo',
    folderFilterType: 'exclude',
    fileRegex: '',
    fileFilterType: 'include',
    maxDepth: -1
  },
  {
    name: 'PHP',
    folderRegex: 'node_modules|\\.git|\\.hg|logs|vendor|\\.qodo',
    folderFilterType: 'exclude',
    fileRegex: '\\.(php|inc|module|install)$',
    fileFilterType: 'include',
    maxDepth: -1
  }
];

export type ContextGeneratorProps = {
  initialPath?: string;
};

type FilterOptions = {
  fileRegex: string;
  fileFilterType: 'include' | 'exclude';
  folderRegex: string;
  folderFilterType: 'include' | 'exclude';
  maxDepth: number;
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
  
  // Get all file IDs from the tree
  const allFiles = useMemo(() => fileTree ? getAllFileIds([fileTree]) : new Set<string>(), [fileTree]);

  // Memoized and filtered file tree for search
  const filteredFileTree = useMemo(() => {
    if (!searchTerm) return fileTree;

    const lowerCaseSearchTerm = searchTerm.toLowerCase();

    const filterNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
      const result: FileTreeNode[] = [];
      for (const node of nodes) {
        if (node.type === 'file') {
          if (node.name.toLowerCase().includes(lowerCaseSearchTerm)) {
            result.push(node);
          }
        } else {
          const filteredChildren = filterNodes(node.children || []);
          if (node.name.toLowerCase().includes(lowerCaseSearchTerm) || filteredChildren.length > 0) {
            result.push({ ...node, children: filteredChildren });
          }
        }
      }
      return result;
    };

    return filterNodes(fileTree);
  }, [fileTree, searchTerm]);
  
  // UI state
  const [showFilters, setShowFilters] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  // Directory scanning with advanced filtering
  const scanDirectory = useCallback(async (startPath: string) => {
    if (!startPath || !window.fileSystemAPI) return;
    
    setScanning(true);
    setProgress('Scanning directory...');
    
    try {
      const tree = await window.fileSystemAPI.scanDirectory(startPath, {
        recursive: true,
        maxDepth: filterOptions.maxDepth,
        fileRegex: filterOptions.fileRegex,
        fileFilterType: filterOptions.fileFilterType,
        folderRegex: filterOptions.folderRegex,
        folderFilterType: filterOptions.folderFilterType,
      });
      
      const transformToNode = (item: any): FileTreeNode => ({
        id: item.path,
        name: item.name,
        type: item.type,
        children: item.children ? item.children.map(transformToNode) : [],
      });

      setFileTree(tree.children.map(transformToNode));
      setRootPath(startPath);
      
    } catch (error) {
      console.error('Failed to scan directory:', error);
      setProgress('Error scanning directory');
    } finally {
      setScanning(false);
      setProgress('');
    }
  }, [filterOptions]);

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

  // Initialize with current directory and load configuration
  useEffect(() => {
    const initializePlugin = async () => {
      setLoading(true);
      try {
        if (window.configAPI) {
          const configResult = await window.configAPI.getConfigAndSchema(pluginId);
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
        }

        const initPath = initialPath || (window.fileSystemAPI ? await window.fileSystemAPI.getRootPath() : '.');
        const finalPath = rootPath || initPath;
        setRootPath(finalPath);
        if (finalPath) {
          scanDirectory(finalPath);
        }
      } catch (error) {
        console.error('Failed to load plugin configuration:', error);
        const initPath = initialPath || (window.fileSystemAPI ? await window.fileSystemAPI.getRootPath() : '.');
        setRootPath(initPath);
        if (initPath) {
          scanDirectory(initPath);
        }
      } finally {
        setLoading(false);
      }
    };
    initializePlugin();
  }, [initialPath, scanDirectory, pluginId]);

  // Apply preset when selected
  useEffect(() => {
    if (selectedPreset) {
      applyPreset(selectedPreset);
    }
  }, [selectedPreset, applyPreset]);

  // Save custom filter
  const saveCustomFilter = useCallback(async (name: string) => {
    if (!name || !window.configAPI) return;
    const newPreset: FilterPreset = { name, ...filterOptions };
    const updatedPresets = [...customPresets.filter(p => p.name !== name), newPreset];
    setCustomPresets(updatedPresets);
    setSelectedPreset(name);

    try {
      const configResult = await window.configAPI.getConfigAndSchema(pluginId);
      const currentConfig = configResult?.config || {};
      const updatedSavedFilters = { ...currentConfig.savedFilters, [name]: newPreset };
      await window.configAPI.savePluginConfig(pluginId, { ...currentConfig, savedFilters: updatedSavedFilters });
      setProgress(`Preset '${name}' saved.`);
    } catch (error) {
      console.error('Failed to save preset:', error);
      setProgress(`Error saving preset '${name}'.`);
    }
  }, [filterOptions, customPresets, pluginId]);

  // Delete custom filter
  const deleteCustomFilter = useCallback(async (name: string) => {
    if (!window.configAPI) return;
    const updatedPresets = customPresets.filter(p => p.name !== name);
    setCustomPresets(updatedPresets);
    if (selectedPreset === name) {
      setSelectedPreset(''); // Clear selection if deleted preset was active
    }

    try {
      const configResult = await window.configAPI.getConfigAndSchema(pluginId);
      const currentConfig = configResult?.config || {};
      const updatedSavedFilters = { ...currentConfig.savedFilters };
      delete updatedSavedFilters[name];
      await window.configAPI.savePluginConfig(pluginId, { ...currentConfig, savedFilters: updatedSavedFilters });
      setProgress(`Preset '${name}' deleted.`);
    } catch (error) {
      console.error('Failed to delete preset:', error);
      setProgress(`Error deleting preset '${name}'.`);
    }
  }, [customPresets, selectedPreset, pluginId]);

  // Persist last used filter options and path
  useEffect(() => {
    const saveLastUsedSettings = async () => {
      if (!window.configAPI) return;
      try {
        const configResult = await window.configAPI.getConfigAndSchema(pluginId);
        const currentConfig = configResult?.config || {};
        await window.configAPI.savePluginConfig(pluginId, {
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

  // Context generation
  const generateContext = useCallback(async () => {
    if (selectedFiles.size === 0 || !window.fileSystemAPI || !window.utilityAPI) {
      setOutput('No files selected or APIs not available.');
      return;
    }

    setGenerating(true);
    setProgress('');
    
    try {
      const files = Array.from(selectedFiles);
      let contextOutput = '';
      let totalChars = 0;
      
      const contents = await window.fileSystemAPI.readFiles(files);

      for (const fileContent of contents) {
        if (fileContent.status === 'fulfilled') {
          const { path, content } = fileContent.value;
          const relativePath = window.utilityAPI.relative(rootPath, path);
          const fileName = window.utilityAPI.basename(path);
          
          contextOutput += `---\nFile: ${fileName}\nPath: ${relativePath.replace(/\\/g, '/')}\n---\n\n`;
          contextOutput += '```\n' + content + '\n```\n\n';
          totalChars += content.length;
        } else {
          contextOutput += `---\nError reading ${fileContent.reason.path}: ${fileContent.reason.error}\n---\n\n`;
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
      // Use navigator.clipboard as fallback if available
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(output);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        // Fallback to manual copy
        const textArea = document.createElement('textarea');
        textArea.value = output;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
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
    if (!window.fileSystemAPI) return;
    try {
      // Use prompt as fallback since selectFolder may not be available
      const folderPath = prompt('Enter the folder path to scan:');
      if (folderPath) {
        scanDirectory(folderPath);
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
                onChange={(e) => setFilterOptions(prev => ({ ...prev, maxDepth: parseInt(e.target.value) || -1 }))}
                min="-1"
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
          <div style={{ height: '300px', overflowY: 'auto' }}>
            {filteredFileTree.length > 0 ? (
              <FileTree
                data={filteredFileTree}
                onSelectionChange={(ids) => setSelectedFiles(new Set(ids.filter(id => allFiles.has(id))))}
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
                {scanning ? 'Scanning...' : 'No files found matching your criteria.'}
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

function getAllFileIds(nodes: FileTreeNode[]): Set<string> {
    const fileIds = new Set<string>();
    function traverse(node: FileTreeNode) {
        if (node.type === 'file') {
            fileIds.add(node.id);
        }
        if (node.children) {
            node.children.forEach(traverse);
        }
    }
    nodes.forEach(traverse);
    return fileIds;
}

export default ContextGenerator;
