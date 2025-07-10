import path from 'path';
import { pathToFileURL } from 'url';

const modulePath = path.join(process.cwd(), 'dist', 'plugins', 'script-runner', 'index.js');
const moduleUrl = pathToFileURL(modulePath).href;
console.log('Module URL:', moduleUrl);

try {
  const module = await import(moduleUrl);
  console.log('Module keys:', Object.keys(module));
  console.log('Default export type:', typeof module.default);
  console.log('Named exports:', Object.keys(module).filter(k => k !== 'default'));
  
  // Check what the module object contains
  console.log('\nModule structure:');
  for (const key of Object.keys(module)) {
    console.log(`  ${key}: ${typeof module[key]}`);
  }
} catch (err) {
  console.error('Error:', err);
}