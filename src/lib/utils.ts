/**
 * Utility functions for Omnia - Electron and browser compatible
 * This file provides utilities that work seamlessly in both environments
 */

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Combines class names with Tailwind CSS class merging
 * Compatible with both Electron and browser environments
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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