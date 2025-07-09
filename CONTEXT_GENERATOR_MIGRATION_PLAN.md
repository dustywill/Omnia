# Context Generator Plugin Migration Plan - Comprehensive Analysis

## Executive Summary & Goals

This document merges two comprehensive analysis plans for migrating the Context Generator plugin from Node-ttCommander to Omnia. The goal is to achieve full feature parity while modernizing the implementation with React/TypeScript and integrating with Omnia's architecture.

### **Original Plugin Capabilities (Node-ttCommander)**
- **Purpose**: Scans directory structures and bundles selected file contents into formatted text output
- **Core Features**: Directory scanning, regex filtering, interactive file tree, preset management, content generation, clipboard integration
- **Configuration**: Persistent user preferences, custom filter presets, last-used settings
- **UI**: HTML/JS with interactive tree view, filter controls, and output panel

## Merged Implementation Strategy

### **Phase 1: Foundation & Configuration**

#### 1.1 Plugin Structure Setup ✅
- **Status**: Basic structure exists in `/plugins/context-generator/`
- **Existing**: `plugin.json5`, `index.tsx`, `config-schema.js`
- **Needs Enhancement**: Full feature implementation

#### 1.2 Configuration Schema Alignment
**File**: `config-schema.js`

**Current State Analysis**:
- ✅ **Good**: Comprehensive schema with many advanced features
- ⚠️ **Issue**: Schema has extra features not in ttCommander (outputDirectory, maxFileSize, etc.)
- ⚠️ **Issue**: Default values differ from ttCommander

**Required Changes**:
```javascript
// Fix default values to match ttCommander exactly:
lastFileFilterType: z.enum(['include', 'exclude']).default('include')    // Current: 'include' ✅ 
lastFolderFilterType: z.enum(['include', 'exclude']).default('include')  // Current: 'include' ✅

// Remove ttCommander incompatible fields from SavedFilterSchema:
// - Remove name and description (not in ttCommander)
// - Keep: fileRegex, fileFilterType, folderRegex, folderFilterType, maxDepth

// Consider keeping advanced features as Omnia enhancements:
// - outputDirectory, maxFileSize, etc. (marked as Omnia-specific)
```

#### 1.3 Plugin Manifest Update
**File**: `plugin.json5`

**Required Updates**:
```json5
{
  id: "context-generator",                    // ✅ Matches ttCommander
  name: "Context Generator",                  // ✅ Matches ttCommander  
  version: "1.0.0",                          // ✅ Updated from 0.1.0
  main: "index.js",                          // ✅ Correct
  type: "configured",                        // ✅ Correct for Omnia
  permissions: [
    "filesystem:read",                       // ✅ Required
    "filesystem:write",                      // ✅ Required  
    "filesystem:select",                     // ➕ Add for folder selection
    "clipboard:write"                        // ➕ Add for clipboard access
  ]
}
```

### **Phase 2: API Migration & Core Functionality**

#### 2.1 File System API Migration
**File**: `index.tsx`

**Replace Direct Node.js Calls**:
```typescript
// Before (Node.js direct):
import { readdir, stat, readFile } from 'fs/promises';
import { join, basename, extname, relative } from 'path';

// After (Omnia APIs):
window.fileSystemAPI.scanDirectory()     // Replace readdir/stat
window.fileSystemAPI.readFiles()         // Replace readFile  
window.fileSystemAPI.selectFolder()      // Replace prompt for directory
window.fileSystemAPI.copyToClipboard()   // Replace navigator.clipboard
window.utilityAPI.joinPosix()            // Replace path.join
window.utilityAPI.basename()             // Replace path.basename
window.utilityAPI.relative()             // Replace path.relative
window.fileSystemAPI.getRootPath()       // Replace process.cwd()
```

#### 2.2 Configuration API Integration
```typescript
// Initial config loading:
const config = await window.configAPI.getConfigAndSchema();

// Persist settings:
await window.configAPI.savePluginConfig('context-generator', updatedConfig);
```

### **Phase 3: UI Component Implementation**

#### 3.1 Component Architecture
```
ContextGenerator/
├── index.tsx (Main plugin component)
├── components/
│   ├── FolderSelector/           // Folder selection with path display
│   ├── FilterControls/           // Regex inputs, presets, modes
│   ├── FileTree/                 // Interactive tree with checkboxes
│   ├── OutputPanel/              // Content generation and display
│   ├── PresetManager/            // Save/load/delete custom presets
│   └── SearchBox/                // Real-time tree search
├── hooks/
│   ├── useFileSystem.ts          // File system operations
│   ├── useFilters.ts             // Filter logic and presets
│   ├── useTreeState.ts           // Tree selection and expansion
│   └── useConfig.ts              // Configuration management
└── types/
    └── index.ts                  // TypeScript definitions
```

#### 3.2 Core UI Components

**3.2.1 Folder Selector Component**
- System dialog integration via `window.fileSystemAPI.selectFolder()`
- Path display with breadcrumb navigation
- "Select Folder" button with loading state

**3.2.2 Filter Controls Component**
- **Preset Dropdown**: Built-in (Common, PHP) + custom presets
- **File Filter**: Regex input + include/exclude radio buttons  
- **Folder Filter**: Regex input + include/exclude radio buttons
- **Max Depth**: Number input (-1 for unlimited)
- **Preset Management**: Save/Delete buttons for custom presets

**3.2.3 Interactive File Tree Component**
- **Hierarchical Display**: Folders with expand/collapse (+/-)
- **Tri-state Checkboxes**: Unchecked, checked, indeterminate
- **Selection Logic**: 
  - Individual file selection
  - Folder selection affects all descendants
  - Parent state updates based on children
- **Visual Indicators**: Folder icons, indentation, search highlighting

**3.2.4 Search Functionality**
- **Real-time Search**: Filter tree display as user types
- **Search Highlighting**: Visual indication of matches
- **Search Scope**: File names and folder names

**3.2.5 Output Panel Component**
- **Content Generation**: Batch file reading with progress
- **Formatted Output**: Structured text with headers and code blocks
- **Character Count**: Real-time character count display
- **Clipboard Integration**: Copy button with success feedback
- **Progress Indicators**: Loading states and error handling

#### 3.3 Built-in Filter Presets

**Common Preset**:
```typescript
{
  name: 'Common',
  folderRegex: 'node_modules|\\.git|\\.hg|logs|\\.qodo',
  folderFilterType: 'exclude',
  fileRegex: '',
  fileFilterType: 'include', 
  maxDepth: -1
}
```

**PHP Preset**:
```typescript
{
  name: 'PHP',
  folderRegex: 'node_modules|\\.git|\\.hg|logs|vendor|\\.qodo',
  folderFilterType: 'exclude',
  fileRegex: '\\.(php|inc|module|install)$',
  fileFilterType: 'include',
  maxDepth: -1
}
```

### **Phase 4: Advanced Features**

#### 4.1 State Management
- **Selection State**: Track checked files and folders
- **Expansion State**: Remember expanded/collapsed folders  
- **Filter State**: Persist active filters
- **Configuration State**: Auto-save user preferences

#### 4.2 Content Generation Engine
```typescript
interface GeneratedContent {
  fileCount: number;
  characterCount: number;
  content: string;
  errors: FileError[];
}

// Format structure:
// File: relative/path/to/file.ext
// ---
// [file contents]
// 
```

#### 4.3 Performance Optimizations
- **Lazy Loading**: Load tree nodes on demand
- **Virtual Scrolling**: Handle large directory structures  
- **Debounced Search**: Optimize search performance
- **Progress Reporting**: Real-time feedback during operations

### **Phase 5: Integration & Polish**

#### 5.1 Omnia Integration
- **Component Library**: Use Omnia's Button, Input, etc.
- **Styling**: Hybrid Tailwind + CSS Modules approach
- **Notifications**: Integrate with notification system
- **Error Handling**: Consistent error reporting

#### 5.2 Responsive Design
- **Two-Panel Layout**: Tree view (40%) + Output (60%)
- **Mobile Adaptation**: Collapsible panels for small screens
- **Accessibility**: Keyboard navigation, screen reader support

## Key Differences Between Plans & Resolutions

### **1. Configuration Schema Scope**

**Gemini Plan**: Minimal schema matching ttCommander exactly
**Claude Plan**: Enhanced schema with additional Omnia-specific features

**Resolution**: 
- ✅ **Keep core ttCommander features** for compatibility
- ✅ **Add Omnia enhancements** as optional features marked clearly
- ✅ **Maintain exact default values** from ttCommander where applicable

### **2. Implementation Approach**

**Gemini Plan**: Phase-based, systematic replacement
**Claude Plan**: Component-based architecture with hooks

**Resolution**:
- ✅ **Use Gemini's phased approach** for systematic migration
- ✅ **Adopt Claude's component architecture** for maintainable code
- ✅ **Combine both testing strategies** (manual + automated)

### **3. Feature Scope**

**Gemini Plan**: Exact feature parity with ttCommander
**Claude Plan**: Enhanced features + modernization

**Resolution**:
- ✅ **Core Feature Parity**: All ttCommander features must work identically
- ✅ **Progressive Enhancement**: Add Omnia-specific improvements as optional
- ✅ **Backwards Compatibility**: Support importing ttCommander configurations

## Implementation Priority

### **High Priority (Core Functionality)**
1. ✅ Folder selection and directory scanning
2. ✅ Basic file tree display with checkboxes
3. ✅ File selection logic (tri-state checkboxes)
4. ✅ Content generation and formatting
5. ✅ Clipboard integration
6. ✅ Configuration persistence

### **Medium Priority (ttCommander Parity)**
1. ✅ Regex filtering (files and folders)
2. ✅ Built-in presets (Common, PHP)
3. ✅ Custom preset management
4. ✅ Search functionality
5. ✅ Progress indicators and error handling
6. ✅ Last-used settings persistence

### **Low Priority (Omnia Enhancements)**
1. 🔄 Enhanced responsive design
2. 🔄 Advanced performance optimizations
3. 🔄 Additional output formats
4. 🔄 Extended configuration options
5. 🔄 Integration with project management features

## Testing Strategy

### **Manual Testing Checklist**
- [ ] Plugin loads correctly in Omnia
- [ ] Folder selection dialog works
- [ ] Directory scanning with various paths
- [ ] All filter options (regex, modes, depth)
- [ ] File tree rendering and interaction
- [ ] Tri-state checkbox logic
- [ ] Content generation accuracy
- [ ] Clipboard functionality
- [ ] Preset management (save/load/delete)
- [ ] Configuration persistence
- [ ] Search functionality
- [ ] Error handling scenarios

### **Automated Testing**
- [ ] Unit tests for filter logic
- [ ] Unit tests for tree state management
- [ ] Unit tests for content generation
- [ ] Integration tests for file system operations
- [ ] Performance tests for large directories

## Success Criteria

1. **✅ Feature Parity**: All ttCommander functionality works identically
2. **✅ API Integration**: Uses Omnia's file system and config APIs exclusively
3. **✅ Modern UI**: React/TypeScript implementation with component library
4. **✅ Performance**: Handles large directories efficiently
5. **✅ Configuration**: Persistent settings and presets
6. **✅ User Experience**: Intuitive interface matching Omnia design standards

## Risks & Mitigation

1. **File System API Limitations**: Test thoroughly with various directory structures
2. **Performance with Large Trees**: Implement virtual scrolling and lazy loading
3. **Configuration Migration**: Support importing existing ttCommander configs
4. **Browser Compatibility**: Test in all supported environments

This merged plan provides a comprehensive roadmap for successfully migrating the Context Generator plugin while maintaining feature parity and adding modern enhancements.