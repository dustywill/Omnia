import React, { useState, useEffect, useCallback } from 'react';
import { loadNodeModule } from '../../src/ui/node-module-loader.js';
import { Card } from '../../src/ui/components/Card/Card.js';
import { Button } from '../../src/ui/components/Button/Button.js';
import { ShadcnButton } from '../../src/ui/components/index.js';
import { SchemaForm } from '../../src/ui/components/SchemaForm/SchemaForm.js';
import { defaultAsBuiltDocumenterConfig } from '../../src/lib/schemas/plugins/as-built-documenter.js';

export type AsBuiltDocumenterProps = {
  context?: any; // Plugin context from Omnia system
};

// Types for the three-tier architecture
type DataSource = {
  id: string;
  name: string;
  description: string;
  url: string;
  method: 'GET' | 'POST';
  headers: Record<string, string>;
  auth: {
    type: 'none' | 'bearer' | 'basic';
    credentials: Record<string, string>;
  };
  timeout: number;
  retries: number;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
};

type Template = {
  id: string;
  name: string;
  description: string;
  path: string;
  engine: 'handlebars' | 'simple';
  outputFormat: 'markdown' | 'html' | 'text' | 'pdf';
  requiredVariables: string[];
  optionalVariables: string[];
  tags: string[];
  version: string;
  author: string;
  createdAt?: string;
  updatedAt?: string;
};

type CustomerInfo = {
  name: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone: string;
  address: string;
  notes: string;
};

type IntegratorInfo = {
  name: string;
  contactPerson: string;
  contactEmail?: string;
  contactPhone: string;
  address: string;
  notes: string;
};

type Project = {
  id: string;
  name: string;
  description: string;
  customer: CustomerInfo;
  integrator: IntegratorInfo;
  dataSourceIds: string[];
  templateIds: string[];
  outputDirectory: string;
  variables: Record<string, any>;
  status: 'active' | 'inactive' | 'completed' | 'archived';
  startDate?: string;
  endDate?: string;
  tags: string[];
  createdAt?: string;
  updatedAt?: string;
};

type GenerationProgress = {
  phase: string;
  progress: number;
  message?: string;
};

type GenerationResult = {
  success: boolean;
  error?: string;
  outputFilePath?: string;
  generationTime?: number;
  content?: string;
};

// Default configuration for the new three-tier architecture
const createDefaultConfig = () => {
  const now = new Date().toISOString();
  return {
    ...defaultAsBuiltDocumenterConfig,
    // Add sample data sources
    dataSources: {
      'sample-resources': {
        id: 'sample-resources',
        name: 'Sample Resources API',
        description: 'Sample resource data for demonstration',
        url: 'http://{ipAddress}/api/resources',
        method: 'GET' as const,
        headers: {},
        auth: { type: 'none' as const, credentials: {} },
        timeout: 10000,
        retries: 3,
        tags: ['sample'],
        createdAt: now,
        updatedAt: now,
      },
      'sample-stations': {
        id: 'sample-stations',
        name: 'Sample Stations API',
        description: 'Sample station configuration data',
        url: 'http://{ipAddress}/api/stations',
        method: 'GET' as const,
        headers: {},
        auth: { type: 'none' as const, credentials: {} },
        timeout: 10000,
        retries: 3,
        tags: ['sample'],
        createdAt: now,
        updatedAt: now,
      }
    } as Record<string, DataSource>,
    // Add sample templates
    templates: {
      'sample-template': {
        id: 'sample-template',
        name: 'Sample MES Template',
        description: 'Sample as-built documentation template',
        path: 'templates/as-built/MES_Template.md',
        engine: 'simple' as const,
        outputFormat: 'markdown' as const,
        requiredVariables: ['project', 'data'],
        optionalVariables: ['system'],
        tags: ['sample', 'mes'],
        version: '1.0.0',
        author: 'Omnia Team',
        createdAt: now,
        updatedAt: now,
      }
    } as Record<string, Template>,
    // Add sample project
    projects: {
      'sample-project': {
        id: 'sample-project',
        name: 'Sample Integration Project',
        description: 'Demonstration project for As-Built documentation',
        customer: {
          name: 'Sample Customer Corp',
          contactPerson: 'John Doe',
          contactEmail: 'john.doe@samplecustomer.com',
          contactPhone: '+1-555-0123',
          address: '123 Customer Street, City, State',
          notes: 'Sample customer for demonstration'
        },
        integrator: {
          name: 'Integration Services Inc',
          contactPerson: 'Jane Smith',
          contactEmail: 'jane.smith@integrator.com',
          contactPhone: '+1-555-0456',
          address: '456 Integrator Ave, City, State',
          notes: 'Sample integrator for demonstration'
        },
        dataSourceIds: ['sample-resources', 'sample-stations'],
        templateIds: ['sample-template'],
        outputDirectory: 'output/sample-project',
        variables: { 
          ipAddress: '192.168.1.100',
          siteName: 'Sample Manufacturing Site',
          commissioningDate: new Date().toISOString().split('T')[0]
        },
        status: 'active' as const,
        startDate: now,
        tags: ['sample'],
        createdAt: now,
        updatedAt: now,
      }
    } as Record<string, Project>,
    activeProjectId: 'sample-project',
    globalVariables: { 
      ipAddress: '192.168.1.100'
    }
  };
};

const AsBuiltDocumenter: React.FC<AsBuiltDocumenterProps> = ({ context }) => {
  // Use the provided plugin context config, fallback to default
  const [config] = useState(() => context?.config || createDefaultConfig());

  // Core state
  const [template, setTemplate] = useState('');
  const [templateContent, setTemplateContent] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState<GenerationProgress | null>(null);
  const [generationResult, setGenerationResult] = useState<GenerationResult | null>(null);
  const [sampleData, setSampleData] = useState<Record<string, any> | null>(null);
  const [isFetchingSample, setIsFetchingSample] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  
  // UI state
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'dataSources' | 'templates' | 'templateEditor' | 'generate' | 'result'>('overview');
  const [CodeMirrorComponent, setCodeMirrorComponent] = useState<any>(null);
  
  // Editing state
  const [editingItem, setEditingItem] = useState<{type: 'project' | 'dataSource' | 'template', id?: string, data?: any} | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSchemas, setEditingSchemas] = useState<any>(null);
  const [schemasLoaded, setSchemasLoaded] = useState(false);
  
  // Template editor state
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [templateEditorContent, setTemplateEditorContent] = useState<string>('');
  const [selectedSampleSource, setSelectedSampleSource] = useState<string>('');
  const [sampleSourceData, setSampleSourceData] = useState<any[]>([]);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);

  // Get current project
  const currentProject = config.activeProjectId ? config.projects[config.activeProjectId] : null;

  // Load CodeMirror component and schemas
  useEffect(() => {
    const loadCodeMirror = async () => {
      try {
        const CodeMirror = await loadNodeModule('@uiw/react-codemirror');
        setCodeMirrorComponent(() => CodeMirror);
      } catch (err) {
        console.warn('CodeMirror not available, using textarea fallback');
        setCodeMirrorComponent(() => (props: any) => (
          <textarea
            value={props.value}
            onChange={(e) => props.onChange?.(e.target.value)}
            style={{ width: '100%', height: props.height || '200px', fontFamily: 'monospace' }}
            aria-label={props['aria-label']}
          />
        ));
      }
    };

    const loadSchemas = async () => {
      try {
        console.log('Loading as-built documenter schemas...');
        const { createAsBuiltDocumenterSchemas } = await import('../../src/lib/schemas/plugins/as-built-documenter.js');
        console.log('Schema module loaded, creating schemas...');
        const schemas = await createAsBuiltDocumenterSchemas();
        console.log('Schemas created:', schemas);
        setEditingSchemas(schemas);
        setSchemasLoaded(true);
        console.log('Schemas loaded successfully');
      } catch (err) {
        console.error('Could not load schemas:', err);
        setSchemasLoaded(false);
      }
    };

    loadCodeMirror();
    loadSchemas();
  }, []);

  // Load default template content
  useEffect(() => {
    if (currentProject && currentProject.templateIds.length > 0) {
      const templateId = currentProject.templateIds[0];
      const template = config.templates[templateId];
      if (template) {
        setTemplate(template.path);
        // For demo purposes, use a simple template
        setTemplateContent(`# As-Built Documentation for {{project.name}}

**Customer:** {{project.customer.name}}
**Integrator:** {{project.integrator.name}}
**Generation Date:** {{system.generatedAt}}

## Project Overview
- **Site Name:** {{project.variables.siteName}}
- **Commissioning Date:** {{project.variables.commissioningDate}}

## Data Sources
{{#each data}}
### {{@key}}
- **Status:** {{#if this.success}}✅ Success{{else}}❌ Failed{{/if}}
- **Data:** {{json this.data true}}
{{/each}}

## Summary
Documentation generated for {{project.customer.name}} on {{formatDate system.generatedAt 'long'}}.`);
      }
    }
  }, [currentProject, config.templates]);

  // Test data source functionality
  const handleTestDataSource = useCallback(async () => {
    if (!currentProject) {
      console.error('No active project');
      return;
    }

    setIsFetchingSample(true);
    setSampleData(null);
    
    try {
      const dataSourceResults: Record<string, any> = {};
      
      // Mock data fetch for demo purposes
      for (const dataSourceId of currentProject.dataSourceIds) {
        const dataSource = config.dataSources[dataSourceId];
        if (dataSource) {
          console.log(`Sample fetch progress: Fetching from ${dataSource.name}`);
          
          // Simulate API call with mock data
          const mockData = {
            success: true,
            data: {
              timestamp: new Date().toISOString(),
              source: dataSource.name,
              sampleValues: [
                { id: 1, name: 'Sample Item 1', value: 100 },
                { id: 2, name: 'Sample Item 2', value: 200 }
              ]
            }
          };
          
          dataSourceResults[dataSourceId] = mockData;
        }
      }
      
      setSampleData(dataSourceResults);
    } catch (error) {
      console.error('Error fetching sample data:', error);
      setSampleData({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setIsFetchingSample(false);
    }
  }, [currentProject, config.dataSources]);

  // Generate documentation
  const handleGenerateDocumentation = useCallback(async () => {
    if (!currentProject) {
      console.error('No active project');
      return;
    }

    setIsGenerating(true);
    setGenerationProgress(null);
    setGenerationResult(null);

    try {
      // Simulate document generation process
      setGenerationProgress({ phase: 'Initializing', progress: 0, message: 'Starting document generation' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress({ phase: 'Fetching Data', progress: 25, message: 'Fetching data from sources' });
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      setGenerationProgress({ phase: 'Processing Template', progress: 50, message: 'Processing template' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress({ phase: 'Generating Output', progress: 75, message: 'Generating final document' });
      
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress({ phase: 'Complete', progress: 100, message: 'Document generation complete' });

      // Mock successful generation
      const mockResult: GenerationResult = {
        success: true,
        outputFilePath: `${currentProject.outputDirectory}/as-built-documentation.md`,
        generationTime: 2500,
        content: `# As-Built Documentation for ${currentProject.name}

**Customer:** ${currentProject.customer.name}
**Integrator:** ${currentProject.integrator.name}
**Generation Date:** ${new Date().toISOString()}

## Project Overview
- **Site Name:** ${currentProject.variables.siteName}
- **Commissioning Date:** ${currentProject.variables.commissioningDate}

## Data Sources
Sample data from ${currentProject.dataSourceIds.length} data sources has been processed.

## Summary
Documentation generated successfully for ${currentProject.customer.name}.`
      };

      setGenerationResult(mockResult);
      setActiveTab('result');
    } catch (error) {
      console.error('Error generating documentation:', error);
      setGenerationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        generationTime: 0
      });
    } finally {
      setIsGenerating(false);
    }
  }, [currentProject, templateContent, config]);

  // Validate template
  const handleValidateTemplate = useCallback(async () => {
    try {
      // Simple validation - check for basic template syntax
      const variables = templateContent.match(/\{\{[^}]+\}\}/g) || [];
      const uniqueVariables = [...new Set(variables)];
      
      setValidationResult({
        success: true,
        variables: uniqueVariables,
        message: `Template is valid. Found ${uniqueVariables.length} variables: ${uniqueVariables.join(', ')}`
      });
    } catch (error) {
      setValidationResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Template validation failed'
      });
    }
  }, [templateContent]);

  // Handlers for CRUD operations
  const handleAddItem = useCallback((type: 'project' | 'dataSource' | 'template') => {
    console.log('Adding item:', type, 'Schemas loaded:', schemasLoaded, 'EditingSchemas:', editingSchemas);
    if (!schemasLoaded || !editingSchemas) {
      console.warn('Schemas not loaded yet, cannot add item');
      return;
    }
    setEditingItem({ type, id: undefined, data: undefined });
    setIsFormOpen(true);
  }, [schemasLoaded, editingSchemas]);

  const handleEditItem = useCallback((type: 'project' | 'dataSource' | 'template', id: string, data: any) => {
    console.log('Editing item:', type, id, 'Schemas loaded:', schemasLoaded, 'EditingSchemas:', editingSchemas);
    if (!schemasLoaded || !editingSchemas) {
      console.warn('Schemas not loaded yet, cannot edit item');
      return;
    }
    setEditingItem({ type, id, data });
    setIsFormOpen(true);
  }, [schemasLoaded, editingSchemas]);

  const handleSaveItem = useCallback((data: any) => {
    if (!editingItem || !editingSchemas) return;

    const now = new Date().toISOString();
    const isNew = !editingItem.id;
    const id = editingItem.id || `${editingItem.type}-${Date.now()}`;

    // Add timestamps
    const itemData = {
      ...data,
      id,
      createdAt: isNew ? now : editingItem.data?.createdAt || now,
      updatedAt: now
    };

    // Update config based on type
    const newConfig = { ...config };
    switch (editingItem.type) {
      case 'project':
        newConfig.projects = { ...newConfig.projects, [id]: itemData };
        break;
      case 'dataSource':
        newConfig.dataSources = { ...newConfig.dataSources, [id]: itemData };
        break;
      case 'template':
        newConfig.templates = { ...newConfig.templates, [id]: itemData };
        break;
    }

    // In a real implementation, this would save to the configuration system
    console.log('Saving item:', editingItem.type, itemData);
    
    setIsFormOpen(false);
    setEditingItem(null);
  }, [editingItem, editingSchemas, config]);

  const handleCancelEdit = useCallback(() => {
    setIsFormOpen(false);
    setEditingItem(null);
  }, []);

  // Template editor functions
  const handleTemplateSelect = useCallback(async (templateId: string) => {
    setSelectedTemplateId(templateId);
    if (templateId && config.templates[templateId]) {
      setIsLoadingTemplate(true);
      const template = config.templates[templateId];
      console.log('Loading template content from:', template.path);
      
      try {
        // For demonstration, we'll load a sample template based on the template type
        let sampleContent = '';
        
        if (template.name.toLowerCase().includes('mes')) {
          sampleContent = `# As-Built Documentation for {{project.name}}

**Customer:** {{project.customer.name}}
**Integrator:** {{project.integrator.name}}
**Generation Date:** {{system.generatedAt}}

## Project Overview
- **Site Name:** {{project.variables.siteName}}
- **Commissioning Date:** {{project.variables.commissioningDate}}

## Data Sources
{{#each data}}
### {{@key}}
- **Status:** {{#if this.success}}✅ Success{{else}}❌ Failed{{/if}}
- **Data:** {{json this.data true}}
{{/each}}

## Summary
Documentation generated for {{project.customer.name}} on {{formatDate system.generatedAt 'long'}}.`;
        } else {
          sampleContent = `# {{project.name}} Documentation

Generated on {{system.generatedAt}}

## Customer Information
**Name:** {{project.customer.name}}
**Contact:** {{project.customer.contactPerson}}
{{#if project.customer.contactEmail}}
**Email:** {{project.customer.contactEmail}}
{{/if}}

## Project Details
{{project.description}}

## Data Sources
{{#each data}}
- **{{@key}}:** {{#if this.success}}Available{{else}}Unavailable{{/if}}
{{/each}}`;
        }
        
        setTemplateEditorContent(sampleContent);
        console.log('Template content loaded successfully');
      } catch (error) {
        console.error('Error loading template content:', error);
        setTemplateEditorContent('# Template content could not be loaded\n\n<!-- Please edit this template -->');
      } finally {
        setIsLoadingTemplate(false);
      }
    } else {
      setTemplateEditorContent('');
      setIsLoadingTemplate(false);
    }
  }, [config.templates]);

  const handleLoadSampleData = useCallback(async () => {
    if (!selectedSampleSource || !config.dataSources[selectedSampleSource]) {
      return;
    }
    
    setIsFetchingSample(true);
    try {
      const dataSource = config.dataSources[selectedSampleSource];
      console.log(`Loading sample data from ${dataSource.name}`);
      
      // Mock sample data - in a real implementation, this would fetch from the actual data source
      const mockSampleData = [
        { id: '1', name: 'Sample Item 1', status: 'Active', value: 100, timestamp: new Date().toISOString() },
        { id: '2', name: 'Sample Item 2', status: 'Inactive', value: 200, timestamp: new Date().toISOString() },
        { id: '3', name: 'Sample Item 3', status: 'Active', value: 150, timestamp: new Date().toISOString() },
      ];
      
      setSampleSourceData(mockSampleData);
    } catch (error) {
      console.error('Error loading sample data:', error);
      setSampleSourceData([]);
    } finally {
      setIsFetchingSample(false);
    }
  }, [selectedSampleSource, config.dataSources]);

  const handleInsertVariable = useCallback((variable: string) => {
    const textarea = document.getElementById('template-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const variableText = `{{${variable}}}`;
    
    const newContent = templateEditorContent.slice(0, start) + variableText + templateEditorContent.slice(end);
    setTemplateEditorContent(newContent);
    
    // Set cursor position after the inserted variable
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + variableText.length, start + variableText.length);
    }, 0);
  }, [templateEditorContent]);

  const handleInsertLoop = useCallback(() => {
    if (!selectedSampleSource) return;
    
    const textarea = document.getElementById('template-editor-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const loopText = `{{#each ${selectedSampleSource}}}\n  {{name}}: {{value}}\n{{/each}}`;
    
    const newContent = templateEditorContent.slice(0, start) + loopText + templateEditorContent.slice(end);
    setTemplateEditorContent(newContent);
    
    // Set cursor position after the inserted loop
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + loopText.length, start + loopText.length);
    }, 0);
  }, [selectedSampleSource, templateEditorContent]);

  const handleSaveTemplate = useCallback(async () => {
    if (!selectedTemplateId) {
      console.warn('No template selected');
      return;
    }
    
    setIsSavingTemplate(true);
    try {
      console.log('Saving template:', selectedTemplateId);
      console.log('Template content:', templateEditorContent);
      
      // In a real implementation, this would save the template to the file system
      // For now, we'll just simulate saving
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
    } finally {
      setIsSavingTemplate(false);
    }
  }, [selectedTemplateId, templateEditorContent]);

  // Render navigation tabs
  const renderTabs = () => (
    <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e0e0e0' }}>
      {[
        { key: 'overview', label: 'Overview' },
        { key: 'projects', label: 'Projects' },
        { key: 'dataSources', label: 'Data Sources' },
        { key: 'templates', label: 'Templates' },
        { key: 'templateEditor', label: 'Template Editor' },
        { key: 'generate', label: 'Generate' },
        { key: 'result', label: 'Result' }
      ].map(({ key, label }) => (
        <button
          key={key}
          onClick={() => setActiveTab(key as any)}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderBottom: activeTab === key ? '2px solid #007bff' : '2px solid transparent',
            background: activeTab === key ? '#f8f9fa' : 'transparent',
            color: activeTab === key ? '#007bff' : '#666',
            cursor: 'pointer',
            fontWeight: activeTab === key ? 'bold' : 'normal'
          }}
        >
          {label}
        </button>
      ))}
    </div>
  );

  // Render overview tab
  const renderOverviewTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <h3>Three-Tier Architecture Overview</h3>
        <div style={{ lineHeight: '1.6' }}>
          <p><strong>The As-Built Documenter now uses a three-tier architecture:</strong></p>
          <ul>
            <li><strong>Data Sources</strong> - Shared library of API endpoints that can be reused across projects</li>
            <li><strong>Templates</strong> - Shared library of documentation templates</li>
            <li><strong>Projects</strong> - Combine data sources and templates with customer-specific information</li>
          </ul>
          
          {currentProject && (
            <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h4>Active Project: {currentProject.name}</h4>
              <p><strong>Customer:</strong> {currentProject.customer.name}</p>
              <p><strong>Integrator:</strong> {currentProject.integrator.name}</p>
              <p><strong>Data Sources:</strong> {currentProject.dataSourceIds.length}</p>
              <p><strong>Templates:</strong> {currentProject.templateIds.length}</p>
              <p><strong>Status:</strong> {currentProject.status}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );

  // Render data sources tab
  const renderDataSourcesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0' }}>Data Sources Library</h3>
            <p style={{ margin: 0 }}>Shared data sources that can be reused across multiple projects:</p>
          </div>
          <ShadcnButton 
            variant="default"
            onClick={() => handleAddItem('dataSource')}
            disabled={!schemasLoaded}
          >
            {schemasLoaded ? 'Add Data Source' : 'Loading...'}
          </ShadcnButton>
        </div>
        {(Object.values(config.dataSources) as DataSource[]).map((dataSource) => (
          <div key={dataSource.id} style={{ 
            padding: '12px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '4px', 
            marginBottom: '8px',
            backgroundColor: currentProject?.dataSourceIds.includes(dataSource.id) ? '#e8f5e8' : 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <strong>{dataSource.name}</strong>
                {currentProject?.dataSourceIds.includes(dataSource.id) && (
                  <span style={{ color: '#28a745', marginLeft: '8px' }}>✓ Used in active project</span>
                )}
                <br />
                <small style={{ color: '#666' }}>{dataSource.description}</small>
                <br />
                <code style={{ fontSize: '12px', color: '#007bff' }}>{dataSource.url}</code>
                <br />
                <small>Method: {dataSource.method} | Timeout: {dataSource.timeout}ms | Retries: {dataSource.retries}</small>
              </div>
              <div style={{ marginLeft: '16px' }}>
                <ShadcnButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditItem('dataSource', dataSource.id, dataSource)}
                  disabled={!schemasLoaded}
                >
                  {schemasLoaded ? 'Edit' : 'Loading...'}
                </ShadcnButton>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  // Render templates tab
  const renderTemplatesTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0' }}>Templates Library</h3>
            <p style={{ margin: 0 }}>Shared templates that can be reused across multiple projects:</p>
          </div>
          <ShadcnButton 
            variant="default"
            onClick={() => handleAddItem('template')}
            disabled={!schemasLoaded}
          >
            {schemasLoaded ? 'Add Template' : 'Loading...'}
          </ShadcnButton>
        </div>
        {(Object.values(config.templates) as Template[]).map((template) => (
          <div key={template.id} style={{ 
            padding: '12px', 
            border: '1px solid #e0e0e0', 
            borderRadius: '4px', 
            marginBottom: '8px',
            backgroundColor: currentProject?.templateIds.includes(template.id) ? '#e8f5e8' : 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <strong>{template.name}</strong>
                {currentProject?.templateIds.includes(template.id) && (
                  <span style={{ color: '#28a745', marginLeft: '8px' }}>✓ Used in active project</span>
                )}
                <br />
                <small style={{ color: '#666' }}>{template.description}</small>
                <br />
                <code style={{ fontSize: '12px', color: '#007bff' }}>{template.path}</code>
                <br />
                <small>
                  Engine: {template.engine} | Format: {template.outputFormat} | Version: {template.version}
                  {template.author && ` | Author: ${template.author}`}
                </small>
              </div>
              <div style={{ marginLeft: '16px' }}>
                <ShadcnButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditItem('template', template.id, template)}
                  disabled={!schemasLoaded}
                >
                  {schemasLoaded ? 'Edit' : 'Loading...'}
                </ShadcnButton>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  // Render projects tab
  const renderProjectsTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div>
            <h3 style={{ margin: '0 0 8px 0' }}>Projects</h3>
            <p style={{ margin: 0 }}>Projects combine data sources and templates with customer-specific information:</p>
          </div>
          <ShadcnButton 
            variant="default"
            onClick={() => handleAddItem('project')}
            disabled={!schemasLoaded}
          >
            {schemasLoaded ? 'Add Project' : 'Loading...'}
          </ShadcnButton>
        </div>
        {(Object.values(config.projects) as Project[]).map((project) => (
          <div key={project.id} style={{ 
            padding: '16px', 
            border: '2px solid ' + (project.id === config.activeProjectId ? '#007bff' : '#e0e0e0'), 
            borderRadius: '4px', 
            marginBottom: '12px',
            backgroundColor: project.id === config.activeProjectId ? '#f8f9fa' : 'white'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <strong>{project.name}</strong>
                  {project.id === config.activeProjectId && (
                    <span style={{ 
                      backgroundColor: '#007bff', 
                      color: 'white', 
                      padding: '2px 8px', 
                      borderRadius: '12px', 
                      fontSize: '12px' 
                    }}>
                      ACTIVE
                    </span>
                  )}
                  <span style={{ 
                    backgroundColor: project.status === 'active' ? '#28a745' : '#6c757d', 
                    color: 'white', 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    fontSize: '12px' 
                  }}>
                    {project.status.toUpperCase()}
                  </span>
                </div>
                <p style={{ margin: '8px 0', color: '#666' }}>{project.description}</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '12px' }}>
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', color: '#007bff' }}>Customer</h5>
                    <div style={{ fontSize: '14px' }}>
                      <div><strong>{project.customer.name}</strong></div>
                      {project.customer.contactPerson && <div>Contact: {project.customer.contactPerson}</div>}
                      {project.customer.contactEmail && <div>Email: {project.customer.contactEmail}</div>}
                    </div>
                  </div>
                  
                  <div>
                    <h5 style={{ margin: '0 0 8px 0', color: '#007bff' }}>Integrator</h5>
                    <div style={{ fontSize: '14px' }}>
                      <div><strong>{project.integrator.name}</strong></div>
                      {project.integrator.contactPerson && <div>Contact: {project.integrator.contactPerson}</div>}
                      {project.integrator.contactEmail && <div>Email: {project.integrator.contactEmail}</div>}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '12px', display: 'flex', gap: '24px', fontSize: '14px' }}>
                  <div>
                    <strong>Data Sources:</strong> {project.dataSourceIds.length}
                    {project.dataSourceIds.length > 0 && (
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {project.dataSourceIds.map((id: string) => (
                          <li key={id}>{config.dataSources[id]?.name || id}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                  
                  <div>
                    <strong>Templates:</strong> {project.templateIds.length}
                    {project.templateIds.length > 0 && (
                      <ul style={{ margin: '4px 0', paddingLeft: '20px' }}>
                        {project.templateIds.map((id: string) => (
                          <li key={id}>{config.templates[id]?.name || id}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                {Object.keys(project.variables).length > 0 && (
                  <div style={{ marginTop: '12px' }}>
                    <strong>Project Variables:</strong>
                    <div style={{ 
                      backgroundColor: '#f8f9fa', 
                      padding: '8px', 
                      borderRadius: '4px', 
                      marginTop: '4px',
                      fontSize: '12px',
                      fontFamily: 'monospace'
                    }}>
                      {JSON.stringify(project.variables, null, 2)}
                    </div>
                  </div>
                )}
              </div>
              <div style={{ marginLeft: '16px' }}>
                <ShadcnButton 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditItem('project', project.id, project)}
                  disabled={!schemasLoaded}
                >
                  {schemasLoaded ? 'Edit' : 'Loading...'}
                </ShadcnButton>
              </div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );

  // Render generate tab
  const renderGenerateTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {!currentProject ? (
        <Card>
          <h3>No Active Project</h3>
          <p>Please select an active project to generate documentation.</p>
        </Card>
      ) : (
        <>
          <Card>
            <h3>Data Source Preview</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span>Test data sources from active project</span>
              <Button 
                onClick={handleTestDataSource}
                disabled={isFetchingSample}
                variant="secondary"
              >
                {isFetchingSample ? 'Testing...' : 'Test Data Sources'}
              </Button>
            </div>
            
            {sampleData && (
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '12px', 
                borderRadius: '4px',
                fontFamily: 'monospace',
                fontSize: '12px',
                maxHeight: '200px',
                overflow: 'auto'
              }}>
                <pre>{JSON.stringify(sampleData, null, 2)}</pre>
              </div>
            )}
          </Card>

          <Card>
            <h3>Template Editor</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span>Current template: {template || 'None selected'}</span>
              <Button 
                onClick={handleValidateTemplate}
                variant="secondary"
              >
                Validate Template
              </Button>
            </div>

            {validationResult && (
              <div style={{ 
                padding: '8px 12px', 
                borderRadius: '4px', 
                marginBottom: '16px',
                backgroundColor: validationResult.success ? '#d4edda' : '#f8d7da',
                color: validationResult.success ? '#155724' : '#721c24',
                border: `1px solid ${validationResult.success ? '#c3e6cb' : '#f5c6cb'}`
              }}>
                {validationResult.message}
              </div>
            )}

            <div style={{ border: '1px solid #ddd', borderRadius: '4px' }}>
              {CodeMirrorComponent ? (
                <CodeMirrorComponent
                  value={templateContent}
                  onChange={setTemplateContent}
                  height="300px"
                  aria-label="Template content editor"
                />
              ) : (
                <div>Loading editor...</div>
              )}
            </div>
          </Card>

          <Card>
            <h3>Document Generation</h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <div><strong>Project:</strong> {currentProject.name}</div>
                <div><strong>Customer:</strong> {currentProject.customer.name}</div>
                <div><strong>Output:</strong> {currentProject.outputDirectory}</div>
              </div>
              <Button 
                onClick={handleGenerateDocumentation}
                disabled={isGenerating || !templateContent.trim()}
                variant="primary"
              >
                {isGenerating ? 'Generating...' : 'Generate Documentation'}
              </Button>
            </div>

            {generationProgress && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span>{generationProgress.phase}</span>
                  <span>{generationProgress.progress}%</span>
                </div>
                <div style={{ 
                  width: '100%', 
                  backgroundColor: '#e0e0e0', 
                  borderRadius: '4px',
                  height: '8px'
                }}>
                  <div style={{ 
                    width: `${generationProgress.progress}%`, 
                    backgroundColor: '#007bff',
                    borderRadius: '4px',
                    height: '100%',
                    transition: 'width 0.3s ease'
                  }} />
                </div>
                {generationProgress.message && (
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {generationProgress.message}
                  </div>
                )}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );

  // Render template editor tab
  const renderTemplateEditorTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <Card>
        <h3>Template Editor</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Left Panel - Template Selection and Editor */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Select Template</label>
              <select
                value={selectedTemplateId}
                onChange={(e) => {
                  const templateId = e.target.value;
                  handleTemplateSelect(templateId);
                }}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
              >
                <option value="">Select a template...</option>
                {Object.values(config.templates).map((template: any) => (
                  <option key={template.id} value={template.id}>
                    {template.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>Template Content</label>
              {isLoadingTemplate ? (
                <div style={{
                  width: '100%',
                  height: '400px',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#f9f9f9'
                }}>
                  Loading template content...
                </div>
              ) : (
                <textarea
                  id="template-editor-textarea"
                  value={templateEditorContent}
                  onChange={(e) => setTemplateEditorContent(e.target.value)}
                  style={{
                    width: '100%',
                    height: '400px',
                    padding: '12px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    resize: 'vertical'
                  }}
                  placeholder="Enter your mustache template here..."
                />
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <ShadcnButton
                onClick={handleSaveTemplate}
                disabled={isSavingTemplate || !selectedTemplateId}
                variant="default"
              >
                {isSavingTemplate ? 'Saving...' : 'Save Template'}
              </ShadcnButton>
              <ShadcnButton
                onClick={handleValidateTemplate}
                variant="secondary"
              >
                Validate Template
              </ShadcnButton>
            </div>
          </div>
          
          {/* Right Panel - Variables and Sample Data */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Project Variables */}
            <div>
              <h4 style={{ margin: '0 0 12px 0' }}>Project Variables</h4>
              <p style={{ margin: '0 0 12px 0', fontSize: '14px', color: '#666' }}>Click to insert into template</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {currentProject && [
                  { key: 'project.name', label: 'Project Name' },
                  { key: 'project.description', label: 'Description' },
                  { key: 'project.customer.name', label: 'Customer' },
                  { key: 'project.customer.contactPerson', label: 'Contact' },
                  { key: 'project.integrator.name', label: 'Integrator' },
                  { key: 'project.startDate', label: 'Start Date' },
                  { key: 'system.generatedAt', label: 'Generated At' }
                ].map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => handleInsertVariable(key)}
                    style={{
                      padding: '6px 8px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      background: 'white',
                      cursor: 'pointer',
                      fontSize: '12px',
                      textAlign: 'left'
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Sample Data */}
            <div>
              <h4 style={{ margin: '0 0 12px 0' }}>Sample Data</h4>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <select
                  value={selectedSampleSource}
                  onChange={(e) => setSelectedSampleSource(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '6px',
                    border: '1px solid #ddd',
                    borderRadius: '4px'
                  }}
                >
                  <option value="">Select data source...</option>
                  {Object.values(config.dataSources).map((source: any) => (
                    <option key={source.id} value={source.id}>
                      {source.name}
                    </option>
                  ))}
                </select>
                <ShadcnButton
                  onClick={handleLoadSampleData}
                  disabled={!selectedSampleSource || isFetchingSample}
                  variant="secondary"
                  size="sm"
                >
                  {isFetchingSample ? 'Loading...' : 'Load'}
                </ShadcnButton>
              </div>
              
              <div style={{ marginBottom: '12px' }}>
                <ShadcnButton
                  onClick={handleInsertLoop}
                  disabled={!selectedSampleSource}
                  variant="outline"
                  size="sm"
                >
                  Insert Loop
                </ShadcnButton>
              </div>
              
              {sampleSourceData.length > 0 && (
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '4px',
                  maxHeight: '200px',
                  overflow: 'auto'
                }}>
                  <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ backgroundColor: '#f5f5f5' }}>
                        {Object.keys(sampleSourceData[0]).map(header => (
                          <th
                            key={header}
                            onClick={() => handleInsertVariable(header)}
                            style={{
                              padding: '6px 8px',
                              border: '1px solid #ddd',
                              cursor: 'pointer',
                              textAlign: 'left'
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sampleSourceData.slice(0, 5).map((row, index) => (
                        <tr key={index}>
                          {Object.keys(row).map(key => (
                            <td
                              key={key}
                              onClick={() => handleInsertVariable(key)}
                              style={{
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                cursor: 'pointer',
                                maxWidth: '100px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {typeof row[key] === 'object' ? JSON.stringify(row[key]) : String(row[key])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  // Render result tab
  const renderResultTab = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {generationResult ? (
        <Card>
          <h3>{generationResult.success ? 'Documentation Generated Successfully' : 'Generation Failed'}</h3>
          <div style={{ marginBottom: '16px' }}>
            <div><strong>Status:</strong> {generationResult.success ? '✅ Success' : '❌ Failed'}</div>
            {generationResult.generationTime && (
              <div><strong>Duration:</strong> {generationResult.generationTime}ms</div>
            )}
            {generationResult.outputFilePath && (
              <div><strong>Output Path:</strong> {generationResult.outputFilePath}</div>
            )}
          </div>

          {generationResult.error && (
            <div style={{ 
              padding: '12px', 
              backgroundColor: '#f8d7da', 
              border: '1px solid #f5c6cb',
              borderRadius: '4px',
              color: '#721c24',
              marginBottom: '16px'
            }}>
              <strong>Error:</strong> {generationResult.error}
            </div>
          )}

          {generationResult.content && (
            <div>
              <h4>Generated Content:</h4>
              <div style={{ 
                backgroundColor: '#f8f9fa', 
                padding: '16px', 
                borderRadius: '4px',
                border: '1px solid #e0e0e0',
                fontFamily: 'monospace',
                fontSize: '14px',
                maxHeight: '400px',
                overflow: 'auto'
              }}>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{generationResult.content}</pre>
              </div>
            </div>
          )}
        </Card>
      ) : (
        <Card>
          <h3>No Results</h3>
          <p>No documentation has been generated yet. Use the Generate tab to create documentation.</p>
        </Card>
      )}
    </div>
  );

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '20px', color: '#333' }}>As-Built Documenter</h2>
      
      {renderTabs()}
      
      <div style={{ minHeight: '500px' }}>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'projects' && renderProjectsTab()}
        {activeTab === 'dataSources' && renderDataSourcesTab()}
        {activeTab === 'templates' && renderTemplatesTab()}
        {activeTab === 'templateEditor' && renderTemplateEditorTab()}
        {activeTab === 'generate' && renderGenerateTab()}
        {activeTab === 'result' && renderResultTab()}
      </div>

      {/* Editing Modal */}
      {isFormOpen && editingItem && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '24px',
            maxWidth: '600px',
            maxHeight: '80vh',
            overflow: 'auto',
            width: '90%'
          }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8px' }}>
              <ShadcnButton variant="ghost" size="sm" onClick={handleCancelEdit}>
                ✕
              </ShadcnButton>
            </div>
            
            {schemasLoaded && editingSchemas ? (
              <SchemaForm
                title={`${editingItem.id ? 'Edit' : 'Add'} ${editingItem.type === 'dataSource' ? 'Data Source' : editingItem.type === 'template' ? 'Template' : 'Project'}`}
                schema={editingItem.type === 'project' ? editingSchemas.projectSchema :
                       editingItem.type === 'dataSource' ? editingSchemas.dataSourceSchema :
                       editingSchemas.templateSchema}
                initialValues={editingItem.data || {}}
                onSubmit={(values, isValid) => {
                  if (isValid) {
                    handleSaveItem(values);
                  }
                }}
                onCancel={handleCancelEdit}
                submitLabel={editingItem.id ? 'Update' : 'Create'}
                showCancelButton={true}
                realTimeValidation={true}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <h3>Loading Schema...</h3>
                <p>Please wait while the form schema is being loaded.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// Export the default configuration for the plugin manager
export const defaultConfig = createDefaultConfig();

export default AsBuiltDocumenter;