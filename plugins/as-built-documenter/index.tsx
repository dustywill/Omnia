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
  const [sourceId, setSourceId] = useState('');
  const [sample, setSample] = useState<unknown>(null);
  const [copied, setCopied] = useState(false);

  const insertEach = () => {
    setContent((c: string) => `${c}{{#each items}}\n{{/each}}`);
  };

  const saveTemplate = async () => {
    await fs.mkdir(saveDir, { recursive: true });
    const file = path.join(saveDir, template || 'template.md');
    await fs.writeFile(file, content);
  };

  const handleCopyField = async (field: string) => {
    await navigator.clipboard.writeText(field);
    setCopied(true);
  };

  const handleCopyLoop = async () => {
    await navigator.clipboard.writeText('{{#each items}}');
    setCopied(true);
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
      <select
        aria-label="Data Source"
        value={sourceId}
        onChange={(e) => setSourceId(e.target.value)}
      >
        <option value="">(none)</option>
        {Object.keys(dataSources).map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={async () => {
          if (!sourceId) return;
          const data = await (window as any).ipcRenderer.invoke(
            'load-sample-data',
            { id: sourceId, ...dataSources[sourceId] },
          );
          setSample(data);
          setCopied(false);
        }}
      >
        Load Sample Data
      </button>
      {Array.isArray(sample) && sample.length > 0 && (
        <>
          <table>
            <thead>
              <tr>
                <th>Field</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys((sample as any)[0]).map((key: string) => (
                <tr key={key}>
                  <td>{key}</td>
                  <td>
                    <button
                      type="button"
                      aria-label={`Copy Field ${key}`}
                      onClick={() => handleCopyField(key)}
                    >
                      Copy Field
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" aria-label="Copy Loop" onClick={handleCopyLoop}>
            Copy Loop
          </button>
        </>
      )}
      {sample && !Array.isArray(sample) && <pre>{JSON.stringify(sample, null, 2)}</pre>}
      {copied && <div>Copied to clipboard</div>}
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
