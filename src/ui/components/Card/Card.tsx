import React from 'react';
import styles from './Card.module.css';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export function Card({ 
  children, 
  className = '', 
  elevated = false, 
  interactive = false,
  padding = 'md'
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const baseClasses = `bg-theme-surface border-theme rounded-lg shadow-theme ${paddingClasses[padding]}`;
  const elevatedClasses = elevated ? 'shadow-lg' : '';
  const interactiveClasses = interactive ? styles.interactive : '';
  
  return (
    <div className={`${baseClasses} ${elevatedClasses} ${interactiveClasses} ${styles.card} ${className}`}>
      {children}
    </div>
  );
}