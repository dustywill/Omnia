import React, { useEffect, useState } from 'react';
import { parse as parseJson5 } from 'json5';
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

  useEffect(() => {
    try {
      const parsed = parseJson5(content);
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
  }, [content, schema, onChange]);

  const addEntry = () => {
    try {
      const parsed = parseJson5(content) as Record<string, unknown>;
      parsed.new = '';
      const newContent = stringify(parsed);
      setContent(newContent);
    } catch {
      // ignore invalid JSON when adding entry
    }
  };

  const deleteEntry = (key: string) => {
    try {
      const parsed = parseJson5(content) as Record<string, unknown>;
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
