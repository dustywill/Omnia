import fs from 'fs/promises';
import path from 'path';
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import {
  scanCustomerSites,
  generateCustomerLinksHtml,
  CustomerLinks,
} from '../../plugins/customer-links/index.js';

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
  it('generates standalone HTML and renders it', () => {
    const sites = [
      { id: 'acme', name: 'Acme Corp', url: 'https://acme.com' },
      { id: 'foo', name: 'Foo Inc', url: 'https://foo.example.com' },
    ];

    const html = generateCustomerLinksHtml(sites);
    expect(html).toContain('<a href="https://acme.com">Acme Corp</a>');
    expect(html).toContain('<a href="https://foo.example.com">Foo Inc</a>');

    render(<CustomerLinks sites={sites} />);
    expect(screen.getByText('Acme Corp').getAttribute('href')).toBe('https://acme.com');
    expect(screen.getByText('Foo Inc').getAttribute('href')).toBe('https://foo.example.com');
  });
});
