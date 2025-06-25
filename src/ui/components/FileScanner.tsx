
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
};

export const FileScanner: React.FC<FileScannerProps> = ({ tree }) => {

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
      <ul className="file-scanner">{filtered.map(renderNode)}</ul>
    </div>
  );

};
