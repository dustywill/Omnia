import fs from 'fs/promises';
import path from 'path';

/**
 * Process CSS module files and generate JavaScript objects
 * This converts .module.css files to .module.css.js files that export the class mappings
 */
async function processCssModules() {
  console.log('Processing CSS modules...');
  
  const distDir = 'dist';
  
  // Find all .module.css files in the dist directory
  async function findCssModules(dir) {
    const cssModules = [];
    
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        
        if (entry.isDirectory()) {
          const subModules = await findCssModules(fullPath);
          cssModules.push(...subModules);
        } else if (entry.name.endsWith('.module.css')) {
          cssModules.push(fullPath);
        }
      }
    } catch (error) {
      // Directory might not exist
    }
    
    return cssModules;
  }
  
  const cssModuleFiles = await findCssModules(distDir);
  
  for (const cssFile of cssModuleFiles) {
    await processCssModule(cssFile);
  }
  
  console.log(`Processed ${cssModuleFiles.length} CSS modules`);
}

async function processCssModule(cssFilePath) {
  try {
    const cssContent = await fs.readFile(cssFilePath, 'utf8');
    
    // Extract class names from CSS
    const classNames = extractClassNames(cssContent);
    
    // Generate JavaScript module that exports the class mappings
    const jsContent = generateJsModule(classNames);
    
    // Write the JavaScript file alongside the CSS file
    const jsFilePath = cssFilePath + '.js';
    await fs.writeFile(jsFilePath, jsContent);
    
    console.log(`Generated ${jsFilePath}`);
  } catch (error) {
    console.warn(`Failed to process ${cssFilePath}:`, error.message);
  }
}

function extractClassNames(cssContent) {
  const classNames = new Set();
  
  // Match CSS class selectors (.className)
  const classRegex = /\.([a-zA-Z][a-zA-Z0-9_-]*)/g;
  let match;
  
  while ((match = classRegex.exec(cssContent)) !== null) {
    const className = match[1];
    // Skip utility classes that might be Tailwind (typically shorter)
    if (className.length > 2) {
      classNames.add(className);
    }
  }
  
  return Array.from(classNames).sort();
}

function generateJsModule(classNames) {
  // For now, use identity mapping (class name maps to itself)
  // In a real CSS modules system, these would be scoped/hashed names
  const classMap = {};
  
  for (const className of classNames) {
    classMap[className] = className;
  }
  
  return `// Generated CSS module
const styles = ${JSON.stringify(classMap, null, 2)};
export default styles;
`;
}

processCssModules().catch(console.error);