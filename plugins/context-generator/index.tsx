import React, { useState } from 'react';
import fs from 'fs/promises';
import { FileScanner, type FileNode } from '../../src/ui/components/FileScanner.js';

export type ContextGeneratorProps = {
  tree: FileNode[];
};

export const ContextGenerator: React.FC<ContextGeneratorProps> = ({ tree }) => {
  const [selected, setSelected] = useState<string[]>([]);
  const [progress, setProgress] = useState<{ index: number; total: number; chars: number } | null>(null);

  const handleToggle = (path: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, path] : prev.filter((p) => p !== path),
    );
  };

  const handleGenerate = async () => {
    const total = selected.length;
    let chars = 0;
    for (let i = 0; i < selected.length; i++) {
      const content = await fs.readFile(selected[i], 'utf8');
      chars += content.length;
      setProgress({ index: i + 1, total, chars });
    }
  };

  return (
    <div>
      <FileScanner tree={tree} onToggleFile={handleToggle} />
      <button type="button" onClick={handleGenerate}>Generate Context</button>
      {progress && (
        <div>
          Progress: {progress.index}/{progress.total} Characters: {progress.chars}
        </div>
      )}
      <ul>
        {selected.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </div>
  );
};
