import React, { useState } from 'react';
import fs from 'fs/promises';
import path from 'path';
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export type AsBuiltDocumenterProps = {
  templates: string[];
  onLoad?: (file: File) => void;
  saveDir?: string;
  initialContent?: string;
  dataSources?: Record<string, { url: string }>;
};

export const AsBuiltDocumenter: React.FC<AsBuiltDocumenterProps> = ({
  templates,
  onLoad,
  saveDir = path.join('templates', 'as-built'),
  initialContent,
  dataSources = {},
}) => {
  const [template, setTemplate] = useState('');
  const [content, setContent] = useState(initialContent ?? '');

  const insertEach = () => {
    setContent((c: string) => `${c}{{#each items}}\n{{/each}}`);
  };

  const saveTemplate = async () => {
    await fs.mkdir(saveDir, { recursive: true });
    const file = path.join(saveDir, template || 'template.md');
    await fs.writeFile(file, content);
  };
  return (
    <>
      <select
        aria-label="Template File"
        value={template}
        onChange={(e) => setTemplate(e.target.value)}
      >
        <option value="">(none)</option>
        {templates.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <input
        type="file"
        accept=".md"
        aria-label="Load Template"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onLoad?.(file);
          }
        }}
      />
      <div>
        <button aria-label="Insert Each" onClick={insertEach}>
          Each
        </button>
      </div>
      <select aria-label="Data Source" value="" onChange={() => {}}>
        <option value="">(none)</option>
        {Object.keys(dataSources).map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      <CodeMirror
        aria-label="Template Editor"
        value={content}
        height="200px"
        extensions={[markdown()]}
        onChange={(v) => setContent(v)}
      />
      <button onClick={saveTemplate}>Save</button>
    </>
  );
};
