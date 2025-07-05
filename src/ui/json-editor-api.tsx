import { loadNodeModule } from "./node-module-loader.js";
import type { ZodType } from "zod";
import React from "react";
import { JsonEditor } from "./components/JsonEditor/JsonEditor.js";

export const openJsonEditor = async (
  filePath: string,
  schema?: ZodType<unknown>,
): Promise<React.ReactElement> => {
  const fs = await loadNodeModule<typeof import("fs/promises")>("fs/promises");
  const initialContent = await fs.readFile(filePath, "utf8");
  return <JsonEditor initialContent={initialContent} schema={schema} />;
};
