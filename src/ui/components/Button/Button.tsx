import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'action' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export function Button({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  disabled,
  ...props 
}: ButtonProps) {
  const baseClasses = 'inline-flex items-center justify-center font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm rounded-md',
    md: 'px-4 py-2 text-base rounded-lg',
    lg: 'px-6 py-3 text-lg rounded-lg',
  };
  
  const variantClasses = {
    primary: 'bg-primary text-white hover:bg-blue-20 focus:ring-primary/20 shadow-sm hover:shadow-md',
    secondary: 'bg-neutral-80 text-neutral-20 hover:bg-neutral-70 focus:ring-neutral-60/20 shadow-sm hover:shadow-md',
    action: 'bg-action text-white hover:bg-blue-30 focus:ring-action/20 shadow-sm hover:shadow-md',
    success: 'bg-success text-white hover:bg-green-30 focus:ring-success/20 shadow-sm hover:shadow-md',
    warning: 'bg-warning text-white hover:bg-orange-30 focus:ring-warning/20 shadow-sm hover:shadow-md',
    danger: 'bg-danger text-white hover:bg-red-30 focus:ring-danger/20 shadow-sm hover:shadow-md',
    ghost: 'bg-transparent text-neutral-30 hover:bg-neutral-95 focus:ring-neutral-60/20 hover:text-neutral-10',
  };
  
  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}