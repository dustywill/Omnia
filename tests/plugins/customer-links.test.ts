import fs from 'fs/promises';
import path from 'path';
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { scanCustomerSites } from '../../plugins/customer-links/index.js';

describe('customer links plugin', () => {
  const dir = path.join(__dirname, 'data');
  const jsonPath = path.join(dir, 'customers.json5');

  beforeEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
    await fs.mkdir(dir, { recursive: true });
    const content = `[
      // test comment
      { id: 'acme', name: 'Acme Corp', url: 'https://acme.com' },
      { id: 'foo', name: 'Foo Inc', url: 'https://foo.example.com' },
    ]`;
    await fs.writeFile(jsonPath, content, 'utf8');
  });

  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('scans configurable JSON or JSON5 file for customer sites', async () => {
    const sites = await scanCustomerSites(jsonPath);
    expect(sites).toEqual([
      { id: 'acme', name: 'Acme Corp', url: 'https://acme.com' },
      { id: 'foo', name: 'Foo Inc', url: 'https://foo.example.com' },
    ]);
  });
});
