import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { openJsonEditor } from '../../src/ui/json-editor-api.js';

export type CustomerSite = {
  id: string;
  name: string;
  url: string;
};

export const scanCustomerSites = async (filePath: string): Promise<CustomerSite[]> => {
  const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
  const text = await fs.readFile(filePath, 'utf8');
  
  // Try JSON5 first, fallback to regular JSON
  try {
    const JSON5 = await loadNodeModule<any>('json5');
    return JSON5.parse(text);
  } catch {
    // Fallback to regular JSON
    return JSON.parse(text);
  }
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
    undefined, // No schema validation for now
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

// Main plugin component
const CustomerLinksPlugin: React.FC = () => {
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [filePath, setFilePath] = useState('config/customer-sites.json');

  useEffect(() => {
    const loadSites = async () => {
      try {
        const loadedSites = await scanCustomerSites(filePath);
        setSites(loadedSites);
      } catch (error) {
        console.error('Failed to load customer sites:', error);
        // Set some default sites for demo
        setSites([
          { id: '1', name: 'Example Company', url: 'https://example.com' },
          { id: '2', name: 'Another Site', url: 'https://another.com' }
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadSites();
  }, [filePath]);

  const handleGenerateHtml = async () => {
    try {
      const html = generateCustomerLinksHtml(sites);
      const css = `
        body { font-family: Arial, sans-serif; margin: 20px; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; padding: 10px; background: #f5f5f5; border-radius: 4px; }
        a { text-decoration: none; color: #007cba; font-weight: bold; }
        a:hover { text-decoration: underline; }
      `;
      const js = `console.log('Customer links page loaded');`;
      
      await saveCustomerLinksFiles(html, css, js, 'output/customer-links');
      alert('Customer links files generated successfully!');
    } catch (error) {
      console.error('Failed to generate files:', error);
      alert('Failed to generate files: ' + error);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Loading customer sites...</div>;
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2>Customer Links</h2>
      <p>Manage customer site links and generate HTML output.</p>
      
      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="file-path" style={{ display: 'block', marginBottom: '5px' }}>
          Configuration File:
        </label>
        <input
          id="file-path"
          type="text"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
          style={{ width: '100%', padding: '8px', marginBottom: '10px' }}
        />
        <button
          onClick={() => {
            setLoading(true);
            const loadSites = async () => {
              try {
                const loadedSites = await scanCustomerSites(filePath);
                setSites(loadedSites);
              } catch (error) {
                console.error('Failed to reload customer sites:', error);
                alert('Failed to load sites: ' + error);
              } finally {
                setLoading(false);
              }
            };
            loadSites();
          }}
          style={{
            padding: '8px 16px',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Reload Sites
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Current Sites ({sites.length})</h3>
        <CustomerLinks sites={sites} />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button
          onClick={handleGenerateHtml}
          style={{
            padding: '10px 20px',
            backgroundColor: '#007cba',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '10px'
          }}
        >
          Generate HTML Files
        </button>
        
        <button
          onClick={async () => {
            try {
              const editor = await openCustomerLocationsEditor(filePath);
              // In a real implementation, this would open the editor in a modal or new window
              console.log('Editor component:', editor);
              alert('JSON editor would open here (see console for component)');
            } catch (error) {
              console.error('Failed to open editor:', error);
              alert('Failed to open editor: ' + error);
            }
          }}
          style={{
            padding: '10px 20px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Edit Configuration
        </button>
      </div>

      <div style={{ fontSize: '12px', color: '#666', marginTop: '20px' }}>
        <p><strong>Note:</strong> This plugin manages customer site links and can generate static HTML files.</p>
        <ul>
          <li>Configure sites in JSON format</li>
          <li>Generate HTML, CSS, and JavaScript files</li>
          <li>Edit configuration with built-in JSON editor</li>
        </ul>
      </div>
    </div>
  );
};

export default CustomerLinksPlugin;
