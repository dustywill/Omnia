import React from 'react';

export type JsonEditorProps = {
  initialContent: string;
  schema?: unknown;
  onChange?: (content: string) => void;
};

export const JsonEditor: React.FC<JsonEditorProps> = () => {
  return <div>JsonEditor not implemented</div>;
};
