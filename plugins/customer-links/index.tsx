import React from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { openJsonEditor } from '../../src/ui/json-editor-api.js';
import { parse as parseJson5 } from 'json5';
import { z } from 'zod';

const CustomerSiteSchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
});

export type CustomerSite = z.infer<typeof CustomerSiteSchema>;

const CustomerSitesSchema = z.array(CustomerSiteSchema);

export const scanCustomerSites = async (filePath: string): Promise<CustomerSite[]> => {
  const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
  const text = await fs.readFile(filePath, 'utf8');
  const data = parseJson5(text);
  return CustomerSitesSchema.parse(data);
};

export const generateCustomerLinksHtml = (sites: CustomerSite[]): string => {
  const listItems = sites
    .map((site) => `<li><a href="${site.url}">${site.name}</a></li>`)
    .join('');
  return `<!DOCTYPE html><html><body><ul>${listItems}</ul></body></html>`;
};

export const saveCustomerLinksFiles = async (
  html: string,
  css: string,
  js: string,
  outDir: string,
): Promise<void> => {
  const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
  const path = await loadNodeModule<typeof import('path')>('path');
  await fs.mkdir(outDir, { recursive: true });
  await fs.writeFile(path.join(outDir, 'index.html'), html);
  await fs.writeFile(path.join(outDir, 'style.css'), css);
  await fs.writeFile(path.join(outDir, 'script.js'), js);
};

export const openCustomerLocationsEditor = async (
  filePath: string,
): Promise<React.ReactElement> => {
  const element = (await openJsonEditor(
    filePath,
    CustomerSitesSchema,
  )) as React.ReactElement<any>;
  return React.cloneElement(element, {
    onChange: async (content: string) => {
      const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
      await fs.writeFile(filePath, content);
    },
  });
};

export type CustomerLinksProps = {
  sites: CustomerSite[];
};

export const CustomerLinks: React.FC<CustomerLinksProps> = ({ sites }) => {
  return (
    <ul>
      {sites.map((site) => (
        <li key={site.id}>
          <a href={site.url}>{site.name}</a>
        </li>
      ))}
    </ul>
  );
};
