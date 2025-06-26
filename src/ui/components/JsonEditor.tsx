import React, { useEffect, useState } from 'react';
import { parse as parseJson5 } from 'json5';
import type { ZodType } from 'zod';

import './JsonEditor.css';

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

  useEffect(() => {
    try {
      const parsed = parseJson5(content);
      if (schema) {
        const result = schema.safeParse(parsed);
        setError(result.success ? null : 'Invalid content');
      } else {
        setError(null);
      }
    } catch {
      setError('Invalid content');
    }
    onChange?.(content);
  }, [content, schema, onChange]);

  return (
    <div>
      <textarea
        aria-label="json-editor"
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      {error && <div>{error}</div>}
    </div>
  );
};
