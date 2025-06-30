import fs from 'fs/promises';
import path from 'path';
import { describe, it, beforeEach, afterEach, expect } from '@jest/globals';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
    // ensure Node require path is used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).fetch = undefined;
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

  it('saves generated HTML, CSS, and JS to output path', async () => {
    const { saveCustomerLinksFiles } = await import(
      '../../plugins/customer-links/index.js'
    );
    const outDir = path.join(dir, 'out');
    await fs.mkdir(outDir, { recursive: true });

    await saveCustomerLinksFiles(
      '<html></html>',
      'body{}',
      'console.log(1);',
      outDir,
    );

    const html = await fs.readFile(path.join(outDir, 'index.html'), 'utf8');
    const css = await fs.readFile(path.join(outDir, 'style.css'), 'utf8');
    const js = await fs.readFile(path.join(outDir, 'script.js'), 'utf8');

    expect(html).toBe('<html></html>');
    expect(css).toBe('body{}');
    expect(js).toBe('console.log(1);');
  });

  it('launches JsonEditor to modify Customers.json and update locations', async () => {
    const customersPath = path.join(dir, 'Customers.json');
    await fs.writeFile(
      customersPath,
      '[{"id":"acme","name":"Acme","url":"https://acme.com"}]',
      'utf8',
    );

    const { openCustomerLocationsEditor } = await import(
      '../../plugins/customer-links/index.js'
    );

    const element = await openCustomerLocationsEditor(customersPath);
    const user = userEvent.setup();
    render(element);
    const textbox = screen.getByRole('textbox');
    await user.clear(textbox);
    await user.paste('[{"id":"foo","name":"Foo","url":"https://foo.com"}]');

    await waitFor(async () => {
      const text = await fs.readFile(customersPath, 'utf8');
      expect(text).toBe('[{"id":"foo","name":"Foo","url":"https://foo.com"}]');
    });
  });
});
