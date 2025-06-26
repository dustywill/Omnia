
import React, { useState } from 'react';

import './FileScanner.css';

export type FileNode = {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileNode[];
};

export type FileScannerProps = {
  tree: FileNode[];
  selectRootFolder?: () => Promise<string>;
  presets?: string[];
  onSavePreset?: (name: string) => void;
};

export const FileScanner: React.FC<FileScannerProps> = ({
  tree,
  selectRootFolder,
  presets = [],
  onSavePreset,
}) => {

  const [query, setQuery] = useState('');

  const filterTree = (nodes: FileNode[]): FileNode[] => {
    if (!query) return nodes;
    const q = query.toLowerCase();
    return nodes
      .map((n) => {
        const children = n.children ? filterTree(n.children) : [];
        const match = n.name.toLowerCase().includes(q);
        if (match || children.length) {
          return { ...n, children };
        }
        return null;
      })
      .filter(Boolean) as FileNode[];
  };

  const [rootPath, setRootPath] = useState<string | undefined>();
  const [presetName, setPresetName] = useState('');
  const [presetList, setPresetList] = useState<string[]>(presets);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();

  const filtered = filterTree(tree);

  const renderNode = (node: FileNode) => (
    <li key={node.path}>
      <label>
        <input type="checkbox" aria-label={node.name} />
        {node.name}
      </label>
      {node.isDirectory && node.children && (
        <ul>{node.children.map(renderNode)}</ul>
      )}
    </li>
  );


  return (
    <div>
      <input
        placeholder="Search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {selectRootFolder && (
        <button
          type="button"
          onClick={async () => {
            const path = await selectRootFolder();
            setRootPath(path);
          }}
        >
          Select Root Folder
        </button>
      )}
      {rootPath && <div>{rootPath}</div>}
      <select
        value={selectedPreset}
        onChange={(e) => setSelectedPreset(e.target.value)}
        aria-label="Preset Selector"
      >
        {presetList.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </select>
      <input
        placeholder="Filter Name"
        value={presetName}
        onChange={(e) => setPresetName(e.target.value)}
      />
      <button
        type="button"
        onClick={() => {
          if (!presetName) return;
          setPresetList([...presetList, presetName]);
          setSelectedPreset(presetName);
          onSavePreset?.(presetName);
          setPresetName('');
        }}
      >
        Save Preset
      </button>
      <ul className="file-scanner">{filtered.map(renderNode)}</ul>
    </div>
  );

};
