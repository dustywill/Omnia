import React from 'react';
import styles from './Sidebar.module.css';

export interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  width?: 'sm' | 'md' | 'lg';
}

export interface SidebarItemProps {
  children: React.ReactNode;
  active?: boolean;
  onClick?: () => void;
  icon?: React.ReactNode;
  className?: string;
}

export function Sidebar({ children, className = '', width = 'md' }: SidebarProps) {
  const widthClasses = {
    sm: 'w-48',
    md: 'w-64',
    lg: 'w-80',
  };
  
  return (
    <aside className={`${widthClasses[width]} bg-theme-surface border-r border-theme ${styles.sidebar} ${className}`}>
      <nav className="h-full p-4">
        {children}
      </nav>
    </aside>
  );
}

export function SidebarItem({ 
  children, 
  active = false, 
  onClick, 
  icon, 
  className = '' 
}: SidebarItemProps) {
  const baseClasses = 'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer';
  const activeClasses = active 
    ? 'bg-action text-white shadow-sm' 
    : 'text-theme-secondary hover:bg-theme-background hover:text-theme-primary';
  
  return (
    <div 
      className={`${baseClasses} ${activeClasses} ${styles.sidebarItem} ${className}`}
      onClick={onClick}
    >
      {icon && (
        <span className={`flex-shrink-0 ${styles.sidebarIcon}`}>
          {icon}
        </span>
      )}
      <span className="flex-1">{children}</span>
    </div>
  );
}