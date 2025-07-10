/**
 * Core Services Export
 * 
 * Exports all core services for the Omnia application
 */

export * from './http-client.js';
export * from './template-engine.js';
export * from './document-generator.js';
export * from './file-system.js';
export * from './progress-tracking.js';
export * from './script-execution.js';

// Explicitly re-export to resolve ambiguity
export type { HttpProgressCallback } from './http-client.js';
export type { ProgressCallback } from './progress-tracking.js';

// Re-export factory functions for convenience
export { createHttpClient } from './http-client.js';
export { createTemplateEngine } from './template-engine.js';
export { createDocumentGenerator } from './document-generator.js';
export { createFileSystemService } from './file-system.js';
export { createProgressTrackingService } from './progress-tracking.js';
export { createScriptExecutionService } from './script-execution.js';

// Re-export CoreServicesRegistry
export { CoreServicesRegistry, createDefaultCoreServicesConfig } from '../core-services-registry.js';
export type { CoreServicesConfig } from '../core-services-registry.js';