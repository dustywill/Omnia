import fs from 'fs/promises';
import path from 'path';

async function copyAssets() {
  console.log('Copying assets to dist...');
  
  // Create directories
  await fs.mkdir('dist/assets', { recursive: true });
  await fs.mkdir('dist/ui', { recursive: true });
  await fs.mkdir('dist/ui/components', { recursive: true });
  await fs.mkdir('dist/ui/components/ui', { recursive: true });
  
  // Copy basic files
  await fs.copyFile('src/preload.js', 'dist/preload.js');
  await fs.copyFile('dist.html', 'dist/index.html');
  await fs.copyFile('assets/omnia_logo.svg', 'dist/assets/omnia_logo.svg');
  await fs.copyFile('assets/omnia_logo.ico', 'dist/assets/omnia_logo.ico');
  await fs.copyFile('src/ui/global.css', 'dist/ui/global.css');
  
  // Copy all CSS files from components
  const componentDirs = [
    'AppHeader', 'AppNavigation', 'AppSettings', 'Card', 'PluginCard',
    'PluginSettings', 'SchemaForm', 'SettingsForm', 'SettingsPage', 'Sidebar', 'JsonEditor', 'StatusBar', 'ToggleSwitch', 'NotificationSystem', 'FileTree'
  ];
  
  // Copy Shadcn UI components (no CSS modules, just ensure directory structure)
  try {
    const shadcnSrcDir = 'src/ui/components/ui';
    const shadcnDestDir = 'dist/ui/components/ui';
    
    await fs.mkdir(shadcnDestDir, { recursive: true });
    console.log(`Created Shadcn UI directory: ${shadcnDestDir}`);
  } catch (err) {
    console.warn(`Could not create Shadcn UI directory:`, err.message);
  }
  
  for (const dir of componentDirs) {
    const srcDir = `src/ui/components/${dir}`;
    const destDir = `dist/ui/components/${dir}`;
    
    try {
      await fs.mkdir(destDir, { recursive: true });
      
      // Copy CSS files
      const cssFile = `${srcDir}/${dir}.module.css`;
      const destCssFile = `${destDir}/${dir}.module.css`;
      
      try {
        await fs.copyFile(cssFile, destCssFile);
        console.log(`Copied ${cssFile} -> ${destCssFile}`);
      } catch (err) {
        // File might not exist, that's OK
      }
    } catch (err) {
      console.warn(`Could not create ${destDir}:`, err.message);
    }
  }
  
  // Copy other CSS files
  const otherCssFiles = [
    'src/ui/components/CardGrid.css',
    'src/ui/components/FileScanner.css'
  ];
  
  for (const cssFile of otherCssFiles) {
    const fileName = path.basename(cssFile);
    const destFile = `dist/ui/components/${fileName}`;
    
    try {
      await fs.copyFile(cssFile, destFile);
      console.log(`Copied ${cssFile} -> ${destFile}`);
    } catch (err) {
      console.warn(`Could not copy ${cssFile}:`, err.message);
    }
  }
  
  // Copy plugin JavaScript dependencies
  const pluginDirs = ['customer-links', 'script-runner', 'as-built-documenter', 'context-generator']; // Add other plugins as needed
  
  for (const pluginDir of pluginDirs) {
    const srcPluginDir = `plugins/${pluginDir}`;
    const destPluginDir = `dist/plugins/${pluginDir}`;
    
    try {
      await fs.mkdir(destPluginDir, { recursive: true });
      
      // Copy .js and plugin.json5 files from plugin directory
      try {
        const entries = await fs.readdir(srcPluginDir, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isFile() && (entry.name.endsWith('.js') || entry.name === 'plugin.json5')) {
            const srcFile = `${srcPluginDir}/${entry.name}`;
            const destFile = `${destPluginDir}/${entry.name}`;
            await fs.copyFile(srcFile, destFile);
            console.log(`Copied ${srcFile} -> ${destFile}`);
          }
        }
      } catch (err) {
        // Plugin directory might not exist or have required files
        console.warn(`No plugin files found in ${srcPluginDir}`);
      }
    } catch (err) {
      console.warn(`Could not process plugin directory ${pluginDir}:`, err.message);
    }
  }
  
  // Copy CSS files from views
  const viewCssFiles = [
    'PluginsView.module.css',
    'SettingsView.module.css', 
    'LogsView.module.css'
  ];
  
  await fs.mkdir('dist/ui/views', { recursive: true });
  
  for (const cssFile of viewCssFiles) {
    const srcFile = `src/ui/views/${cssFile}`;
    const destFile = `dist/ui/views/${cssFile}`;
    
    try {
      await fs.copyFile(srcFile, destFile);
      console.log(`Copied ${srcFile} -> ${destFile}`);
    } catch (err) {
      console.warn(`Could not copy ${cssFile}:`, err.message);
    }
  }
  
  console.log('Assets copied successfully!');
}

copyAssets().catch(console.error);