import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { FileScanner, type FileNode } from '../../src/ui/components/FileScanner.js';

export type ContextGeneratorProps = {
  tree?: FileNode[];
};

const ContextGenerator: React.FC<ContextGeneratorProps> = ({ tree: providedTree }) => {
  const [tree, setTree] = useState<FileNode[]>(providedTree || []);
  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ index: number; total: number; chars: number } | null>(null);
  const [context, setContext] = useState('');
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);

  // Load file tree if not provided
  useEffect(() => {
    if (!providedTree || providedTree.length === 0) {
      loadFileTree();
    }
  }, []);

  const loadFileTree = async () => {
    try {
      setLoading(true);
      const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
      const path = await loadNodeModule<typeof import('path')>('path');
      
      const scanDirectory = async (dirPath: string, depth = 0): Promise<FileNode[]> => {
        if (depth > 3) return []; // Limit depth to prevent infinite loops
        
        try {
          const items = await fs.readdir(dirPath, { withFileTypes: true });
          const nodes: FileNode[] = [];
          
          for (const item of items) {
            // Skip common unwanted directories
            if (item.name.startsWith('.') || 
                ['node_modules', 'dist', 'build', 'coverage', '.git'].includes(item.name)) {
              continue;
            }
            
            const fullPath = path.join(dirPath, item.name);
            
            if (item.isDirectory()) {
              const children = await scanDirectory(fullPath, depth + 1);
              nodes.push({
                name: item.name,
                path: fullPath,
                isDirectory: true,
                children
              });
            } else if (item.isFile() && (
              item.name.endsWith('.ts') || 
              item.name.endsWith('.tsx') || 
              item.name.endsWith('.js') || 
              item.name.endsWith('.jsx') ||
              item.name.endsWith('.md') ||
              item.name.endsWith('.json')
            )) {
              nodes.push({
                name: item.name,
                path: fullPath,
                isDirectory: false
              });
            }
          }
          
          return nodes;
        } catch (error) {
          console.warn(`Failed to scan directory ${dirPath}:`, error);
          return [];
        }
      };
      
      // Get current working directory
      const cwd = typeof process !== 'undefined' ? process.cwd() : '.';
      const fileTree = await scanDirectory(cwd);
      setTree(fileTree);
      
    } catch (error) {
      console.error('Failed to load file tree:', error);
      setTree([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (path: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, path] : prev.filter((p) => p !== path),
    );
  };

  const handleGenerate = async () => {
    const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
    const total = selected.length;
    let chars = 0;
    let ctx = '';
    setOutput('');
    for (let i = 0; i < selected.length; i++) {
      const content = await fs.readFile(selected[i], 'utf8');
      chars += content.length;
      ctx += content;
      const progressText = `Step ${i + 1}/${total} Chars: ${chars}`;
      setProgress({ index: i + 1, total, chars });
      setOutput((prev) => prev + progressText + '\n');
    }
    setContext(ctx);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(context);
    setCopied(true);
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
    <div>
      <h3>Context Generator</h3>
      <p>Select files to include in your context generation:</p>
      <FileScanner tree={tree} onToggleFile={handleToggle} />
      <button type="button" onClick={handleGenerate}>Generate Context</button>
      {progress && (
        <div>
          Progress: {progress.index}/{progress.total} Characters: {progress.chars}
        </div>
      )}
      {output && (
        <textarea aria-label="Context Output" readOnly value={output} />
      )}
      {context && (
        <button type="button" onClick={handleCopy}>
          Copy to Clipboard
        </button>
      )}
      {copied && <div>Copied to clipboard</div>}
      <ul>
        {selected.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
};

export default ContextGenerator;
