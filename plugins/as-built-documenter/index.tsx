import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
const fs = loadNodeModule<typeof import('fs/promises')>('fs/promises');
const path = loadNodeModule<typeof import('path')>('path');
import CodeMirror from '@uiw/react-codemirror';
import { markdown } from '@codemirror/lang-markdown';

export type AsBuiltDocumenterProps = {
  templates: string[];
  onLoad?: (file: File) => void;
  saveDir?: string;
  initialContent?: string;
  dataSources?: Record<string, { url: string }>;
  configPath?: string;
};

export const AsBuiltDocumenter: React.FC<AsBuiltDocumenterProps> = ({
  templates,
  onLoad,
  saveDir = path.join('templates', 'as-built'),
  initialContent,
  dataSources = {},
  configPath,
}) => {
  const [template, setTemplate] = useState('');
  const [content, setContent] = useState(initialContent ?? '');
  const [sourceId, setSourceId] = useState('');
  const [sources, setSources] = useState<Record<string, { url: string }>>(dataSources);
  const [sample, setSample] = useState<unknown>(null);
  const [sampleIndex, setSampleIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [config, setConfig] = useState('');

  useEffect(() => {
    const loadConfig = async () => {
      if (!configPath) return;
      try {
        const text = await fs.readFile(configPath, 'utf8');
        setConfig(text);
      } catch {
        setConfig('');
      }
    };
    loadConfig();
  }, [configPath]);

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
        {Object.keys(sources).map((id) => (
          <option key={id} value={id}>
            {id}
          </option>
        ))}
      </select>
      {configPath && (
        <button
          type="button"
          aria-label="Add Data Source"
          onClick={async () => {
            const id = window.prompt('Data Source ID');
            if (!id) return;
            const url = window.prompt('Data Source URL');
            if (!url) return;
            const next = { ...sources, [id]: { url } };
            setSources(next);
            setConfig(JSON.stringify(next, null, 2));
            if (configPath) {
              await fs.writeFile(configPath, JSON.stringify(next, null, 2));
            }
          }}
        >
          Add Data Source
        </button>
      )}
      <button
        type="button"
        onClick={async () => {
          if (!sourceId) return;
          const res = await fetch(sources[sourceId].url);
          const data = await res.json();
          setSample(data);
          setSampleIndex(0);
          setCopied(false);
        }}
      >
        Load Sample Data
      </button>
      {Array.isArray(sample) && sample.length > 0 && (
        <>
          <div>
            <button
              type="button"
              aria-label="Prev Sample"
              disabled={sampleIndex === 0}
              onClick={() => setSampleIndex((i) => Math.max(i - 1, 0))}
            >
              Prev
            </button>
            <button
              type="button"
              aria-label="Next Sample"
              disabled={sampleIndex === (sample as any).length - 1}
              onClick={() =>
                setSampleIndex((i) =>
                  Math.min(i + 1, (sample as any).length - 1),
                )
              }
            >
              Next
            </button>
          </div>
          <pre>{JSON.stringify((sample as any)[sampleIndex], null, 2)}</pre>
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
      {configPath && (
        <>
          <textarea
            aria-label="Configuration Editor"
            value={config}
            onChange={(e) => setConfig(e.target.value)}
          />
          <button
            type="button"
            onClick={async () => {
              if (configPath) {
                await fs.writeFile(configPath, config);
              }
            }}
          >
            Save Config
          </button>
        </>
      )}
      <button onClick={saveTemplate}>Save</button>
    </>
  );
};
