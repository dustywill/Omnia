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
