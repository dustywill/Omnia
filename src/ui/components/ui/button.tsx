/**
 * Shadcn Button Component - Electron Compatible
 * 
 * This component is designed to work seamlessly in both browser and Electron environments.
 * It uses relative imports and avoids any import patterns that could break in Electron.
 */
import * as React from "react"
import { loadNodeModule } from "../../node-module-loader.js"
import { cnSync as cn } from "../../../lib/utils.js"

// Load dependencies asynchronously
let cva: any = null;
let Slot: any = null;

// Initialize dependencies
const initializeDependencies = async () => {
  if (!cva) {
    try {
      const cvaModule = await loadNodeModule("class-variance-authority");
      cva = (cvaModule as any).cva;
    } catch (err) {
      console.warn("Failed to load class-variance-authority:", err);
      // Fallback cva implementation
      cva = (base: string, options: any = {}) => {
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
    }
  }
  
  if (!Slot) {
    try {
      const slotModule = await loadNodeModule("@radix-ui/react-slot");
      Slot = (slotModule as any).Slot;
    } catch (err) {
      console.warn("Failed to load @radix-ui/react-slot:", err);
      // Fallback Slot implementation
      Slot = React.forwardRef<HTMLElement, { children?: React.ReactNode; asChild?: boolean; [key: string]: any }>(({ children, asChild, ...props }, ref) => {
        if (asChild && React.isValidElement(children)) {
          return React.cloneElement(children, { ...props, ref } as any);
        }
        return React.createElement('span', { ...props, ref }, children);
      });
    }
  }
};

const buttonVariants = (base: string, options: any = {}) => {
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

const buttonVariantConfig = {
  variants: {
    variant: {
      default:
        "bg-primary text-primary-foreground shadow hover:bg-primary/90",
      destructive:
        "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
      outline:
        "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
      secondary:
        "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
      ghost: "hover:bg-accent hover:text-accent-foreground",
      link: "text-primary underline-offset-4 hover:underline",
      // Omnia-specific variants that match existing buttons
      action: "bg-accent text-accent-foreground shadow hover:bg-accent/90",
      success: "bg-green-600 text-white shadow hover:bg-green-700",
      warning: "bg-orange-600 text-white shadow hover:bg-orange-700",
      danger: "bg-destructive text-destructive-foreground shadow hover:bg-destructive/90",
    },
    size: {
      default: "h-9 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-10 rounded-md px-8",
      icon: "h-9 w-9",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "default",
  },
};

const getButtonVariants = buttonVariants(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  buttonVariantConfig
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link' | 'action' | 'success' | 'warning' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const [isInitialized, setIsInitialized] = React.useState(false);
    
    React.useEffect(() => {
      initializeDependencies().then(() => {
        setIsInitialized(true);
      });
    }, []);
    
    if (!isInitialized) {
      // Return a basic button while dependencies are loading
      return (
        <button
          className={cn(getButtonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        />
      );
    }
    
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(getButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, getButtonVariants as buttonVariants };