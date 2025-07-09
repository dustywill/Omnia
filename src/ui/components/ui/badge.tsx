/**
 * Shadcn Badge Component - Electron Compatible
 * 
 * This component is designed to work seamlessly in both browser and Electron environments.
 * It uses relative imports and avoids any import patterns that could break in Electron.
 */
import * as React from "react"
import { cnSync as cn } from "../../../lib/utils.js"

const badgeVariants = (base: string, options: any = {}) => {
  const variants = options.variants || {};
  const defaultVariants = options.defaultVariants || {};
  
  return (props: any = {}) => {
    let classes = base;
    
    // Apply variant classes
    for (const [key, value] of Object.entries(props)) {
      if (variants[key] && variants[key][value as string]) {
        classes += ' ' + variants[key][value as string];
      }
    }
    
    // Apply default variant classes for missing props
    for (const [key, value] of Object.entries(defaultVariants)) {
      if (!(key in props) && variants[key] && variants[key][value as string]) {
        classes += ' ' + variants[key][value as string];
      }
    }
    
    return classes;
  };
};

const badgeVariantConfig = {
  variants: {
    variant: {
      default:
        "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
      secondary:
        "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive:
        "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
      outline: "text-foreground",
      // Omnia-specific variants
      success: "border-transparent bg-green-600 text-white shadow hover:bg-green-700",
      warning: "border-transparent bg-orange-600 text-white shadow hover:bg-orange-700",
      info: "border-transparent bg-blue-600 text-white shadow hover:bg-blue-700",
      action: "border-transparent bg-accent text-accent-foreground shadow hover:bg-accent/80",
    },
  },
  defaultVariants: {
    variant: "default",
  },
};

const getBadgeVariants = badgeVariants(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  badgeVariantConfig
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning' | 'info' | 'action';
}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(getBadgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, getBadgeVariants as badgeVariants }