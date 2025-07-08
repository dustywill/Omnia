# Phase 3: Build System Optimization - Step-by-Step Task List

## Overview

This document provides a detailed, actionable task list for completing Phase 3 of the Node-ttCommander to Omnia migration. Phase 3 focuses on simplifying and optimizing the build system from 5 stages to 3 essential stages while improving performance, developer experience, and production readiness.

## Prerequisites

### Phase 2 Completion Validation
- [ ] **Plugin System Unified**
  - Unified plugin manager supporting all plugin types functional
  - Plugin loading and execution optimized
  - Service registry and inter-plugin communication working
  - Plugin development tools operational

- [ ] **Architecture Stability**
  - All existing plugins working through unified system
  - Security sandbox and permission system validated
  - Performance targets met for plugin operations
  - Test coverage >90% for unified plugin system

- [ ] **Development Environment Ready**
  - TypeScript compilation working for both app and plugins
  - CSS module processing functional
  - Plugin hot reloading operational
  - Build system baseline metrics established

## Week 1: Build System Analysis and Redesign

### Task 3.1: Current Build System Assessment

#### Step 3.1.1: Document Existing Build Process
- [ ] **Analyze Current 5-Stage Build**
  ```bash
  # Profile current build process
  npm run build -- --profile > build-profile.json
  
  # Generate bundle analysis
  npm run build && npm run analyze-bundle > bundle-analysis.json
  
  # Measure build times
  time npm run build 2>&1 | tee build-timing.log
  ```

- [ ] **Create Build Process Documentation**
  - Document inputs, outputs, and tools for each stage:
    1. **Stage 1**: `npm run clean` - Remove dist directory
    2. **Stage 2**: `tsc -p tsconfig.build.json` - Compile main app
    3. **Stage 3**: `tsc -p tsconfig.plugins.json` - Compile plugins
    4. **Stage 4**: `node scripts/copy-assets.js` - Copy CSS and assets
    5. **Stage 5**: `node scripts/process-css-modules.js && node scripts/fix-plugin-imports.js` - Process CSS modules and fix imports

- [ ] **Identify Performance Bottlenecks**
  ```typescript
  // scripts/analyze-build-performance.ts
  export interface BuildStageMetrics {
    stageName: string;
    startTime: number;
    endTime: number;
    duration: number;
    inputFiles: number;
    outputFiles: number;
    memoryUsage: number;
  }

  export class BuildAnalyzer {
    private metrics: BuildStageMetrics[] = [];

    startStage(stageName: string): void {
      this.metrics.push({
        stageName,
        startTime: Date.now(),
        endTime: 0,
        duration: 0,
        inputFiles: 0,
        outputFiles: 0,
        memoryUsage: process.memoryUsage().heapUsed,
      });
    }

    endStage(stageName: string): void {
      const stage = this.metrics.find(m => m.stageName === stageName);
      if (stage) {
        stage.endTime = Date.now();
        stage.duration = stage.endTime - stage.startTime;
      }
    }

    generateReport(): BuildAnalysisReport {
      const totalDuration = this.metrics.reduce((sum, m) => sum + m.duration, 0);
      const bottlenecks = this.metrics
        .filter(m => m.duration > totalDuration * 0.2) // Stages taking >20% of total time
        .sort((a, b) => b.duration - a.duration);

      return {
        totalBuildTime: totalDuration,
        stages: this.metrics,
        bottlenecks,
        recommendations: this.generateRecommendations(bottlenecks),
      };
    }
  }
  ```

**Acceptance Criteria:**
- Complete build process diagram created and documented
- Performance bottlenecks identified with timing data
- Bundle analysis showing dependency breakdown
- Baseline metrics established for comparison

#### Step 3.1.2: Evaluate Modern Build Tools
- [ ] **esbuild Performance Comparison**
  ```typescript
  // scripts/esbuild-poc.ts
  import { build } from 'esbuild';
  import { performance } from 'perf_hooks';

  export class EsbuildPOC {
    async runComparison(): Promise<ComparisonResult> {
      const startTime = performance.now();
      
      // Test esbuild compilation speed
      await build({
        entryPoints: ['src/index.ts'],
        bundle: true,
        outfile: 'dist/esbuild-test.js',
        platform: 'node',
        format: 'esm',
        sourcemap: true,
        metafile: true,
      });
      
      const esbuildTime = performance.now() - startTime;
      
      // Compare with TypeScript compiler
      const tscStartTime = performance.now();
      await this.runTypeScriptCompiler();
      const tscTime = performance.now() - tscStartTime;
      
      return {
        esbuildTime,
        tscTime,
        speedImprovement: ((tscTime - esbuildTime) / tscTime) * 100,
        bundleSize: await this.getBundleSize('dist/esbuild-test.js'),
      };
    }
  }
  ```

- [ ] **Vite Development Server POC**
  ```typescript
  // vite.config.dev.ts
  import { defineConfig } from 'vite';
  import react from '@vitejs/plugin-react';

  export default defineConfig({
    plugins: [react()],
    server: {
      port: 3000,
      hmr: {
        port: 3001,
      },
    },
    build: {
      sourcemap: true,
      rollupOptions: {
        input: {
          main: 'src/index.ts',
        },
      },
    },
    css: {
      modules: {
        generateScopedName: '[name]__[local]___[hash:base64:5]',
      },
    },
  });
  ```

- [ ] **Create Tool Comparison Matrix**
  ```typescript
  // Tool evaluation criteria
  interface ToolEvaluation {
    tool: string;
    compilationSpeed: number; // ms
    bundleSize: number; // bytes
    configComplexity: 'low' | 'medium' | 'high';
    pluginEcosystem: 'limited' | 'good' | 'excellent';
    compatibility: 'poor' | 'good' | 'excellent';
    learningCurve: 'low' | 'medium' | 'high';
  }

  const toolComparison: ToolEvaluation[] = [
    {
      tool: 'TypeScript Compiler',
      compilationSpeed: 45000, // Current baseline
      bundleSize: 1200000,
      configComplexity: 'medium',
      pluginEcosystem: 'excellent',
      compatibility: 'excellent',
      learningCurve: 'low',
    },
    {
      tool: 'esbuild',
      compilationSpeed: 3000, // Expected improvement
      bundleSize: 1100000,
      configComplexity: 'low',
      pluginEcosystem: 'good',
      compatibility: 'good',
      learningCurve: 'medium',
    },
    // Additional tools...
  ];
  ```

**Acceptance Criteria:**
- POCs completed for esbuild, SWC, and Vite
- Performance comparison data collected
- Tool recommendation document created with justifications
- Migration effort assessment completed

#### Step 3.1.3: Design Optimized 3-Stage Architecture
- [ ] **Create New Build Architecture**
  ```typescript
  // build-architecture.ts
  export interface BuildStage {
    name: string;
    description: string;
    inputs: string[];
    outputs: string[];
    parallelizable: boolean;
    dependencies: string[];
    estimatedTime: number;
  }

  export const optimizedBuildArchitecture: BuildStage[] = [
    {
      name: 'Stage 1: Compilation',
      description: 'Compile TypeScript to JavaScript for app and plugins',
      inputs: ['src/**/*.ts', 'plugins/**/*.tsx', 'tsconfig.*.json'],
      outputs: ['dist/**/*.js', 'dist/**/*.d.ts'],
      parallelizable: true,
      dependencies: [],
      estimatedTime: 15000, // 15 seconds
    },
    {
      name: 'Stage 2: Asset Processing',
      description: 'Process CSS, copy assets, optimize images',
      inputs: ['src/**/*.css', 'assets/**/*', 'dist/**/*.js'],
      outputs: ['dist/**/*.css', 'dist/assets/**/*'],
      parallelizable: true,
      dependencies: ['Stage 1'],
      estimatedTime: 8000, // 8 seconds
    },
    {
      name: 'Stage 3: Packaging',
      description: 'Bundle optimization, import fixing, validation',
      inputs: ['dist/**/*.js', 'dist/**/*.css'],
      outputs: ['dist/**/*.min.js', 'dist/manifest.json'],
      parallelizable: false,
      dependencies: ['Stage 1', 'Stage 2'],
      estimatedTime: 12000, // 12 seconds
    },
  ];
  ```

- [ ] **Design Caching Strategy**
  ```typescript
  // build-cache.ts
  export interface CacheStrategy {
    level: 'file' | 'chunk' | 'stage';
    invalidation: CacheInvalidationRule[];
    storage: 'memory' | 'disk' | 'hybrid';
    maxSize: number;
  }

  export const buildCacheStrategy: Record<string, CacheStrategy> = {
    typescript: {
      level: 'file',
      invalidation: [
        { trigger: 'file-changed', target: 'file' },
        { trigger: 'dependency-changed', target: 'dependent-files' },
        { trigger: 'config-changed', target: 'all' },
      ],
      storage: 'disk',
      maxSize: 500 * 1024 * 1024, // 500MB
    },
    assets: {
      level: 'file',
      invalidation: [
        { trigger: 'file-changed', target: 'file' },
        { trigger: 'config-changed', target: 'all' },
      ],
      storage: 'disk',
      maxSize: 200 * 1024 * 1024, // 200MB
    },
    bundle: {
      level: 'stage',
      invalidation: [
        { trigger: 'source-changed', target: 'all' },
        { trigger: 'dependency-changed', target: 'all' },
      ],
      storage: 'memory',
      maxSize: 100 * 1024 * 1024, // 100MB
    },
  };
  ```

**Acceptance Criteria:**
- 3-stage architecture diagram complete and approved
- Parallel processing opportunities identified
- Caching strategy document finalized
- Performance improvement projections validated

## Week 2: Simplified Build Pipeline Implementation

### Task 3.2: Three-Stage Build Implementation

#### Step 3.2.1: Implement Stage 1 - Compilation
- [ ] **Create Optimized Compilation Scripts**
  ```typescript
  // scripts/build-stage1-compilation.ts
  import { build } from 'esbuild';
  import { spawn } from 'child_process';

  export class CompilationStage {
    async executeStage(): Promise<CompilationResult> {
      console.log('📦 Stage 1: Starting compilation...');
      
      const startTime = Date.now();
      
      // Parallel compilation tasks
      const compilationTasks = [
        this.compileMainApplication(),
        this.compilePlugins(),
        this.performTypeChecking(),
      ];
      
      const results = await Promise.allSettled(compilationTasks);
      
      const totalTime = Date.now() - startTime;
      
      return {
        success: results.every(r => r.status === 'fulfilled'),
        duration: totalTime,
        results: results.map(r => r.status === 'fulfilled' ? r.value : r.reason),
      };
    }

    private async compileMainApplication(): Promise<void> {
      return build({
        entryPoints: ['src/index.ts'],
        bundle: false, // Don't bundle yet, just compile
        outdir: 'dist',
        platform: 'node',
        format: 'esm',
        sourcemap: true,
        tsconfig: 'tsconfig.build.json',
        external: ['electron', 'react', 'react-dom'],
      });
    }

    private async compilePlugins(): Promise<void> {
      return build({
        entryPoints: ['plugins/*/index.tsx'],
        bundle: false,
        outdir: 'dist/plugins',
        platform: 'browser',
        format: 'esm',
        sourcemap: true,
        tsconfig: 'tsconfig.plugins.json',
        jsx: 'automatic',
      });
    }

    private async performTypeChecking(): Promise<void> {
      return new Promise((resolve, reject) => {
        const tsc = spawn('npx', ['tsc', '--noEmit', '--project', 'tsconfig.json'], {
          stdio: 'pipe',
        });
        
        let errors = '';
        tsc.stderr.on('data', (data) => {
          errors += data.toString();
        });
        
        tsc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Type checking failed: ${errors}`));
          }
        });
      });
    }
  }
  ```

- [ ] **Implement Source Map Generation**
  ```typescript
  // Enhanced source map configuration
  const sourceMapConfig = {
    development: {
      sourcemap: 'inline',
      sources: 'include',
      sourcesContent: true,
    },
    production: {
      sourcemap: 'external',
      sources: 'exclude',
      sourcesContent: false,
    },
  };
  ```

**Acceptance Criteria:**
- Application compiles successfully with esbuild
- Plugins compile in parallel without conflicts
- Type checking runs independently
- Source maps generated correctly for debugging

#### Step 3.2.2: Implement Stage 2 - Asset Processing
- [ ] **Create CSS Processing Pipeline**
  ```typescript
  // scripts/build-stage2-assets.ts
  import postcss from 'postcss';
  import tailwindcss from 'tailwindcss';
  import autoprefixer from 'autoprefixer';
  import cssnano from 'cssnano';

  export class AssetProcessingStage {
    private postcssProcessor: postcss.Processor;

    constructor(mode: 'development' | 'production') {
      const plugins = [
        tailwindcss(),
        autoprefixer(),
      ];

      if (mode === 'production') {
        plugins.push(
          cssnano({
            preset: ['default', {
              discardComments: { removeAll: true },
              normalizeWhitespace: true,
              minifySelectors: true,
            }],
          })
        );
      }

      this.postcssProcessor = postcss(plugins);
    }

    async executeStage(): Promise<AssetProcessingResult> {
      console.log('🎨 Stage 2: Processing assets...');
      
      const startTime = Date.now();
      
      const tasks = [
        this.processCSSFiles(),
        this.copyStaticAssets(),
        this.optimizeImages(),
        this.processFonts(),
      ];
      
      await Promise.all(tasks);
      
      return {
        success: true,
        duration: Date.now() - startTime,
        processedFiles: await this.getProcessedFileCount(),
      };
    }

    private async processCSSFiles(): Promise<void> {
      const cssFiles = await glob('src/**/*.css');
      
      await Promise.all(
        cssFiles.map(async (file) => {
          const content = await fs.readFile(file, 'utf8');
          const result = await this.postcssProcessor.process(content, { from: file });
          
          const outputPath = file.replace('src/', 'dist/');
          await fs.mkdir(path.dirname(outputPath), { recursive: true });
          await fs.writeFile(outputPath, result.css);
          
          // Generate CSS module if needed
          if (file.includes('.module.css')) {
            await this.generateCSSModule(file, result.css);
          }
        })
      );
    }

    private async generateCSSModule(originalFile: string, processedCSS: string): Promise<void> {
      const classes = this.extractCSSClasses(processedCSS);
      const moduleExport = this.generateModuleExport(classes);
      
      const jsOutputPath = originalFile
        .replace('src/', 'dist/')
        .replace('.css', '.css.js');
      
      await fs.writeFile(jsOutputPath, moduleExport);
    }

    private async copyStaticAssets(): Promise<void> {
      const assetDirs = ['assets', 'public', 'static'];
      
      for (const dir of assetDirs) {
        if (await fs.pathExists(dir)) {
          await fs.copy(dir, `dist/${dir}`, {
            filter: (src) => !src.includes('.DS_Store'),
          });
        }
      }
    }

    private async optimizeImages(): Promise<void> {
      const imageFiles = await glob('dist/**/*.{jpg,jpeg,png,gif,svg}');
      
      // Only optimize in production
      if (process.env.NODE_ENV === 'production') {
        await Promise.all(
          imageFiles.map(file => this.optimizeImage(file))
        );
      }
    }
  }
  ```

**Acceptance Criteria:**
- CSS files processed with PostCSS pipeline
- CSS modules generated correctly
- Static assets copied and organized
- Image optimization working for production builds

#### Step 3.2.3: Implement Stage 3 - Packaging
- [ ] **Create Bundle Optimization System**
  ```typescript
  // scripts/build-stage3-packaging.ts
  export class PackagingStage {
    async executeStage(): Promise<PackagingResult> {
      console.log('📦 Stage 3: Packaging...');
      
      const startTime = Date.now();
      
      const tasks = [
        this.bundleApplication(),
        this.fixImportPaths(),
        this.generateManifest(),
        this.validateBuild(),
      ];
      
      await Promise.all(tasks);
      
      return {
        success: true,
        duration: Date.now() - startTime,
        bundleSize: await this.calculateBundleSize(),
      };
    }

    private async bundleApplication(): Promise<void> {
      // Final bundling with optimization
      await build({
        entryPoints: ['dist/index.js'],
        bundle: true,
        outfile: 'dist/app.bundle.js',
        minify: process.env.NODE_ENV === 'production',
        treeShaking: true,
        splitting: true,
        format: 'esm',
        external: ['electron'],
      });
    }

    private async fixImportPaths(): Promise<void> {
      const jsFiles = await glob('dist/**/*.js');
      
      await Promise.all(
        jsFiles.map(async (file) => {
          let content = await fs.readFile(file, 'utf8');
          
          // Fix CSS module imports
          content = content.replace(
            /import\s+(\w+)\s+from\s+['"](.+)\.module\.css['"]/g,
            "import $1 from '$2.module.css.js'"
          );
          
          // Fix relative imports
          content = this.fixRelativeImports(content, file);
          
          await fs.writeFile(file, content);
        })
      );
    }

    private async generateManifest(): Promise<void> {
      const manifest = {
        name: 'Omnia',
        version: await this.getVersion(),
        buildTime: new Date().toISOString(),
        files: await this.getFileList(),
        integrity: await this.generateIntegrityHashes(),
      };
      
      await fs.writeFile(
        'dist/manifest.json',
        JSON.stringify(manifest, null, 2)
      );
    }

    private async validateBuild(): Promise<void> {
      // Validate all required files exist
      const requiredFiles = [
        'dist/app.bundle.js',
        'dist/manifest.json',
        'dist/plugins',
        'dist/styles',
      ];
      
      for (const file of requiredFiles) {
        if (!await fs.pathExists(file)) {
          throw new Error(`Required file missing: ${file}`);
        }
      }
      
      // Validate JavaScript syntax
      await this.validateJavaScript();
      
      // Validate CSS
      await this.validateCSS();
    }
  }
  ```

**Acceptance Criteria:**
- Application bundled and optimized correctly
- Import paths fixed for all modules
- Build manifest generated with integrity hashes
- Build validation passes all checks

### Task 3.3: Development Build Optimization

#### Step 3.3.1: Implement Hot Module Replacement
- [ ] **Create HMR Development Server**
  ```typescript
  // scripts/dev-server-hmr.ts
  import { createServer, ViteDevServer } from 'vite';
  import { WebSocketServer } from 'ws';

  export class HMRDevServer {
    private viteServer: ViteDevServer;
    private wsServer: WebSocketServer;

    async start(): Promise<void> {
      this.viteServer = await createServer({
        configFile: false,
        root: process.cwd(),
        server: {
          port: 3000,
          hmr: {
            port: 3001,
          },
        },
        plugins: [
          {
            name: 'omnia-hmr',
            configureServer(server) {
              server.middlewares.use('/hmr', this.handleHMRRequest.bind(this));
            },
            handleHotUpdate: this.handleHotUpdate.bind(this),
          },
        ],
      });

      await this.viteServer.listen();
      console.log('🚀 Development server started with HMR');
    }

    private async handleHotUpdate(ctx: any): Promise<void> {
      const { file, server } = ctx;
      
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        // Handle TypeScript/React component updates
        await this.updateReactComponent(file);
      } else if (file.endsWith('.module.css')) {
        // Handle CSS module updates
        await this.updateCSSModule(file);
      } else if (file.includes('/plugins/')) {
        // Handle plugin updates
        await this.updatePlugin(file);
      } else if (file.includes('/config/')) {
        // Handle configuration updates
        await this.updateConfiguration(file);
      }
      
      // Notify clients
      server.ws.send({
        type: 'update',
        updates: [{
          type: 'js-update',
          path: file,
          acceptedPath: file,
          timestamp: Date.now(),
        }],
      });
    }

    private async updateReactComponent(file: string): Promise<void> {
      // Recompile single component
      await build({
        entryPoints: [file],
        bundle: false,
        outdir: 'dist',
        format: 'esm',
        jsx: 'automatic',
        sourcemap: 'inline',
      });
    }

    private async updateCSSModule(file: string): Promise<void> {
      // Reprocess CSS module
      const content = await fs.readFile(file, 'utf8');
      const result = await this.postcssProcessor.process(content, { from: file });
      
      const outputPath = file.replace('src/', 'dist/');
      await fs.writeFile(outputPath, result.css);
      
      // Regenerate CSS module JavaScript
      await this.generateCSSModule(file, result.css);
    }
  }
  ```

- [ ] **Implement Configuration Live Reloading**
  ```typescript
  // scripts/config-watcher.ts
  export class ConfigurationWatcher {
    private watcher: chokidar.FSWatcher;

    start(): void {
      this.watcher = chokidar.watch([
        'config/**/*.json5',
        'tsconfig*.json',
        'package.json',
      ]);

      this.watcher.on('change', async (filePath) => {
        console.log(`📝 Configuration changed: ${filePath}`);
        
        if (filePath.includes('tsconfig')) {
          await this.handleTypeScriptConfigChange();
        } else if (filePath.includes('package.json')) {
          await this.handlePackageJsonChange();
        } else {
          await this.handleAppConfigChange(filePath);
        }
      });
    }

    private async handleTypeScriptConfigChange(): Promise<void> {
      // Restart TypeScript compilation with new config
      console.log('🔄 Restarting TypeScript compilation...');
      await this.restartCompilation();
    }

    private async handleAppConfigChange(filePath: string): Promise<void> {
      // Hot reload application configuration
      console.log('🔄 Reloading application configuration...');
      
      // Validate configuration
      const isValid = await this.validateConfiguration(filePath);
      if (isValid) {
        // Notify running application
        await this.notifyConfigurationChange(filePath);
      } else {
        console.error('❌ Invalid configuration, changes not applied');
      }
    }
  }
  ```

**Acceptance Criteria:**
- HMR working for React components
- CSS modules hot reload without page refresh
- Plugin hot reloading functional
- Configuration changes applied without restart

## Week 3: Build Tool Integration and Plugin System

### Task 3.4: Modern Build Tools Integration

#### Step 3.4.1: esbuild Integration
- [ ] **Replace TypeScript Compiler with esbuild**
  ```typescript
  // build.config.ts
  import { BuildOptions } from 'esbuild';

  export const esbuildConfig: Record<string, BuildOptions> = {
    development: {
      entryPoints: ['src/index.ts'],
      bundle: false,
      outdir: 'dist',
      platform: 'node',
      format: 'esm',
      sourcemap: 'inline',
      target: 'node18',
      jsx: 'automatic',
      jsxDev: true,
      define: {
        'process.env.NODE_ENV': '"development"',
      },
      external: ['electron', 'fs', 'path', 'os'],
    },
    production: {
      entryPoints: ['src/index.ts'],
      bundle: true,
      outfile: 'dist/app.js',
      platform: 'node',
      format: 'esm',
      sourcemap: false,
      minify: true,
      treeShaking: true,
      target: 'node18',
      jsx: 'automatic',
      define: {
        'process.env.NODE_ENV': '"production"',
      },
      external: ['electron'],
    },
  };

  // Separate type checking
  export async function runTypeChecking(): Promise<void> {
    const { spawn } = await import('child_process');
    
    return new Promise((resolve, reject) => {
      const tsc = spawn('npx', ['tsc', '--noEmit'], {
        stdio: 'inherit',
      });
      
      tsc.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Type checking failed with code ${code}`));
        }
      });
    });
  }
  ```

- [ ] **Create esbuild Plugin for CSS Modules**
  ```typescript
  // plugins/esbuild-css-modules.ts
  import { Plugin } from 'esbuild';
  import postcss from 'postcss';
  import postcssModules from 'postcss-modules';

  export const cssModulesPlugin: Plugin = {
    name: 'css-modules',
    setup(build) {
      build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
        const source = await fs.readFile(args.path, 'utf8');
        
        let cssModuleClasses: Record<string, string> = {};
        
        const result = await postcss([
          postcssModules({
            generateScopedName: '[name]__[local]___[hash:base64:5]',
            getJSON: (cssFilename, json) => {
              cssModuleClasses = json;
            },
          }),
        ]).process(source, { from: args.path });
        
        // Return JavaScript module that exports the class mapping
        return {
          contents: `
            const styles = ${JSON.stringify(cssModuleClasses)};
            
            // Inject CSS into document
            if (typeof document !== 'undefined') {
              const style = document.createElement('style');
              style.textContent = ${JSON.stringify(result.css)};
              document.head.appendChild(style);
            }
            
            export default styles;
          `,
          loader: 'js',
        };
      });
    },
  };
  ```

**Acceptance Criteria:**
- esbuild successfully replaces TypeScript compiler
- Build time reduced by >60%
- Type checking runs separately
- CSS modules plugin working correctly

#### Step 3.4.2: Plugin Build System Enhancement
- [ ] **Optimize Plugin Compilation**
  ```typescript
  // scripts/build-plugins-optimized.ts
  export class OptimizedPluginBuilder {
    async buildAllPlugins(): Promise<PluginBuildResult[]> {
      const pluginDirs = await this.discoverPlugins();
      
      // Build plugins in parallel
      const buildTasks = pluginDirs.map(dir => this.buildPlugin(dir));
      const results = await Promise.allSettled(buildTasks);
      
      return results.map((result, index) => ({
        pluginDir: pluginDirs[index],
        success: result.status === 'fulfilled',
        result: result.status === 'fulfilled' ? result.value : result.reason,
      }));
    }

    private async buildPlugin(pluginDir: string): Promise<PluginBuildSuccess> {
      const manifest = await this.loadPluginManifest(pluginDir);
      const entryPoint = path.join(pluginDir, manifest.component || 'index.tsx');
      
      const buildResult = await build({
        entryPoints: [entryPoint],
        bundle: false, // Keep separate for hot reloading
        outdir: path.join('dist/plugins', path.basename(pluginDir)),
        format: 'esm',
        jsx: 'automatic',
        external: ['react', 'react-dom'],
        plugins: [
          this.cssModulesPlugin,
          this.assetPlugin,
        ],
      });
      
      // Copy plugin manifest
      await fs.copy(
        path.join(pluginDir, 'plugin.json5'),
        path.join('dist/plugins', path.basename(pluginDir), 'plugin.json5')
      );
      
      return {
        pluginId: manifest.id,
        buildTime: buildResult.metafile?.buildTime || 0,
        outputFiles: buildResult.outputFiles?.length || 0,
      };
    }

    private async discoverPlugins(): Promise<string[]> {
      const pluginsDir = 'plugins';
      const entries = await fs.readdir(pluginsDir, { withFileTypes: true });
      
      return entries
        .filter(entry => entry.isDirectory())
        .map(entry => path.join(pluginsDir, entry.name));
    }
  }
  ```

- [ ] **Implement Plugin Development Mode**
  ```typescript
  // scripts/plugin-dev-server.ts
  export class PluginDevServer {
    private pluginWatchers = new Map<string, chokidar.FSWatcher>();

    async startWatching(): Promise<void> {
      const pluginDirs = await this.discoverPlugins();
      
      for (const pluginDir of pluginDirs) {
        await this.watchPlugin(pluginDir);
      }
    }

    private async watchPlugin(pluginDir: string): Promise<void> {
      const watcher = chokidar.watch([
        path.join(pluginDir, '**/*.{ts,tsx,js,jsx}'),
        path.join(pluginDir, '**/*.{css,scss}'),
        path.join(pluginDir, 'plugin.json5'),
      ]);

      watcher.on('change', async (filePath) => {
        console.log(`🔄 Plugin file changed: ${filePath}`);
        
        try {
          await this.rebuildPlugin(pluginDir);
          await this.notifyPluginReload(path.basename(pluginDir));
        } catch (error) {
          console.error(`❌ Plugin rebuild failed:`, error);
        }
      });

      this.pluginWatchers.set(pluginDir, watcher);
    }

    private async rebuildPlugin(pluginDir: string): Promise<void> {
      const startTime = Date.now();
      
      const manifest = await this.loadPluginManifest(pluginDir);
      const entryPoint = path.join(pluginDir, manifest.component || 'index.tsx');
      
      await build({
        entryPoints: [entryPoint],
        bundle: false,
        outdir: path.join('dist/plugins', path.basename(pluginDir)),
        format: 'esm',
        jsx: 'automatic',
        sourcemap: 'inline',
        plugins: [this.cssModulesPlugin],
      });
      
      const buildTime = Date.now() - startTime;
      console.log(`✅ Plugin ${manifest.id} rebuilt in ${buildTime}ms`);
    }
  }
  ```

**Acceptance Criteria:**
- Plugin compilation parallelized and optimized
- Plugin development mode with hot reloading
- Plugin build validation working
- Plugin-specific optimizations applied

## Week 4: Performance Monitoring and Production Optimization

### Task 3.5: Build Performance Monitoring

#### Step 3.5.1: Implement Build Metrics Collection
- [ ] **Create Build Analytics System**
  ```typescript
  // scripts/build-analytics.ts
  export interface BuildMetrics {
    buildId: string;
    timestamp: Date;
    environment: 'development' | 'production';
    stages: StageMetrics[];
    totalDuration: number;
    bundleSize: number;
    bundleAnalysis: BundleAnalysis;
    cacheEffectiveness: CacheMetrics;
  }

  export class BuildAnalytics {
    private metrics: BuildMetrics[] = [];

    startBuild(environment: 'development' | 'production'): string {
      const buildId = this.generateBuildId();
      
      this.metrics.push({
        buildId,
        timestamp: new Date(),
        environment,
        stages: [],
        totalDuration: 0,
        bundleSize: 0,
        bundleAnalysis: {},
        cacheEffectiveness: {
          hitRate: 0,
          missRate: 0,
          invalidations: 0,
        },
      });
      
      return buildId;
    }

    recordStageMetrics(buildId: string, stage: StageMetrics): void {
      const build = this.metrics.find(m => m.buildId === buildId);
      if (build) {
        build.stages.push(stage);
      }
    }

    async finalizeBuild(buildId: string): Promise<void> {
      const build = this.metrics.find(m => m.buildId === buildId);
      if (!build) return;

      build.totalDuration = build.stages.reduce((sum, stage) => sum + stage.duration, 0);
      build.bundleSize = await this.calculateBundleSize();
      build.bundleAnalysis = await this.analyzeBundleComposition();
      
      await this.saveBuildMetrics(build);
      await this.checkPerformanceRegression(build);
    }

    private async checkPerformanceRegression(currentBuild: BuildMetrics): Promise<void> {
      const recentBuilds = this.getRecentBuilds(5); // Last 5 builds
      const averageDuration = recentBuilds.reduce((sum, b) => sum + b.totalDuration, 0) / recentBuilds.length;
      
      if (currentBuild.totalDuration > averageDuration * 1.2) { // 20% slower
        console.warn('⚠️  Performance regression detected!');
        console.warn(`Current build: ${currentBuild.totalDuration}ms`);
        console.warn(`Average: ${averageDuration}ms`);
        
        // Send alert if in CI
        if (process.env.CI) {
          await this.sendPerformanceAlert(currentBuild, averageDuration);
        }
      }
    }
  }
  ```

- [ ] **Implement CI Performance Checks**
  ```typescript
  // scripts/ci-performance-check.ts
  export class CIPerformanceCheck {
    private performanceBudgets = {
      maxBuildTime: 60000, // 60 seconds
      maxBundleSize: 5 * 1024 * 1024, // 5MB
      maxChunkSize: 1 * 1024 * 1024, // 1MB
      maxCSSSize: 500 * 1024, // 500KB
    };

    async runPerformanceCheck(): Promise<PerformanceCheckResult> {
      const buildMetrics = await this.getLatestBuildMetrics();
      const bundleAnalysis = await this.analyzeBundles();
      
      const checks: PerformanceCheck[] = [
        {
          name: 'Build Time',
          value: buildMetrics.totalDuration,
          limit: this.performanceBudgets.maxBuildTime,
          passed: buildMetrics.totalDuration <= this.performanceBudgets.maxBuildTime,
        },
        {
          name: 'Bundle Size',
          value: bundleAnalysis.totalSize,
          limit: this.performanceBudgets.maxBundleSize,
          passed: bundleAnalysis.totalSize <= this.performanceBudgets.maxBundleSize,
        },
        {
          name: 'Largest Chunk',
          value: bundleAnalysis.largestChunk,
          limit: this.performanceBudgets.maxChunkSize,
          passed: bundleAnalysis.largestChunk <= this.performanceBudgets.maxChunkSize,
        },
      ];
      
      const allPassed = checks.every(check => check.passed);
      
      return {
        passed: allPassed,
        checks,
        summary: this.generateSummary(checks),
      };
    }

    async generatePerformanceReport(): Promise<string> {
      const result = await this.runPerformanceCheck();
      
      let report = '# Build Performance Report\n\n';
      
      if (result.passed) {
        report += '✅ All performance checks passed!\n\n';
      } else {
        report += '❌ Performance budget exceeded!\n\n';
      }
      
      report += '## Performance Checks\n\n';
      for (const check of result.checks) {
        const status = check.passed ? '✅' : '❌';
        const percentage = ((check.value / check.limit) * 100).toFixed(1);
        
        report += `${status} **${check.name}**: ${this.formatBytes(check.value)} / ${this.formatBytes(check.limit)} (${percentage}%)\n`;
      }
      
      return report;
    }
  }
  ```

**Acceptance Criteria:**
- Build metrics collected automatically
- Performance regression detection working
- CI performance checks integrated
- Performance budgets enforced

#### Step 3.5.2: Production Build Optimization
- [ ] **Implement Advanced Bundle Optimization**
  ```typescript
  // scripts/production-optimizer.ts
  export class ProductionOptimizer {
    async optimizeForProduction(): Promise<OptimizationResult> {
      console.log('🚀 Starting production optimization...');
      
      const tasks = [
        this.implementTreeShaking(),
        this.optimizeCodeSplitting(),
        this.compressAssets(),
        this.generateServiceWorker(),
      ];
      
      const results = await Promise.allSettled(tasks);
      
      return {
        treeshaking: results[0],
        codeSplitting: results[1],
        compression: results[2],
        serviceWorker: results[3],
      };
    }

    private async implementTreeShaking(): Promise<void> {
      // Aggressive tree-shaking configuration
      await build({
        entryPoints: ['dist/index.js'],
        bundle: true,
        outfile: 'dist/app.bundle.js',
        treeShaking: true,
        minify: true,
        format: 'esm',
        // Mark unused exports for elimination
        define: {
          'process.env.NODE_ENV': '"production"',
        },
        // External dependencies to avoid bundling
        external: ['electron', 'fs', 'path', 'os'],
        // Plugin to analyze and remove unused code
        plugins: [
          {
            name: 'unused-code-eliminator',
            setup(build) {
              build.onEnd(async (result) => {
                await this.analyzeUnusedCode(result);
              });
            },
          },
        ],
      });
    }

    private async optimizeCodeSplitting(): Promise<void> {
      // Implement strategic code splitting
      const entryPoints = {
        main: 'src/index.ts',
        renderer: 'src/ui/renderer.tsx',
        plugins: 'src/ui/plugin-ui-loader.ts',
        settings: 'src/ui/views/SettingsView.tsx',
      };

      await build({
        entryPoints,
        bundle: true,
        outdir: 'dist/chunks',
        splitting: true,
        format: 'esm',
        chunkNames: '[name]-[hash]',
        // Configure chunk splitting strategy
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['lodash', 'date-fns'],
        },
      });
    }

    private async compressAssets(): Promise<void> {
      // Compress all assets with gzip and brotli
      const files = await glob('dist/**/*.{js,css,html,json}');
      
      await Promise.all(
        files.map(async (file) => {
          await Promise.all([
            this.compressWithGzip(file),
            this.compressWithBrotli(file),
          ]);
        })
      );
    }

    private async generateServiceWorker(): Promise<void> {
      // Generate service worker for caching
      const swConfig = {
        globDirectory: 'dist/',
        globPatterns: [
          '**/*.{js,css,html,png,jpg,gif,svg,ico}',
        ],
        swDest: 'dist/sw.js',
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com/,
            handler: 'StaleWhileRevalidate',
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
              },
            },
          },
        ],
      };
      
      await generateSW(swConfig);
    }
  }
  ```

**Acceptance Criteria:**
- Production bundle size reduced by 30%
- Tree-shaking eliminating unused code
- Code splitting implemented for major routes
- Asset compression working (gzip/brotli)

## Phase 3 Completion Validation

### Final Validation Checklist

#### Build System Performance
- [ ] **Build Time Improvements**
  ```bash
  # Measure build performance
  npm run test:build-performance
  
  # Expected results:
  # - Development build: <10 seconds initial, <2 seconds incremental
  # - Production build: <60 seconds total
  # - Plugin build: <5 seconds per plugin
  ```

- [ ] **Bundle Size Optimization**
  ```bash
  # Analyze bundle sizes
  npm run analyze-bundle
  
  # Expected improvements:
  # - 30% reduction in production bundle size
  # - Elimination of unused dependencies
  # - Optimal chunk splitting
  ```

#### Development Experience
- [ ] **Hot Module Replacement**
  - React components hot reload without state loss
  - CSS modules update without page refresh
  - Plugin hot reloading functional
  - Configuration changes applied live

- [ ] **Error Reporting**
  - Clear error messages with source maps
  - Type errors reported separately
  - Build failures with actionable feedback
  - Performance warnings for regressions

#### Production Readiness
- [ ] **Build Validation**
  - All required files generated correctly
  - Import paths resolved properly
  - Asset optimization working
  - Bundle integrity verified

- [ ] **Cross-Platform Testing**
  ```bash
  # Test builds on all platforms
  npm run test:cross-platform
  
  # Verify:
  # - Windows build working
  # - macOS build working  
  # - Linux build working
  ```

### Success Criteria Met

- [ ] **Build time reduced by 60% (target: ~45 seconds)**
- [ ] **Bundle size reduced by 30%**
- [ ] **Development hot reload <500ms**
- [ ] **Build reliability >99% success rate**
- [ ] **Simplified build commands and better error messages**
- [ ] **Cache effectiveness >80% hit rate**

### Performance Benchmarks
- [ ] **Development Build**: Initial <10s, incremental <2s
- [ ] **Production Build**: Total <60s
- [ ] **Plugin Build**: <5s per plugin
- [ ] **Asset Processing**: <10s total

### Next Steps

Upon successful completion of Phase 3:

1. **Performance Validation**: Comprehensive build performance testing
2. **Developer Training**: Team training on new build system
3. **Production Deployment**: Test optimized builds in production environment
4. **Documentation Updates**: Update all build-related documentation
5. **Phase 4 Preparation**: Feature enhancement and final optimization planning

---

*Phase 3 Task List - Created: January 2025*