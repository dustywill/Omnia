import React, { useState } from 'react';

export type AsBuiltDocumenterProps = {
  templates: string[];
  onLoad?: (file: File) => void;
};

export const AsBuiltDocumenter: React.FC<AsBuiltDocumenterProps> = ({
  templates,
  onLoad,
}) => {
  const [template, setTemplate] = useState('');
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
    </>
  );
};
