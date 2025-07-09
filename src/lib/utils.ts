/**
 * Utility functions for Omnia - Electron and browser compatible
 * This file provides utilities that work seamlessly in both environments
 */

import { loadNodeModule } from "../ui/node-module-loader.js"

// Cache for loaded modules
let clsxModule: any = null;
let twMergeModule: any = null;

// Initialize dependencies
const initializeDependencies = async () => {
  if (!clsxModule) {
    try {
      clsxModule = await loadNodeModule("clsx");
    } catch (err) {
      console.warn("Failed to load clsx:", err);
      // Fallback clsx implementation
      clsxModule = {
        clsx: (...args: any[]) => {
          return args
            .filter(Boolean)
            .map((arg) => {
              if (typeof arg === 'string') return arg;
              if (typeof arg === 'object' && arg !== null) {
                return Object.entries(arg)
                  .filter(([_, value]) => Boolean(value))
                  .map(([key]) => key)
                  .join(' ');
              }
              return '';
            })
            .join(' ')
            .trim();
        }
      };
    }
  }
  
  if (!twMergeModule) {
    try {
      twMergeModule = await loadNodeModule("tailwind-merge");
    } catch (err) {
      console.warn("Failed to load tailwind-merge:", err);
      // Fallback twMerge implementation
      twMergeModule = {
        twMerge: (...classes: any[]) => {
          const classString = classes.filter(Boolean).join(' ');
          const classArray = classString.split(/\s+/).filter(Boolean);
          const uniqueClasses = [...new Set(classArray)];
          return uniqueClasses.join(' ');
        }
      };
    }
  }
};

/**
 * Combines class names with Tailwind CSS class merging
 * Compatible with both Electron and browser environments
 */
export async function cn(...inputs: any[]) {
  await initializeDependencies();
  const clsx = clsxModule?.clsx || clsxModule?.default || ((x: any) => x);
  const twMerge = twMergeModule?.twMerge || twMergeModule?.default || ((x: any) => x);
  return twMerge(clsx(inputs));
}

/**
 * Synchronous version of cn for cases where async is not possible
 * Uses fallback implementations if modules aren't loaded yet
 */
export function cnSync(...inputs: any[]) {
  // Simple fallback implementation
  const clsx = (...args: any[]) => {
    return args
      .filter(Boolean)
      .map((arg) => {
        if (typeof arg === 'string') return arg;
        if (typeof arg === 'object' && arg !== null) {
          return Object.entries(arg)
            .filter(([_, value]) => Boolean(value))
            .map(([key]) => key)
            .join(' ');
        }
        return '';
      })
      .join(' ')
      .trim();
  };
  
  const twMerge = (...classes: any[]) => {
    const classString = classes.filter(Boolean).join(' ');
    const classArray = classString.split(/\s+/).filter(Boolean);
    const uniqueClasses = [...new Set(classArray)];
    return uniqueClasses.join(' ');
  };
  
  return twMerge(clsx(inputs));
}

/**
 * Safely loads a module in both Node.js and Electron environments
 * This ensures imports work regardless of the runtime environment
 */
export async function safeImport<T = any>(modulePath: string): Promise<T | null> {
  try {
    // Try dynamic import first (works in both environments)
    const module = await import(modulePath)
    return module.default || module
  } catch (error) {
    // If that fails and we're in Electron, try require
    if (typeof window !== 'undefined' && (window as any).require) {
      try {
        return (window as any).require(modulePath)
      } catch (requireError) {
        console.warn(`Failed to load module ${modulePath}:`, requireError)
        return null
      }
    }
    console.warn(`Failed to load module ${modulePath}:`, error)
    return null
  }
}

/**
 * Format a date to a human-readable string
 */
export function formatDate(date: Date | string, format: 'short' | 'long' = 'short'): string {
  const d = typeof date === 'string' ? new Date(date) : date
  
  if (format === 'long') {
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }
  
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func(...args), delay)
  }
}

/**
 * Deep merge objects
 */
export function deepMerge<T extends Record<string, any>>(target: T, source: Partial<T>): T {
  const result = { ...target }
  
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key])
      ) {
        result[key] = deepMerge(target[key], source[key])
      } else {
        result[key] = source[key] as T[Extract<keyof T, string>]
      }
    }
  }
  
  return result
}