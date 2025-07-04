/**
 * Application Header Component
 * 
 * Displays the Omnia logo and application branding
 */

import React from 'react';

export interface AppHeaderProps {
  className?: string;
}

export function AppHeader({ className = '' }: AppHeaderProps) {
  return (
    <header className={`appHeader ${className}`}>
      <div className="logoContainer">
        <img 
          src="./assets/omnia_logo.svg" 
          alt="Omnia Logo" 
          className="logo"
        />
        <div className="branding">
          <h1 className="title">Omnia</h1>
          <p className="subtitle">Plugin-Based Development Platform</p>
        </div>
      </div>
    </header>
  );
}