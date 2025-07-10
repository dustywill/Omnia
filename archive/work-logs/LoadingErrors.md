## Navigated to Customer Links Plugin In

```
[PluginManager] Module keys:
(6) ['configSchema', 'default', 'defaultConfig', 'generateCustomerSitesHtml', 'loadCustomerSites', 'saveCustomerSites']
client-logger.js:59 [PluginDetailView] loadPluginModule returned:
Module {…}
client-logger.js:59 [PluginDetailView] pluginModule type: object
client-logger.js:59 [PluginDetailView] pluginModule keys:
(6) ['configSchema', 'default', 'defaultConfig', 'generateCustomerSitesHtml', 'loadCustomerSites', 'saveCustomerSites']
client-logger.js:59 [PluginDetailView] pluginModule.default: (props) => {
    // Handle null props or missing config gracefully
    const providedConfig = props?.config;
    // Use provided config or fall back to default
    const config = providedConfig || de…
client-logger.js:59 [PluginComponent] Extracting React component from customer-links:
client-logger.js:59   moduleObj:
Module {…}
client-logger.js:59   moduleObj type: object
client-logger.js:59   moduleObj keys:
(6) ['configSchema', 'default', 'defaultConfig', 'generateCustomerSitesHtml', 'loadCustomerSites', 'saveCustomerSites']
client-logger.js:59   Strategy 1 successful, found component: CustomerLinksPlugin
client-logger.js:71 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
client-logger.js:71 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
client-logger.js:71 React has detected a change in the order of Hooks called by PluginComponent. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useState                   useState
2. useState                   useState
3. useState                   useState
4. useEffect                  useState
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
client-logger.js:71 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
react-dom-client.development.js:5840 Uncaught Error: Should have a queue. You are likely calling Hooks conditionally, which is not allowed. (https://react.dev/link/invalid-hook-call)
    at CustomerLinksPlugin (index.js:342:49)
client-logger.js:65 An error occurred in the <PluginComponent> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
```

## Navigating to Script Runner

```
[PluginDetailView] loadPluginModule returned:
Module
client-logger.js:59 [PluginDetailView] pluginModule type: object
client-logger.js:59 [PluginDetailView] pluginModule keys:
Array(4)
client-logger.js:59 [PluginDetailView] pluginModule.default: (props) => {
    // Use provided config or fall back to default
    const config = props?.config || defaultConfig;
    // All useState hooks called at the top level, in the same order every time
    …
client-logger.js:59 [PluginComponent] Extracting React component from script-runner:
client-logger.js:59   moduleObj:
Module
client-logger.js:59   moduleObj type: object
client-logger.js:59   moduleObj keys:
Array(4)
client-logger.js:59   Strategy 1 successful, found component: ScriptRunnerPlugin
2
client-logger.js:71 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
client-logger.js:71 React has detected a change in the order of Hooks called by PluginComponent. This will lead to bugs and errors if not fixed. For more information, read the Rules of Hooks: https://react.dev/link/rules-of-hooks

   Previous render            Next render
   ------------------------------------------------------
1. useState                   useState
2. useState                   useState
3. useState                   useState
4. useEffect                  useState
   ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
client-logger.js:71 Do not call Hooks inside useEffect(...), useMemo(...), or other built-in Hooks. You can only call Hooks at the top level of your React function. For more information, see https://react.dev/link/rules-of-hooks
react-dom-client.development.js:5840 Uncaught Error: Should have a queue. You are likely calling Hooks conditionally, which is not allowed. (https://react.dev/link/invalid-hook-call)
    at ScriptRunnerPlugin (index.js:229:35)
client-logger.js:65 An error occurred in the <PluginComponent> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
﻿

```

## Navigated to Context Generator

```
[PluginDetailView] pluginModule.default: ({ initialPath }) => {
    // State management
    const [rootPath, setRootPath] = useState('');
    const [fileTree, setFileTree] = useState(null);
    const [selectedFiles, setSelectedFiles] = useS…
client-logger.js:59 [PluginComponent] Extracting React component from context-generator:
client-logger.js:59   moduleObj:
Module {Symbol(Symbol.toStringTag): 'Module'}
client-logger.js:59   moduleObj type: object
client-logger.js:59   moduleObj keys:
['default']
client-logger.js:59   Strategy 1 successful, found component: ContextGenerator
index.js:32 Uncaught TypeError: Cannot destructure property 'initialPath' of 'object null' as it is null.
    at ContextGenerator (index.js:32:29)
    at PluginComponent (PluginDetailView.js:7:57)
client-logger.js:65 An error occurred in the <PluginComponent> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
﻿
```

## Navigated to As-Built Documenter

```
[PluginDetailView] loadPluginModule returned:
Module {Symbol(Symbol.toStringTag): 'Module'}
client-logger.js:59 [PluginDetailView] pluginModule type: object
client-logger.js:59 [PluginDetailView] pluginModule keys:
(2) ['default', 'defaultConfig']
client-logger.js:59 [PluginDetailView] pluginModule.default: ({ context }) => {
    // Use the provided plugin context config, fallback to default
    const [config] = useState(() => context?.config || createDefaultConfig());
    // Core state
    const [templ…
client-logger.js:59 [PluginComponent] Extracting React component from as-built-documenter:
client-logger.js:59   moduleObj:
Module {Symbol(Symbol.toStringTag): 'Module'}
client-logger.js:59   moduleObj type: object
client-logger.js:59   moduleObj keys:
(2) ['default', 'defaultConfig']
client-logger.js:59   Strategy 1 successful, found component: AsBuiltDocumenter
index.js:106 Uncaught TypeError: Cannot destructure property 'context' of 'object null' as it is null.
    at AsBuiltDocumenter (index.js:106:30)
    at PluginComponent (PluginDetailView.js:7:57)
client-logger.js:65 An error occurred in the <PluginComponent> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.
﻿
```

## Navigated to Test Simple Plugin

```
 Electron APIs available
 Download the React DevTools for a better development experience: https://react.dev/link/react-devtoolsYou might need to use a local HTTP server (instead of file://): https://react.dev/link/react-devtools-faq
 [start] Initializing client-side console logging...
 [start] Client-side console logging initialized
 [start] Loading path module...
 [start] Modules loaded successfully
 [start] Getting current working directory...
 [start] Current working directory: C:\Users\byron\Documents\Projects\Byron\Omnia
 [start] Building plugins source path...
 [start] Source plugins path: C:\Users\byron\Documents\Projects\Byron\Omnia/plugins
 [start] Building plugins dist path...
 [start] Dist plugins path: C:\Users\byron\Documents\Projects\Byron\Omnia/dist/plugins
 [start] Building config path...
 [start] Config path: C:\Users\byron\Documents\Projects\Byron\Omnia/config
 [start] Initializing main application renderer...
 [initMainAppRenderer] Initializing client-side console logging
 [initMainAppRenderer] Starting main application renderer initialization
 [initMainAppRenderer] Initializing settings manager
 [createAppConfigSchemas] Electron renderer environment detected, using IPC-based Zod
 [createBrowserCompatibleSchemas] Creating Zod schema using mock
 [initMainAppRenderer] Initializing service registry
 Service Registry initialized
client-logger.js:59 [initMainAppRenderer] Initializing navigation service
client-logger.js:59 [initMainAppRenderer] Initializing plugin manager
client-logger.js:59 Enhanced Plugin Manager initialized
client-logger.js:59 [initMainAppRenderer] Discovering plugins
client-logger.js:59 Discovering plugins in: C:\Users\byron\Documents\Projects\Byron\Omnia/plugins
client-logger.js:59 [readManifest] Reading manifest from: C:\Users\byron\Documents\Projects\Byron\Omnia/plugins/as-built-documenter/plugin.json5
client-logger.js:59 [readManifest] Content (first 200 chars): {
  // As-Built Documenter Plugin Manifest
  id: "as-built-documenter",
  name: "As-Built Documenter",
  version: "1.0.0",
  description: "Generate documentation for as-built projects and configu
client-logger.js:59 [readManifest] JSON5 module loaded: Object
client-logger.js:59 [readManifest] Parsed manifest: Object
client-logger.js:59 [readManifest] Manifest fields - id: as-built-documenter, name: As-Built Documenter, version: 1.0.0, type: configured, main: index.js
client-logger.js:59 Loading plugin: as-built-documenter
client-logger.js:59 [PluginManager] Loading module from: file:///C:/Users/byron/Documents/Projects/Byron/Omnia/dist/plugins/as-built-documenter/index.js
client-logger.js:59 [PluginManager] Loaded module for as-built-documenter: Module
client-logger.js:59 [PluginManager] Module keys: Array(2)
client-logger.js:59 [PluginManager] Module default: ({ context }) => {
    // Use the provided plugin context config, fallback to default
    const [config] = useState(() => context?.config || createDefaultConfig());
    // Core state
    const [templ…
client-logger.js:59 [PluginManager] Module default type: function
client-logger.js:59 Plugin as-built-documenter loaded successfully
client-logger.js:59 [readManifest] Reading manifest from: C:\Users\byron\Documents\Projects\Byron\Omnia/plugins/context-generator/plugin.json5
client-logger.js:59 [readManifest] Content (first 200 chars): {
  // Context Generator Plugin Manifest
  id: "context-generator",
  name: "Context Generator",
  version: "1.0.0",
  description: "Generate context information and documentation for projects",
client-logger.js:59 [readManifest] JSON5 module loaded: Object
client-logger.js:59 [readManifest] Parsed manifest: Object
client-logger.js:59 [readManifest] Manifest fields - id: context-generator, name: Context Generator, version: 1.0.0, type: configured, main: index.js
client-logger.js:59 Loading plugin: context-generator
client-logger.js:59 [PluginManager] Loading module from: file:///C:/Users/byron/Documents/Projects/Byron/Omnia/dist/plugins/context-generator/index.js
client-logger.js:59 [PluginManager] Loaded module for context-generator: Module
client-logger.js:59 [PluginManager] Module keys: Array(1)
client-logger.js:59 [PluginManager] Module default: ({ initialPath }) => {
    // State management
    const [rootPath, setRootPath] = useState('');
    const [fileTree, setFileTree] = useState(null);
    const [selectedFiles, setSelectedFiles] = useS…
client-logger.js:59 [PluginManager] Module default type: function
client-logger.js:59 Plugin context-generator loaded successfully
client-logger.js:59 [readManifest] Reading manifest from: C:\Users\byron\Documents\Projects\Byron\Omnia/plugins/customer-links/plugin.json5
client-logger.js:59 [readManifest] Content (first 200 chars): {
  id: "customer-links",
  name: "Customer Links Manager",
  version: "2.0.0",
  description: "Manage customer site links and generate HTML output files with configurable templates",
  author: "
client-logger.js:59 [readManifest] JSON5 module loaded: Object
client-logger.js:59 [readManifest] Parsed manifest: Object
client-logger.js:59 [readManifest] Manifest fields - id: customer-links, name: Customer Links Manager, version: 2.0.0, type: configured, main: index.js
client-logger.js:59 Loading plugin: customer-links
client-logger.js:59 [PluginManager] Loading module from: file:///C:/Users/byron/Documents/Projects/Byron/Omnia/dist/plugins/customer-links/index.js
client-logger.js:59 [PluginManager] Loaded module for customer-links: Module
client-logger.js:59 [PluginManager] Module keys: Array(6)
client-logger.js:59 [PluginManager] Module default: (props) => {
    // Handle null props or missing config gracefully
    const providedConfig = props?.config;
    // Use provided config or fall back to default
    const config = providedConfig || de…
client-logger.js:59 [PluginManager] Module default type: function
client-logger.js:59 Plugin customer-links loaded successfully
client-logger.js:59 [readManifest] Reading manifest from: C:\Users\byron\Documents\Projects\Byron\Omnia/plugins/script-runner/plugin.json5
client-logger.js:59 [readManifest] Content (first 200 chars): {
  id: "script-runner",
  name: "Script Runner",
  version: "2.0.0",
  description: "Execute PowerShell scripts with parameters and real-time output. Provides both UI and service capabilities for
client-logger.js:59 [readManifest] JSON5 module loaded: Object
client-logger.js:59 [readManifest] Parsed manifest: Object
client-logger.js:59 [readManifest] Manifest fields - id: script-runner, name: Script Runner, version: 2.0.0, type: hybrid, main: index.js
client-logger.js:59 Loading plugin: script-runner
client-logger.js:59 [PluginManager] Loading module from: file:///C:/Users/byron/Documents/Projects/Byron/Omnia/dist/plugins/script-runner/index.js
client-logger.js:59 [PluginManager] Loaded module for script-runner: Module
client-logger.js:59 [PluginManager] Module keys: Array(4)
client-logger.js:59 [PluginManager] Module default: (props) => {
    // Use provided config or fall back to default
    const config = props?.config || defaultConfig;
    // All useState hooks called at the top level, in the same order every time
    …
client-logger.js:59 [PluginManager] Module default type: function
client-logger.js:59 Service registered: script-execution@1.0.0 by script-runner
client-logger.js:59 Plugin script-runner loaded successfully
client-logger.js:59 [readManifest] Reading manifest from: C:\Users\byron\Documents\Projects\Byron\Omnia/plugins/test-simple/plugin.json5
client-logger.js:59 [readManifest] Content (first 200 chars): {
  // Test Simple Plugin Manifest
  id: "test-simple",
  name: "Test Simple Plugin",
  version: "1.0.0",
  description: "A simple test plugin for development and testing",
  author: "Omnia Tea
client-logger.js:59 [readManifest] JSON5 module loaded: Object
client-logger.js:59 [readManifest] Parsed manifest: Object
client-logger.js:59 [readManifest] Manifest fields - id: test-simple, name: Test Simple Plugin, version: 1.0.0, type: simple, main: index.js
client-logger.js:59 Loading plugin: test-simple
client-logger.js:59 [PluginManager] Loading module from: file:///C:/Users/byron/Documents/Projects/Byron/Omnia/dist/plugins/test-simple/index.js
client-logger.js:59 [PluginManager] Loaded module for test-simple: Module
client-logger.js:59 [PluginManager] Module keys: Array(1)
client-logger.js:59 [PluginManager] Module default: () => {
    return (_jsxs("div", { style: { padding: '20px', border: '1px solid #ccc', margin: '10px' }, children: [_jsx("h2", { children: "\uD83C\uDF89 Test Plugin Loaded Successfully!" }), _jsx("p"…
client-logger.js:59 [PluginManager] Module default type: function
client-logger.js:59 Plugin test-simple loaded successfully
client-logger.js:59 Discovered 5 plugins
client-logger.js:59 [initMainAppRenderer] Loading plugin registry
client-logger.js:59 [PluginManager] loadPluginModule called for: customer-links
client-logger.js:59 [PluginManager] Found cached plugin module for customer-links: Module
client-logger.js:59 [PluginManager] Module keys: Array(6)
client-logger.js:59 [PluginManager] loadPluginModule called for: script-runner
client-logger.js:59 [PluginManager] Found cached plugin module for script-runner: Module
client-logger.js:59 [PluginManager] Module keys: Array(4)
client-logger.js:59 [PluginManager] loadPluginModule called for: as-built-documenter
client-logger.js:59 [PluginManager] Found cached plugin module for as-built-documenter: Module
client-logger.js:59 [PluginManager] Module keys: Array(2)
client-logger.js:59 [PluginManager] loadPluginModule called for: context-generator
client-logger.js:59 [PluginManager] Found cached plugin module for context-generator: Module
client-logger.js:59 [PluginManager] Module keys: Array(1)
client-logger.js:59 [initMainAppRenderer] Found 5 plugins: Array(5)
client-logger.js:59 [initMainAppRenderer] Initializing plugin services
client-logger.js:59 [initMainAppRenderer] Services initialized for script-runner
client-logger.js:59 [initMainAppRenderer] Main application renderer initialized successfully
client-logger.js:59 [start] Renderer initialized successfully
client-logger.js:59 [config-persistence] [INFO] ConfigPersistenceService initialized
client-logger.js:59 [NavigationService] Navigating to plugin detail: test-simple
client-logger.js:59 [PluginDetailView] About to call loadPluginModule for: test-simple
client-logger.js:59 [PluginManager] loadPluginModule called for: test-simple
client-logger.js:59 [PluginManager] Found cached plugin module for test-simple: Module {Symbol(Symbol.toStringTag): 'Module'}
client-logger.js:59 [PluginManager] Module keys: ['default']
client-logger.js:59 [PluginDetailView] loadPluginModule returned: Module {Symbol(Symbol.toStringTag): 'Module'}
client-logger.js:59 [PluginDetailView] pluginModule type: object
client-logger.js:59 [PluginDetailView] pluginModule keys: ['default']
client-logger.js:59 [PluginDetailView] pluginModule.default: () => {
    return (_jsxs("div", { style: { padding: '20px', border: '1px solid #ccc', margin: '10px' }, children: [_jsx("h2", { children: "\uD83C\uDF89 Test Plugin Loaded Successfully!" }), _jsx("p"…
client-logger.js:59 [PluginComponent] Extracting React component from test-simple:
client-logger.js:59   moduleObj: Module {Symbol(Symbol.toStringTag): 'Module'}
client-logger.js:59   moduleObj type: object
client-logger.js:59   moduleObj keys: ['default']
client-logger.js:59   Strategy 1 successful, found component: TestSimple
react-dom-client.development.js:4259 Uncaught Error: Element type is invalid: expected a string (for built-in components) or a class/function (for composite components) but got: <div />. Did you accidentally export a JSX literal instead of a component?

Check the render method of `PluginComponent`.
    at Ic (react-dom-client.development.js:4259:28)
    at Xo (react-dom-client.development.js:4273:14)
    at L (react-dom-client.development.js:7879:31)
    at react-dom-client.development.js:8057:33
    at Ae (react-dom-client.development.js:8622:13)
    at _s (react-dom-client.development.js:8914:7)
    at Ps (react-dom-client.development.js:10522:18)
    at z (react-dom-client.development.js:1519:30)
    at lm (react-dom-client.development.js:15140:22)
    at am (react-dom-client.development.js:14956:41)
Ic @ react-dom-client.development.js:4259
Xo @ react-dom-client.development.js:4273
L @ react-dom-client.development.js:7879
(anonymous) @ react-dom-client.development.js:8057
Ae @ react-dom-client.development.js:8622
_s @ react-dom-client.development.js:8914
Ps @ react-dom-client.development.js:10522
z @ react-dom-client.development.js:1519
lm @ react-dom-client.development.js:15140
am @ react-dom-client.development.js:14956
rf @ react-dom-client.development.js:14936
Ip @ react-dom-client.development.js:14462
vm @ react-dom-client.development.js:16216
s @ scheduler.development.js:45
<PluginComponent>
d.jsx @ react-jsx-runtime.development.js:339
PluginDetailView @ PluginDetailView.js:238
react-stack-bottom-frame @ react-dom-client.development.js:23863
ms @ react-dom-client.development.js:5529
_s @ react-dom-client.development.js:8897
Ps @ react-dom-client.development.js:10522
z @ react-dom-client.development.js:1519
lm @ react-dom-client.development.js:15140
am @ react-dom-client.development.js:14956
rf @ react-dom-client.development.js:14936
Ip @ react-dom-client.development.js:14419
vm @ react-dom-client.development.js:16216
s @ scheduler.development.js:45
<PluginDetailView>
d.jsx @ react-jsx-runtime.development.js:339
MainApp @ main-app-renderer.js:113
react-stack-bottom-frame @ react-dom-client.development.js:23863
ms @ react-dom-client.development.js:5529
_s @ react-dom-client.development.js:8897
Ps @ react-dom-client.development.js:10522
z @ react-dom-client.development.js:1519
lm @ react-dom-client.development.js:15140
am @ react-dom-client.development.js:14956
rf @ react-dom-client.development.js:14936
Ip @ react-dom-client.development.js:14419
vm @ react-dom-client.development.js:16216
s @ scheduler.development.js:45
client-logger.js:65 An error occurred in the <PluginComponent> component.

Consider adding an error boundary to your tree to customize error handling behavior.
Visit https://react.dev/link/error-boundaries to learn more about error boundaries.

console.warn @ client-logger.js:65
sp @ react-dom-client.development.js:8283
hi @ react-dom-client.development.js:8352
z @ react-dom-client.development.js:1519
Xs.n.callback @ react-dom-client.development.js:8382
Ch @ react-dom-client.development.js:5363
Mh @ react-dom-client.development.js:5383
z @ react-dom-client.development.js:1522
qp @ react-dom-client.development.js:12709
cm @ react-dom-client.development.js:15559
df @ react-dom-client.development.js:15402
Pp @ react-dom-client.development.js:14652
Ip @ react-dom-client.development.js:14575
vm @ react-dom-client.development.js:16216
s @ scheduler.development.js:45
<...>
u.createElement @ react.development.js:1033
PluginComponent @ PluginDetailView.js:212
react-stack-bottom-frame @ react-dom-client.development.js:23863
ms @ react-dom-client.development.js:5529
_s @ react-dom-client.development.js:8897
Ps @ react-dom-client.development.js:10522
z @ react-dom-client.development.js:1519
lm @ react-dom-client.development.js:15140
am @ react-dom-client.development.js:14956
rf @ react-dom-client.development.js:14936
Ip @ react-dom-client.development.js:14462
vm @ react-dom-client.development.js:16216
s @ scheduler.development.js:45
<PluginComponent>
d.jsx @ react-jsx-runtime.development.js:339
PluginDetailView @ PluginDetailView.js:238
react-stack-bottom-frame @ react-dom-client.development.js:23863
ms @ react-dom-client.development.js:5529
_s @ react-dom-client.development.js:8897
Ps @ react-dom-client.development.js:10522
z @ react-dom-client.development.js:1519
lm @ react-dom-client.development.js:15140
am @ react-dom-client.development.js:14956
rf @ react-dom-client.development.js:14936
Ip @ react-dom-client.development.js:14419
vm @ react-dom-client.development.js:16216
s @ scheduler.development.js:45
<PluginDetailView>
d.jsx @ react-jsx-runtime.development.js:339
MainApp @ main-app-renderer.js:113
react-stack-bottom-frame @ react-dom-client.development.js:23863
ms @ react-dom-client.development.js:5529
_s @ react-dom-client.development.js:8897
Ps @ react-dom-client.development.js:10522
z @ react-dom-client.development.js:1519
lm @ react-dom-client.development.js:15140
am @ react-dom-client.development.js:14956
rf @ react-dom-client.development.js:14936
Ip @ react-dom-client.development.js:14419
vm @ react-dom-client.development.js:16216
s @ scheduler.development.js:45
```
