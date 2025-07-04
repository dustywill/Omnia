import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { Card } from '../../src/ui/components/Card/Card.js';
import { Button } from '../../src/ui/components/Button/Button.js';
import { Badge } from '../../src/ui/components/Badge/Badge.js';
import { Grid } from '../../src/ui/components/Grid/Grid.js';
// @ts-ignore
import { createSchemas } from './config-schema.js';

// Type definitions
export type CustomerLinksConfig = {
  configFilePath: string;
  outputDirectory: string;
  title: string;
  showDescription: boolean;
  autoReload: boolean;
  htmlTemplate: 'simple' | 'styled' | 'cards';
  customCss: string;
  openAfterGenerate: boolean;
  validateUrls: boolean;
  maxSites: number;
};

export type CustomerSite = {
  id: string;
  name: string;
  url: string;
};

// Default configuration
export const defaultConfig: CustomerLinksConfig = {
  configFilePath: 'config/customer-sites.json',
  outputDirectory: 'output/customer-links',
  title: 'Customer Links',
  showDescription: true,
  autoReload: false,
  htmlTemplate: 'styled',
  customCss: '',
  openAfterGenerate: false,
  validateUrls: true,
  maxSites: 100
};

// Configuration schema export for the plugin system
// Export config schema factory function
export const configSchema = async () => {
  const { CustomerLinksConfigSchema } = await createSchemas();
  return CustomerLinksConfigSchema;
};

// Utility functions
export const scanCustomerSites = async (filePath: string): Promise<CustomerSite[]> => {
  const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
  const text = await fs.readFile(filePath, 'utf8');
  
  try {
    const JSON5 = await loadNodeModule<any>('json5');
    return JSON5.parse(text);
  } catch {
    return JSON.parse(text);
  }
};

export const generateCustomerLinksHtml = (
  sites: CustomerSite[], 
  config: CustomerLinksConfig
): string => {
  const { title, htmlTemplate, customCss } = config;
  
  let listContent = '';
  let styles = '';
  
  switch (htmlTemplate) {
    case 'simple':
      listContent = sites
        .map((site) => `<li><a href="${site.url}">${site.name}</a></li>`)
        .join('');
      styles = `
        body { font-family: Arial, sans-serif; margin: 20px; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 5px 0; }
        a { color: #007cba; text-decoration: none; }
        a:hover { text-decoration: underline; }
      `;
      break;
      
    case 'cards':
      listContent = sites
        .map((site) => `
          <div class="card">
            <h3><a href="${site.url}">${site.name}</a></h3>
            <p class="url">${site.url}</p>
          </div>
        `).join('');
      styles = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; }
        h1 { color: #333; text-align: center; margin-bottom: 30px; }
        .cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .card h3 { margin: 0 0 10px 0; }
        .card a { color: #007cba; text-decoration: none; font-weight: 500; }
        .card a:hover { text-decoration: underline; }
        .url { color: #666; font-size: 14px; margin: 0; word-break: break-all; }
      `;
      break;
      
    default: // styled
      listContent = sites
        .map((site) => `
          <li class="site-item">
            <a href="${site.url}" class="site-link">${site.name}</a>
            <span class="site-url">${site.url}</span>
          </li>
        `).join('');
      styles = `
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { color: #333; border-bottom: 2px solid #007cba; padding-bottom: 10px; }
        ul { list-style-type: none; padding: 0; }
        .site-item { 
          margin: 15px 0; 
          padding: 15px; 
          background: #f8f9fa; 
          border-radius: 6px; 
          border-left: 4px solid #007cba;
          transition: background-color 0.2s ease;
        }
        .site-item:hover { background: #e9ecef; }
        .site-link { 
          color: #007cba; 
          text-decoration: none; 
          font-weight: 600; 
          font-size: 18px;
          display: block;
          margin-bottom: 5px;
        }
        .site-link:hover { text-decoration: underline; }
        .site-url { color: #666; font-size: 14px; }
      `;
  }
  
  const containerClass = htmlTemplate === 'cards' ? 'cards' : '';
  const containerTag = htmlTemplate === 'cards' ? 'div' : 'ul';
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    ${styles}
    ${customCss}
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <${containerTag} class="${containerClass}">
      ${listContent}
    </${containerTag}>
  </div>
</body>
</html>`;
};

export const saveCustomerLinksFiles = async (
  html: string,
  config: CustomerLinksConfig
): Promise<void> => {
  const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
  const path = await loadNodeModule<typeof import('path')>('path');
  
  await fs.mkdir(config.outputDirectory, { recursive: true });
  await fs.writeFile(path.join(config.outputDirectory, 'index.html'), html);
  
  // Create a simple CSS file for external styling if needed
  const css = `/* Generated by Customer Links Plugin */\n/* Customize as needed */\n`;
  await fs.writeFile(path.join(config.outputDirectory, 'style.css'), css);
};

// Main configured plugin component
interface CustomerLinksPluginProps {
  config?: CustomerLinksConfig;
}

const CustomerLinksPlugin: React.FC<CustomerLinksPluginProps> = ({ config: providedConfig }) => {
  // Use provided config or fall back to default
  const config = providedConfig || defaultConfig;
  const [sites, setSites] = useState<CustomerSite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadSites();
  }, [config.configFilePath]);

  const loadSites = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedSites = await scanCustomerSites(config.configFilePath);
      
      // Apply max sites limit
      const limitedSites = loadedSites.slice(0, config.maxSites);
      setSites(limitedSites);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load customer sites';
      setError(errorMessage);
      
      // Set demo sites as fallback
      setSites([
        { id: '1', name: 'Example Company', url: 'https://example.com' },
        { id: '2', name: 'Another Site', url: 'https://another.com' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHtml = async () => {
    try {
      setGenerating(true);
      
      const html = generateCustomerLinksHtml(sites, config);
      await saveCustomerLinksFiles(html, config);
      
      // Show success message
      alert(`Customer links files generated successfully in ${config.outputDirectory}!`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate files';
      console.error('Generation failed:', err);
      alert('Failed to generate files: ' + errorMessage);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Card className="max-w-2xl mx-auto">
        <div className="text-center py-8">
          <p className="text-theme-secondary">Loading customer sites...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-theme-primary">{config.title}</h2>
            {config.showDescription && (
              <p className="text-theme-secondary">
                Manage customer site links and generate HTML output files with configurable templates.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="info" size="sm">
              Template: {config.htmlTemplate}
            </Badge>
            <Badge variant="neutral" size="sm">
              {sites.length} sites
            </Badge>
          </div>
        </div>

        {error && (
          <div className="bg-red-95 border border-red-80 rounded-lg p-4 mb-4">
            <p className="text-danger text-sm">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        <div className="flex items-center gap-3">
          <Button
            onClick={loadSites}
            variant="secondary"
            size="sm"
            disabled={loading}
          >
            {loading ? 'Reloading...' : 'Reload Sites'}
          </Button>

          <Button
            onClick={handleGenerateHtml}
            variant="primary"
            disabled={generating || sites.length === 0}
          >
            {generating ? 'Generating...' : 'Generate HTML Files'}
          </Button>
        </div>
      </Card>

      {/* Sites List */}
      <Card>
        <h3 className="text-lg font-semibold text-theme-primary mb-4">
          Customer Sites ({sites.length}/{config.maxSites})
        </h3>
        
        {sites.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-theme-secondary">No customer sites found.</p>
            <p className="text-sm text-theme-secondary mt-2">
              Check the configuration file: {config.configFilePath}
            </p>
          </div>
        ) : (
          <Grid cols={2} gap="md">
            {sites.map((site) => (
              <div
                key={site.id}
                className="p-4 border border-theme rounded-lg hover:bg-theme-background transition-colors"
              >
                <h4 className="font-medium text-theme-primary mb-1">{site.name}</h4>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-action hover:underline break-all"
                >
                  {site.url}
                </a>
              </div>
            ))}
          </Grid>
        )}
      </Card>

      {/* Configuration Info */}
      <Card>
        <h3 className="text-lg font-semibold text-theme-primary mb-4">Configuration</h3>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-theme-secondary">Config File:</span>
            <div className="font-mono text-theme-primary">{config.configFilePath}</div>
          </div>
          <div>
            <span className="text-theme-secondary">Output Directory:</span>
            <div className="font-mono text-theme-primary">{config.outputDirectory}</div>
          </div>
          <div>
            <span className="text-theme-secondary">Template Style:</span>
            <div className="text-theme-primary">{config.htmlTemplate}</div>
          </div>
          <div>
            <span className="text-theme-secondary">Max Sites:</span>
            <div className="text-theme-primary">{config.maxSites}</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CustomerLinksPlugin;