# Omnia Design Decisions

This document captures all major architectural and design decisions made during the planning phase of Omnia development.

## **1. Schema & Configuration System**

### **Decision: Zod over JSON Schema**
**Rationale**: 
- TypeScript-first approach with automatic type inference
- Better developer experience with IDE support
- Runtime validation with detailed error messages
- Easier to compose and transform schemas

**Implementation**:
```typescript
// Example: Plugin config schema
export const ScriptRunnerConfigSchema = z.object({
  enabled: z.boolean().default(true),
  scriptsDirectory: z.string().default("scripts"),
  scriptConfigurations: z.array(ScriptConfigSchema).default([])
});

type ScriptRunnerConfig = z.infer<typeof ScriptRunnerConfigSchema>;
```

**Tradeoffs**:
- ✅ Excellent TypeScript integration
- ✅ Better runtime validation
- ❌ TypeScript/JavaScript ecosystem only
- ❌ Slightly larger bundle size (~13KB)

### **Decision: Hybrid Settings Management**
**Structure**:
```
config/
├── app.json5          # Main app settings
├── plugins.json5      # Plugin registry & state
└── plugins/           # Individual plugin settings
    ├── as-built.json5
    ├── customer-links.json5
    └── script-runner.json5
```

**Rationale**:
- Plugin independence: Each plugin owns its configuration
- Clean separation: App vs plugin settings
- Easy plugin management: Add/remove without touching main config
- Backup simplicity: Single config/ directory

## **2. Styling Architecture**

### **Decision: Hybrid CSS Modules + Tailwind CSS**
**Usage Pattern**:
- **Tailwind for**: Layout, spacing, responsive design, quick utilities, component variants
- **CSS Modules for**: Complex components, animations, theme systems, component-specific logic

**Example**:
```typescript
// Hybrid approach
import styles from './PluginCard.module.css';

export const PluginCard = ({ title, status }) => (
  <article className={`${styles.card} p-6 rounded-lg border border-gray-200`}>
    <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
    <div className={`${styles.statusIndicator} ${styles[status]}`} />
  </article>
);
```

**Rationale**:
- Best of both worlds: Rapid development + design flexibility
- Component library friendly: Easy to package and distribute
- Performance: CSS Modules for production optimization
- Learning curve: Gradual adoption of Tailwind utilities

## **3. UI Architecture & Navigation**

### **Decision: Unus-Inspired Sidebar Navigation**
**Design Pattern**:
- **Left sidebar**: Dashboard, Plugins, Settings
- **Dashboard page**: Large plugin cards for quick access
- **Individual plugin views**: Full content area utilization
- **Multi-page plugin support**: Breadcrumb navigation for complex plugins

**Inspiration Sources**:
- **Unus UI**: Beautiful design language, large cards, professional appearance
- **ttCommander UI**: Integrated navigation, full real estate usage, multi-page support

**Rationale**:
- Single plugin focus: Reduces cognitive load
- Full real estate: Better plugin functionality
- Professional appearance: Modern, clean interface
- Extensible: Supports simple and complex plugins

### **Decision: Single Plugin Display**
**Pattern**: One plugin visible at a time, not simultaneous grid view
**Rationale**:
- Better focus and usability
- More space for plugin functionality
- Cleaner visual hierarchy
- Supports complex multi-page plugins

## **4. Plugin Architecture**

### **Decision: Three-Tier Plugin System**
**Tier 1: Simple Plugins**
```typescript
// Just export React component
export default function Calculator() {
  return <div>Simple calculator UI</div>;
}
```

**Tier 2: Configured Plugins** (Most Common)
```typescript
// Component + configuration schema
export default function ScriptRunner() {
  const config = usePluginConfig(ScriptRunnerSchema);
  return <div>Script runner with settings</div>;
}
export { ScriptRunnerSchema as configSchema };
```

**Tier 3: Advanced Plugins**
```typescript
// Full lifecycle with background processing
export default class FileScanner extends AdvancedPlugin {
  async onInit() { /* Setup background service */ }
  render() { return <div>File scanner UI</div>; }
}
```

**Rationale**:
- Progressive complexity: Start simple, add features as needed
- Developer experience: Easy entry point, powerful when needed
- Performance: Only load complexity when required

### **Decision: Service Registry Communication Pattern**
**Pattern**: Plugins communicate through main application service registry
```typescript
// Plugin registers service
this.registerService('file-scanner', {
  scanDirectory: this.scanDirectory.bind(this),
  findFiles: this.findFiles.bind(this)
});

// Other plugins consume service
const fileService = useService<FileService>('file-scanner');
```

**Rationale**:
- Controlled communication: Main app mediates all interactions
- Service discovery: Plugins can find available functionality
- Decoupling: Plugins don't directly depend on each other
- Safety: Main app can validate and sandbox service calls

### **Decision: Moderate Plugin Sandboxing**
**Permission System**:
```json5
{
  "id": "script-runner",
  "permissions": [
    "filesystem:read",
    "filesystem:write", 
    "process:execute",
    "service:file-scanner"
  ]
}
```

**Safety Measures**:
- Permission declarations in manifest
- Runtime permission checking
- Path validation (prevent directory traversal)
- Service access control

**Rationale**:
- Accident prevention: Stop bad plugins from major damage
- Not security-focused: Assumes trusted plugin development
- Developer-friendly: Clear permission model
- Practical: Matches actual use cases (script runner, file scanner)

### **Decision: Plugin Types**
**Three Plugin Types**:
- **UI Plugin**: Pure interface components
- **Service Plugin**: Background functionality only
- **Hybrid Plugin**: Both UI and background service

**Rationale**:
- Matches actual use cases: File scanner (service), weather widget (UI), script runner (hybrid)
- Flexible architecture: Plugins choose appropriate pattern
- Resource efficiency: Service plugins don't load unnecessary UI

### **Decision: Local Plugin Distribution Only**
**Pattern**: All plugins are local, no marketplace or registry
**Rationale**:
- Simplicity: No complex distribution infrastructure
- Control: Full control over plugin ecosystem
- Performance: No network dependencies
- Security: Known, trusted plugin sources

## **5. Component Library Strategy**

### **Decision: Reusable Component Library Architecture**
**Structure**:
```
src/lib/
├── components/
│   ├── primitives/     # Button, Input, Badge (Tailwind-heavy)
│   ├── layout/         # Sidebar, Card, Grid (Hybrid)
│   ├── complex/        # PluginCard, SettingsForm (CSS Modules-heavy)
│   └── theme/          # Design tokens and theme system
├── hooks/              # Reusable React hooks
├── utils/              # Configuration utilities
└── types/              # Common TypeScript types
```

**Rationale**:
- Future applications: Build once, reuse everywhere
- Consistency: Shared design language across projects
- Maintainability: Centralized component development
- Documentation: Self-documenting component library

### **Decision: Schema-Driven Form Generation**
**Pattern**: Auto-generate settings forms from Zod schemas
```typescript
// Automatic form generation
<SettingsForm 
  schema={ScriptRunnerSchema} 
  value={config} 
  onChange={updateConfig}
/>
```

**Rationale**:
- DRY principle: Define schema once, get validation + UI
- Consistency: Uniform settings interface across plugins
- Developer experience: No manual form building
- Maintainability: Schema changes automatically update UI

## **6. Development Workflow**

### **Decision: Plugin Development Toolkit**
**Tools to Provide**:
- Plugin CLI for code generation
- Development server with hot reload
- Plugin hooks (usePluginConfig, useService)
- Testing utilities
- Documentation generator

**Rationale**:
- Developer experience: Easy plugin creation
- Consistency: Standardized plugin structure
- Quality: Built-in testing and documentation
- Productivity: Reduce boilerplate development

### **Decision: Progressive Enhancement Approach**
**Implementation Order**:
1. Simple plugins first (Tier 1)
2. Add configuration system (Tier 2)
3. Add advanced features as needed (Tier 3)

**Rationale**:
- Immediate value: Get basic functionality working quickly
- Risk mitigation: Test architecture with simple cases
- Learning curve: Build complexity gradually
- User feedback: Validate approach before full implementation

## **7. Technical Stack Decisions**

### **Primary Technologies**:
- **Framework**: React with TypeScript
- **Validation**: Zod schemas
- **Styling**: Tailwind CSS + CSS Modules
- **Build**: TypeScript compiler
- **Runtime**: Electron + Node.js

### **Key Dependencies**:
- **Zod**: Schema validation and type generation
- **React**: UI component framework
- **Tailwind**: Utility-first CSS framework
- **TypeScript**: Type safety and developer experience

**Rationale**:
- Proven technologies: Battle-tested, well-documented
- TypeScript ecosystem: Excellent tooling and type safety
- Modern development: Current best practices
- Community support: Large ecosystems and resources

## **8. Future Considerations**

### **Potential Additions** (Not Immediate):
- Plugin marketplace/registry
- Plugin versioning and compatibility
- Plugin communication protocols
- Advanced permission systems
- Plugin hot-swapping
- Multi-language plugin support

### **Architectural Flexibility**:
- Service registry can be extended for complex communication
- Permission system can be enhanced for fine-grained control
- Component library can support multiple design systems
- Schema system can add runtime UI generation features

**Rationale**:
- Future-proof: Architecture supports enhancements
- Pragmatic: Focus on immediate needs first
- Extensible: Clear extension points for future features
- Maintainable: Simple foundation that can grow

---

## **Decision Log Summary**

| Decision | Alternative Considered | Rationale |
|----------|----------------------|-----------|
| Zod Schemas | JSON Schema | TypeScript integration, better DX |
| Hybrid Styling | Pure CSS Modules or Pure Tailwind | Best of both worlds |
| Sidebar Navigation | Grid Dashboard | Better focus, professional appearance |
| Service Registry | Direct Plugin Communication | Safety, control, decoupling |
| Three-Tier Plugins | Single Plugin Pattern | Progressive complexity |
| Local Distribution | Plugin Marketplace | Simplicity, control |
| Schema-Driven Forms | Manual Form Building | DRY principle, consistency |

This document serves as the architectural foundation for Omnia development and should be referenced when making implementation decisions.