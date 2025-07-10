# Phase 1 Foundation Migration - Step-by-Step Task List

## Overview

This document provides a detailed, actionable task list for completing Phase 1 of the Node-ttCommander to Omnia migration. Each task includes specific steps, acceptance criteria, and validation requirements.

## Prerequisites

### Environment Setup
- [ ] **Development Environment Ready**
  - Node.js 18+ installed and verified
  - TypeScript 5.2+ installed globally
  - Git repository configured with proper branching
  - VS Code with recommended extensions

- [ ] **Project Access Verified**
  - Node-ttCommander codebase accessible at `/Node-ttCommander/`
  - Omnia codebase accessible at `/Omnia/`
  - Write permissions confirmed for both projects
  - Backup strategy implemented and tested

- [ ] **Dependencies Installed**
  - All Node-ttCommander dependencies analyzed
  - All Omnia dependencies updated to latest stable versions
  - No dependency conflicts identified
  - Build processes verified for both projects

## Week 1-2: Design System Migration

### Task 1.1: Extract Node-ttCommander Design System

#### Step 1.1.1: Copy and Analyze CSS Design System
- [ ] **Extract CSS File**
  ```bash
  # Copy the main CSS file
  cp /Node-ttCommander/src/ui/style.css /Omnia/src/ui/styles/ttcommander-base.css
  
  # Verify file integrity
  wc -l /Omnia/src/ui/styles/ttcommander-base.css
  # Expected: 858 lines
  ```

- [ ] **Analyze CSS Structure**
  - [ ] Identify all CSS custom properties (variables)
  - [ ] Document color palette structure (8 families × 10 shades)
  - [ ] Map semantic color usage patterns
  - [ ] Identify theme-specific sections

- [ ] **Create CSS Analysis Report**
  ```bash
  # Generate CSS analysis
  node scripts/analyze-css.js \
    --input src/ui/styles/ttcommander-base.css \
    --output docs/css-analysis-report.md
  ```

**Acceptance Criteria:**
- ttcommander-base.css file exists and is 858 lines
- CSS analysis report generated
- All color variables documented (80 total: 8 families × 10 shades)

#### Step 1.1.2: Create Design Tokens TypeScript Interface
- [ ] **Generate Design Tokens File**
  ```bash
  # Create design tokens extraction script
  node scripts/extract-design-tokens.js \
    --input src/ui/styles/ttcommander-base.css \
    --output src/ui/styles/design-tokens.ts
  ```

- [ ] **Design Tokens Structure**
  ```typescript
  // src/ui/styles/design-tokens.ts
  export interface ThemeTokens {
    palette: {
      blue: Record<string, string>;     // b10-b100
      green: Record<string, string>;    // g10-g100
      red: Record<string, string>;      // r10-r100
      yellow: Record<string, string>;   // y10-y100
      purple: Record<string, string>;   // p10-p100
      teal: Record<string, string>;     // t10-t100
      orange: Record<string, string>;   // o10-o100
      neutral: Record<string, string>;  // n10-n100
    };
    semantic: {
      action: string;      // --tt-palette--b40
      success: string;     // --tt-palette--g40
      error: string;       // --tt-palette--r40
      warning: string;     // --tt-palette--y40
    };
    themes: {
      light: Record<string, string>;
      dark: Record<string, string>;
    };
  }
  ```

- [ ] **Export Design Tokens**
  ```typescript
  export const ttCommanderTokens: ThemeTokens = {
    // Implementation with actual extracted values
  };
  ```

**Acceptance Criteria:**
- design-tokens.ts file created with complete TypeScript interface
- All 80 color variables properly typed and exported
- Semantic color mapping documented

#### Step 1.1.3: Integrate with Omnia's CSS System
- [ ] **Update Global CSS**
  ```css
  /* src/ui/global.css */
  @import './styles/ttcommander-base.css';
  @import './styles/tailwind.css';
  @import './styles/variables.css';
  ```

- [ ] **Update Tailwind Configuration**
  ```javascript
  // tailwind.config.js
  const { ttCommanderTokens } = require('./src/ui/styles/design-tokens');
  
  module.exports = {
    theme: {
      extend: {
        colors: {
          'tt-blue': ttCommanderTokens.palette.blue,
          'tt-green': ttCommanderTokens.palette.green,
          // ... all color families
          action: ttCommanderTokens.semantic.action,
          success: ttCommanderTokens.semantic.success,
          error: ttCommanderTokens.semantic.error,
          warning: ttCommanderTokens.semantic.warning,
        }
      }
    }
  };
  ```

- [ ] **Verify CSS Integration**
  ```bash
  # Build and test CSS integration
  npm run build
  npm run dev
  # Manually verify theme variables are available
  ```

**Acceptance Criteria:**
- Global CSS successfully imports ttCommander styles
- Tailwind config extended with ttCommander colors
- No CSS build errors
- Theme variables accessible in browser dev tools

### Task 1.2: Component Theme Integration

#### Step 1.2.1: Update Existing Components
- [ ] **Inventory Existing Components**
  ```bash
  # List all existing components
  find src/ui/components -name "*.module.css" -o -name "*.css" | sort
  ```

- [ ] **Update Components to Use ttCommander Variables**
  
  **For each component:**
  - [ ] AppHeader - Update colors to use ttCommander variables
    ```css
    /* AppHeader.module.css */
    .header {
      background-color: var(--tt-color-surface);
      color: var(--tt-color-text-primary);
      border-bottom: 1px solid var(--tt-palette--n20);
    }
    ```
  
  - [ ] AppNavigation - Update navigation colors
  - [ ] Button - Update button variants to use semantic colors
  - [ ] Card - Update card styling with ttCommander theme
  - [ ] Input - Update form input styling
  - [ ] PluginCard - Update plugin card theming
  - [ ] StatusBar - Update status bar colors
  - [ ] All remaining components (18+ total)

- [ ] **Test Component Rendering**
  ```bash
  # Run component tests
  npm run test:components
  
  # Visual test each component
  npm run test:visual-regression
  ```

**Acceptance Criteria:**
- All 18+ components updated to use ttCommander variables
- No hardcoded colors remaining in component CSS
- All component tests passing
- Visual consistency maintained

#### Step 1.2.2: Create Theme Provider
- [ ] **Implement ThemeProvider Component**
  ```typescript
  // src/ui/components/ThemeProvider/ThemeProvider.tsx
  import React, { createContext, useContext, useState, useEffect } from 'react';

  interface ThemeContextType {
    theme: 'light' | 'dark';
    toggleTheme: () => void;
    isLoading: boolean;
  }

  const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

  export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');
    const [isLoading, setIsLoading] = useState(true);

    const toggleTheme = () => {
      const newTheme = theme === 'light' ? 'dark' : 'light';
      setTheme(newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('omnia-theme', newTheme);
    };

    useEffect(() => {
      const savedTheme = localStorage.getItem('omnia-theme') as 'light' | 'dark' | null;
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      const initialTheme = savedTheme || systemTheme;
      
      setTheme(initialTheme);
      document.documentElement.setAttribute('data-theme', initialTheme);
      setIsLoading(false);
    }, []);

    return (
      <ThemeContext.Provider value={{ theme, toggleTheme, isLoading }}>
        {children}
      </ThemeContext.Provider>
    );
  };

  export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
      throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
  };
  ```

- [ ] **Add Theme Toggle Component**
  ```typescript
  // src/ui/components/ThemeToggle/ThemeToggle.tsx
  import React from 'react';
  import { useTheme } from '../ThemeProvider/ThemeProvider';
  import { Button } from '../Button/Button';

  export const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();
    
    return (
      <Button
        onClick={toggleTheme}
        variant="outline"
        size="sm"
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
      >
        {theme === 'light' ? '🌙' : '☀️'}
      </Button>
    );
  };
  ```

- [ ] **Integrate ThemeProvider in Main App**
  ```typescript
  // src/ui/renderer.tsx
  import { ThemeProvider } from './components/ThemeProvider/ThemeProvider';
  
  // Wrap main app with ThemeProvider
  const root = createRoot(container);
  root.render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
  ```

**Acceptance Criteria:**
- ThemeProvider component implemented and tested
- Theme switching works between light and dark modes
- Theme preference persisted in localStorage
- System theme preference respected on initial load

#### Step 1.2.3: Visual Regression Testing
- [ ] **Set Up Playwright Visual Testing**
  ```typescript
  // tests/visual/theme-consistency.spec.ts
  import { test, expect } from '@playwright/test';

  test.describe('Theme Consistency', () => {
    test('components render correctly in light theme', async ({ page }) => {
      await page.goto('/');
      await page.locator('[data-theme="light"]').waitFor();
      
      // Test each component
      await expect(page.locator('[data-testid="app-header"]')).toHaveScreenshot('header-light.png');
      await expect(page.locator('[data-testid="navigation"]')).toHaveScreenshot('nav-light.png');
      // ... all components
    });

    test('components render correctly in dark theme', async ({ page }) => {
      await page.goto('/');
      await page.click('[aria-label*="dark theme"]');
      await page.locator('[data-theme="dark"]').waitFor();
      
      // Test each component
      await expect(page.locator('[data-testid="app-header"]')).toHaveScreenshot('header-dark.png');
      await expect(page.locator('[data-testid="navigation"]')).toHaveScreenshot('nav-dark.png');
      // ... all components
    });
  });
  ```

- [ ] **Generate Baseline Screenshots**
  ```bash
  # Generate initial screenshots for comparison
  npx playwright test tests/visual/theme-consistency.spec.ts --update-snapshots
  ```

- [ ] **Document Visual Testing Process**
  - Create visual testing guidelines
  - Document screenshot review process
  - Set up automated visual diff alerts

**Acceptance Criteria:**
- Playwright visual tests implemented for all components
- Baseline screenshots captured for both themes
- Visual regression detection working
- Documentation for visual testing process complete

## Week 3-4: Configuration System Integration

### Task 2.1: JSONEditor Integration

#### Step 2.1.1: Extract JSONEditor Components from Node-ttCommander
- [ ] **Analyze Existing JSONEditor Usage**
  ```bash
  # Find JSONEditor usage in Node-ttCommander
  grep -r "json-editor\|JSONEditor" /Node-ttCommander/src/
  grep -r "editor\.json\|jsoneditor" /Node-ttCommander/src/ui/
  ```

- [ ] **Extract JSONEditor Integration Code**
  ```bash
  # Copy relevant files
  cp /Node-ttCommander/src/ui/renderer.js temp/ttcommander-renderer.js
  
  # Extract JSONEditor initialization and configuration
  # Manual extraction needed - identify key patterns
  ```

- [ ] **Document JSONEditor Configuration**
  - Document theme customization used in Node-ttCommander
  - Identify all JSONEditor options and settings
  - Map form validation and error handling patterns

**Acceptance Criteria:**
- JSONEditor usage patterns documented
- All customization options identified
- Theme integration requirements clear

#### Step 2.1.2: Create React JSONEditor Wrapper
- [ ] **Install JSONEditor Dependency**
  ```bash
  cd /Omnia
  npm install vanilla-jsoneditor
  npm install -D @types/json-editor
  ```

- [ ] **Implement JSONEditor React Component**
  ```typescript
  // src/ui/components/JSONEditor/JSONEditor.tsx
  import React, { useEffect, useRef, useCallback } from 'react';
  import { JSONEditor } from 'vanilla-jsoneditor';
  import { useTheme } from '../ThemeProvider/ThemeProvider';
  import styles from './JSONEditor.module.css';

  interface JSONEditorProps {
    content: any;
    onChange: (content: any) => void;
    schema?: any;
    mode?: 'tree' | 'code' | 'form';
    readOnly?: boolean;
    onError?: (error: Error) => void;
  }

  export const JSONEditorComponent: React.FC<JSONEditorProps> = ({
    content,
    onChange,
    schema,
    mode = 'tree',
    readOnly = false,
    onError,
  }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const editorRef = useRef<JSONEditor | null>(null);
    const { theme } = useTheme();

    const handleChange = useCallback((updatedContent: any) => {
      try {
        onChange(updatedContent);
      } catch (error) {
        onError?.(error as Error);
      }
    }, [onChange, onError]);

    useEffect(() => {
      if (containerRef.current && !editorRef.current) {
        editorRef.current = new JSONEditor({
          target: containerRef.current,
          props: {
            content,
            mode,
            schema,
            readOnly,
            onChange: handleChange,
            theme: theme === 'dark' ? 'jse-theme-dark' : 'jse-theme-default',
          }
        });
      }

      return () => {
        if (editorRef.current) {
          editorRef.current.destroy();
          editorRef.current = null;
        }
      };
    }, []);

    // Update content when prop changes
    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.update({ content });
      }
    }, [content]);

    // Update theme when it changes
    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.updateProps({
          theme: theme === 'dark' ? 'jse-theme-dark' : 'jse-theme-default',
        });
      }
    }, [theme]);

    return (
      <div className={styles.container}>
        <div ref={containerRef} className={styles.editor} />
      </div>
    );
  };
  ```

- [ ] **Create JSONEditor CSS Module**
  ```css
  /* src/ui/components/JSONEditor/JSONEditor.module.css */
  .container {
    border: 1px solid var(--tt-palette--n20);
    border-radius: 8px;
    overflow: hidden;
    background: var(--tt-color-surface);
  }

  .editor {
    min-height: 300px;
  }

  /* Custom theme integration */
  .container :global(.jse-theme-default) {
    --jse-background-color: var(--tt-color-surface);
    --jse-text-color: var(--tt-color-text-primary);
    --jse-border-color: var(--tt-palette--n20);
  }

  .container :global(.jse-theme-dark) {
    --jse-background-color: var(--tt-color-surface);
    --jse-text-color: var(--tt-color-text-primary);
    --jse-border-color: var(--tt-palette--n30);
  }
  ```

**Acceptance Criteria:**
- JSONEditor React wrapper component implemented
- Theme integration working (light/dark mode)
- Component properly handles content changes
- Error handling implemented

#### Step 2.1.3: Implement Configuration State Management
- [ ] **Create Configuration State Hook**
  ```typescript
  // src/hooks/useConfigurationState.ts
  import { useState, useCallback, useEffect } from 'react';

  interface ConfigurationState {
    collapsedSections: Record<string, boolean>;
    lastModified: Date;
    isDirty: boolean;
  }

  export const useConfigurationState = (configId: string) => {
    const [state, setState] = useState<ConfigurationState>({
      collapsedSections: {},
      lastModified: new Date(),
      isDirty: false,
    });

    const toggleSection = useCallback((sectionId: string) => {
      setState(prev => ({
        ...prev,
        collapsedSections: {
          ...prev.collapsedSections,
          [sectionId]: !prev.collapsedSections[sectionId],
        },
      }));
      
      // Persist to localStorage
      localStorage.setItem(
        `omnia-config-state-${configId}`,
        JSON.stringify(state.collapsedSections)
      );
    }, [configId, state.collapsedSections]);

    const markDirty = useCallback(() => {
      setState(prev => ({
        ...prev,
        isDirty: true,
        lastModified: new Date(),
      }));
    }, []);

    const markClean = useCallback(() => {
      setState(prev => ({
        ...prev,
        isDirty: false,
      }));
    }, []);

    // Load persisted state on mount
    useEffect(() => {
      const savedState = localStorage.getItem(`omnia-config-state-${configId}`);
      if (savedState) {
        try {
          const collapsedSections = JSON.parse(savedState);
          setState(prev => ({ ...prev, collapsedSections }));
        } catch (error) {
          console.warn('Failed to load configuration state:', error);
        }
      }
    }, [configId]);

    return {
      state,
      toggleSection,
      markDirty,
      markClean,
    };
  };
  ```

**Acceptance Criteria:**
- Configuration state hook implemented
- Collapse/expand state persisted across sessions
- Dirty state tracking working
- Local storage integration functional

### Task 2.2: Schema Compatibility Layer

#### Step 2.2.1: Implement AJV to Zod Conversion
- [ ] **Create Schema Compatibility Class**
  ```typescript
  // src/core/schema-compatibility.ts
  import { z } from 'zod';
  import Ajv from 'ajv';

  export class SchemaCompatibility {
    private ajv = new Ajv({ useDefaults: true, allErrors: true, strict: false });

    convertAjvToZod(ajvSchema: any): z.ZodSchema<any> {
      return this.convertProperty(ajvSchema);
    }

    private convertProperty(prop: any): z.ZodSchema<any> {
      if (prop.type === 'object') {
        const shape: Record<string, z.ZodSchema<any>> = {};
        
        if (prop.properties) {
          for (const [key, value] of Object.entries(prop.properties)) {
            shape[key] = this.convertProperty(value);
          }
        }

        let schema = z.object(shape);
        
        if (prop.required && Array.isArray(prop.required)) {
          // Zod objects are required by default, make optional fields optional
          const optionalFields = Object.keys(shape).filter(key => !prop.required.includes(key));
          optionalFields.forEach(key => {
            shape[key] = shape[key].optional();
          });
          schema = z.object(shape);
        }

        return schema;
      }

      if (prop.type === 'array') {
        const itemSchema = prop.items ? this.convertProperty(prop.items) : z.any();
        return z.array(itemSchema);
      }

      if (prop.type === 'string') {
        let schema = z.string();
        if (prop.minLength) schema = schema.min(prop.minLength);
        if (prop.maxLength) schema = schema.max(prop.maxLength);
        if (prop.pattern) schema = schema.regex(new RegExp(prop.pattern));
        if (prop.format === 'email') schema = z.string().email();
        if (prop.format === 'uri') schema = z.string().url();
        return schema;
      }

      if (prop.type === 'number' || prop.type === 'integer') {
        let schema = prop.type === 'integer' ? z.number().int() : z.number();
        if (prop.minimum !== undefined) schema = schema.min(prop.minimum);
        if (prop.maximum !== undefined) schema = schema.max(prop.maximum);
        return schema;
      }

      if (prop.type === 'boolean') {
        return z.boolean();
      }

      if (prop.enum) {
        return z.enum(prop.enum);
      }

      return z.any();
    }

    validateWithBoth(data: any, ajvSchema: any, zodSchema: z.ZodSchema<any>) {
      const ajvResult = this.ajv.validate(ajvSchema, data);
      const zodResult = zodSchema.safeParse(data);
      
      return {
        ajv: { 
          valid: ajvResult, 
          errors: this.ajv.errors || [] 
        },
        zod: { 
          valid: zodResult.success, 
          errors: zodResult.success ? [] : zodResult.error.errors 
        },
        consensus: ajvResult && zodResult.success,
      };
    }
  }
  ```

- [ ] **Test Schema Conversion**
  ```typescript
  // tests/core/schema-compatibility.test.ts
  import { SchemaCompatibility } from '../../src/core/schema-compatibility';

  describe('SchemaCompatibility', () => {
    let compatibility: SchemaCompatibility;

    beforeEach(() => {
      compatibility = new SchemaCompatibility();
    });

    test('converts basic object schema', () => {
      const ajvSchema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };

      const zodSchema = compatibility.convertAjvToZod(ajvSchema);
      
      // Test valid data
      const validData = { name: 'John', age: 30 };
      const result = zodSchema.safeParse(validData);
      expect(result.success).toBe(true);

      // Test invalid data
      const invalidData = { age: 30 }; // missing required name
      const invalidResult = zodSchema.safeParse(invalidData);
      expect(invalidResult.success).toBe(false);
    });
  });
  ```

**Acceptance Criteria:**
- Schema conversion working for basic types
- Object schemas with required fields converted correctly
- Array schemas converted properly
- String validation (min/max length, patterns) working
- Number validation (min/max, integer) working
- Test coverage >90% for schema conversion

#### Step 2.2.2: Configuration File Compatibility
- [ ] **Update Settings Manager**
  ```typescript
  // src/core/enhanced-settings-manager.ts
  import { SettingsManager } from './settings-manager';
  import { SchemaCompatibility } from './schema-compatibility';

  export class EnhancedSettingsManager extends SettingsManager {
    private schemaCompatibility = new SchemaCompatibility();

    async loadLegacyConfig(configPath: string): Promise<any> {
      try {
        // Try to load as Omnia config first
        return await super.loadAppConfig();
      } catch (error) {
        // Fall back to Node-ttCommander format
        return await this.loadNodeTtCommanderConfig(configPath);
      }
    }

    private async loadNodeTtCommanderConfig(configPath: string): Promise<any> {
      const configData = await this.JSON5.parse(
        await this.fs.readFile(configPath, 'utf8')
      );

      // Convert Node-ttCommander config to Omnia format
      return this.convertLegacyConfig(configData);
    }

    private convertLegacyConfig(legacyConfig: any): any {
      return {
        appSettings: {
          debugMode: legacyConfig.appSettings?.debugMode || false,
          theme: legacyConfig.appSettings?.theme || 'light',
        },
        logging: legacyConfig.logging || {
          level: 'info',
          prettyPrint: false,
        },
        plugins: legacyConfig.plugins || {},
      };
    }

    async validateConfigWithBothSchemas(config: any, ajvSchema: any): Promise<any> {
      // Convert AJV schema to Zod
      const zodSchema = this.schemaCompatibility.convertAjvToZod(ajvSchema);
      
      // Validate with both
      const validation = this.schemaCompatibility.validateWithBoth(
        config, 
        ajvSchema, 
        zodSchema
      );

      if (!validation.consensus) {
        throw new Error('Configuration validation failed');
      }

      return config;
    }
  }
  ```

**Acceptance Criteria:**
- Legacy config loading working
- Config format conversion successful
- Dual validation (AJV + Zod) implemented
- Error handling for invalid configs

## Week 5-6: Plugin Compatibility Layer

### Task 3.1: Legacy Plugin Support

#### Step 3.1.1: HTML Plugin Loader Implementation
- [ ] **Create HTML Plugin Loader**
  ```typescript
  // src/core/html-plugin-loader.ts
  import React, { useEffect, useRef } from 'react';
  import DOMPurify from 'dompurify';

  export class HTMLPluginLoader {
    async loadPlugin(manifest: any): Promise<React.ComponentType> {
      const htmlPath = manifest.ui;
      const scriptPath = manifest.main;

      if (!htmlPath) {
        throw new Error('HTML plugin requires ui field in manifest');
      }

      const htmlContent = await this.loadHTMLContent(htmlPath);
      const scriptModule = scriptPath ? await this.loadScriptModule(scriptPath) : null;

      return this.createReactWrapper(htmlContent, scriptModule, manifest);
    }

    private async loadHTMLContent(htmlPath: string): Promise<string> {
      // In production, this would use file system APIs
      // For now, simulate with fetch or file reading
      const response = await fetch(htmlPath);
      return await response.text();
    }

    private async loadScriptModule(scriptPath: string): Promise<any> {
      try {
        // Dynamic import for the script module
        const module = await import(scriptPath);
        return module;
      } catch (error) {
        console.warn(`Failed to load script module: ${scriptPath}`, error);
        return null;
      }
    }

    private createReactWrapper(
      htmlContent: string,
      scriptModule: any,
      manifest: any
    ): React.ComponentType {
      return function HTMLPluginWrapper(props: any) {
        const containerRef = useRef<HTMLDivElement>(null);
        const inititalizedRef = useRef(false);

        useEffect(() => {
          if (containerRef.current && !inititalizedRef.current) {
            inititalizedRef.current = true;

            // Sanitize HTML content for security
            const sanitizedHTML = DOMPurify.sanitize(htmlContent, {
              ALLOWED_TAGS: ['div', 'span', 'p', 'h1', 'h2', 'h3', 'button', 'input', 'form'],
              ALLOWED_ATTR: ['class', 'id', 'data-*'],
            });

            containerRef.current.innerHTML = sanitizedHTML;

            // Initialize plugin if it has an activate method
            if (scriptModule?.activate) {
              try {
                scriptModule.activate({
                  container: containerRef.current,
                  config: props.config,
                  context: {
                    pluginId: manifest.id,
                    ...props.context,
                  },
                });
              } catch (error) {
                console.error(`Plugin activation failed for ${manifest.id}:`, error);
              }
            }
          }

          return () => {
            if (scriptModule?.deactivate) {
              try {
                scriptModule.deactivate();
              } catch (error) {
                console.error(`Plugin deactivation failed for ${manifest.id}:`, error);
              }
            }
          };
        }, []);

        return (
          <div 
            ref={containerRef} 
            className="html-plugin-wrapper"
            data-plugin-id={manifest.id}
            style={{ 
              width: '100%', 
              height: '100%',
              minHeight: '200px',
            }}
          />
        );
      };
    }
  }
  ```

**Acceptance Criteria:**
- HTML content loading and sanitization working
- Script module loading with error handling
- React wrapper component functional
- Plugin activation/deactivation lifecycle working

#### Step 3.1.2: Plugin Manifest Compatibility
- [ ] **Update Plugin Discovery**
  ```typescript
  // src/core/enhanced-plugin-discovery.ts
  import { PluginDiscovery } from './plugin-discovery';

  export class EnhancedPluginDiscovery extends PluginDiscovery {
    async discoverPlugins(pluginsPath: string): Promise<PluginManifest[]> {
      const plugins = await super.discoverPlugins(pluginsPath);
      
      // Also discover legacy plugins
      const legacyPlugins = await this.discoverLegacyPlugins(pluginsPath);
      
      return [...plugins, ...legacyPlugins];
    }

    private async discoverLegacyPlugins(pluginsPath: string): Promise<PluginManifest[]> {
      const pluginDirs = await this.fs.readdir(pluginsPath);
      const legacyPlugins: PluginManifest[] = [];

      for (const dir of pluginDirs) {
        const manifestPath = this.path.join(pluginsPath, dir, 'plugin.json5');
        
        try {
          const manifest = await this.loadLegacyManifest(manifestPath);
          if (this.isLegacyManifest(manifest)) {
            const convertedManifest = this.convertLegacyManifest(manifest);
            legacyPlugins.push(convertedManifest);
          }
        } catch (error) {
          // Skip if not a legacy manifest
          continue;
        }
      }

      return legacyPlugins;
    }

    private isLegacyManifest(manifest: any): boolean {
      // Legacy manifests have 'ui' field but no 'type' field
      return manifest.ui && !manifest.type;
    }

    private convertLegacyManifest(legacyManifest: any): PluginManifest {
      return {
        id: legacyManifest.id,
        name: legacyManifest.name,
        version: legacyManifest.version,
        type: 'legacy-html',
        main: legacyManifest.main,
        ui: legacyManifest.ui,
        permissions: ['ui:render', 'config:read'],
        description: legacyManifest.description,
        author: legacyManifest.author,
      };
    }
  }
  ```

**Acceptance Criteria:**
- Legacy plugin discovery working
- Manifest conversion successful
- Both modern and legacy plugins detected
- Plugin type differentiation working

### Task 3.2: Plugin Development Tools

#### Step 3.2.1: Plugin Migration Scripts
- [ ] **Create Plugin Migration CLI Tool**
  ```bash
  # scripts/migrate-plugin.js
  #!/usr/bin/env node

  const fs = require('fs').promises;
  const path = require('path');
  const { program } = require('commander');

  program
    .name('migrate-plugin')
    .description('Migrate Node-ttCommander plugin to Omnia format')
    .argument('<plugin-path>', 'Path to the plugin directory')
    .option('-o, --output <path>', 'Output directory for migrated plugin')
    .action(async (pluginPath, options) => {
      try {
        await migratePlugin(pluginPath, options.output);
        console.log('✅ Plugin migration completed successfully');
      } catch (error) {
        console.error('❌ Plugin migration failed:', error.message);
        process.exit(1);
      }
    });

  async function migratePlugin(pluginPath, outputPath) {
    console.log(`🔄 Migrating plugin: ${pluginPath}`);
    
    // 1. Validate plugin structure
    await validatePluginStructure(pluginPath);
    
    // 2. Read existing manifest
    const manifest = await readPluginManifest(pluginPath);
    
    // 3. Convert manifest to Omnia format
    const newManifest = convertManifest(manifest);
    
    // 4. Set up output directory
    const finalOutputPath = outputPath || path.join(process.cwd(), 'migrated-plugins', manifest.id);
    await fs.mkdir(finalOutputPath, { recursive: true });
    
    // 5. Copy and convert files
    await copyPluginFiles(pluginPath, finalOutputPath);
    await writeManifest(finalOutputPath, newManifest);
    
    // 6. Validate migrated plugin
    await validateMigratedPlugin(finalOutputPath);
    
    console.log(`📦 Migrated plugin saved to: ${finalOutputPath}`);
  }

  async function validatePluginStructure(pluginPath) {
    const manifestPath = path.join(pluginPath, 'plugin.json5');
    const exists = await fs.access(manifestPath).then(() => true).catch(() => false);
    
    if (!exists) {
      throw new Error('plugin.json5 not found in plugin directory');
    }
  }

  // Additional helper functions...
  
  program.parse();
  ```

- [ ] **Test Plugin Migration**
  ```bash
  # Test with existing Node-ttCommander plugins
  node scripts/migrate-plugin.js /Node-ttCommander/plugins/as-built-documenter
  node scripts/migrate-plugin.js /Node-ttCommander/plugins/context-generator
  node scripts/migrate-plugin.js /Node-ttCommander/plugins/customer-links
  node scripts/migrate-plugin.js /Node-ttCommander/plugins/script-runner
  ```

**Acceptance Criteria:**
- Migration script successfully converts all 4 existing plugins
- Manifest conversion working correctly
- File copying and structure preservation working
- Validation of migrated plugins passing

## Week 7-8: Testing Integration

### Task 4.1: Test Suite Consolidation

#### Step 4.1.1: Merge Test Configurations
- [ ] **Update Jest Configuration**
  ```javascript
  // jest.config.cjs (updated)
  module.exports = {
    preset: 'ts-jest/presets/default-esm',
    extensionsToTreatAsEsm: ['.ts', '.tsx'],
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testMatch: [
      '<rootDir>/tests/**/*.test.{ts,tsx}',
      '<rootDir>/tests/**/*.spec.{ts,tsx}',
      // Include migrated Node-ttCommander tests
      '<rootDir>/tests/legacy/**/*.test.{js,ts}',
      '<rootDir>/tests/legacy/**/*.spec.{js,ts}',
    ],
    moduleNameMapping: {
      // CSS modules
      '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
      '\\.css$': '<rootDir>/tests/style-mock.js',
      // Path aliases
      '^@/(.*)$': '<rootDir>/src/$1',
    },
    collectCoverageFrom: [
      'src/**/*.{ts,tsx}',
      '!src/**/*.d.ts',
      '!src/**/*.stories.{ts,tsx}',
    ],
    coverageThreshold: {
      global: {
        branches: 80,
        functions: 80,
        lines: 80,
        statements: 80,
      },
    },
  };
  ```

- [ ] **Convert Node-ttCommander Tests**
  ```bash
  # Create directory for legacy tests
  mkdir -p tests/legacy

  # Convert and copy tests (manual process with automation where possible)
  # Example for plugin manager tests:
  cp /Node-ttCommander/tests/core/plugin-manager.spec.js tests/legacy/plugin-manager.test.ts
  
  # Convert to TypeScript and update imports
  node scripts/convert-tests-to-typescript.js tests/legacy/plugin-manager.test.ts
  ```

**Acceptance Criteria:**
- Jest configuration supports both modern and legacy tests
- All Node-ttCommander tests converted to TypeScript
- Test coverage maintained at >80%
- No test conflicts or duplicate coverage

#### Step 4.1.2: Integration Testing for Compatibility Layers
- [ ] **Design System Integration Tests**
  ```typescript
  // tests/integration/design-system.test.ts
  import { render, screen } from '@testing-library/react';
  import { ThemeProvider } from '../../src/ui/components/ThemeProvider/ThemeProvider';
  import { Button } from '../../src/ui/components/Button/Button';

  describe('Design System Integration', () => {
    test('ttCommander theme variables are available', () => {
      const { container } = render(
        <ThemeProvider>
          <Button>Test Button</Button>
        </ThemeProvider>
      );

      const styles = getComputedStyle(container.firstChild as Element);
      
      // Verify ttCommander variables are available
      expect(styles.getPropertyValue('--tt-palette--b40')).toBe('#1e6de6');
      expect(styles.getPropertyValue('--tt-palette--g40')).toBe('#1da53f');
    });

    test('theme switching updates CSS variables', async () => {
      render(
        <ThemeProvider>
          <div data-testid="theme-test">Content</div>
        </ThemeProvider>
      );

      // Test light theme
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
      
      // Switch to dark theme (would need ThemeToggle component)
      // Verify dark theme variables are applied
    });
  });
  ```

- [ ] **Plugin Compatibility Tests**
  ```typescript
  // tests/integration/plugin-compatibility.test.ts
  import { HTMLPluginLoader } from '../../src/core/html-plugin-loader';

  describe('Plugin Compatibility', () => {
    test('loads legacy HTML plugin successfully', async () => {
      const loader = new HTMLPluginLoader();
      const manifest = {
        id: 'test-legacy-plugin',
        name: 'Test Legacy Plugin',
        ui: 'test-fixtures/legacy-plugin.html',
        main: 'test-fixtures/legacy-plugin.js',
      };

      const PluginComponent = await loader.loadPlugin(manifest);
      
      const { container } = render(<PluginComponent config={{}} context={{}} />);
      
      expect(container.querySelector('.html-plugin-wrapper')).toBeInTheDocument();
    });
  });
  ```

**Acceptance Criteria:**
- Integration tests cover all compatibility layers
- Theme integration tests passing
- Plugin compatibility tests working
- Configuration compatibility validated

### Task 4.2: End-to-End Testing

#### Step 4.2.1: Critical User Workflow Tests
- [ ] **Application Startup E2E Test**
  ```typescript
  // tests/e2e/application-startup.spec.ts
  import { test, expect } from '@playwright/test';

  test.describe('Application Startup', () => {
    test('application starts with ttCommander theme', async ({ page }) => {
      await page.goto('/');
      
      // Wait for application to load
      await expect(page.locator('[data-testid="app"]')).toBeVisible();
      
      // Verify theme is applied
      const root = page.locator('html');
      await expect(root).toHaveAttribute('data-theme', 'light');
      
      // Verify ttCommander colors are applied
      const header = page.locator('[data-testid="app-header"]');
      const bgColor = await header.evaluate(el => 
        getComputedStyle(el).getPropertyValue('background-color')
      );
      
      // Should match ttCommander theme colors
      expect(bgColor).not.toBe('');
    });

    test('plugins load correctly on startup', async ({ page }) => {
      await page.goto('/');
      
      // Wait for plugins to load
      await page.waitForSelector('[data-testid="plugins-loaded"]');
      
      // Verify plugin cards are visible
      const pluginCards = page.locator('[data-testid="plugin-card"]');
      await expect(pluginCards).toHaveCountGreaterThan(0);
      
      // Test plugin activation
      await pluginCards.first().click();
      await expect(page.locator('[data-testid="plugin-ui"]')).toBeVisible();
    });
  });
  ```

- [ ] **Configuration Management E2E Test**
  ```typescript
  // tests/e2e/configuration-management.spec.ts
  import { test, expect } from '@playwright/test';

  test.describe('Configuration Management', () => {
    test('can load and modify configuration', async ({ page }) => {
      await page.goto('/settings');
      
      // Wait for JSONEditor to load
      await expect(page.locator('.json-editor-container')).toBeVisible();
      
      // Test configuration modification
      await page.click('[data-testid="config-edit-button"]');
      
      // Modify a value in the JSON editor
      await page.fill('[data-path="appSettings.debugMode"]', 'true');
      
      // Save configuration
      await page.click('[data-testid="config-save-button"]');
      
      // Verify success message
      await expect(page.locator('[data-testid="save-success"]')).toBeVisible();
    });
  });
  ```

**Acceptance Criteria:**
- E2E tests cover critical user workflows
- Application startup test passing
- Plugin loading test working
- Configuration management test functional
- All tests run in CI/CD pipeline

## Phase 1 Completion Validation

### Final Validation Checklist

#### Design System Validation
- [ ] **Visual Consistency Check**
  - All components use ttCommander theme variables
  - Light/dark theme switching works correctly
  - No hardcoded colors in component CSS
  - Visual regression tests passing

- [ ] **Performance Validation**
  ```bash
  # Measure application startup time
  npm run test:performance:startup
  
  # Measure theme switching performance
  npm run test:performance:theme-switch
  
  # Validate memory usage
  npm run test:performance:memory
  ```

#### Configuration System Validation
- [ ] **Backward Compatibility**
  - Existing Node-ttCommander configs load successfully
  - JSONEditor functionality preserved
  - Configuration state management working
  - Schema validation working for both systems

#### Plugin System Validation
- [ ] **Plugin Compatibility**
  - All 4 existing plugins migrate successfully
  - HTML plugins render correctly in React
  - Plugin activation/deactivation working
  - Plugin configuration loading correctly

#### Testing Validation
- [ ] **Test Coverage**
  ```bash
  # Generate coverage report
  npm run test:coverage
  
  # Verify coverage thresholds
  # Expected: >90% for core functionality
  ```

- [ ] **Test Quality**
  - Unit tests: >90% coverage
  - Integration tests: >80% coverage
  - E2E tests: 100% critical workflows
  - All tests passing in CI

### Performance Benchmarks
- [ ] **Startup Performance**
  - Target: <3 seconds application startup
  - Current measurement: ___ seconds
  - Degradation from baseline: <20%

- [ ] **Memory Usage**
  - Target: <200MB baseline memory usage
  - Current measurement: ___ MB
  - Plugin loading overhead: <50MB per plugin

- [ ] **UI Responsiveness**
  - Target: <100ms for user interactions
  - Theme switching: <200ms
  - Configuration updates: <500ms

## Success Criteria Met

- [ ] **All tasks completed successfully**
- [ ] **Design system fully integrated**
- [ ] **Configuration compatibility maintained** 
- [ ] **Plugin compatibility layer working**
- [ ] **Test coverage >90%**
- [ ] **Performance within acceptable limits**
- [ ] **No critical bugs or issues**

## Next Steps

Upon successful completion of Phase 1:

1. **Performance Optimization**: Address any performance issues identified
2. **User Acceptance Testing**: Test with actual users and workflows  
3. **Documentation Updates**: Complete all migration documentation
4. **Phase 2 Preparation**: Begin plugin system unification planning
5. **Team Training**: Ensure team is familiar with new system

---

*Phase 1 Task List - Created: January 2025*