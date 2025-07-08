# Phase 1: Foundation Migration (Months 1-2)

## Overview

The foundation migration phase focuses on establishing Omnia as the primary codebase while preserving Node-ttCommander's proven design system and core functionality. This phase creates the foundation for all subsequent migration work.

## Objectives

- **Primary Goal**: Establish Omnia as the unified codebase foundation
- **Preservation**: Maintain Node-ttCommander's design system and proven features
- **Compatibility**: Ensure existing configurations continue to work
- **Testing**: Maintain comprehensive test coverage throughout migration

## Phase 1 Tasks

### 1. Design System Migration

#### Task 1.1: Extract and Analyze Node-ttCommander Design System
- [ ] **Copy CSS Design System** 
  - Extract `/Node-ttCommander/src/ui/style.css` (858 lines)
  - Create `/Omnia/src/ui/styles/ttcommander-theme.css`
  - Preserve complete color palette (8 families × 10 shades)
  - Maintain semantic CSS variables

- [ ] **Document Design Tokens**
  - Create `/Omnia/src/ui/styles/design-tokens.ts`
  - Export TypeScript interfaces for theme structure
  - Document color semantic meanings and usage patterns

- [ ] **Create Theme Integration**
  - Update `/Omnia/src/ui/global.css` to import ttCommander theme
  - Ensure compatibility with existing Tailwind configuration
  - Test theme switching functionality

**Expected Outcome**: Complete Node-ttCommander design system available in Omnia

#### Task 1.2: Component Theme Integration
- [ ] **Update Component Library**
  - Modify existing Omnia components to use ttCommander theme variables
  - Update `/Omnia/src/ui/components/*/` CSS modules
  - Ensure design consistency across all components

- [ ] **Create Theme Provider**
  - Implement React context for theme management
  - Support light/dark mode switching
  - Maintain theme persistence

- [ ] **Visual Regression Testing**
  - Create Playwright tests for theme consistency
  - Capture screenshots of all components in both themes
  - Establish baseline for future changes

**Expected Outcome**: All Omnia components use ttCommander design system

### 2. Configuration System Integration

#### Task 2.1: JSONEditor Integration
- [ ] **Extract JSONEditor Components**
  - Copy JSONEditor integration code from Node-ttCommander
  - Create `/Omnia/src/ui/components/JSONEditor/` React wrapper
  - Preserve all customization and theming

- [ ] **Schema Compatibility Layer**
  - Create compatibility between AJV (Node-ttCommander) and Zod (Omnia)
  - Implement schema conversion utilities
  - Ensure both validation systems work together

- [ ] **Configuration State Management**
  - Port collapse/expand state management from Node-ttCommander
  - Integrate with Omnia's React state management
  - Preserve user preferences and state persistence

**Expected Outcome**: JSONEditor functionality preserved in React environment

#### Task 2.2: Configuration File Compatibility
- [ ] **Unified Configuration Loading**
  - Update Omnia's settings manager to handle Node-ttCommander configs
  - Ensure backward compatibility with existing config files
  - Implement migration utilities for config format changes

- [ ] **Environment Variable Support**
  - Port Node-ttCommander's environment variable override system
  - Integrate with Omnia's configuration management
  - Maintain security and validation features

- [ ] **Configuration Backup System**
  - Implement automatic configuration backups
  - Create configuration restore functionality
  - Ensure data integrity during migration

**Expected Outcome**: Seamless configuration compatibility between systems

### 3. Plugin Compatibility Layer

#### Task 3.1: Legacy Plugin Support
- [ ] **HTML Plugin Loader**
  - Create compatibility layer for Node-ttCommander HTML plugins
  - Implement secure HTML injection in React environment
  - Maintain plugin isolation and security

- [ ] **Plugin Manifest Compatibility**
  - Update Omnia's plugin discovery to handle Node-ttCommander manifests
  - Create manifest migration utilities
  - Ensure both manifest formats are supported

- [ ] **Plugin Configuration Bridge**
  - Create bridge between Node-ttCommander and Omnia plugin configs
  - Implement configuration conversion utilities
  - Maintain plugin-specific settings

**Expected Outcome**: Existing Node-ttCommander plugins work in Omnia

#### Task 3.2: Plugin Development Tools
- [ ] **Plugin Migration Scripts**
  - Create automated tools for plugin migration
  - Implement manifest conversion utilities
  - Provide migration validation and testing

- [ ] **Development Documentation**
  - Create migration guide for plugin developers
  - Document compatibility layer usage
  - Provide examples of successful migrations

- [ ] **Testing Framework**
  - Implement testing utilities for legacy plugins
  - Create validation framework for plugin compatibility
  - Ensure comprehensive test coverage

**Expected Outcome**: Clear migration path for all existing plugins

### 4. Testing Integration

#### Task 4.1: Test Suite Consolidation
- [ ] **Merge Test Suites**
  - Combine Node-ttCommander and Omnia test suites
  - Resolve conflicts and duplicate tests
  - Maintain comprehensive coverage

- [ ] **Legacy Test Compatibility**
  - Ensure Node-ttCommander tests work in Omnia environment
  - Update test utilities and mocking strategies
  - Maintain test quality and coverage standards

- [ ] **Integration Testing**
  - Create tests for compatibility layers
  - Validate design system integration
  - Test configuration migration functionality

**Expected Outcome**: Comprehensive test coverage for merged functionality

#### Task 4.2: End-to-End Testing
- [ ] **User Workflow Testing**
  - Create E2E tests for critical user workflows
  - Test plugin loading and configuration
  - Validate theme switching and persistence

- [ ] **Performance Testing**
  - Baseline performance metrics for merged system
  - Monitor memory usage and startup times
  - Ensure performance remains acceptable

- [ ] **Compatibility Testing**
  - Test with existing Node-ttCommander configurations
  - Validate plugin compatibility across systems
  - Ensure data integrity during migration

**Expected Outcome**: Robust testing framework for ongoing development

## Implementation Details

### Design System Migration Code Examples

#### CSS Variable Extraction
```css
/* From Node-ttCommander style.css */
:root {
  --tt-palette--b40: #1e6de6;  /* Action Blue */
  --tt-palette--g40: #1da53f;  /* Success Green */
  --tt-palette--r40: #d73527;  /* Error Red */
  --tt-palette--y40: #f59e0b;  /* Warning Yellow */
  --tt-palette--p40: #8b5cf6;  /* Purple */
  --tt-palette--t40: #06b6d4;  /* Teal */
  --tt-palette--o40: #f97316;  /* Orange */
  --tt-palette--n40: #6b7280;  /* Neutral */
}

/* Theme-specific colors */
:root[data-theme="light"] {
  --tt-color-background-body: var(--tt-palette--n95);
  --tt-color-text-primary: var(--tt-palette--n10);
  --tt-color-surface: var(--tt-palette--n100);
}

:root[data-theme="dark"] {
  --tt-color-background-body: var(--tt-palette--n10);
  --tt-color-text-primary: var(--tt-palette--n95);
  --tt-color-surface: var(--tt-palette--n20);
}
```

#### TypeScript Theme Interface
```typescript
// src/ui/styles/design-tokens.ts
export interface ThemeTokens {
  palette: {
    blue: Record<string, string>;
    green: Record<string, string>;
    red: Record<string, string>;
    yellow: Record<string, string>;
    purple: Record<string, string>;
    teal: Record<string, string>;
    orange: Record<string, string>;
    neutral: Record<string, string>;
  };
  semantic: {
    action: string;
    success: string;
    error: string;
    warning: string;
  };
}
```

#### React Theme Provider
```tsx
// src/ui/components/ThemeProvider/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

interface ThemeContextType {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
```

### Configuration Migration Code Examples

#### JSONEditor React Wrapper
```tsx
// src/ui/components/JSONEditor/JSONEditor.tsx
import React, { useEffect, useRef } from 'react';
import { JSONEditor } from 'vanilla-jsoneditor';

interface JSONEditorProps {
  content: any;
  onChange: (content: any) => void;
  schema?: any;
  mode?: 'tree' | 'code' | 'form';
}

export const JSONEditorComponent: React.FC<JSONEditorProps> = ({
  content,
  onChange,
  schema,
  mode = 'tree'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<JSONEditor | null>(null);

  useEffect(() => {
    if (containerRef.current && !editorRef.current) {
      editorRef.current = new JSONEditor({
        target: containerRef.current,
        props: {
          content,
          mode,
          schema,
          onChange: (updatedContent) => {
            onChange(updatedContent);
          }
        }
      });
    }
  }, []);

  return <div ref={containerRef} className="json-editor-container" />;
};
```

#### Schema Compatibility Layer
```typescript
// src/core/schema-compatibility.ts
import { z } from 'zod';
import Ajv from 'ajv';

export class SchemaCompatibility {
  private ajv = new Ajv({ useDefaults: true, allErrors: true });

  // Convert AJV schema to Zod schema
  convertAjvToZod(ajvSchema: any): z.ZodSchema<any> {
    // Implementation for schema conversion
    return z.object({}); // Placeholder
  }

  // Validate using both systems
  validateWithBoth(data: any, ajvSchema: any, zodSchema: z.ZodSchema<any>) {
    const ajvResult = this.ajv.validate(ajvSchema, data);
    const zodResult = zodSchema.safeParse(data);
    
    return {
      ajv: { valid: ajvResult, errors: this.ajv.errors },
      zod: { valid: zodResult.success, errors: zodResult.error?.errors }
    };
  }
}
```

## Success Criteria

### Phase 1 Success Metrics
- [ ] **Design System**: ttCommander theme fully integrated and functional
- [ ] **Configuration**: Existing Node-ttCommander configs load without issues
- [ ] **Plugins**: All existing plugins continue to work through compatibility layer
- [ ] **Testing**: Test suite maintains >90% coverage
- [ ] **Performance**: No more than 20% performance degradation
- [ ] **Documentation**: Complete migration documentation available

### Validation Steps
1. **Visual Validation**: All UI components match ttCommander design
2. **Functional Validation**: All existing features work correctly
3. **Performance Validation**: Startup and runtime performance acceptable
4. **Compatibility Validation**: All existing configs and plugins work
5. **Test Validation**: All tests pass with adequate coverage

## Risk Mitigation

### High-Risk Items
1. **Design System Conflicts**: Potential CSS conflicts between systems
   - **Mitigation**: Thorough CSS scoping and testing
   - **Fallback**: Gradual integration with feature flags

2. **Configuration Breaking Changes**: Existing configs may not load
   - **Mitigation**: Comprehensive backward compatibility testing
   - **Fallback**: Configuration migration utilities

3. **Plugin Compatibility Issues**: Legacy plugins may not work
   - **Mitigation**: Extensive compatibility layer testing
   - **Fallback**: Plugin-specific migration assistance

### Medium-Risk Items
1. **Performance Degradation**: React overhead may impact performance
   - **Mitigation**: Performance monitoring and optimization
   - **Fallback**: Selective feature rollback

2. **Testing Complexity**: Merged test suites may be complex
   - **Mitigation**: Gradual test integration with validation
   - **Fallback**: Parallel test execution

## Next Steps

Upon completion of Phase 1:
1. **Validate Success Criteria**: Ensure all phase objectives are met
2. **User Acceptance Testing**: Validate with actual users and workflows
3. **Performance Tuning**: Optimize any identified performance issues
4. **Documentation Update**: Complete all migration documentation
5. **Prepare for Phase 2**: Begin plugin system unification planning

## Dependencies

- Completion of comprehensive project analysis
- Access to both Node-ttCommander and Omnia codebases
- Development environment setup
- Testing infrastructure preparation

---

*Phase 1 Documentation - Last Updated: January 2025*