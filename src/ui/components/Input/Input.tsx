import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export function Input({ 
  label, 
  error, 
  helperText, 
  icon, 
  className = '', 
  id,
  ...props 
}: InputProps) {
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  
  const baseInputClasses = 'w-full px-4 py-2 bg-theme-surface border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1';
  
  const stateClasses = error 
    ? 'border-danger focus:border-danger focus:ring-danger/20 text-theme-primary'
    : 'border-theme hover:border-neutral-60 focus:border-action focus:ring-action/20 text-theme-primary';
  
  const iconClasses = icon ? 'pl-10' : '';
  
  return (
    <div className="space-y-1">
      {label && (
        <label 
          htmlFor={inputId}
          className="block text-sm font-medium text-theme-primary"
        >
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-60">
            {icon}
          </div>
        )}
        
        <input
          id={inputId}
          className={`${baseInputClasses} ${stateClasses} ${iconClasses} ${className}`}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-danger">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-theme-secondary">
          {helperText}
        </p>
      )}
    </div>
  );
}