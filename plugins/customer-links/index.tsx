import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { Card } from '../../src/ui/components/Card/Card.js';
import { Button } from '../../src/ui/components/Button/Button.js';
import { SchemaForm } from '../../src/ui/components/SchemaForm/SchemaForm.js';
// @ts-ignore
import { createSchemas } from './config-schema.js';

// Enhanced type definitions to match the data structure
export type CustomerSite = {
  Location: string;
  Label: string;
  LogoFile: string;
  IPAddress: string;
  CIDR: number;
  Link: string;
};

export type CustomerGroup = {
  CustomerName: string;
  sites: CustomerSite[];
};

export type CustomerLinksConfig = {
  configFilePath: string;
  outputDirectory: string;
  title: string;
  showDescription: boolean;
  autoReload: boolean;
  htmlTemplate: 'simple' | 'styled' | 'cards' | 'modern';
  customCss: string;
  openAfterGenerate: boolean;
  validateUrls: boolean;
  maxSites: number;
};

// Default configuration
export const defaultConfig: CustomerLinksConfig = {
  configFilePath: 'config/customer-sites.json',
  outputDirectory: 'output/customer-links',
  title: 'Customer Application Links',
  showDescription: true,
  autoReload: false,
  htmlTemplate: 'modern',
  customCss: '',
  openAfterGenerate: false,
  validateUrls: true,
  maxSites: 500
};

// Configuration schema export for the plugin system
export const configSchema = async () => {
  const { CustomerLinksConfigSchema } = await createSchemas();
  return CustomerLinksConfigSchema;
};

// HTML Template for the modern customer sites page
const CUSTOMER_SITES_TEMPLATE = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}}</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Nunito+Sans:ital,opsz,wght@0,6..12,200..1000;1,6..12,200..1000&display=swap" rel="stylesheet">
    <style>
        {{CSS_STYLES}}
    </style>
</head>
<body>
    <h1>{{TITLE}}</h1>
    <div class="customer-grid">
        {{CUSTOMER_CARDS}}
    </div>
    <script>
        {{JAVASCRIPT}}
    </script>
</body>
</html>`;

const SHADCN_CSS_STYLES = `/* Shadcn UI and Tailwind CSS Styles */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --popover: 0 0% 100%;
  --popover-foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96%;
  --muted-foreground: 215.4 16.3% 46.9%;
  --accent: 210 40% 96%;
  --accent-foreground: 222.2 47.4% 11.2%;
  --destructive: 0 84.2% 60.2%;
  --destructive-foreground: 210 40% 98%;
  --border: 214.3 31.8% 91.4%;
  --input: 214.3 31.8% 91.4%;
  --ring: 222.2 84% 4.9%;
  --radius: 0.5rem;
}

body {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  margin: 0;
  padding: 20px;
  line-height: 1.6;
}

h1 {
  font-size: 2rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 2rem;
  color: hsl(var(--primary));
}

.customer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.customer-card {
  background: hsl(var(--card));
  border: 1px solid hsl(var(--border));
  border-radius: calc(var(--radius) + 2px);
  overflow: hidden;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  transition: all 0.2s ease;
}

.customer-card:hover {
  box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
}

.customer-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid hsl(var(--border));
  background: hsl(var(--card));
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.customer-header.collapsible-trigger {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.customer-header.collapsible-trigger:hover {
  background: hsl(var(--accent));
}

.customer-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--foreground));
  margin: 0;
}

.site-count {
  font-size: 0.875rem;
  color: hsl(var(--muted-foreground));
  background: hsl(var(--secondary));
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius);
}

.sites-container {
  padding: 1rem;
}

.site-item {
  margin-bottom: 0.75rem;
}

.site-item:last-child {
  margin-bottom: 0;
}

.site-item.extra-site {
  transition: all 0.3s ease;
  opacity: 1;
  max-height: 200px;
}

.site-item.extra-site.collapsed {
  opacity: 0;
  max-height: 0;
  margin-bottom: 0;
  overflow: hidden;
}

.site-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: hsl(var(--secondary));
  border: 1px solid hsl(var(--border));
  border-radius: var(--radius);
  text-decoration: none;
  color: hsl(var(--foreground));
  transition: all 0.2s ease;
}

.site-link:hover {
  background: hsl(var(--accent));
  border-color: hsl(var(--ring));
}

.site-logo-container {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--background));
  border-radius: var(--radius);
  overflow: hidden;
  flex-shrink: 0;
}

.site-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.site-label {
  font-weight: 500;
  color: hsl(var(--foreground));
}

/* Collapsible trigger styling */
.customer-header.collapsible-trigger::after {
  content: "▼";
  font-size: 0.75rem;
  color: hsl(var(--muted-foreground));
  transition: transform 0.2s ease;
}

.customer-header.collapsible-trigger[aria-expanded="true"]::after {
  transform: rotate(180deg);
}
`;

const JAVASCRIPT_CODE = `document.addEventListener('DOMContentLoaded', function () {
    const collapsibleTriggers = document.querySelectorAll('.customer-header.collapsible-trigger');

    collapsibleTriggers.forEach(header => {
        const sitesContainer = header.nextElementSibling;
        if (!sitesContainer || !sitesContainer.classList.contains('sites-container') || !sitesContainer.querySelector('.extra-site')) {
            header.classList.remove('collapsible-trigger');
            return;
        }

        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');

        header.addEventListener('click', function () {
            const expanded = this.getAttribute('aria-expanded') === 'true';
            this.setAttribute('aria-expanded', (!expanded).toString());

            const extras = sitesContainer.querySelectorAll('.extra-site');
            extras.forEach(item => item.classList.toggle('collapsed'));
        });

        header.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                this.click();
            }
        });
    });
});`;

// Utility functions
export const loadCustomerSites = async (filePath: string): Promise<CustomerGroup[]> => {
  const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
  const text = await fs.readFile(filePath, 'utf8');
  
  let rawData: any;
  try {
    const JSON5 = await loadNodeModule<any>('json5');
    rawData = JSON5.parse(text);
  } catch {
    rawData = JSON.parse(text);
  }
  
  return rawData;
};

export const saveCustomerSites = async (filePath: string, data: CustomerGroup[]): Promise<void> => {
  const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
  const path = await loadNodeModule<typeof import('path')>('path');
  
  // Ensure directory exists
  const dir = path.dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
  
  // Save with pretty formatting
  const jsonString = JSON.stringify(data, null, 2);
  await fs.writeFile(filePath, jsonString, 'utf8');
};

export const generateCustomerSitesHtml = (
  customerGroups: CustomerGroup[],
  config: CustomerLinksConfig
): string => {
  // Generate customer cards HTML using Shadcn-like styling
  const customerCards = customerGroups.map(group => {
    const hasMultipleSites = group.sites.length > 1;
    
    if (hasMultipleSites) {
      // Multiple sites - use accordion-like structure
      const sitesHtml = group.sites.map((site, index) => {
        const isFirstSite = index === 0;
        const siteClass = isFirstSite ? 'site-item first-site' : 'site-item extra-site collapsed';
        const fullUrl = `http://${site.IPAddress}${site.Link}`;
        const logoUrl = `http://${site.IPAddress}/images/${site.LogoFile}`;
        
        return `        <div class="${siteClass}">
          <a href="${fullUrl}" class="site-link" target="_blank" rel="noopener noreferrer" title="${site.Location}">
            <div class="site-logo-container"><img src="${logoUrl}" alt="${site.Label} Logo" class="site-logo"></div>
            <span class="site-label">${site.Label}</span>
          </a>
        </div>`;
      }).join('\n');
      
      return `      <div class="customer-card">
        <div class="customer-header collapsible-trigger" role="button" tabindex="0" aria-expanded="false">
          <h2 class="customer-title">${group.CustomerName}</h2>
          <span class="site-count">${group.sites.length} sites</span>
        </div>
        <div class="sites-container">
${sitesHtml}
        </div>
      </div>`;
    } else {
      // Single site - show directly
      const site = group.sites[0];
      const fullUrl = `http://${site.IPAddress}${site.Link}`;
      const logoUrl = `http://${site.IPAddress}/images/${site.LogoFile}`;
      
      return `      <div class="customer-card">
        <div class="customer-header">
          <h2 class="customer-title">${group.CustomerName}</h2>
        </div>
        <div class="sites-container">
          <div class="site-item first-site">
            <a href="${fullUrl}" class="site-link" target="_blank" rel="noopener noreferrer" title="${site.Location}">
              <div class="site-logo-container"><img src="${logoUrl}" alt="${site.Label} Logo" class="site-logo"></div>
              <span class="site-label">${site.Label}</span>
            </a>
          </div>
        </div>
      </div>`;
    }
  }).join('\n');
  
  // Replace template placeholders
  return CUSTOMER_SITES_TEMPLATE
    .replace(/{{TITLE}}/g, config.title)
    .replace('{{CSS_STYLES}}', SHADCN_CSS_STYLES + (config.customCss ? '\n' + config.customCss : ''))
    .replace('{{CUSTOMER_CARDS}}', customerCards)
    .replace('{{JAVASCRIPT}}', JAVASCRIPT_CODE);
};

// Main configured plugin component
interface CustomerLinksPluginProps {
  config?: CustomerLinksConfig;
}

const CustomerLinksPlugin: React.FC<CustomerLinksPluginProps> = (props) => {
  // Handle null props or missing config gracefully
  const providedConfig = props?.config;
  // Use provided config or fall back to default
  const config = providedConfig || defaultConfig;
  
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [editingData, setEditingData] = useState<CustomerGroup[]>([]);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [customerSitesSchema, setCustomerSitesSchema] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'generator'>('preview');

  useEffect(() => {
    loadData();
  }, [config.configFilePath]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedGroups = await loadCustomerSites(config.configFilePath);
      setCustomerGroups(loadedGroups);
      setEditingData(loadedGroups);
      
      // Load schema for customer sites data
      try {
        const { z } = await createSchemas();
        const CustomerGroupSchema = z.array(
          z.object({
            CustomerName: z.string().min(1, 'Customer name is required'),
            sites: z.array(
              z.object({
                Location: z.string().min(1, 'Location is required'),
                Label: z.string().min(1, 'Label is required'),
                LogoFile: z.string().min(1, 'Logo file is required'),
                IPAddress: z.string().min(1, 'IP address is required'),
                CIDR: z.number().min(0).max(32),
                Link: z.string().min(1, 'Link is required')
              })
            )
          })
        );
        setCustomerSitesSchema(CustomerGroupSchema);
      } catch (error) {
        console.error('Failed to create customer sites schema:', error);
      }
      
    } catch (err) {
      console.error('Failed to load customer sites:', err);
      setError(err instanceof Error ? err.message : 'Failed to load customer sites');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateHtml = async () => {
    try {
      const html = generateCustomerSitesHtml(customerGroups, config);
      setGeneratedHtml(html);
      
      // Save to file
      const fs = await loadNodeModule<typeof import('fs/promises')>('fs/promises');
      const path = await loadNodeModule<typeof import('path')>('path');
      
      await fs.mkdir(config.outputDirectory, { recursive: true });
      const outputFile = path.join(config.outputDirectory, 'customer-sites.html');
      await fs.writeFile(outputFile, html, 'utf8');
      
      console.log(`HTML saved to: ${outputFile}`);
      
    } catch (err) {
      console.error('Failed to generate HTML:', err);
      setError('Failed to generate HTML: ' + (err instanceof Error ? err.message : 'Unknown error'));
    }
  };

  const handleCopyHtml = async () => {
    try {
      await navigator.clipboard.writeText(generatedHtml);
      console.log('HTML copied to clipboard');
    } catch (err) {
      console.error('Failed to copy HTML:', err);
    }
  };

  const handleSchemaFormSubmit = async (values: CustomerGroup[], isValid: boolean) => {
    if (!isValid) {
      setError('Cannot save invalid data. Please fix validation errors first.');
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
      return;
    }

    try {
      setSaveStatus('saving');
      
      // Save to file
      await saveCustomerSites(config.configFilePath, values);
      
      // Update local state
      setCustomerGroups(values);
      setEditingData(values);
      setSaveStatus('saved');
      setError(null);
      
      setTimeout(() => setSaveStatus('idle'), 2000);
      
    } catch (err) {
      console.error('Failed to save data:', err);
      setSaveStatus('error');
      setError('Failed to save: ' + (err instanceof Error ? err.message : 'Unknown error'));
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };
  
  const handleSchemaFormChange = (values: CustomerGroup[]) => {
    setEditingData(values);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '16px' }}>Customer Links Manager</h2>
            <p style={{ color: '#64748b' }}>Loading customer sites data...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '24px', color: '#1e293b' }}>Customer Links Manager</h2>
      
      {error && (
        <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '4px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {/* Simple tab navigation */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ borderBottom: '1px solid #e2e8f0', marginBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '0px' }}>
            <button
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === 'preview' ? '2px solid #3b82f6' : '2px solid transparent',
                backgroundColor: activeTab === 'preview' ? '#f8fafc' : 'transparent',
                color: activeTab === 'preview' ? '#1e293b' : '#64748b',
                cursor: 'pointer',
                fontWeight: activeTab === 'preview' ? 'bold' : 'normal'
              }}
              onClick={() => setActiveTab('preview')}
            >
              Preview Sites
            </button>
            <button
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === 'editor' ? '2px solid #3b82f6' : '2px solid transparent',
                backgroundColor: activeTab === 'editor' ? '#f8fafc' : 'transparent',
                color: activeTab === 'editor' ? '#1e293b' : '#64748b',
                cursor: 'pointer',
                fontWeight: activeTab === 'editor' ? 'bold' : 'normal'
              }}
              onClick={() => setActiveTab('editor')}
            >
              Edit Data
            </button>
            <button
              style={{
                padding: '12px 24px',
                border: 'none',
                borderBottom: activeTab === 'generator' ? '2px solid #3b82f6' : '2px solid transparent',
                backgroundColor: activeTab === 'generator' ? '#f8fafc' : 'transparent',
                color: activeTab === 'generator' ? '#1e293b' : '#64748b',
                cursor: 'pointer',
                fontWeight: activeTab === 'generator' ? 'bold' : 'normal'
              }}
              onClick={() => setActiveTab('generator')}
            >
              Generate HTML
            </button>
          </div>
        </div>
        
        {/* Tab content */}
        {activeTab === 'preview' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '8px' }}>Customer Sites Preview</h3>
              <p style={{ color: '#64748b' }}>This shows how your customer sites will appear. {customerGroups.length} customer groups loaded.</p>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {customerGroups.map((group, index) => (
                <Card key={index}>
                  <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: '600', color: '#1e293b', borderBottom: '2px solid #fbbf24', paddingBottom: '8px', marginBottom: '0' }}>
                      {group.CustomerName}
                    </h4>
                  </div>
                  <div style={{ padding: '16px' }}>
                    {group.sites.length === 1 ? (
                      // Single site - show directly
                      <div style={{ padding: '12px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{group.sites[0].Label}</div>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{group.sites[0].IPAddress}</div>
                      </div>
                    ) : (
                      // Multiple sites - show count and first site
                      <div>
                        <div style={{ marginBottom: '12px', fontSize: '0.875rem', fontWeight: '500' }}>
                          {group.sites.length} sites
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {group.sites.map((site, siteIndex) => (
                            <div key={siteIndex} style={{ padding: '8px', backgroundColor: '#f8fafc', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                              <div style={{ fontWeight: '500', fontSize: '0.875rem' }}>{site.Label}</div>
                              <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{site.IPAddress}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'editor' && (
          <div>
            <div style={{ marginBottom: '24px' }}>
              <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '8px' }}>Edit Customer Sites Data</h3>
              <p style={{ color: '#64748b' }}>Edit the customer sites data using the form or JSON editor. Changes are validated automatically.</p>
            </div>
            
            {customerSitesSchema ? (
              <SchemaForm
                title="Customer Sites Configuration"
                description="Manage your customer sites data with automatic validation."
                schema={customerSitesSchema}
                initialValues={editingData}
                onSubmit={handleSchemaFormSubmit}
                onChange={handleSchemaFormChange}
                loading={saveStatus === 'saving'}
                mode="hybrid"
                defaultMode="json"
                submitLabel={saveStatus === 'saving' ? 'Saving...' : 'Save Customer Sites'}
                showResetButton={true}
                compact={false}
              />
            ) : (
              <div style={{ padding: '32px', textAlign: 'center', color: '#64748b' }}>
                Loading schema...
              </div>
            )}
            
            {saveStatus === 'saved' && (
              <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#15803d', padding: '12px 16px', borderRadius: '4px', marginTop: '16px' }}>
                ✓ Customer sites data saved successfully
              </div>
            )}
            
            {saveStatus === 'error' && (
              <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', padding: '12px 16px', borderRadius: '4px', marginTop: '16px' }}>
                ✗ Failed to save customer sites data
              </div>
            )}
          </div>
        )}

        {activeTab === 'generator' && (
          <div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
              <div>
                <h3 style={{ fontSize: '1.125rem', fontWeight: '600', marginBottom: '8px' }}>Generate Static HTML Page</h3>
                <p style={{ color: '#64748b' }}>Generate a complete, static HTML page with all customer sites.</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button onClick={handleGenerateHtml}>
                  Generate HTML
                </Button>
                {generatedHtml && (
                  <Button onClick={handleCopyHtml}>
                    Copy HTML
                  </Button>
                )}
              </div>
            </div>
            
            {generatedHtml && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: '600' }}>Generated HTML ({generatedHtml.length.toLocaleString()} characters)</h4>
                <textarea
                  value={generatedHtml}
                  readOnly
                  style={{
                    width: '100%',
                    height: '384px',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    padding: '16px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    backgroundColor: '#f8fafc',
                    resize: 'none'
                  }}
                />
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
                  HTML saved to: {config.outputDirectory}/customer-sites.html
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerLinksPlugin;