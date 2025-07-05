import React, { useState, useEffect } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { Card } from '../../src/ui/components/Card/Card.js';
import { Button } from '../../src/ui/components/Button/Button.js';
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

const CSS_STYLES = `:root {
    --tt-palette--n95: #eceeee;
    --tt-palette--n90: #e3e7e8;
    --tt-palette--n80: #caced3;
    --tt-palette--n70: #aeb4bc;
    --tt-palette--n60: #929aa5;
    --tt-palette--n50: #76818e;
    --tt-palette--n40: #5e6773;
    --tt-palette--n30: #454e59;
    --tt-palette--n20: #2e343d;
    --tt-palette--n10: #15191e;
    --tt-palette--b95: #e5efff;
    --tt-palette--b90: #dbe9ff;
    --tt-palette--b80: #b3d3fe;
    --tt-palette--b70: #89b9fb;
    --tt-palette--b60: #64a1f7;
    --tt-palette--b50: #3d89f5;
    --tt-palette--b40: #1e6de6;
    --tt-palette--b30: #1555b2;
    --tt-palette--b20: #0d3778;
    --tt-palette--b10: #051d42;
    --tt-palette--white: #fff;
    --tt-palette--black: #000;
    --tt-palette--light: #fffd;
    --tt-palette--dark : #000c;
    --tt-palette--hilight: #fff3;
    --tt-palette--lolight: #0002;
    --tt-palette--action : var(--tt-palette--b40);
    --tt-palette--neutral: var(--tt-palette--n40);
    --tt-palette--link   : var(--tt-palette--b40);
    --tt-palette--brand-primary: #1555b2;
    --tt-palette--brand-accent : #ffcd08;
}

body {
  font-family: "Nunito Sans", sans-serif;
  background-color: var(--tt-palette--n95);
  color: var(--tt-palette--n10);
  margin: 0;
  padding: 20px;
  box-sizing: border-box;
}

h1 {
  color: var(--tt-palette--brand-primary);
  text-align: center;
  margin-bottom: 30px;
}

.customer-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  justify-content: center;
  align-items: flex-start;
}

.customer-card {
  background-color: var(--tt-palette--white);
  border: 1px solid var(--tt-palette--n80);
  border-radius: 8px;
  box-shadow: 0 2px 5px var(--tt-palette--lolight);
  padding: 0;
  width: 300px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.customer-header {
  font-size: 1.5em;
  color: var(--tt-palette--n20);
  margin: 0;
  padding: 15px 20px;
  border-bottom: 2px solid var(--tt-palette--brand-accent);
  position: relative;
}

.customer-header.collapsible-trigger {
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.customer-header.collapsible-trigger:hover {
  background-color: var(--tt-palette--n90);
}

.customer-header.collapsible-trigger.active {
  background-color: var(--tt-palette--b90);
  color: var(--tt-palette--b20);
}

.customer-header.collapsible-trigger::after {
  content: "\\25B6";
  font-size: 0.8em;
  position: absolute;
  right: 20px;
  top: 50%;
  transform: translateY(-50%) rotate(0deg);
  transition: transform 0.3s ease;
  color: var(--tt-palette--action);
}

.customer-header.collapsible-trigger.active::after {
  transform: translateY(-50%) rotate(90deg);
}

.site-list {
  list-style: none;
  padding: 15px 20px;
  margin: 0;
  display: flex;
  flex-direction: column;
  background-color: var(--tt-palette--n95);
}

.site-item {
  overflow: hidden;
}

.site-item.extra-site {
  transition: max-height 0.4s ease-out, opacity 0.4s ease-out, margin-top 0.4s ease-out;
  margin-top: 10px;
}

.site-item.extra-site.collapsed {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  margin-bottom: 0;
}

.site-item.extra-site.collapsed .site-link {
  visibility: hidden;
}

.site-item.extra-site:not(.collapsed) .site-link {
  visibility: visible;
}

.site-link {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 10px;
  border: 1px solid var(--tt-palette--n80);
  border-radius: 6px;
  background-color: var(--tt-palette--white);
  color: var(--tt-palette--link);
  text-decoration: none;
  transition: background-color 0.3s ease, box-shadow 0.3s ease;
}

.site-link:hover,
.site-link:focus {
  background-color: var(--tt-palette--b90);
  color: var(--tt-palette--b10);
  box-shadow: 0 1px 3px var(--tt-palette--hilight);
  outline: none;
}

.site-logo-container {
  width: 100px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
  background-color: var(--tt-palette--white);
  border-radius: 4px;
  overflow: hidden;
}

.site-logo {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.site-logo-placeholder {
  font-size: 0.9em;
  color: var(--tt-palette--n50);
}

.site-label {
  font-size: 0.9em;
  font-weight: bold;
  margin-top: 5px;
}

[data-tooltip] {
  position: relative;
  cursor: pointer;
}

[data-tooltip]::before,
[data-tooltip]::after {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.3s ease, visibility 0.3s ease;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
}

[data-tooltip]::before {
  content: "";
  border-width: 5px;
  border-style: solid;
  border-color: transparent transparent var(--tt-palette--n20) transparent;
  bottom: 100%;
  margin-bottom: 0px;
}

[data-tooltip]::after {
  content: attr(data-tooltip);
  background-color: var(--tt-palette--n20);
  color: var(--tt-palette--n95);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 0.85em;
  white-space: nowrap;
  bottom: 100%;
  margin-bottom: 5px;
}

[data-tooltip]:hover::before,
[data-tooltip]:hover::after {
  visibility: visible;
  opacity: 1;
}`;

const JAVASCRIPT_CODE = `document.addEventListener('DOMContentLoaded', function () {
    const collapsibleTriggers = document.querySelectorAll('.customer-header.collapsible-trigger');

    collapsibleTriggers.forEach(header => {
        const siteList = header.nextElementSibling;
        if (!siteList || !siteList.classList.contains('site-list') || !siteList.querySelector('.extra-site')) {
            header.classList.remove('collapsible-trigger');
            return;
        }

        header.setAttribute('role', 'button');
        header.setAttribute('tabindex', '0');
        header.setAttribute('aria-expanded', 'false');

        header.addEventListener('click', function () {
            this.classList.toggle('active');
            const expanded = this.classList.contains('active');
            this.setAttribute('aria-expanded', expanded.toString());

            const extras = siteList.querySelectorAll('.extra-site');
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
  // Generate customer cards HTML
  const customerCards = customerGroups.map(group => {
    const hasMultipleSites = group.sites.length > 1;
    const headerClass = hasMultipleSites ? 'customer-header collapsible-trigger' : 'customer-header';
    
    const sitesHtml = group.sites.map((site, index) => {
      const isFirstSite = index === 0;
      const siteClass = isFirstSite ? 'site-item first-site' : 'site-item extra-site collapsed';
      const fullUrl = `http://${site.IPAddress}${site.Link}`;
      const logoUrl = `http://${site.IPAddress}/images/${site.LogoFile}`;
      
      return `      <li class="${siteClass}">
        <a href="${fullUrl}" class="site-link" target="_blank" rel="noopener noreferrer" data-tooltip="${site.Location}">
          <div class="site-logo-container"><img src="${logoUrl}" alt="${site.Label} Logo" class="site-logo"></div>
          <span class="site-label">${site.Label}</span>
        </a>
      </li>`;
    }).join('\n');
    
    return `      <div class="customer-card">
        <h2 class="${headerClass}">${group.CustomerName}</h2>
        <ul class="site-list">
${sitesHtml}</ul>
      </div>`;
  }).join('\n');
  
  // Replace template placeholders
  return CUSTOMER_SITES_TEMPLATE
    .replace(/{{TITLE}}/g, config.title)
    .replace('{{CSS_STYLES}}', CSS_STYLES + (config.customCss ? '\n' + config.customCss : ''))
    .replace('{{CUSTOMER_CARDS}}', customerCards)
    .replace('{{JAVASCRIPT}}', JAVASCRIPT_CODE);
};

// Main configured plugin component
interface CustomerLinksPluginProps {
  config?: CustomerLinksConfig;
}

const CustomerLinksPlugin: React.FC<CustomerLinksPluginProps> = ({ config: providedConfig }) => {
  // Use provided config or fall back to default
  const config = providedConfig || defaultConfig;
  
  const [activeTab, setActiveTab] = useState<'preview' | 'editor' | 'generator'>('preview');
  const [customerGroups, setCustomerGroups] = useState<CustomerGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState<string>('');
  const [editingData, setEditingData] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    loadData();
  }, [config.configFilePath]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const loadedGroups = await loadCustomerSites(config.configFilePath);
      setCustomerGroups(loadedGroups);
      setEditingData(JSON.stringify(loadedGroups, null, 2));
      
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

  const handleSaveData = async () => {
    try {
      setSaveStatus('saving');
      
      // Parse and validate the JSON
      const parsedData = JSON.parse(editingData);
      
      // Save to file
      await saveCustomerSites(config.configFilePath, parsedData);
      
      // Update local state
      setCustomerGroups(parsedData);
      setSaveStatus('saved');
      
      setTimeout(() => setSaveStatus('idle'), 2000);
      
    } catch (err) {
      console.error('Failed to save data:', err);
      setSaveStatus('error');
      setError('Failed to save: ' + (err instanceof Error ? err.message : 'Invalid JSON'));
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h3>Customer Links Manager</h3>
        <p>Loading customer sites data...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h2>Customer Links Manager</h2>
      
      {/* Tab Navigation */}
      <div style={{ marginBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
        <nav style={{ display: 'flex', gap: '1px' }}>
          {[
            { key: 'preview', label: 'Preview Sites' },
            { key: 'editor', label: 'Edit Data' },
            { key: 'generator', label: 'Generate HTML' }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                padding: '10px 20px',
                border: 'none',
                borderBottom: activeTab === tab.key ? '2px solid #007cba' : '2px solid transparent',
                backgroundColor: activeTab === tab.key ? '#f0f8ff' : 'transparent',
                color: activeTab === tab.key ? '#007cba' : '#666',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal'
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {error && (
        <div style={{ 
          color: '#dc2626', 
          backgroundColor: '#fef2f2', 
          padding: '10px', 
          borderRadius: '4px', 
          marginBottom: '20px',
          border: '1px solid #fecaca'
        }}>
          {error}
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'preview' && (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <h3>Customer Sites Preview</h3>
            <p>This shows how your customer sites will appear. {customerGroups.length} customer groups loaded.</p>
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '20px', 
            justifyContent: 'center' 
          }}>
            {customerGroups.map((group, index) => (
              <div key={index} style={{ width: '300px' }}>
                <Card padding="none">
                  <div style={{ 
                    padding: '15px 20px', 
                    borderBottom: '2px solid #ffcd08',
                    backgroundColor: '#fff',
                    fontWeight: 'bold',
                    fontSize: '1.2em'
                  }}>
                    {group.CustomerName}
                  </div>
                  <div style={{ padding: '15px 20px', backgroundColor: '#f8f9fa' }}>
                  {group.sites.slice(0, 3).map((site, siteIndex) => (
                    <div key={siteIndex} style={{ 
                      marginBottom: '10px',
                      padding: '8px',
                      backgroundColor: '#fff',
                      borderRadius: '4px',
                      border: '1px solid #e0e0e0'
                    }}>
                      <div style={{ fontWeight: 'bold', fontSize: '0.9em' }}>{site.Label}</div>
                      <div style={{ fontSize: '0.8em', color: '#666' }}>{site.IPAddress}</div>
                    </div>
                  ))}
                  {group.sites.length > 3 && (
                    <div style={{ fontSize: '0.8em', color: '#666', textAlign: 'center' }}>
                      +{group.sites.length - 3} more sites
                    </div>
                  )}
                </div>
                </Card>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'editor' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3>Edit Customer Sites Data</h3>
              <p>Edit the JSON data for customer sites. Validate and save your changes.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              {saveStatus === 'saving' && <span style={{ color: '#666' }}>Saving...</span>}
              {saveStatus === 'saved' && <span style={{ color: '#28a745' }}>✓ Saved</span>}
              {saveStatus === 'error' && <span style={{ color: '#dc2626' }}>✗ Error</span>}
              <Button 
                onClick={handleSaveData}
                variant="action"
                disabled={saveStatus === 'saving'}
              >
                Save Changes
              </Button>
            </div>
          </div>
          
          <textarea
            value={editingData}
            onChange={(e) => setEditingData(e.target.value)}
            style={{
              width: '100%',
              height: '600px',
              fontFamily: 'monospace',
              fontSize: '12px',
              padding: '15px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: '#f8f9fa'
            }}
            placeholder="Enter customer sites JSON data..."
          />
          
          <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
            <strong>Schema:</strong> Array of customer groups, each with CustomerName and sites array.
            Each site should have: Location, Label, LogoFile, IPAddress, CIDR, Link
          </div>
        </div>
      )}

      {activeTab === 'generator' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3>Generate Static HTML Page</h3>
              <p>Generate a complete, static HTML page with all customer sites.</p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button onClick={handleGenerateHtml} variant="action">
                Generate HTML
              </Button>
              {generatedHtml && (
                <Button onClick={handleCopyHtml} variant="secondary">
                  Copy HTML
                </Button>
              )}
            </div>
          </div>
          
          {generatedHtml && (
            <div>
              <h4>Generated HTML ({generatedHtml.length.toLocaleString()} characters)</h4>
              <textarea
                value={generatedHtml}
                readOnly
                style={{
                  width: '100%',
                  height: '400px',
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  padding: '15px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  backgroundColor: '#f8f9fa'
                }}
              />
              <div style={{ marginTop: '10px', fontSize: '0.9em', color: '#666' }}>
                HTML saved to: {config.outputDirectory}/customer-sites.html
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CustomerLinksPlugin;