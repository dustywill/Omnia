import fs from 'fs/promises';
import path from 'path';

// Fix plugin imports and CSS module imports
async function fixImports() {
  const pluginDir = path.resolve('dist/plugins');
  const entries = await fs.readdir(pluginDir, { withFileTypes: true });
  
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const pluginPath = path.join(pluginDir, entry.name);
    
    // Fix imports in index.js
    const indexFile = path.join(pluginPath, 'index.js');
    try {
      let text = await fs.readFile(indexFile, 'utf8');
      
      // Fix source path imports
      text = text.replace(/\.\.\/\.\.\/src\//g, '../../');
      
      // Fix CSS module imports to point to generated JS files
      text = text.replace(/from\s+['"]([^'"]*\.module\.css)['"]/g, "from '$1.js'");
      
      await fs.writeFile(indexFile, text);
    } catch {}
    
    // Fix imports in other .js files in the plugin directory
    try {
      const pluginEntries = await fs.readdir(pluginPath, { withFileTypes: true });
      for (const pluginEntry of pluginEntries) {
        if (pluginEntry.isFile() && pluginEntry.name.endsWith('.js') && pluginEntry.name !== 'index.js') {
          const jsFile = path.join(pluginPath, pluginEntry.name);
          try {
            let text = await fs.readFile(jsFile, 'utf8');
            
            // Fix source path imports in plugin dependency files
            text = text.replace(/\.\.\/\.\.\/src\//g, '../../');
            
            await fs.writeFile(jsFile, text);
          } catch {}
        }
      }
    } catch {}
  }
  
  // Also fix CSS module imports in main UI components
  const uiDir = path.resolve('dist/ui');
  await fixCssImportsInDir(uiDir);
}

async function fixCssImportsInDir(dir) {
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        await fixCssImportsInDir(fullPath);
      } else if (entry.name.endsWith('.js')) {
        try {
          let text = await fs.readFile(fullPath, 'utf8');
          
          // Fix CSS module imports to point to generated JS files
          const originalText = text;
          text = text.replace(/from\s+['"]([^'"]*\.module\.css)['"]/g, "from '$1.js'");
          
          if (text !== originalText) {
            await fs.writeFile(fullPath, text);
          }
        } catch {}
      }
    }
  } catch {}
}

fixImports().catch(console.error);
