/**
 * Document Generation Service for As-Built Documenter
 * 
 * Orchestrates HTTP data fetching, template compilation, and document generation
 * to create complete as-built documentation.
 */

import { HttpClientService, DataSourceEndpoint, FetchResult } from './http-client.js';
import { TemplateEngineService, Template, TemplateCompilationResult } from './template-engine.js';

export interface ProjectConfig {
  name: string;
  description?: string;
  version?: string;
  author?: string;
  ipAddress?: string;
  dataSources: DataSourceConfig[];
  outputSettings: OutputSettings;
  [key: string]: any;
}

export interface DataSourceConfig {
  name: string;
  url: string;
  method?: 'GET' | 'POST';
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  enabled: boolean;
  description?: string;
}

export interface OutputSettings {
  format: 'markdown' | 'html';
  filename?: string;
  directory?: string;
  includeTimestamp: boolean;
  includeMetadata: boolean;
}

export interface GenerationProgress {
  phase: 'initializing' | 'fetching_data' | 'compiling_template' | 'generating_document' | 'saving_file' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  currentTask?: string;
  totalTasks?: number;
  completedTasks?: number;
  errors?: string[];
}

export interface GenerationResult {
  success: boolean;
  document?: string;
  metadata: {
    generatedAt: Date;
    projectName: string;
    templateUsed: string;
    dataSourcesUsed: string[];
    generationTime: number;
    documentLength: number;
    errors?: string[];
    warnings?: string[];
  };
  error?: string;
}

export interface GenerationOptions {
  progressCallback?: (progress: GenerationProgress) => void;
  abortSignal?: AbortSignal;
  includeFailedDataSources?: boolean;
  validateTemplate?: boolean;
}

export class DocumentGenerationService {
  private httpClient: HttpClientService;
  private templateEngine: TemplateEngineService;
  private isGenerating = false;
  private currentAbortController?: AbortController;

  constructor(
    httpClient: HttpClientService,
    templateEngine: TemplateEngineService
  ) {
    this.httpClient = httpClient;
    this.templateEngine = templateEngine;
  }

  /**
   * Generate complete as-built document
   */
  async generateDocument(
    projectConfig: ProjectConfig,
    template: Template | string,
    options: GenerationOptions = {}
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    
    if (this.isGenerating) {
      throw new Error('Document generation already in progress');
    }

    this.isGenerating = true;
    this.currentAbortController = new AbortController();

    try {
      const { abortSignal } = options;
      
      // Combine external abort signal with internal one
      if (abortSignal) {
        abortSignal.addEventListener('abort', () => {
          this.currentAbortController?.abort();
        });
      }

      // Phase 1: Initialize
      this.reportProgress(options.progressCallback, {
        phase: 'initializing',
        progress: 0,
        message: 'Initializing document generation...',
        totalTasks: 4,
        completedTasks: 0,
      });

      this.checkAborted();

      // Phase 2: Fetch data from all sources
      this.reportProgress(options.progressCallback, {
        phase: 'fetching_data',
        progress: 10,
        message: 'Fetching data from sources...',
        currentTask: 'Preparing data source requests',
        totalTasks: 4,
        completedTasks: 0,
      });

      const dataResults = await this.fetchAllDataSources(
        projectConfig,
        (progress, status) => {
          this.reportProgress(options.progressCallback, {
            phase: 'fetching_data',
            progress: 10 + (progress * 0.4), // 10-50%
            message: status,
            currentTask: 'Fetching data from sources',
            totalTasks: 4,
            completedTasks: 0,
          });
        }
      );

      this.checkAborted();

      // Phase 3: Compile template
      this.reportProgress(options.progressCallback, {
        phase: 'compiling_template',
        progress: 50,
        message: 'Compiling template...',
        currentTask: 'Processing template',
        totalTasks: 4,
        completedTasks: 1,
      });

      const templateResult = await this.compileTemplate(
        template,
        projectConfig,
        dataResults,
        options
      );

      if (!templateResult.success) {
        throw new Error(`Template compilation failed: ${templateResult.error}`);
      }

      this.checkAborted();

      // Phase 4: Generate document
      this.reportProgress(options.progressCallback, {
        phase: 'generating_document',
        progress: 75,
        message: 'Generating document...',
        currentTask: 'Creating final document',
        totalTasks: 4,
        completedTasks: 2,
      });

      const document = templateResult.output!;
      const generationTime = Date.now() - startTime;

      // Phase 5: Complete
      this.reportProgress(options.progressCallback, {
        phase: 'complete',
        progress: 100,
        message: 'Document generation completed successfully',
        currentTask: 'Finalizing',
        totalTasks: 4,
        completedTasks: 4,
      });

      const result: GenerationResult = {
        success: true,
        document,
        metadata: {
          generatedAt: new Date(),
          projectName: projectConfig.name,
          templateUsed: typeof template === 'string' ? 'inline' : template.name,
          dataSourcesUsed: this.getSuccessfulDataSources(dataResults),
          generationTime,
          documentLength: document.length,
          errors: this.getDataSourceErrors(dataResults),
          warnings: templateResult.missingVariables.length > 0 
            ? [`Missing template variables: ${templateResult.missingVariables.join(', ')}`]
            : undefined,
        },
      };

      return result;

    } catch (error) {
      this.reportProgress(options.progressCallback, {
        phase: 'error',
        progress: 100,
        message: `Generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      });

      const generationTime = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        metadata: {
          generatedAt: new Date(),
          projectName: projectConfig.name,
          templateUsed: typeof template === 'string' ? 'inline' : template.name,
          dataSourcesUsed: [],
          generationTime,
          documentLength: 0,
          errors: [error instanceof Error ? error.message : 'Unknown error'],
        },
      };
    } finally {
      this.isGenerating = false;
      this.currentAbortController = undefined;
    }
  }

  /**
   * Fetch sample data for template development
   */
  async fetchSampleData(
    projectConfig: ProjectConfig,
    limitSources?: number,
    progressCallback?: (progress: number, status: string) => void
  ): Promise<Record<string, any>> {
    const enabledSources = projectConfig.dataSources.filter(source => source.enabled);
    const sourcesToFetch = limitSources 
      ? enabledSources.slice(0, limitSources)
      : enabledSources;

    const endpoints: DataSourceEndpoint[] = sourcesToFetch.map(source => ({
      url: source.url,
      method: source.method || 'GET',
      headers: source.headers,
      params: source.params,
      body: source.body,
    }));

    const results = await this.httpClient.fetchMultipleDataSources(
      endpoints,
      projectConfig.ipAddress,
      progressCallback
    );

    // Transform results to more usable format
    const sampleData: Record<string, any> = {};
    
    sourcesToFetch.forEach((source, index) => {
      const resultKey = `endpoint_${index}`;
      const result = results[resultKey];
      
      if (result.success) {
        sampleData[source.name] = result.data;
      } else {
        sampleData[source.name] = {
          error: result.error,
          message: `Failed to fetch data from ${source.name}`,
        };
      }
    });

    return sampleData;
  }

  /**
   * Validate template with current project configuration
   */
  async validateTemplate(
    template: Template | string,
    projectConfig: ProjectConfig,
    sampleData?: Record<string, any>
  ): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    missingVariables: string[];
    usedVariables: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Use sample data if provided, otherwise fetch fresh data
      const testData = sampleData || await this.fetchSampleData(projectConfig, 2);

      // Build test context
      const context = this.templateEngine.buildTemplateContext(
        projectConfig,
        testData
      );

      // Try to compile and generate
      const result = this.templateEngine.generateDocument(template, context);

      if (!result.success) {
        errors.push(result.error || 'Template compilation failed');
      }

      if (result.missingVariables.length > 0) {
        warnings.push(`Missing variables: ${result.missingVariables.join(', ')}`);
      }

      return {
        isValid: result.success && errors.length === 0,
        errors,
        warnings,
        missingVariables: result.missingVariables,
        usedVariables: result.usedVariables,
      };

    } catch (error) {
      errors.push(`Template validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);

      return {
        isValid: false,
        errors,
        warnings,
        missingVariables: [],
        usedVariables: [],
      };
    }
  }

  /**
   * Cancel current generation
   */
  cancelGeneration(): void {
    if (this.currentAbortController && this.isGenerating) {
      this.currentAbortController.abort();
    }
  }

  /**
   * Check if generation is currently in progress
   */
  isGenerationInProgress(): boolean {
    return this.isGenerating;
  }

  /**
   * Fetch data from all configured sources
   */
  private async fetchAllDataSources(
    projectConfig: ProjectConfig,
    progressCallback?: (progress: number, status: string) => void
  ): Promise<Record<string, FetchResult>> {
    const enabledSources = projectConfig.dataSources.filter(source => source.enabled);
    
    if (enabledSources.length === 0) {
      progressCallback?.(100, 'No data sources configured');
      return {};
    }

    const endpoints: DataSourceEndpoint[] = enabledSources.map(source => ({
      url: source.url,
      method: source.method || 'GET',
      headers: source.headers,
      params: source.params,
      body: source.body,
    }));

    const results = await this.httpClient.fetchMultipleDataSources(
      endpoints,
      projectConfig.ipAddress,
      progressCallback
    );

    // Transform results to use source names as keys
    const namedResults: Record<string, FetchResult> = {};
    
    enabledSources.forEach((source, index) => {
      const resultKey = `endpoint_${index}`;
      namedResults[source.name] = results[resultKey];
    });

    return namedResults;
  }

  /**
   * Compile template with project data
   */
  private async compileTemplate(
    template: Template | string,
    projectConfig: ProjectConfig,
    dataResults: Record<string, FetchResult>,
    options: GenerationOptions
  ): Promise<TemplateCompilationResult> {
    // Build template context
    const successfulData: Record<string, any> = {};
    const failedData: Record<string, any> = {};

    Object.entries(dataResults).forEach(([sourceName, result]) => {
      if (result.success) {
        successfulData[sourceName] = result.data;
      } else {
        failedData[sourceName] = {
          error: result.error,
          statusCode: result.statusCode,
        };
      }
    });

    const templateData = options.includeFailedDataSources 
      ? { ...successfulData, ...failedData }
      : successfulData;

    const context = this.templateEngine.buildTemplateContext(
      projectConfig,
      templateData
    );

    // Generate document
    return this.templateEngine.generateDocument(template, context);
  }

  /**
   * Get list of successful data sources
   */
  private getSuccessfulDataSources(dataResults: Record<string, FetchResult>): string[] {
    return Object.entries(dataResults)
      .filter(([_, result]) => result.success)
      .map(([sourceName]) => sourceName);
  }

  /**
   * Get list of data source errors
   */
  private getDataSourceErrors(dataResults: Record<string, FetchResult>): string[] {
    return Object.entries(dataResults)
      .filter(([_, result]) => !result.success)
      .map(([sourceName, result]) => `${sourceName}: ${result.error}`);
  }

  /**
   * Report progress to callback
   */
  private reportProgress(
    callback: ((progress: GenerationProgress) => void) | undefined,
    progress: GenerationProgress
  ): void {
    if (callback) {
      callback(progress);
    }
  }

  /**
   * Check if generation has been aborted
   */
  private checkAborted(): void {
    if (this.currentAbortController?.signal.aborted) {
      throw new Error('Document generation was cancelled');
    }
  }
}

/**
 * Factory function to create document generation service
 */
export function createDocumentGenerator(
  httpClient: HttpClientService,
  templateEngine: TemplateEngineService
): DocumentGenerationService {
  return new DocumentGenerationService(httpClient, templateEngine);
}