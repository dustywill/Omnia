
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import postcss from 'postcss';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';

export async function resolve(specifier, context, defaultResolve) {
  if (specifier.endsWith('.css')) {
    return { url: new URL(specifier, context.parentURL).href, shortCircuit: true };
  }
  return defaultResolve(specifier, context, defaultResolve);
}

export async function load(url, context, defaultLoad) {
  if (url.endsWith('.css')) {
    const filePath = fileURLToPath(url);
    
    try {
      const css = readFileSync(filePath, 'utf8');
      
      // Check if this is a CSS Modules file
      const isModule = url.includes('.module.css');
      
      if (isModule) {
        // For CSS Modules, return a simple object with class names
        // In a full implementation, you'd use a CSS Modules processor
        const classNames = {};
        const classMatches = css.match(/\.[\w-]+/g);
        if (classMatches) {
          classMatches.forEach(className => {
            const name = className.substring(1);
            classNames[name] = name; // Simple mapping for now
          });
        }
        
        return {
          format: 'module',
          source: `export default ${JSON.stringify(classNames)};`,
          shortCircuit: true,
        };
      } else {
        // For regular CSS files (like Tailwind), process with PostCSS
        const result = await postcss([tailwindcss, autoprefixer])
          .process(css, { from: filePath, to: undefined });
        
        // In Node.js environment, we can't inject styles directly
        // Instead, we'll store the processed CSS for later use
        if (typeof global !== 'undefined') {
          global.__processedCSS = global.__processedCSS || [];
          global.__processedCSS.push(result.css);
        }
        
        return {
          format: 'module',
          source: 'export default {};',
          shortCircuit: true,
        };
      }
    } catch (error) {
      console.warn(`CSS processing warning for ${url}:`, error.message);
      // Fallback to empty export
      return {
        format: 'module',
        source: 'export default {};',
        shortCircuit: true,
      };
    }
  }
  return defaultLoad(url, context, defaultLoad);
}
