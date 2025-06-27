import React from 'react';
import fs from 'fs/promises';
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
