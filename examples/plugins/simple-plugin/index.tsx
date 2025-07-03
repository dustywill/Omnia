import React from 'react';
import { Card } from '../../../src/ui/components/index.js';

/**
 * Simple Plugin Example
 * 
 * This is the simplest type of plugin - just a React component
 * No configuration, no services, just UI
 */
export default function SimplePlugin() {
  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-theme-primary mb-4">
          Hello from Simple Plugin!
        </h2>
        <p className="text-theme-secondary">
          This is a simple plugin that requires no configuration.
          It just displays this friendly message.
        </p>
      </div>
    </Card>
  );
}