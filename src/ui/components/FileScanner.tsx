
import React, { useState } from 'react';


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
  onDeletePreset?: (name: string) => void;
  onToggleFile?: (path: string, checked: boolean) => void;
  onApplyFilters?: (settings: {
    query: string;
    maxDepth?: number;
    folderRegexMode: 'include' | 'exclude';
    fileRegexMode: 'include' | 'exclude';
  }) => void;
};

export const FileScanner: React.FC<FileScannerProps> = ({
  tree,
  selectRootFolder,
  presets = [],
  onSavePreset,
  onDeletePreset,
  onToggleFile,
  onApplyFilters,
}) => {

  const [query, setQuery] = useState('');
  const [maxDepth, setMaxDepth] = useState<number | undefined>();

  const filterTree = (nodes: FileNode[], depth = 0): FileNode[] => {
    const withinDepth =
      maxDepth === undefined ? true : depth <= maxDepth;
    const filteredNodes = nodes
      .map((n) => {
        const children =
          n.children && withinDepth ? filterTree(n.children, depth + 1) : [];
        const match = query
          ? n.name.toLowerCase().includes(query.toLowerCase())
          : true;
        if (match && withinDepth) {
          return { ...n, children };
        }
        if (children.length) {
          return { ...n, children };
        }
        return null;
      })
      .filter(Boolean) as FileNode[];
    return filteredNodes;
  };

  const [rootPath, setRootPath] = useState<string | undefined>();
  const [presetName, setPresetName] = useState('');
  const [presetList, setPresetList] = useState<string[]>(presets);
  const [selectedPreset, setSelectedPreset] = useState<string | undefined>();
  const [folderRegexMode, setFolderRegexMode] = useState<'include' | 'exclude'>(
    'include',
  );
  const [fileRegexMode, setFileRegexMode] = useState<'include' | 'exclude'>(
    'include',
  );

  const filtered = filterTree(tree);

  const renderNode = (node: FileNode) => (
    <li key={node.path}>
      <label>
        <input
          type="checkbox"
          aria-label={node.name}
          onChange={(e) => onToggleFile?.(node.path, e.target.checked)}
        />
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
      <button
        type="button"
        onClick={() => {
          if (!selectedPreset) return;
          onSavePreset?.(selectedPreset);
        }}
        disabled={!selectedPreset}
      >
        Save Filter
      </button>
      <button
        type="button"
        onClick={() => {
          if (!selectedPreset) return;
          setPresetList(presetList.filter((p) => p !== selectedPreset));
          onDeletePreset?.(selectedPreset);
          setSelectedPreset(undefined);
        }}
        disabled={!selectedPreset}
      >
        Delete Filter
      </button>
      <fieldset>
        <legend>Folder Regex Mode</legend>
        <label>
          <input
            type="radio"
            name="folder-mode"
            value="include"
            checked={folderRegexMode === 'include'}
            onChange={() => setFolderRegexMode('include')}
          />
          Include Folders
        </label>
        <label>
          <input
            type="radio"
            name="folder-mode"
            value="exclude"
            checked={folderRegexMode === 'exclude'}
            onChange={() => setFolderRegexMode('exclude')}
          />
          Exclude Folders
        </label>
      </fieldset>
      <fieldset>
        <legend>File Regex Mode</legend>
        <label>
          <input
            type="radio"
            name="file-mode"
            value="include"
            checked={fileRegexMode === 'include'}
            onChange={() => setFileRegexMode('include')}
          />
          Include Files
        </label>
        <label>
          <input
            type="radio"
            name="file-mode"
            value="exclude"
            checked={fileRegexMode === 'exclude'}
            onChange={() => setFileRegexMode('exclude')}
          />
          Exclude Files
        </label>
      </fieldset>
      <label>
        Max Depth
        <input
          type="number"
          aria-label="Max Depth"
          value={maxDepth ?? ''}
          onChange={(e) => {
            const value = e.target.value;
            setMaxDepth(value === '' ? undefined : Number(value));
          }}
        />
      </label>
      <button
        type="button"
        onClick={() =>
          onApplyFilters?.({
            query,
            maxDepth,
            folderRegexMode,
            fileRegexMode,
          })
        }
      >
        Apply Filters
      </button>
      <ul className="file-scanner">{filtered.map(renderNode)}</ul>
    </div>
  );

};
