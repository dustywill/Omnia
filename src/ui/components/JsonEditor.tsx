import React, { useEffect, useState } from 'react';
import { loadNodeModule } from '../node-module-loader.js';
import type { ZodType } from 'zod';


export type JsonEditorProps = {
  initialContent: string;
  schema?: ZodType<unknown>;
  onChange?: (content: string) => void;
};

export const JsonEditor: React.FC<JsonEditorProps> = ({
  initialContent,
  schema,
  onChange,
}) => {
  const [content, setContent] = useState(initialContent);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<Record<string, unknown>>({});

  const stringify = (obj: Record<string, unknown>): string =>
    JSON.stringify(obj).replace(/:/g, ': ').replace(/,/g, ', ');

  const parseJson = async (text: string) => {
    try {
      const JSON5 = await loadNodeModule<any>('json5');
      return JSON5.parse(text);
    } catch {
      // Fallback to regular JSON
      return JSON.parse(text);
    }
  };

  useEffect(() => {
    const updateContent = async () => {
      try {
        const parsed = await parseJson(content);
        if (
          typeof parsed === 'object' &&
          parsed !== null &&
          !Array.isArray(parsed)
        ) {
          setEntries(parsed as Record<string, unknown>);
        } else {
          setEntries({});
        }
        if (schema) {
          const result = schema.safeParse(parsed);
          setError(result.success ? null : 'Invalid content');
        } else {
          setError(null);
        }
      } catch {
        setError('Invalid content');
        setEntries({});
      }
      onChange?.(content);
    };
    updateContent();
  }, [content, schema, onChange]);

  const addEntry = async () => {
    try {
      const parsed = await parseJson(content) as Record<string, unknown>;
      parsed.new = '';
      const newContent = stringify(parsed);
      setContent(newContent);
    } catch {
      // ignore invalid JSON when adding entry
    }
  };

  const deleteEntry = async (key: string) => {
    try {
      const parsed = await parseJson(content) as Record<string, unknown>;
      delete parsed[key];
      const newContent = stringify(parsed);
      setContent(newContent);
    } catch {
      // ignore invalid JSON when deleting entry
    }
  };

  return (
    <div>
      <textarea
        aria-label="json-editor"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <div>{error}</div>}
      <button onClick={addEntry}>Add Entry</button>
      {Object.keys(entries).map((key) => (
        <button key={key} onClick={() => deleteEntry(key)}>{`Delete ${key}`}</button>
      ))}
    </div>
  );
};
