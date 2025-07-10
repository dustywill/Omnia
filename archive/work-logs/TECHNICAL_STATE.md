# TECHNICAL STATE - Omnia Application

**Last Updated:** July 6, 2025
**Current Branch:** feature/settings-management-architecture

## CURRENT ARCHITECTURE

### Core System Components

#### 1. Entry Point & Environment Setup
- **File:** `src/index.ts`
- **Purpose:** Handles environment detection (Node.js vs Browser/Electron)
- **Key Features:**
  - JSDOM setup for Node.js environment
  - Native DOM for browser/Electron
  - Plugin manager initialization
  - Settings manager startup

#### 2. Plugin Management System
- **File:** `src/core/plugin-manager.ts`
- **Architecture:** Three-tier plugin system
  - **Simple:** React component only
  - **Configured:** React + Zod schema
  - **Advanced:** Full lifecycle management
- **Features:**
  - Service registry for inter-plugin communication
  - Permission-based security
  - Dynamic loading with error handling
  - Status tracking and lifecycle management

#### 3. Settings Management (Hybrid System)
- **File:** `src/core/settings-manager.ts`
- **Configuration Files:**
  - `config/app.json5` - Main application settings
  - `config/plugins.json5` - Plugin registry and state
  - `config/plugins/*.json5` - Individual plugin configurations
- **Features:**
  - Zod schema validation
  - File watching for live updates
  - Type-safe configuration access
  - Permission-based security

#### 4. Event System
- **File:** `src/core/event-bus.ts`
- **Type:** Type-safe event bus
- **Pattern:** Subscribe/unsubscribe/publish with typed payloads

## RECENT MAJOR ENHANCEMENTS

### 1. Client-Side Logging System
- **New File:** `src/ui/client-logger.ts`
- **Implementation:**
  ```typescript
  // Captures all console methods
  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalError = console.error;
  const originalInfo = console.info;
  
  // Unified logging to single file
  logToFile(`[client-renderer] ${level}: ${message}`);
  ```
- **Integration:** Initialized in `src/ui/main-app-renderer.tsx`
- **Output:** Unified logs in `logs/app.log`

### 2. Enhanced IPC System
- **Files Modified:** `src/electron-main.ts`, `src/preload.js`
- **New IPC Handlers:**
  ```javascript
  // In electron-main.ts
  ipcMain.handle('fs-stat', async (event, filePath) => {
    // Safe file stat operations
  });
  
  // In preload.js
  stat: (filePath) => ipcRenderer.invoke('fs-stat', filePath)
  ```
- **Security:** Proper path validation and error handling

### 3. Plugin File System Operations
- **Example:** ScriptRunner plugin (`plugins/script-runner/index.tsx`)
- **Fixed Pattern:**
  ```typescript
  // Before: Direct fs.stat (caused errors)
  // After: Proper IPC usage
  const stats = await window.electronAPI.stat(scriptPath);
  ```

## COMPONENT LIBRARY STATE

### New Components Added

#### ToggleSwitch Component
- **Location:** `src/ui/components/ToggleSwitch/`
- **Architecture:** Hybrid Tailwind + CSS Modules
- **Files:**
  - `ToggleSwitch.tsx` - React component with TypeScript interfaces
  - `ToggleSwitch.module.css` - CSS module for animations and states
  - `index.ts` - Export definitions
- **Features:**
  - iOS-style appearance
  - Smooth animations
  - Accessibility support (ARIA labels)
  - TypeScript interfaces exported

### Component Categories
1. **Primitive Components:** Button, Input, Badge (Tailwind-heavy)
2. **Layout Components:** Card, Grid, Sidebar (Hybrid approach)
3. **Navigation Components:** AppNavigation (Unus-inspired)
4. **Complex Components:** PluginCard, DashboardPluginCard, StatusBar, SettingsForm (CSS Modules-heavy)
5. **Form Components:** ToggleSwitch (NEW - iOS-style)

## BUILD SYSTEM STATE

### Build Process Flow
1. **Clean:** `npm run clean` - Remove dist/
2. **TypeScript Compilation:**
   - Main app: `tsconfig.build.json`
   - Plugin UIs: `tsconfig.plugins.json`
3. **Asset Processing:** `scripts/copy-assets.js`
4. **CSS Module Processing:** `scripts/process-css-modules.js`
5. **Import Fixing:** `scripts/fix-plugin-imports.js`

### Recent Build Updates
- **File:** `scripts/copy-assets.js`
- **Addition:** ToggleSwitch component asset copying
- **Pattern:** Automatic detection and copying of component assets

### CSS Module System
- **Pattern:** `*.module.css` files converted to `*.module.css.js`
- **Import Rewriting:** Automatic conversion during build
- **Runtime:** Dynamic loading in browser environment

## LOGGING ARCHITECTURE

### Unified Logging System
- **File:** `logs/app.log`
- **Sources:**
  - Main process: `[electron-main]` tag
  - Client renderer: `[client-renderer]` tag
- **Format:** `[YYYY-MM-DD HH:mm:ss] [source] LEVEL: message`
- **Levels:** INFO, WARNING, ERROR, DEBUG

### Log Viewer Enhancement
- **File:** `src/ui/views/LogsView.tsx`
- **Features:**
  - Auto-refresh every 5 seconds
  - Syntax highlighting for log levels
  - Proper parsing of unified log format
  - Error level detection and styling

## PLUGIN SYSTEM STATE

### Plugin Types Support
1. **Simple Plugins:** React component only
2. **Configured Plugins:** React + Zod schema validation
3. **Advanced Plugins:** Full lifecycle with services

### Plugin Examples
- **ScriptRunner:** Advanced plugin with file system operations
- **DemoSettings:** Configured plugin with settings schema
- **Clock:** Simple plugin example

### Plugin Communication
- **Service Registry:** Secure inter-plugin communication
- **Permission System:** Manifest-based security
- **IPC Integration:** Safe file system and system operations

## DEVELOPMENT ENVIRONMENT

### Commands Available
- `npm run dev` - Development with TypeScript ESM loader
- `npm run build` - Full build with asset processing
- `npm start` - Run compiled application
- `npm run electron` - Electron desktop mode
- `npm test` - Jest unit tests
- `npm test:e2e` - Playwright end-to-end tests

### Testing State
- **Jest:** Unit tests with TypeScript, ESM, JSDOM
- **Playwright:** E2E tests in `tests/e2e/`
- **Mocks:** CSS files mocked during testing
- **Setup:** `tests/setup.ts` for test environment

## CURRENT STABILITY

### Build Status
- ✅ No TypeScript compilation errors
- ✅ All assets copy correctly
- ✅ CSS modules process successfully
- ✅ Plugin compilation works

### Runtime Status
- ✅ Client-side logging captures all output
- ✅ Plugin file operations work via IPC
- ✅ Settings system loads properly
- ✅ Navigation and filtering functional
- ✅ Toggle switches work correctly

### Known Issues
- None critical identified
- All major runtime errors resolved
- System stable for continued development

## NEXT TECHNICAL PRIORITIES

### Immediate (Low Priority)
- Minor UI text changes (Plugin Management → Plugin Settings)
- Individual plugin settings UI

### Medium Term
- Additional plugin examples
- Enhanced service registry features
- Performance optimizations

### Long Term
- Advanced plugin capabilities
- Extended IPC operations
- Enhanced security features