import React from 'react';

export interface StatusBarProps {
  activePlugins: number;
  totalPlugins: number;
  errorPlugins: number;
  currentView: string;
}

export function StatusBar({ activePlugins, totalPlugins, errorPlugins, currentView }: StatusBarProps) {
  // Don't show plugin counts on dashboard
  if (currentView === 'dashboard') {
    return (
      <div style={{
        height: '32px',
        backgroundColor: '#f8fafc',
        borderTop: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '0.75rem',
        color: '#6b7280'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span>Ready</span>
        </div>
        <div>
          Omnia Plugin Management System
        </div>
      </div>
    );
  }

  return (
    <div style={{
      height: '32px',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      fontSize: '0.75rem',
      color: '#6b7280'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#10b981' 
          }} />
          {activePlugins} Active
        </span>
        
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <div style={{ 
            width: '8px', 
            height: '8px', 
            borderRadius: '50%', 
            backgroundColor: '#6b7280' 
          }} />
          {totalPlugins - activePlugins} Inactive
        </span>
        
        {errorPlugins > 0 && (
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <div style={{ 
              width: '8px', 
              height: '8px', 
              borderRadius: '50%', 
              backgroundColor: '#dc2626' 
            }} />
            {errorPlugins} Errors
          </span>
        )}
        
        <span>Total: {totalPlugins}</span>
      </div>
      
      <div>
        {currentView === 'plugins' && 'Plugin Management'}
        {currentView === 'settings' && 'System Settings'}
        {currentView === 'plugin-detail' && 'Plugin Details'}
      </div>
    </div>
  );
}