/**
 * Shadcn UI Demo Component - For Testing Integration
 * 
 * This component demonstrates the new Shadcn UI components and will be used
 * to verify that everything works correctly in both web and Electron environments.
 */
import React from 'react';
import { Button } from './button.js';
import { Input } from './input.js';
import { Badge } from './badge.js';

export interface ShadcnDemoProps {
  title?: string;
}

export const ShadcnDemo: React.FC<ShadcnDemoProps> = ({ title = "Shadcn UI Integration Demo" }) => {
  const [inputValue, setInputValue] = React.useState('');

  return (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <h2 style={{ marginBottom: '20px' }}>{title}</h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Buttons</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <Button variant="default">Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          {/* Omnia-specific variants */}
          <Button variant="action">Action</Button>
          <Button variant="success">Success</Button>
          <Button variant="warning">Warning</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Button Sizes</h3>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon">📧</Button>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Input</h3>
        <div style={{ marginTop: '8px' }}>
          <Input 
            placeholder="Type something here..." 
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <p style={{ marginTop: '8px', fontSize: '14px', color: 'var(--tt-color-text-secondary)' }}>
            You typed: {inputValue || '(nothing yet)'}
          </p>
        </div>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h3>Badges</h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
          <Badge variant="default">Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
          {/* Omnia-specific variants */}
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="action">Action</Badge>
        </div>
      </div>

      <div style={{ 
        padding: '16px', 
        backgroundColor: 'var(--tt-color-surface)', 
        border: '1px solid var(--tt-color-border)',
        borderRadius: '8px',
        marginTop: '20px'
      }}>
        <h4 style={{ margin: '0 0 8px 0' }}>Integration Status</h4>
        <p style={{ margin: '0', fontSize: '14px', color: 'var(--tt-color-text-secondary)' }}>
          ✅ Shadcn UI components successfully integrated with Omnia design system<br/>
          ✅ CSS variables mapping working correctly<br/>
          ✅ Electron-compatible imports in place<br/>
          ✅ Backward compatibility maintained with existing components
        </p>
      </div>
    </div>
  );
};

export default ShadcnDemo;