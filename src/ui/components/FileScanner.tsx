import React from 'react';
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

  return <ul className="file-scanner">{tree.map(renderNode)}</ul>;
};
