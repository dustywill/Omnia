import React from 'react';
import { Card, Badge } from '../../../src/ui/components/index.js';
import { z } from 'zod';

// Configuration schema
export const configSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  showTimestamp: z.boolean().default(true),
  theme: z.enum(['info', 'success', 'warning', 'danger']).default('info')
});

export type PluginConfig = z.infer<typeof configSchema>;

// Default configuration
export const defaultConfig: PluginConfig = {
  title: 'Configured Plugin',
  message: 'This plugin can be customized through settings!',
  showTimestamp: true,
  theme: 'info'
};

/**
 * Configured Plugin Example
 * 
 * This plugin accepts configuration and displays customizable content
 */
interface ConfiguredPluginProps {
  config: PluginConfig;
}

export default function ConfiguredPlugin({ config }: ConfiguredPluginProps) {
  const currentConfig = { ...defaultConfig, ...config };
  const { title, message, showTimestamp, theme } = currentConfig;

  const getBadgeVariant = (theme: string) => {
    switch (theme) {
      case 'success': return 'success';
      case 'warning': return 'warning';
      case 'danger': return 'danger';
      default: return 'info';
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <h2 className="text-2xl font-bold text-theme-primary">
            {title}
          </h2>
          <Badge variant={getBadgeVariant(theme)} size="sm">
            {theme}
          </Badge>
        </div>
        
        <p className="text-theme-secondary mb-4">
          {message}
        </p>
        
        {showTimestamp && (
          <div className="text-sm text-theme-secondary border-t border-theme pt-4">
            Rendered at: {new Date().toLocaleString()}
          </div>
        )}
      </div>
    </Card>
  );
}