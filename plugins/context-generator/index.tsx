import React, { useState } from 'react';
import { FileScanner, type FileNode } from '../../src/ui/components/FileScanner.js';

export type ContextGeneratorProps = {
  tree: FileNode[];
};

export const ContextGenerator: React.FC<ContextGeneratorProps> = ({ tree }) => {
  const [selected, setSelected] = useState<string[]>([]);

  const handleToggle = (path: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, path] : prev.filter((p) => p !== path),
    );
  };

  return (
    <div>
      <FileScanner tree={tree} onToggleFile={handleToggle} />
      <ul>
        {selected.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
};
