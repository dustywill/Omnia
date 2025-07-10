# As-Built Documenter Completion Plan

## Overview

This plan focuses on completing the existing Omnia As-Built Documenter plugin by implementing the missing core functionality from the ttCommander version. The Omnia version already has superior UI, configuration system, and architecture - we just need to add the business logic.

## Current Status Analysis

### ✅ **Already Complete (30%)**
- **Superior React UI**: CodeMirror editor, modern component library
- **Configuration System**: Comprehensive Zod schemas, type safety
- **Template Management**: Load, edit, save templates with syntax highlighting  
- **Data Source Configuration**: JSON5-based with validation
- **Modern Architecture**: Full Omnia integration, plugin system
- **TypeScript**: Complete type definitions and safety

### ❌ **Missing Core Functionality (70%)**
- **HTTP Client**: axios implementation for data fetching
- **Document Generation Pipeline**: Handlebars compilation + output
- **File Output**: Markdown file generation and saving
- **Progress Tracking**: Generation progress UI and feedback
- **Template Compilation**: Handlebars rendering with context
- **Sample Data Fetching**: Real HTTP calls for template development

## Implementation Plan: 3 Focused Phases

---

## **Phase 1: Core Services Implementation (Week 1)**
*Priority: Get basic functionality working*

### **Task 1.1: HTTP Client Service**
- [ ] **Add axios dependency and implement HTTP client**
- [ ] **Create data fetching service with retry logic**
- [ ] **Implement authentication handling (Bearer, Basic)**
- [ ] **Add progress tracking for concurrent requests**

### **Task 1.2: Template Engine Integration**
- [ ] **Add handlebars dependency**
- [ ] **Create template compilation service**
- [ ] **Implement context building from project + data sources**
- [ ] **Add template variable extraction**

### **Task 1.3: Document Generation Core**
- [ ] **Create generation orchestrator**
- [ ] **Implement data source fetching pipeline**
- [ ] **Add template compilation with data context**
- [ ] **Create document output service**

**Deliverables:**
- Working HTTP client with retry logic
- Template compilation engine
- Basic document generation pipeline
- File output capabilities

---

## **Phase 2: UI Integration and File Operations (Week 2)**
*Priority: Connect services to existing UI*

### **Task 2.1: Generation UI Implementation**
- [ ] **Add generation progress component**
- [ ] **Implement real-time status updates**
- [ ] **Create error handling and display**
- [ ] **Add generation result preview**

### **Task 2.2: File System Integration**
- [ ] **Implement secure file operations**
- [ ] **Add output directory management**
- [ ] **Create file saving with user selection**
- [ ] **Add clipboard integration**

### **Task 2.3: Sample Data Integration**
- [ ] **Connect sample data button to real HTTP calls**
- [ ] **Implement data preview in template editor**
- [ ] **Add error handling for failed requests**
- [ ] **Cache sample data for development**

**Deliverables:**
- Functional generation UI with progress
- File operations working securely
- Sample data fetching operational
- Error handling throughout

---

## **Phase 3: Polish and Advanced Features (Week 3)**
*Priority: Match ttCommander feature parity*

### **Task 3.1: Advanced Features**
- [ ] **Web scraping implementation (optional)**
- [ ] **Enhanced error recovery**
- [ ] **Configuration validation improvements**
- [ ] **Performance optimizations**

### **Task 3.2: Testing and Validation**
- [ ] **Complete test coverage**
- [ ] **End-to-end workflow testing**
- [ ] **Performance benchmarking**
- [ ] **Security validation**

### **Task 3.3: Documentation and Polish**
- [ ] **User documentation**
- [ ] **Developer documentation**
- [ ] **UI/UX improvements**
- [ ] **Accessibility enhancements**

**Deliverables:**
- Feature-complete plugin matching ttCommander
- Comprehensive testing and validation
- Production-ready polish and documentation

---

## **Detailed Implementation Steps**

### **Step 1: Add Missing Dependencies**

```bash
# Add required dependencies to Omnia
cd /mnt/c/users/byron/documents/projects/byron/Omnia
npm install axios handlebars jsdom
npm install --save-dev @types/handlebars
```

### **Step 2: Create HTTP Client Service**

```typescript
// src/services/http-client.ts
export interface HttpClientConfig {
  timeout: number;
  retries: number;
  auth?: {
    type: 'bearer' | 'basic';
    credentials: Record<string, string>;
  };
}

export class HttpClientService {
  private client: AxiosInstance;
  
  constructor(config: HttpClientConfig) {
    this.client = axios.create({
      timeout: config.timeout,
      // Add retry logic with exponential backoff
    });
  }

  async fetchData(url: string, ipAddress?: string): Promise<any> {
    // Replace {ipAddress} tokens in URL
    const processedUrl = url.replace(/\{ipAddress\}/g, ipAddress || '');
    
    // Make request with retry logic
    const response = await this.client.get(processedUrl);
    return response.data;
  }
}
```

### **Step 3: Implement Document Generation Service**

```typescript
// src/services/document-generator.ts
export class DocumentGenerationService {
  constructor(
    private httpClient: HttpClientService,
    private templateService: TemplateService
  ) {}

  async generateDocument(
    projectConfig: ProjectConfig,
    templatePath: string,
    progressCallback?: (progress: number) => void
  ): Promise<GenerationResult> {
    // 1. Fetch data from all sources concurrently
    const dataResults = await this.fetchAllDataSources(
      projectConfig,
      progressCallback
    );
    
    // 2. Build template context
    const context = this.buildTemplateContext(projectConfig, dataResults);
    
    // 3. Compile template
    const template = await this.templateService.loadTemplate(templatePath);
    const compiledTemplate = Handlebars.compile(template.content);
    
    // 4. Generate document
    const document = compiledTemplate(context);
    
    return {
      success: true,
      content: document,
      metadata: {
        generatedAt: new Date(),
        projectName: projectConfig.name,
        templateUsed: templatePath,
      }
    };
  }
}
```

### **Step 4: Update Existing UI Component**

```typescript
// plugins/as-built-documenter/index.tsx (enhance existing)
export default function AsBuiltDocumenter({ context }: ConfiguredPluginProps) {
  const [config] = usePluginConfig(context, asBuiltDocumenterSchema);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationResult, setGenerationResult] = useState<string | null>(null);

  const handleGenerateDocument = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    try {
      // Use the new document generation service
      const generator = new DocumentGenerationService(httpClient, templateService);
      
      const result = await generator.generateDocument(
        config.currentProject,
        config.selectedTemplate,
        (progress) => setGenerationProgress(progress)
      );
      
      setGenerationResult(result.content);
    } catch (error) {
      // Handle error
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="as-built-documenter">
      {/* Existing UI components */}
      
      {/* Add generation section */}
      <Card>
        <h3>Generate Document</h3>
        <Button 
          onClick={handleGenerateDocument}
          disabled={isGenerating}
        >
          {isGenerating ? 'Generating...' : 'Generate Document'}
        </Button>
        
        {isGenerating && (
          <ProgressBar value={generationProgress} />
        )}
        
        {generationResult && (
          <DocumentPreview content={generationResult} />
        )}
      </Card>
    </div>
  );
}
```

## **Integration Points**

### **Omnia Services Integration**
- **File System Service**: Use Omnia's secure file operations
- **Configuration Service**: Leverage existing Zod schemas
- **Event Bus**: Emit progress and status events
- **Permission System**: Ensure secure operations

### **Existing Component Enhancement**
- **Template Editor**: Add sample data injection buttons
- **Configuration Forms**: Connect to real data sources
- **Progress UI**: Add generation progress display
- **Result Display**: Add document preview and save options

## **Success Criteria**

### **Functional Requirements**
- [ ] **Generate documents** from templates + project data + API data
- [ ] **Save documents** to user-selected file locations
- [ ] **Copy documents** to clipboard
- [ ] **Fetch sample data** for template development
- [ ] **Progress tracking** during generation
- [ ] **Error handling** for failed operations

### **Quality Requirements**
- [ ] **Performance**: Generation completes in <30 seconds
- [ ] **Reliability**: >95% success rate for valid configurations
- [ ] **Security**: All operations use Omnia's permission system
- [ ] **UX**: Clear feedback for all operations

### **Technical Requirements**
- [ ] **Type Safety**: Full TypeScript integration
- [ ] **Testing**: >90% test coverage for new functionality
- [ ] **Integration**: Works seamlessly with existing Omnia architecture
- [ ] **Documentation**: Complete user and developer docs

## **Risk Mitigation**

### **Technical Risks**
1. **HTTP Client Integration**: Use proven axios patterns from ttCommander
2. **Template Compilation**: Handlebars is well-established, low risk
3. **File Operations**: Leverage Omnia's existing secure file services
4. **Performance**: Implement progress tracking and cancellation

### **Integration Risks**
1. **Plugin Architecture**: Work within existing Configured plugin type
2. **Permission System**: Use Omnia's existing permissions appropriately
3. **Configuration**: Build on existing Zod schemas
4. **UI Integration**: Enhance existing React components

## **Timeline**

- **Week 1**: Core services implementation (HTTP, templates, generation)
- **Week 2**: UI integration and file operations
- **Week 3**: Polish, testing, and documentation

**Total Effort**: 3 weeks for feature-complete implementation

## **Next Steps**

1. **Start with HTTP Client Service** - Foundation for all data operations
2. **Add Template Engine** - Core functionality for document generation  
3. **Integrate with Existing UI** - Leverage superior React architecture
4. **Test and Polish** - Ensure production readiness

This plan leverages the excellent foundation already built in Omnia while adding the proven business logic from ttCommander. The result will be a superior plugin that combines the best of both systems.