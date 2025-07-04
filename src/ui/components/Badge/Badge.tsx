import React from 'react';

export interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ 
  variant = 'neutral', 
  size = 'md', 
  children, 
  className = '' 
}: BadgeProps) {
  const baseClasses = 'inline-flex items-center font-medium rounded-full';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };
  
  const variantClasses = {
    primary: 'bg-blue-95 text-primary border border-blue-80',
    secondary: 'bg-neutral-95 text-neutral-30 border border-neutral-80',
    success: 'bg-green-95 text-success border border-green-80',
    warning: 'bg-orange-95 text-warning border border-orange-80',
    danger: 'bg-red-95 text-danger border border-red-80',
    info: 'bg-cyan-95 text-info border border-cyan-80',
    neutral: 'bg-neutral-90 text-neutral-40 border border-neutral-70',
  };
  
  return (
    <span className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}