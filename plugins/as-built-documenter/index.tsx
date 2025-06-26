import React, { useState } from 'react';

export type AsBuiltDocumenterProps = {
  templates: string[];
};

export const AsBuiltDocumenter: React.FC<AsBuiltDocumenterProps> = ({ templates }) => {
  const [template, setTemplate] = useState('');
  return (
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
  );
};
