/**
 * Shadcn UI Components Index - Electron Compatible
 * 
 * This file exports all Shadcn UI components with Electron-compatible imports.
 * All imports use relative paths and .js extensions for compatibility.
 */

// Core primitive components
export { Button, type ButtonProps, buttonVariants } from './button.js'
export { Input, type InputProps } from './input.js'
export { Badge, type BadgeProps, badgeVariants } from './badge.js'

// Demo component for testing integration
export { ShadcnDemo, type ShadcnDemoProps } from './demo.js'

// Re-export utilities for convenience
export { cn } from '../../../lib/utils.js'