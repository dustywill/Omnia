/**
 * Template Engine Service for As-Built Documenter
 * 
 * Provides lightweight template compilation, context building,
 * and document generation capabilities using native JavaScript.
 * 
 * Browser-compatible implementation without external dependencies.
 */

export interface TemplateContext {
  project: {
    name: string;
    description?: string;
    version?: string;
    author?: string;
    date: string;
    [key: string]: any;
  };
  data: Record<string, any>;
  system: {
    generatedAt: string;
    generatorVersion: string;
    templateName: string;
  };
  [key: string]: any;
}

export interface Template {
  name: string;
  content: string;
  variables: string[];
  metadata?: {
    description?: string;
    version?: string;
    author?: string;
    lastModified?: Date;
  };
}

export interface TemplateCompilationResult {
  success: boolean;
  output?: string;
  error?: string;
  usedVariables: string[];
  missingVariables: string[];
}

export type TemplateFunction = (context: TemplateContext) => string;

export class TemplateEngineService {
  private compiledTemplates = new Map<string, TemplateFunction>();
  private helpers = new Map<string, (...args: any[]) => any>();

  constructor() {
    this.registerDefaultHelpers();
  }

  /**
   * Load template from string content
   */
  loadTemplate(templateContent: string, templateName: string = 'template'): Template {
    try {
      const variables = this.extractVariables(templateContent);

      return {
        name: templateName,
        content: templateContent,
        variables,
        metadata: {
          lastModified: new Date(),
        },
      };
    } catch (error) {
      throw new Error(`Failed to load template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Compile template string using simple variable substitution
   */
  compileTemplate(templateContent: string, templateName?: string): TemplateFunction {
    try {
      const compiled = this.createTemplateFunction(templateContent);
      
      if (templateName) {
        this.compiledTemplates.set(templateName, compiled);
      }
      
      return compiled;
    } catch (error) {
      throw new Error(`Failed to compile template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a template function that replaces {{variable}} with values from context
   */
  private createTemplateFunction(templateContent: string): TemplateFunction {
    return (context: TemplateContext) => {
      let result = templateContent;

      // Replace simple variables: {{variable}}
      result = result.replace(/\{\{([^}]+)\}\}/g, (_, expression) => {
        const cleanExpression = expression.trim();
        
        // Handle helpers
        if (cleanExpression.includes(' ')) {
          return this.processHelper(cleanExpression, context);
        }
        
        // Simple variable replacement
        const value = this.resolveValue(cleanExpression, context);
        return this.formatValue(value);
      });

      return result;
    };
  }

  /**
   * Process helper functions like {{formatDate date 'short'}}
   */
  private processHelper(expression: string, context: TemplateContext): string {
    const parts = expression.split(' ');
    const helperName = parts[0];
    const args = parts.slice(1);

    const helper = this.helpers.get(helperName);
    if (!helper) {
      return `[Unknown helper: ${helperName}]`;
    }

    try {
      // Resolve arguments
      const resolvedArgs = args.map(arg => {
        // Remove quotes from string literals
        if ((arg.startsWith('"') && arg.endsWith('"')) || (arg.startsWith("'") && arg.endsWith("'"))) {
          return arg.slice(1, -1);
        }
        // Resolve variable
        return this.resolveValue(arg, context);
      });

      return this.formatValue(helper(...resolvedArgs));
    } catch (error) {
      return `[Helper error: ${helperName}]`;
    }
  }

  /**
   * Generate document from template and context
   */
  generateDocument(
    template: Template | string,
    context: TemplateContext
  ): TemplateCompilationResult {
    try {
      let templateContent: string;
      let templateName: string;
      let expectedVariables: string[] = [];

      if (typeof template === 'string') {
        templateContent = template;
        templateName = 'inline';
        expectedVariables = this.extractVariables(templateContent);
      } else {
        templateContent = template.content;
        templateName = template.name;
        expectedVariables = template.variables;
      }

      // Compile the template
      const compiledTemplate = this.compileTemplate(templateContent, templateName);

      // Check for missing variables
      const usedVariables = expectedVariables.filter(variable => 
        this.isVariableAvailable(variable, context)
      );
      const missingVariables = expectedVariables.filter(variable => 
        !this.isVariableAvailable(variable, context)
      );

      // Generate the document
      const output = compiledTemplate(context);

      return {
        success: true,
        output,
        usedVariables,
        missingVariables,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown compilation error',
        usedVariables: [],
        missingVariables: [],
      };
    }
  }

  /**
   * Build template context from project configuration and data sources
   */
  buildTemplateContext(
    projectConfig: any,
    dataResults: Record<string, any> = {},
    additionalContext: Record<string, any> = {}
  ): TemplateContext {
    const now = new Date();

    const context: TemplateContext = {
      project: {
        name: projectConfig?.name || 'Untitled Project',
        description: projectConfig?.description,
        version: projectConfig?.version,
        author: projectConfig?.author,
        date: now.toLocaleDateString(),
        ...projectConfig,
      },
      data: dataResults,
      system: {
        generatedAt: now.toISOString(),
        generatorVersion: '1.0.0',
        templateName: 'as-built-document',
      },
      ...additionalContext,
    };

    return context;
  }

  /**
   * Resolve a dot-notation path in the context
   */
  private resolveValue(path: string, context: TemplateContext): any {
    const parts = path.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  /**
   * Format a value for output
   */
  private formatValue(value: any): string {
    if (value === undefined || value === null) {
      return '';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  /**
   * Extract template variables from template content
   */
  extractVariables(templateContent: string): string[] {
    const variables = new Set<string>();
    
    // Match template expressions: {{variable}}, {{helper args}}, {{data.field}}, etc.
    const templateRegex = /\{\{([^}]+)\}\}/g;
    let match;

    while ((match = templateRegex.exec(templateContent)) !== null) {
      const expression = match[1].trim();
      
      // Skip helpers by checking if first word is a known helper
      const firstWord = expression.split(' ')[0].split('.')[0];
      if (this.helpers.has(firstWord)) {
        continue;
      }

      // Extract the base variable name
      const variableName = expression.split('.')[0].split(' ')[0];
      
      if (variableName) {
        variables.add(variableName);
      }
    }

    return Array.from(variables);
  }

  // Note: extractAvailableVariables method removed as it was unused

  /**
   * Check if a variable is available in the context
   */
  private isVariableAvailable(variable: string, context: TemplateContext): boolean {
    const parts = variable.split('.');
    let current: any = context;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return false;
      }
    }

    return true;
  }

  /**
   * Register default template helpers
   */
  private registerDefaultHelpers(): void {
    // Date formatting helper
    this.helpers.set('formatDate', (date: Date | string, format?: string) => {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      if (!dateObj || isNaN(dateObj.getTime())) {
        return 'Invalid Date';
      }

      switch (format) {
        case 'short':
          return dateObj.toLocaleDateString();
        case 'long':
          return dateObj.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          });
        case 'iso':
          return dateObj.toISOString();
        default:
          return dateObj.toLocaleDateString();
      }
    });

    // JSON formatting helper
    this.helpers.set('json', (obj: any, pretty?: boolean) => {
      try {
        return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
      } catch (error) {
        return '[Invalid JSON]';
      }
    });

    // String utilities
    this.helpers.set('uppercase', (str: string) => {
      return typeof str === 'string' ? str.toUpperCase() : str;
    });

    this.helpers.set('lowercase', (str: string) => {
      return typeof str === 'string' ? str.toLowerCase() : str;
    });

    this.helpers.set('capitalize', (str: string) => {
      if (typeof str !== 'string') return str;
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    });

    // Array/Object helpers
    this.helpers.set('length', (obj: any) => {
      if (Array.isArray(obj)) return obj.length;
      if (obj && typeof obj === 'object') return Object.keys(obj).length;
      return 0;
    });

    this.helpers.set('isEmpty', (obj: any) => {
      if (!obj) return true;
      if (Array.isArray(obj)) return obj.length === 0;
      if (typeof obj === 'object') return Object.keys(obj).length === 0;
      return false;
    });

    // Conditional helpers
    this.helpers.set('eq', (a: any, b: any) => a === b);
    this.helpers.set('ne', (a: any, b: any) => a !== b);
    this.helpers.set('gt', (a: any, b: any) => a > b);
    this.helpers.set('lt', (a: any, b: any) => a < b);
    this.helpers.set('gte', (a: any, b: any) => a >= b);
    this.helpers.set('lte', (a: any, b: any) => a <= b);

    // Math helpers
    this.helpers.set('add', (a: number, b: number) => (a || 0) + (b || 0));
    this.helpers.set('subtract', (a: number, b: number) => (a || 0) - (b || 0));
    this.helpers.set('multiply', (a: number, b: number) => (a || 0) * (b || 0));
    this.helpers.set('divide', (a: number, b: number) => b !== 0 ? (a || 0) / b : 0);
  }

  /**
   * Register custom helper
   */
  registerHelper(name: string, helper: (...args: any[]) => any): void {
    this.helpers.set(name, helper);
  }

  /**
   * Get compiled template by name
   */
  getCompiledTemplate(templateName: string): TemplateFunction | undefined {
    return this.compiledTemplates.get(templateName);
  }

  /**
   * Clear compiled templates cache
   */
  clearCache(): void {
    this.compiledTemplates.clear();
  }

  /**
   * Preview template with sample data (for development)
   */
  previewTemplate(
    template: Template | string,
    sampleData: Record<string, any> = {}
  ): TemplateCompilationResult {
    const sampleContext: TemplateContext = {
      project: {
        name: 'Sample Project',
        description: 'This is a sample project for template preview',
        version: '1.0.0',
        author: 'Template Developer',
        date: new Date().toLocaleDateString(),
      },
      data: sampleData,
      system: {
        generatedAt: new Date().toISOString(),
        generatorVersion: '1.0.0',
        templateName: 'preview',
      },
    };

    return this.generateDocument(template, sampleContext);
  }
}

/**
 * Factory function to create template engine service
 */
export function createTemplateEngine(): TemplateEngineService {
  return new TemplateEngineService();
}